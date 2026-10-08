import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const llm = new GroqProvider();
    
    const systemPrompt = `You are a visionary AI Co-Founder. Based on the following interview transcript, formulate a concrete business plan.
Return ONLY valid JSON matching this schema:
{
  "business": {
    "name": "Creative business name",
    "description": "Short 1-sentence description",
    "industry": "e.g. Technology, Retail"
  },
  "orgChart": [
    { "role": "AI CEO (Co-Founder)", "type": "executive" },
    { "role": "Marketing AI", "type": "department" },
    { "role": "Sales AI", "type": "department" },
    { "role": "Support AI", "type": "department" },
    { "role": "Finance AI", "type": "department" }
  ]
}
Make sure the orgChart makes sense for the specific business being created (e.g., if it's a software company, add Engineering AI). Always include an AI CEO (Co-Founder).`;

    const chatText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const response = await llm.generateText(`${systemPrompt}\n\nTRANSCRIPT:\n${chatText}`, { temperature: 0.5 });
    
    // Parse JSON
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);

    // Save to database
    let business = await prisma.business.findFirst();
    if (!business) {
      business = await prisma.business.create({
        data: {
          name: data.business.name,
          industry: data.business.industry,
          brandVoice: data.business.description
        }
      });
    } else {
      business = await prisma.business.update({
        where: { id: business.id },
        data: {
          name: data.business.name,
          industry: data.business.industry,
          brandVoice: data.business.description
        }
      });
    }

    // Link businessId to user
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const userId = cookieStore.get('userId')?.value;
      if (userId && business?.id) {
        const { adminDb } = await import('@/lib/firebase-admin');
        await adminDb.collection('users').doc(userId).update({
          businessId: business.id
        });
      }
    } catch (e) {
      console.error('Failed to update user doc with businessId', e);
    }

    // Add unique IDs to orgChart for the UI
    const orgChartWithIds = data.orgChart.map((emp: any, index: number) => ({
      id: `emp_${Date.now()}_${index}`,
      role: emp.role,
      type: emp.type || 'department'
    }));

    return NextResponse.json({ success: true, business, orgChart: orgChartWithIds });
  } catch (error: any) {
    console.error('Onboarding Generate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
