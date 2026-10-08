import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (id.toLowerCase() === 'jarvis') {
      return NextResponse.json({
        employee: {
          id: 'jarvis',
          name: 'JARVIS',
          role: 'System Intelligence',
          gender: 'Male',
          accent: 'British',
          voiceId: 'en-GB-RyanNeural',
          voiceSpeed: 1.05,
          voicePitch: 1.0,
          personality: 'Highly professional, formal, intelligent, concise, deferential to the CEO.',
          speakingStyle: 'natural, professional, and crisp',
          department: { name: 'Executive Operations' },
          responsibilities: ['Autonomous executive assistant', 'Enterprise orchestrator'],
          goals: ['Empower the CEO and coordinate company workforce']
        },
        activities: [],
        knowledge: [],
        coworkers: []
      });
    }

    let employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { id: { contains: id } },
        include: {
          department: true,
          tasks: { orderBy: { createdAt: 'desc' } }
        }
      });
    }

    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { name: { contains: id, mode: 'insensitive' } },
        include: {
          department: true,
          tasks: { orderBy: { createdAt: 'desc' } }
        }
      });
    }

    if (!employee) {
      try {
        const { ensureBusinessInitialized } = await import('@/lib/services/SeedService');
        await ensureBusinessInitialized();
        employee = await prisma.employee.findUnique({
          where: { id },
          include: { department: true, tasks: { orderBy: { createdAt: 'desc' } } }
        });
      } catch (e) {}
    }

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch related activity events for this employee specifically
    const employeeActivities = await prisma.activity.findMany({
      where: { employeeId: employee.id }
    });
    
    let activities: any[] = [];
    if (employeeActivities.length > 0) {
      const activityIds = employeeActivities.map((a: any) => a.id);
      
      // Firebase 'in' max array size is 10, so we slice it just to be safe if it gets large, but for now we'll take top 10 recent activities
      const topActivityIds = activityIds.slice(0, 10);
      
      activities = await prisma.activityEvent.findMany({
        where: { activityId: { in: topActivityIds } },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
    }

    // Fetch employee memory from IntelligenceService
    const memories = await IntelligenceService.getEmployeeMemories(employee.businessId, employee.id);

    // Fetch knowledge based on employee's department/tags
    const allKnowledge = await IntelligenceService.getKnowledgeBase(employee.businessId);
    
    // Simple filter: if employee has tags, match them. Otherwise, give them everything or department-specific knowledge.
    const knowledge = allKnowledge.filter(k => {
       if (!employee.knowledgeAccessTags || employee.knowledgeAccessTags.length === 0) return true; // Default to all if no tags set
       const kTags = k.tags || k.keywords || [];
       return employee.knowledgeAccessTags.some(tag => kTags.includes(tag)) || k.department === employee.department?.name;
    });

    // Fetch coworkers
    let coworkers: any[] = [];
    if (employee.departmentId) {
      const peers = await prisma.employee.findMany({
        where: { businessId: employee.businessId, departmentId: employee.departmentId, id: { not: employee.id }, isDeployed: true },
        include: { department: true }
      });
      
      const activeTasks = await prisma.task.findMany({
        where: { businessId: employee.businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
      });

      coworkers = peers.map((p: any) => ({
        ...p,
        tasks: activeTasks.filter((t: any) => t.employeeId === p.id)
      }));
    }

    // We add the memories directly to the employee object to preserve UI compat
    const employeeWithMemories = {
      ...employee,
      memories: memories.map(m => ({
        id: m.id,
        key: m.topic || m.title || 'Memory',
        value: m.content || m.summary || m.value || ''
      }))
    };

    return NextResponse.json({
      employee: employeeWithMemories,
      activities,
      knowledge,
      coworkers
    });
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await req.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        voiceId: data.voiceId,
        gender: data.gender,
        accent: data.accent,
        voiceSpeed: data.voiceSpeed,
        voicePitch: data.voicePitch !== undefined ? data.voicePitch : undefined,
        speakingStyle: data.speakingStyle !== undefined ? data.speakingStyle : undefined,
        temperature: data.temperature !== undefined ? data.temperature : undefined,
        personality: data.personality !== undefined ? data.personality : undefined,
        responsibilities: data.responsibilities !== undefined ? data.responsibilities : undefined,
        goals: data.goals !== undefined ? data.goals : undefined,
        decisionBoundaries: data.decisionBoundaries !== undefined ? data.decisionBoundaries : undefined,
        knowledgeAccessTags: data.knowledgeAccessTags !== undefined ? data.knowledgeAccessTags : undefined,
        assignedIntegrations: data.assignedIntegrations !== undefined ? data.assignedIntegrations : undefined,
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
