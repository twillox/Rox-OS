import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    // Intelligent Search: Retrieve prioritized knowledge instead of dumping everything
    // We'll prioritize businessKnowledge (policies/sops), DNA, and recent active tasks
    const [rawKnowledge, dnaRec, rawTasks, rawInsights] = await Promise.all([
      prisma.businessKnowledge.findMany({ where: { businessId } }),
      prisma.memory.findFirst({ where: { businessId, key: 'COMPANY_DNA' } }),
      prisma.task.findMany({ where: { businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } }, include: { employee: true } }),
      prisma.businessInsight.findMany({ where: { businessId } })
    ]);

    // Sort in memory to avoid missing Firestore composite index errors
    const knowledge = rawKnowledge.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 40);
    const tasks = rawTasks.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 20);
    const insights = rawInsights.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);

    let dnaString = 'No Company DNA defined.';
    if (dnaRec) {
      try {
        const parsed = JSON.parse(dnaRec.value);
        dnaString = `Mission: ${parsed.mission}\nCore Values: ${parsed.coreValues?.join(', ')}\nRules: ${parsed.operationalRules?.join(', ')}`;
      } catch(e) {}
    }

    const context = `
[COMPANY DNA]
${dnaString}

[KNOWLEDGE GRAPH & SOPs]
${knowledge.map(k => `[Source: ${k.sourceReference || 'Document'}] ${k.title}: ${k.content}`).join('\n\n')}

[ACTIVE TASKS]
${tasks.map(t => `[Source: Task Center] ${t.title} (Assigned to: ${t.employee?.name})`).join('\n')}

[STRATEGIC INSIGHTS]
${insights.map(i => `[Source: Brain Insight] ${i.title}: ${i.description}`).join('\n')}
`;

    const llm = new GroqProvider();
    
    const prompt = `You are the Company Brain, an omniscient AI that serves as the intelligence layer of the organization.
You must answer the user's query using ONLY the provided Context Graph below. Do not invent information.
Tone and persona: Speak in a very natural, simple, human tone using clear everyday Indian English words and short conversational sentences (e.g., 'haan bilkul', 'sure sir', 'don't worry', 'straightaway', simple crisp sentences). Never sound robotic, pompous, or use heavy corporate jargon.

If the answer is not in the context, state that you do not have records of it.

CONTEXT GRAPH:
${context}

User Question: ${query}

You MUST return a valid JSON object with the following structure:
{
  "answer": "Your detailed answer",
  "sources": ["List", "of", "sources", "referenced in the context"],
  "confidence": 95
}`;

    const jsonSchema = {
      type: "object",
      properties: {
        answer: { type: "string" },
        sources: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["answer", "sources"]
    };

    const responseJSON = await llm.generateJSON(prompt, jsonSchema) as any;

    return NextResponse.json({
      answer: responseJSON?.answer || 'I could not synthesize an answer.',
      sources: responseJSON?.sources || [],
      confidence: responseJSON?.confidence || 0
    });
  } catch (error: any) {
    console.error('Brain Query Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

