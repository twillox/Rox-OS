import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, limit as fbLimit, orderBy as fbOrderBy, setDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

const globalStore: Record<string, Map<string, any>> = (globalThis as any).__prismaStore || {};
(globalThis as any).__prismaStore = globalStore;

function getStore(name: string): Map<string, any> {
  if (!globalStore[name]) globalStore[name] = new Map();
  return globalStore[name];
}

class FirestoreAdapter {
  constructor(public collectionName: string) {}

  private async parseWhere(qRef: any, whereObj: any) {
    let constraints: any[] = [];
    
    // Auto-inject Multi-Tenant Isolation
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      
      if (this.collectionName === 'companies') {
        const userId = cookieStore.get('userId')?.value;
        if (userId) constraints.push(where('userId', '==', userId));
      } else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles' && this.collectionName !== 'integrations' && this.collectionName !== 'integration') {
        const businessId = cookieStore.get('businessId')?.value;
        if (businessId) {
           if (!whereObj || whereObj.businessId !== 'system') {
             constraints.push(where('businessId', '==', businessId));
           }
        }
      }
    } catch (e) {
      // Ignored if not in a server context
    }

    if (!whereObj) return constraints;
    
    for (const [k, v] of Object.entries(whereObj)) {
      if (typeof v !== 'object') {
        constraints.push(where(k, '==', v));
      } else if (v !== null) {
        const vObj = v as any;
        if (vObj.hasSome) {
          constraints.push(where(k, 'array-contains-any', vObj.hasSome));
        }
        if (vObj.in) {
          constraints.push(where(k, 'in', vObj.in));
        }
      }
    }
    return constraints;
  }

  async findFirst(args?: any) {
    const list = await this.findMany({ ...args, take: 1 });
    return list.length > 0 ? list[0] : null;
  }

  async findUnique(args: any) {
    const id = args?.where?.id;
    if (id) {
      const store = getStore(this.collectionName);
      if (store.has(id)) {
        return store.get(id);
      }
    }

    try {
      if (args?.where?.id) {
        const docRef = doc(db, this.collectionName, args.where.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        
        const data = docSnap.data();
        return { id: docSnap.id, ...data };
      }
      return this.findFirst(args);
    } catch (e: any) {
      console.warn(`Firestore findUnique on ${this.collectionName} fallback:`, e?.message);
      if (id) return getStore(this.collectionName).get(id) || null;
      return null;
    }
  }

  async findMany(args?: any) {
    let results: any[] = [];
    try {
      const qRef = collection(db, this.collectionName);
      const constraints = await this.parseWhere(qRef, args?.where);
      
      if (args?.orderBy) {
        for (const [k, v] of Object.entries(args.orderBy)) {
          if (typeof v === 'string') {
            constraints.push(fbOrderBy(k, v as 'asc' | 'desc'));
          }
        }
      }
      
      if (args?.take) constraints.push(fbLimit(args.take));
      
      const q = query(qRef, ...constraints);
      const snap = await getDocs(q);
      results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      console.warn(`Firestore findMany on ${this.collectionName} fallback to memory:`, e?.message);
    }

    if (results.length === 0) {
      const store = getStore(this.collectionName);
      results = Array.from(store.values());
      if (args?.where) {
        results = results.filter(item => {
          for (const [k, v] of Object.entries(args.where)) {
            if (item[k] !== v) return false;
          }
          return true;
        });
      }
      if (args?.take) results = results.slice(0, args.take);
    }

    return results;
  }

  async create(args: any) {
    const id = args.data.id || generateId();
    const data = { ...args.data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    // Auto-inject Multi-Tenant IDs
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      
      if (this.collectionName === 'companies') {
        data.userId = data.userId || cookieStore.get('userId')?.value;
      } else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles') {
        data.businessId = data.businessId || cookieStore.get('businessId')?.value;
      }
    } catch (e) {}
    
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    // Store in memory first so callers immediately have access
    const store = getStore(this.collectionName);
    store.set(id, data);

    try {
      const firestoreData = { ...data };
      delete firestoreData.id;
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, firestoreData);
    } catch (e: any) {
      console.warn(`Firestore create on ${this.collectionName} fallback to memory:`, e?.message);
    }

    return { id, ...data };
  }
  
  async createMany(args: any) {
    try {
      const batch = writeBatch(db);
      
      let userId: string | undefined;
      let businessId: string | undefined;
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        userId = cookieStore.get('userId')?.value;
        businessId = cookieStore.get('businessId')?.value;
      } catch (e) {}

      for (const item of args.data) {
        const id = item.id || generateId();
        const data = { ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        delete data.id;
        
        if (this.collectionName === 'companies') data.userId = data.userId || userId;
        else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles') data.businessId = data.businessId || businessId;

        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        
        const docRef = doc(db, this.collectionName, id);
        batch.set(docRef, data);
      }
      await batch.commit();
      return { count: args.data.length };
    } catch (e) {
      console.error(`Firestore createMany error on ${this.collectionName}:`, e);
      return { count: 0 };
    }
  }

  async update(args: any) {
    try {
      const id = args.where.id;
      const data = { ...args.data, updatedAt: new Date().toISOString() };
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, data, { merge: true });
      
      const docSnap = await getDoc(docRef);
      return { id, ...docSnap.data() };
    } catch (e) {
      console.error(`Firestore update error on ${this.collectionName}:`, e);
      return null;
    }
  }

  async delete(args: any) {
    try {
      const id = args.where.id;
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return { id };
    } catch (e) {
      console.error(`Firestore delete error on ${this.collectionName}:`, e);
      return null;
    }
  }
}

// Map Prisma model names to requested Firestore collections
const prismaBase: Record<string, FirestoreAdapter> = {
  business: new FirestoreAdapter('companies'),
  department: new FirestoreAdapter('departments'),
  knowledgeDocument: new FirestoreAdapter('knowledgeBase'),
  employee: new FirestoreAdapter('employees'),
  employeeAnalytics: new FirestoreAdapter('employeeAnalytics'),
  activity: new FirestoreAdapter('activities'),
  activityEvent: new FirestoreAdapter('activityEvents'),
  businessKnowledge: new FirestoreAdapter('knowledgeBase'),
  memory: new FirestoreAdapter('employeeMemory'),
  task: new FirestoreAdapter('tasks'),
  businessTimelineEvent: new FirestoreAdapter('timeline'),
  businessInsight: new FirestoreAdapter('companyBrain'),
  gamificationProfile: new FirestoreAdapter('promotions'),
  voice: new FirestoreAdapter('voiceProfiles'),
  employeeTemplate: new FirestoreAdapter('employeeTemplates'),
  testingSession: new FirestoreAdapter('testingSessions'),
  website: new FirestoreAdapter('websites'),
  websiteTemplate: new FirestoreAdapter('websiteTemplates'),
  websiteSection: new FirestoreAdapter('websiteSections'),
  customProject: new FirestoreAdapter('customProjects'),
};

const prisma: any = new Proxy(prismaBase, {
  get(target: any, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    // Automatically create and cache an adapter for unknown models
    target[prop] = new FirestoreAdapter(prop);
    return target[prop];
  }
});

export default prisma;
