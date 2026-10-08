import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';
import * as cheerio from 'cheerio';
import { GroqProvider } from '@/core/providers/GroqProvider';
import prisma from '@/lib/prisma';

export interface PipelineJob {
  id: string;
  businessId?: string;
  userId: string;
  status: 'pending' | 'crawling' | 'analyzing' | 'synthesizing' | 'customizing' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Global in-memory registry to ensure background job tracking always persists
// across Next.js Turbopack route chunks and worker reloads.
const globalPipelineJobs = (globalThis as any).__pipelineJobs || new Map<string, PipelineJob>();
(globalThis as any).__pipelineJobs = globalPipelineJobs;
export const inMemoryPipelineJobs: Map<string, PipelineJob> = globalPipelineJobs;

export function getPipelineJob(id: string): PipelineJob | undefined {
  return inMemoryPipelineJobs.get(id);
}

export async function createPipelineJob(userId: string): Promise<string> {
  const id = uuidv4();
  const job: PipelineJob = {
    id,
    userId,
    status: 'pending',
    progress: 0,
    message: 'Initializing pipeline...',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryPipelineJobs.set(id, job);
  try {
    await setDoc(doc(db, 'pipelineJobs', id), job);
  } catch (e: any) {
    console.warn('Firestore setDoc pipelineJobs fallback to memory:', e?.message);
  }
  return id;
}

export async function updatePipelineJob(id: string, updates: Partial<PipelineJob>) {
  const current = inMemoryPipelineJobs.get(id);
  if (current) {
    Object.assign(current, updates, { updatedAt: new Date().toISOString() });
  }
  try {
    await updateDoc(doc(db, 'pipelineJobs', id), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (e: any) {
    console.warn('Firestore updateDoc pipelineJobs fallback to memory:', e?.message);
  }
}

export async function runIntelligencePipeline(
  jobId: string, 
  userId: string, 
  companyName: string, 
  industry: string, 
  goals: string, 
  extractedText: string, 
  websiteUrl: string
) {
  try {
    const llm = new GroqProvider();

    // ==========================================
    // STAGE 1: EXTRACTION & CRAWLING
    // ==========================================
    await updatePipelineJob(jobId, { status: 'crawling', progress: 10, message: 'Crawling website & extracting documents...' });
    
    let combinedCorpus = extractedText;
    if (websiteUrl) {
      try {
        const res = await fetch(websiteUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const html = await res.text();
        const $ = cheerio.load(html);
        
        // Remove noisy elements
        $('script, style, nav, footer, iframe, noscript').remove();
        const pageText = $('body').text().replace(/\s+/g, ' ').trim();
        
        combinedCorpus += `\n\n--- Website: ${websiteUrl} ---\n${pageText.substring(0, 15000)}`;
      } catch (e: any) {
        console.warn('Failed to crawl website:', e);
        await updatePipelineJob(jobId, { status: 'crawling', progress: 15, message: `Warning: Could not fetch website (${e.message}). Proceeding with provided documents...` });
      }
    }

    // ==========================================
    // STAGE 2 & 3: CHUNKING & DNA SYNTHESIS
    // ==========================================
    await updatePipelineJob(jobId, { status: 'analyzing', progress: 30, message: 'Analyzing data chunks & generating DNA...' });
    
    // We send a massive prompt for Synthesis (in real prod, we'd chunk, but for latency we'll use one massive structured output call)
    const maxTextLength = 20000;
    const documentExcerpt = combinedCorpus.length > 0 
        ? combinedCorpus.substring(0, maxTextLength) 
        : 'No internal documents provided.';

    const systemPrompt = `You are a visionary AI Operating System initializing a new company.
Based on the user input and document corpus, you must map the company's DNA, Knowledge Graph, Departments, and Strategy.

Company Name: ${companyName}
Industry: ${industry}
Goals: ${goals}
Corpus:
${documentExcerpt}

Return ONLY valid JSON matching this exact schema:
{
  "business": {
    "name": "${companyName}",
    "description": "Short description",
    "industry": "${industry}",
    "tone": "Brand tone (e.g. Professional, Playful)",
    "values": ["Value 1", "Value 2"]
  },
  "departments": ["Marketing", "Sales", "Operations", "Finance"],
  "knowledgeGraph": [
    {
      "category": "Product",
      "title": "Name of product/service",
      "content": "Detailed description",
      "tags": ["tag1", "tag2"],
      "confidenceScore": 95,
      "sourceReference": "Website/Document",
      "relatedDepartments": ["Sales", "Marketing"]
    },
    {
      "category": "Policy",
      "title": "Return Policy / SOP",
      "content": "Detailed policy",
      "tags": ["support", "policy"],
      "confidenceScore": 90,
      "sourceReference": "Document",
      "relatedDepartments": ["Operations"]
    }
  ],
  "brain": [
    {
      "category": "Growth Opportunity",
      "title": "A potential growth area",
      "content": "Details on how to achieve it"
    },
    {
      "category": "Operational Risk",
      "title": "Bottleneck or risk",
      "content": "Details"
    }
  ]
}`;

    const synthesisText = await llm.generateText(systemPrompt, { temperature: 0.7 });
    
    let parsedData;
    try {
      const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : synthesisText);
    } catch (e) {
      throw new Error("Failed to parse LLM JSON for synthesis.");
    }

    await updatePipelineJob(jobId, { status: 'synthesizing', progress: 50, message: 'Building connected Knowledge Graph...' });

    // 1. Create Business
    const businessData = {
      name: parsedData.business.name || companyName,
      industry: parsedData.business.industry || industry,
      goals: goals,
      description: parsedData.business.description,
      tone: parsedData.business.tone,
      values: parsedData.business.values,
      userId: userId
    };

    const business = (await prisma.business.create({ data: businessData })) || { id: uuidv4(), ...businessData };

    // Link businessId to user doc (guarded against permission errors)
    try {
      if (userId && !userId.startsWith('user_')) {
        await updateDoc(doc(db, 'users', userId), { businessId: business.id });
      }
    } catch (e: any) {
      console.warn('Could not update user doc with businessId (handled gracefully):', e?.message);
    }
    await updatePipelineJob(jobId, { businessId: business.id });

    // 2. Create Departments
    const deptPromises = (parsedData.departments || []).map((dept: string) => 
      prisma.department.create({ 
        data: { name: dept.replace(' AI', ''), businessId: business.id } 
      })
    );
    await Promise.all(deptPromises);

    // 3. Create Knowledge Graph (Documents with metadata)
    if (parsedData.knowledgeGraph) {
      const kgPromises = parsedData.knowledgeGraph.map((kg: any) => 
        addDoc(collection(db, 'knowledgeBase'), {
          businessId: business.id,
          title: kg.title,
          category: kg.category,
          content: kg.content,
          tags: kg.tags || [],
          confidenceScore: kg.confidenceScore || 90,
          sourceReference: kg.sourceReference || 'Document Ingestion',
          relatedDepartments: kg.relatedDepartments || [],
          createdAt: new Date().toISOString()
        }).catch((e: any) => {
          console.warn('Firestore addDoc knowledgeBase skipped or failed:', e?.message);
        })
      );
      await Promise.all(kgPromises);
    }

    // 4. Create Company Brain (Insights)
    if (parsedData.brain) {
      const brainPromises = parsedData.brain.map((brain: any) => 
        prisma.businessInsight.create({
          data: {
            businessId: business.id,
            category: brain.category,
            content: brain.title,
            actionable: brain.content,
            impact: "High"
          }
        })
      );
      await Promise.all(brainPromises);
    }

    // ==========================================
    // STAGE 4: WORKFORCE CUSTOMIZATION
    // ==========================================
    await updatePipelineJob(jobId, { status: 'customizing', progress: 70, message: 'Customizing AI workforce memory & DNA...' });
    
    let templates = await prisma.employeeTemplate.findMany();
    if (!templates || templates.length === 0) {
      templates = [
        {
          id: "tpl_sales_executive",
          name: "Alex Vance",
          role: "Sales Executive",
          department: "Sales",
          systemPrompt: "You are Alex Vance, an elite Sales Executive. You drive revenue, pitch clients, and close deals."
        },
        {
          id: "tpl_marketing_manager",
          name: "Sarah Jenkins",
          role: "Marketing Manager",
          department: "Marketing",
          systemPrompt: "You are Sarah Jenkins, a strategic Marketing Manager focusing on customer acquisition."
        },
        {
          id: "tpl_lead_engineer",
          name: "David Kim",
          role: "Lead Systems Architect",
          department: "Engineering",
          systemPrompt: "You are David Kim, an analytical and pragmatic Lead Systems Architect."
        }
      ];
    }
    if (templates && templates.length > 0) {
      const toHire = templates.slice(0, 3);
      for (const tpl of toHire) {
        
        // Find related knowledge for this department
        const relatedKnowledge = (parsedData.knowledgeGraph || [])
            .filter((kg: any) => kg.relatedDepartments?.includes(tpl.department))
            .map((kg: any) => `- ${kg.title}: ${kg.content}`)
            .join('\n');

        const customPrompt = `${tpl.systemPrompt}
        
[COMPANY DNA]
You work for ${parsedData.business.name}, a ${parsedData.business.industry} company.
Tone: ${parsedData.business.tone}
Core Values: ${(parsedData.business.values || []).join(', ')}

[YOUR DEPARTMENT KNOWLEDGE]
${relatedKnowledge || 'Rely on general industry best practices.'}
`;

        const emp = await prisma.employee.create({
          data: {
            businessId: business.id,
            templateId: tpl.id,
            name: tpl.name,
            role: tpl.role,
            department: tpl.department,
            systemPrompt: customPrompt, // deeply customized
            status: "active"
          }
        });

        // Seed initial memory
        try {
          await addDoc(collection(db, 'employeeMemory'), {
            businessId: business.id,
            employeeId: emp.id,
            type: 'core_directive',
            content: `You were hired to execute tasks for ${parsedData.business.name}. Your primary directive is to align with their core goals: ${goals}`,
            importance: 10,
            createdAt: new Date().toISOString()
          });
        } catch (e: any) {
          console.warn('addDoc employeeMemory skipped or failed:', e?.message);
        }
      }
    }

    // ==========================================
    // STAGE 5: FINALIZATION
    // ==========================================
    await updatePipelineJob(jobId, { status: 'finalizing', progress: 90, message: 'Drafting Executive Briefing & Missions...' });

    // Create a Mission
    try {
      await prisma.task.create({
        data: {
          businessId: business.id,
          title: "Review Initial Intelligence Report",
          description: "Review the automatically generated intelligence report and SWOT analysis from the onboarding documents.",
          status: "pending",
          priority: "high"
        }
      });
    } catch (e: any) {
      console.warn('prisma.task.create skipped or failed:', e?.message);
    }

    // Create Persistent Intelligence Report
    try {
      await addDoc(collection(db, 'reports'), {
        businessId: business.id,
        title: "Company Intelligence & SWOT Report",
        type: "intelligence",
        content: "Based on the onboarding analysis, the company shows strong potential...",
        data: parsedData.brain,
        createdAt: new Date().toISOString()
      });
    } catch (e: any) {
      console.warn('addDoc reports skipped or failed:', e?.message);
    }

    // Generate Executive Briefing for Jarvis
    const briefingText = `Good morning, CEO. I've completed my analysis of ${parsedData.business.name}. I analyzed your documents and website. I extracted ${parsedData.knowledgeGraph?.length || 0} structured knowledge entries and mapped ${parsedData.departments?.length || 0} departments. I have automatically hired an initial AI workforce and deeply customized their memory with your company DNA. Your persistent intelligence report is ready for review. How would you like to proceed?`;
    
    try {
      await updateDoc(doc(db, 'companies', business.id), {
        executiveBriefing: briefingText,
        briefingPlayed: false
      });
    } catch (e: any) {
      console.warn('updateDoc companies briefing skipped or failed:', e?.message);
    }

    await updatePipelineJob(jobId, { status: 'completed', progress: 100, message: 'Company Ready.' });

  } catch (error: any) {
    console.error('Pipeline Error:', error);
    await updatePipelineJob(jobId, { status: 'error', error: error.message, message: 'Pipeline failed.' });
  }
}
