import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export class IntelligenceService {
  /**
   * Fetch all structured intelligence nodes for the Company Brain
   */
  static async getCompanyBrain(businessId: string) {
    const q = query(collection(db, 'companyBrain'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch all structured documents and facts for the Knowledge Base
   */
  static async getKnowledgeBase(businessId: string) {
    const q = query(collection(db, 'knowledgeBase'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch specific memories injected into an AI Employee
   */
  static async getEmployeeMemories(businessId: string, employeeId: string) {
    const q = query(collection(db, 'employeeMemory'), where('businessId', '==', businessId), where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch persistent intelligence reports
   */
  static async getReports(businessId: string) {
    const q = query(collection(db, 'reports'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Add a new memory for an AI Employee
   */
  static async addEmployeeMemory(businessId: string, employeeId: string, topic: string, content: string) {
    return addDoc(collection(db, 'employeeMemory'), {
      businessId,
      employeeId,
      topic,
      content,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Unified Ingestion Pipeline for all knowledge sources
   */
  static async ingestKnowledge(businessId: string, documentId: string, text: string) {
    const { GroqProvider } = await import('@/core/providers/GroqProvider');
    const { EventService } = await import('@/lib/services/EventService');
    const { default: prisma } = await import('@/lib/prisma');

    // 1. Fetch Document to get metadata (with graceful fallback)
    let docMeta = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } }).catch(() => null);
    if (!docMeta) {
      docMeta = {
        id: documentId,
        title: 'Uploaded Document',
        businessId
      };
    }

    // 2. Mark as PROCESSING
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING', type: 'DOCUMENT' }
    }).catch(() => {});
    await EventService.publish({
      businessId,
      module: 'KNOWLEDGE',
      eventType: 'DOCUMENT_PROCESSING',
      title: 'Processing Document',
      description: `Started processing document: ${docMeta.title}`,
      actor: 'System',
      metadata: { documentId }
    }).catch(() => {});

    // 3. Extraction
    const llm = new GroqProvider();
    const systemPrompt = `You are a visionary AI Operating System. A new document was just uploaded to the company's knowledge base.
Document Source: ${docMeta.title}
Document Content:
${text.substring(0, 15000)}

Analyze this new information. Extract a concise AI Summary of the document itself, and extract structured intelligence updates.`;

    const jsonSchema = {
      type: "object",
      properties: {
        aiSummary: { type: "string" },
        intelligenceUpdates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              confidenceScore: { type: "number" }
            }
          }
        },
        brainUpdates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              title: { type: "string" },
              content: { type: "string" }
            }
          }
        }
      }
    };

    const parsedData = await llm.generateJSON(systemPrompt, jsonSchema) as any;

    // 4. Insert Intelligence Records (LOGICAL SEPARATION: type = 'INTELLIGENCE')
    // We map businessKnowledge to knowledgeBase, so we distinguish by type!
    if (parsedData.intelligenceUpdates && parsedData.intelligenceUpdates.length > 0) {
      await prisma.businessKnowledge.createMany({
        data: parsedData.intelligenceUpdates.map((kg: any) => ({
          businessId,
          title: kg.title,
          category: kg.category,
          content: kg.content,
          tags: kg.tags || [],
          confidenceScore: kg.confidenceScore || 90,
          sourceReference: docMeta.title,
          type: 'INTELLIGENCE' // <--- Logical Separation
        }))
      }).catch((e: any) => console.warn('Could not persist businessKnowledge records:', e));
    }

    // 5. Insert Brain Updates (Insights) (mapped to companyBrain)
    if (parsedData.brainUpdates && parsedData.brainUpdates.length > 0) {
      await prisma.businessInsight.createMany({
        data: parsedData.brainUpdates.map((brain: any) => ({
          businessId,
          category: brain.category,
          title: brain.title,
          description: brain.content,
          type: 'Strategic Insight',
          impact: 'Medium',
          status: 'ACTIVE'
        }))
      }).catch((e: any) => console.warn('Could not persist businessInsight records:', e));
    }

    // 6. Complete Document Lifecycle
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'AVAILABLE',
        aiSummary: parsedData.aiSummary || 'No summary generated.'
      }
    }).catch(() => {});

    // 7. Timeline Event
    await EventService.publish({
      businessId,
      module: 'KNOWLEDGE',
      eventType: 'DOCUMENT_AVAILABLE',
      title: 'Document Available',
      description: `Document processed and available: ${docMeta.title}`,
      actor: 'System',
      metadata: { documentId, extractedFacts: parsedData.intelligenceUpdates?.length || 0 }
    }).catch(() => {});

    // 8. Trigger DNA Regeneration Async
    IntelligenceService.generateCompanyDNA(businessId).catch(console.error);

    return { 
      success: true, 
      ingestedItems: (parsedData.intelligenceUpdates?.length || 0) + (parsedData.brainUpdates?.length || 0) 
    };
  }

  /**
   * Retrieves persisted Company DNA
   */
  static async getCompanyDNA(businessId: string) {
    const { default: prisma } = await import('@/lib/prisma');
    const existing = await prisma.memory.findFirst({
      where: { businessId, key: 'COMPANY_DNA' }
    });
    
    if (existing) {
      try {
        return JSON.parse(existing.value);
      } catch(e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Generates and persists the Company DNA based on current knowledge
   */
  static async generateCompanyDNA(businessId: string) {
    const { GroqProvider } = await import('@/core/providers/GroqProvider');
    const { default: prisma } = await import('@/lib/prisma');

    // Fetch relevant intelligence
    const [knowledge, insights] = await Promise.all([
      prisma.businessKnowledge.findMany({ where: { businessId }, take: 100 }),
      prisma.businessInsight.findMany({ where: { businessId }, take: 50 })
    ]);

    if (knowledge.length === 0 && insights.length === 0) {
      return null;
    }

    const llm = new GroqProvider();
    const prompt = `You are the core intelligence of the company. Based on the following stored knowledge and insights, synthesize the definitive "Company DNA".
This should represent the company's identity, core mission, operational rules, and primary objectives.

Knowledge:
${knowledge.map((k:any) => `- ${k.title}: ${k.content}`).join('\n')}

Insights:
${insights.map((i:any) => `- ${i.title}: ${i.description}`).join('\n')}

Synthesize the Company DNA.
Return ONLY valid JSON with this structure:
{
  "mission": "Core mission statement",
  "coreValues": ["Value 1", "Value 2", "Value 3"],
  "operationalRules": ["Rule 1", "Rule 2"],
  "primaryObjectives": ["Objective 1", "Objective 2"],
  "brandVoice": "Description of the company's tone and brand voice"
}`;

    try {
      const dnaJson = await llm.generateJSON(prompt, {
        type: "object",
        properties: {
          mission: { type: "string" },
          coreValues: { type: "array", items: { type: "string" } },
          operationalRules: { type: "array", items: { type: "string" } },
          primaryObjectives: { type: "array", items: { type: "string" } },
          brandVoice: { type: "string" }
        },
        required: ["mission", "coreValues", "operationalRules"]
      });

      // Persist DNA
      const existing = await prisma.memory.findFirst({
        where: { businessId, key: 'COMPANY_DNA' }
      });

      if (existing) {
        await prisma.memory.update({
          where: { id: existing.id },
          data: { value: JSON.stringify(dnaJson) }
        });
      } else {
        await prisma.memory.create({
          data: {
            businessId,
            key: 'COMPANY_DNA',
            value: JSON.stringify(dnaJson),
            type: 'IDENTITY'
          }
        });
      }

      return dnaJson;
    } catch (error) {
      console.error('Failed to generate Company DNA:', error);
      return null;
    }
  }
}
