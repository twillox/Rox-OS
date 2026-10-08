import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmployeeRuntime } from '@/core/runtime/EmployeeRuntime';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { message, history } = await req.json();

    const llm = new GroqProvider();
    
    // Special Case: JARVIS System Intelligence
    if (id === 'jarvis') {
      const runtime = new EmployeeRuntime({
        id: 'jarvis',
        businessId: 'system',
        name: 'JARVIS',
        role: 'System Intelligence',
        department: 'Operations',
        personality: 'Friendly, helpful, supportive executive coworker. Speaks in natural, simple, conversational Indian English.',
        rules: ['Speak in simple, natural Indian English without robotic or overly advanced vocabulary.', 'Keep answers short and human.'],
        knowledgeTags: [],
        voiceId: 'en-IN-NeerjaNeural',
        speakingStyle: 'friendly, simple, natural Indian English',
        mood: 'supportive',
        temperature: 0.6,
        context: 'You are the core operating system intelligence. The CEO has requested a briefing or given a command.'
      }, llm, null as any);
      
      const { text: responseText, handoverTo } = await runtime.processMessage(message, history || []);
      
      let handoverEmployee: any = null;
      if (handoverTo) {
        const targetDept = await prisma.department.findFirst({
          where: { name: { contains: handoverTo, mode: 'insensitive' }, businessId: 'system' }
        });
        // Simplification for JARVIS handover mock
      }
      
      return NextResponse.json({ text: responseText, voiceId: 'jarvis', handoverEmployee });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Spin up the runtime
    const runtime = new EmployeeRuntime({
      id: employee.id,
      businessId: employee.businessId,
      name: employee.name,
      role: employee.role,
      department: employee.department?.name || 'General',
      personality: employee.personality || 'Professional',
      rules: Array.isArray(employee.decisionBoundaries) ? employee.decisionBoundaries : [employee.decisionBoundaries].filter(Boolean),
      knowledgeTags: employee.knowledgeAccessTags || [],
      voiceId: employee.voiceId || employee.selectedVoiceId || 'default',
      speakingStyle: employee.communicationStyle || employee.speakingStyle || 'natural and concise',
      mood: employee.mood || 'neutral',
      temperature: employee.temperature || 0.7,
      context: `You are ${employee.name}, the ${employee.role} in ${employee.department?.name || 'General'}.
Your responsibilities: ${employee.responsibilities || 'General duties'}.
Your goals: ${employee.goals || 'Serve the company'}.
Your communication style: ${employee.communicationStyle || 'Professional'}.
Your decision boundaries: ${employee.decisionBoundaries || 'None specified'}.`
    }, llm, null as any);

    // 1. Load Company Brain / DNA
    const companyBrain = await IntelligenceService.getCompanyBrain(employee.businessId);
    const dnaMemories = companyBrain.map(c => ({ key: `Company DNA: ${c.title || c.topic || 'Fact'}`, value: c.content || c.summary }));

    // 2. Load Employee Memory
    const memories = await IntelligenceService.getEmployeeMemories(employee.businessId, employee.id);
    const employeeMemories = memories.map(m => ({ key: m.topic || 'Memory', value: m.content || m.summary || '' }));
    
    // 3. Load Department Knowledge
    const allKnowledge = await IntelligenceService.getKnowledgeBase(employee.businessId);
    const deptKnowledge = allKnowledge
        .filter(k => !employee.knowledgeAccessTags?.length || employee.knowledgeAccessTags.some((tag: string) => (k.tags || k.keywords || []).includes(tag)) || k.department === employee.department?.name)
        .map(k => ({ key: `Dept Knowledge: ${k.title}`, value: k.content }));

    // 4. Load Active Tasks
    const activeTasks = await prisma.task.findMany({
      where: { employeeId: employee.id, status: { in: ['PENDING', 'IN_PROGRESS'] } }
    });
    const taskMemories = activeTasks.map((t: any) => ({ key: `Active Task: ${t.title}`, value: `Status: ${t.status}. Description: ${t.description}` }));

    // Inject all context layers before processing
    await runtime.initializeMemory([...dnaMemories, ...employeeMemories, ...deptKnowledge, ...taskMemories]);

    // Process Message
    const { text: responseText, handoverTo } = await runtime.processMessage(message, history || []);
    
    // Create or find an active voice session activity to persist the conversation
    let activity = await prisma.activity.findFirst({
      where: { businessId: employee.businessId, employeeId: employee.id, source: 'voice_session', status: 'active' }
    });

    if (!activity) {
      activity = await prisma.activity.create({
        data: {
          id: `act_voice_${Date.now()}`,
          businessId: employee.businessId,
          employeeId: employee.id,
          source: 'voice_session',
          status: 'active',
          updatedAt: new Date()
        }
      });
    }

    // Save User Input
    await prisma.activityEvent.create({
      data: {
        id: `evt_u_${Date.now()}_${crypto.randomUUID().substring(0,6)}`,
        activityId: activity.id,
        eventType: 'VOICE_INPUT',
        actor: 'CEO',
        content: message
      }
    });

    // Save AI Response
    await prisma.activityEvent.create({
      data: {
        id: `evt_a_${Date.now()}_${crypto.randomUUID().substring(0,6)}`,
        activityId: activity.id,
        eventType: 'VOICE_RESPONSE',
        actor: employee.name,
        content: responseText
      }
    });

    // Update Activity Timestamp
    await prisma.activity.update({
      where: { id: activity.id },
      data: { updatedAt: new Date() }
    });

    let handoverEmployee: any = null;
    if (handoverTo) {
      const targetDept = await prisma.department.findFirst({
        where: { name: { contains: handoverTo, mode: 'insensitive' }, businessId: employee.businessId }
      });
      // Try to find a deployed employee in that department
      if (targetDept) {
        const deptEmployees = await prisma.employee.findMany({
          where: { businessId: employee.businessId, departmentId: targetDept.id, isDeployed: true }
        });
        if (deptEmployees.length > 0) {
          handoverEmployee = {
            id: deptEmployees[0].id,
            name: deptEmployees[0].name,
            role: deptEmployees[0].role
          };
        }
      }
    }

    return NextResponse.json({
      text: responseText,
      voiceId: employee.voiceId || employee.selectedVoiceId,
      handoverEmployee
    });
  } catch (error: any) {
    console.error('Error processing employee chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
