import { db } from './src/lib/firebase';
import { collection, getDocs, limit, query, where, orderBy as fbOrderBy } from 'firebase/firestore';

async function testQuery() {
  const qId = query(collection(db, 'companies'), limit(1));
  const snapId = await getDocs(qId);
  if (snapId.empty) return;
  const businessId = snapId.docs[0].id;
  
  try {
    const q = query(collection(db, 'employees'), where('businessId', '==', businessId), fbOrderBy('name', 'asc'));
    const snap = await getDocs(q);
    console.log('Employees found:', snap.size);
  } catch (e: any) {
    console.error('Firestore Error:', e.message);
  }
}

testQuery();
