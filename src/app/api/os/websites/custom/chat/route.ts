import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { projectId, message } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    const project = await prisma.customProject.findFirst({
      where: { id: projectId }
    });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const userMessage = {
      sender: 'User',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Simulate developer response
    const devMessage = {
      sender: 'Alex Chen',
      content: `I have received your message: "${message}". I will incorporate this into the next iteration.`,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...(project.messages || []), userMessage, devMessage];

    await prisma.customProject.update({
      where: { id: projectId },
      data: {
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, messages: updatedMessages });
  } catch (error: any) {
    console.error('Custom Project Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
