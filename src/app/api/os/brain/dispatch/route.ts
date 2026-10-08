import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    
    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const llm = new GroqProvider();
    
    const prompt = `You are JARVIS, the Executive AI assistant for the CEO inside the Mission Control dashboard.
The CEO just gave the following command: "${input}"

Respond directly to the CEO. Speak in a very natural, friendly, human Indian English tone (using simple normal Indian English words and clear sentences, not high-level complex British or American jargon).
If the input asks for financial records or numbers, mention that monthly revenue is $185,000, expenses are $92,000, with 18 months runway and 50% profit margin.
Keep your response short (1-3 sentences maximum), warm, natural, and helpful. Do not use markdown or emojis, as this will be spoken via Text-To-Speech.`;

    const responseText = await llm.generateText(prompt, { temperature: 0.7 });
    
    return NextResponse.json({ reply: responseText.trim() });
  } catch (error: any) {
    console.error('Dispatch LLM Error:', error);
    // Fallback response if LLM fails
    return NextResponse.json({ reply: `Right away, sir. I have processed your request.` });
  }
}
