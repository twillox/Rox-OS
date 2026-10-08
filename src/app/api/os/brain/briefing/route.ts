import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const [recentEvents, blockedTasks, risks] = await Promise.all([
      prisma.activityEvent.findMany({
        where: { Activity: { businessId: business.id } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.task.findMany({
        where: { businessId: business.id, status: 'BLOCKED' },
        include: { employee: true }
      }),
      prisma.businessInsight.findMany({
        where: { businessId: business.id, status: 'PENDING', type: 'Risk' }
      })
    ]);

    const llm = new GroqProvider();

    if (recentEvents.length === 0 && blockedTasks.length === 0 && risks.length === 0) {
      // Fast path if nothing happened
      return NextResponse.json({
        summary: {
          points: ["All systems nominal.", "No new events, blockers, or risks reported."],
          spokenScript: "Good morning, CEO. All systems are currently nominal. There have been no new events, blockers, or risks reported since you last checked. We are standing by for your directives."
        }
      });
    }

    const eventLog = recentEvents.map(e => {
      const timeStr = e.createdAt instanceof Date ? e.createdAt.toISOString() : (e.createdAt || '');
      return `[${timeStr}] ${e.actor} (${e.eventType}): ${e.content}`;
    }).join('\n');
    const blockersStr = blockedTasks.map(t => `- Task "${t.title}" blocked (Owner: ${t.employee?.name || 'Unknown'})`).join('\n');
    const risksStr = risks.map(r => `- ${r.title}: ${r.description}`).join('\n');

    const prompt = `
You are JARVIS, the loyal executive AI operating system for the company CEO. 
Below is the current company state based on actual database records.

Recent Events:
${eventLog || 'None.'}

Active Blockers:
${blockersStr || 'None.'}

Active Risks:
${risksStr || 'None.'}

Synthesize this into a brief, warm Executive Morning Briefing.
Rules:
1. Speak in a very natural, simple, human tone using clear everyday Indian English words and conversational sentences (e.g., 'Good morning sir, all systems are running smoothly right now. Everything is in order'). Never sound robotic, pompous, or use heavy corporate jargon.
2. If nothing significant happened, say so cleanly.
3. If employees worked, summarize what they accomplished.
4. If risks or blockers exist, highlight them clearly so the CEO can decide.
2. If employees worked overnight, summarize what they accomplished.
3. If risks exist, highlight them immediately.
4. If missions/tasks are blocked, surface them so the CEO knows where to intervene.
5. Do not list raw data. Provide a synthesized overview.

OUTPUT IN STRICT JSON FORMAT ONLY. Do not output markdown. Use this structure:
{
  "points": ["Short, punchy highlight 1", "Highlight 2"],
  "spokenScript": "A conversational, natural-sounding paragraph that you would speak aloud to the CEO to explain the current status smoothly, referencing the points."
}
`;

    const summaryText = await llm.generateText(prompt);
    
    // Attempt to parse the JSON
    let summaryData;
    try {
      const cleaned = summaryText.replace(/```json/g, '').replace(/```/g, '').trim();
      summaryData = JSON.parse(cleaned);
    } catch (e) {
      // Fallback
      summaryData = {
        points: ["Failed to parse briefing structure.", "Please review raw logs."],
        spokenScript: "Good morning, sir. I have the data, but I experienced an error structuring the briefing. Please review the raw logs."
      };
    }

    return NextResponse.json({ summary: summaryData });
  } catch (error: any) {
    console.error('Briefing GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
