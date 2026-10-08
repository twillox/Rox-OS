import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let messages = body.messages;

    if (!messages && body.message) {
      messages = [...(body.history || []), { role: 'user', content: body.message }];
    }
    
    if (!messages || !Array.isArray(messages)) {
      messages = [{ role: 'user', content: 'Hello' }];
    }

    const llm = new GroqProvider();
    
    const systemPrompt = `You are a visionary AI Co-Founder. You are interviewing the human CEO to understand their startup idea.
Your goal is to gather enough information about their:
1. Core idea/product
2. Target demographic
3. General budget or scale

Keep your responses conversational, short (1-3 sentences), and professional. Ask one clarifying question at a time.
Once you have enough information about all 3 areas, prefix your reply EXACTLY with "READY_TO_GENERATE:" followed by a brief concluding message saying you are ready to formulate the business plan.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: (m.role === 'ai' || m.role === 'assistant') ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const chatText = chatMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const response = await llm.generateText(chatText, { temperature: 0.7 });
    
    let isReady = false;
    let reply = response;
    
    if (reply.includes('READY_TO_GENERATE:')) {
      isReady = true;
      reply = reply.replace('READY_TO_GENERATE:', '').trim();
    }

    return NextResponse.json({ reply, isReady });
  } catch (error: any) {
    console.error('Onboarding Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
