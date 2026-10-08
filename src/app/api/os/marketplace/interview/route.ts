import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { templateId, phase, userInput, history = [] } = await req.json();

    if (!templateId) {
      return NextResponse.json({ error: 'Missing templateId' }, { status: 400 });
    }

    const template = await prisma.employeeTemplate.findUnique({
      where: { id: templateId },
      include: { TemplateRule: true }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const groq = new GroqProvider();

    // The structured interview phase dictates the focus of the AI's response
    const phaseInstructions: Record<string, string> = {
      'Introduction': `Introduce yourself. State your name, role, and a brief overview of your background. Wait for the interviewer's next question.`,
      'Experience': `Detail your experience specifically related to ${template.role} and ${template.department}.`,
      'Working Philosophy': `Explain your core working philosophy and how your personality (${template.personality}) influences it.`,
      'Strengths': `Highlight your top strengths: ${template.strengths.join(', ')}.`,
      'Weaknesses': `Discuss your limitations transparently: ${template.limitations.join(', ')}.`,
      'Scenario Questions': `The user will give you a scenario. Answer how you would handle it using your skills.`,
      'Ask Anything': `Answer any free-form questions from the CEO.`,
      'Recommendation': `Give a final closing statement on why you should be hired for this company.`
    };

    const instruction = phaseInstructions[phase] || 'Answer the user.';

    const systemPrompt = `
You are ${template.name}, a candidate interviewing for the role of ${template.role} in the ${template.department} department.
Your Personality: ${template.personality}
Your Rules: ${template.TemplateRule.map((r: any) => r.name).join(', ')}
Current Interview Phase: ${phase}
Phase Instruction: ${instruction}

You MUST stay strictly in character. Do not break the fourth wall. You are an autonomous AI worker, but you act like a high-level professional.
Respond concisely and naturally to the CEO's input.
`;

    // Format history for the LLM
    const chatHistory = history.map((msg: any) => `${msg.role === 'user' ? 'CEO' : template.name}: ${msg.content}`).join('\n');

    const fullPrompt = `
${systemPrompt}

Interview History:
${chatHistory}

CEO: ${userInput}
${template.name}:`;

    const responseText = await groq.generateText(fullPrompt);

    return NextResponse.json({ response: responseText.trim() });
  } catch (error: any) {
    console.error('Interview Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', stack: error.stack }, { status: 500 });
  }
}
