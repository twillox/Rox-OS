import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Parallel fetch from all platform sources
    const [
      employees,
      departments,
      tasks,
      timelineEvents,
      meetings,
      knowledgeDocs,
      reports,
      insights
    ] = await Promise.all([
      prisma.employee.findMany({ where: { businessId: business.id } }),
      prisma.department.findMany({ where: { businessId: business.id } }),
      prisma.task.findMany({ where: { businessId: business.id }, include: { employee: true }, orderBy: { updatedAt: 'desc' } }),
      prisma.businessTimelineEvent.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.meeting.findMany({ where: { businessId: business.id } }),
      IntelligenceService.getKnowledgeBase(business.id),
      IntelligenceService.getReports(business.id),
      prisma.businessInsight.findMany({ where: { businessId: business.id, status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 5 })
    ]);

    // Derived Metrics
    const activeTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
    const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED');
    
    // Determine AI Workforce Status
    const workforceStatus = employees.map((emp: any) => {
      const empTasks = tasks.filter((t: any) => t.employeeId === emp.id);
      const active = empTasks.find((t: any) => t.status === 'IN_PROGRESS');
      return {
        ...emp,
        currentTask: active || null,
        healthStatus: empTasks.some((t: any) => t.status === 'BLOCKED') ? 'blocked' : 'healthy'
      };
    });

    const activeEmployees = workforceStatus.filter(e => e.healthStatus === 'healthy' || e.currentTask).length;

    // Company Health Score calculation based on real metrics
    const totalTasks = tasks.length || 1;
    const taskCompletionRate = completedTasks.length / totalTasks;
    const blockedPenalty = (blockedTasks.length / totalTasks) * 0.5; // Up to 50% penalty
    let healthScore = Math.round((taskCompletionRate - blockedPenalty) * 100);
    if (healthScore < 0) healthScore = 0;
    if (healthScore > 100) healthScore = 100;
    if (tasks.length === 0) healthScore = 100; // default for new companies

    // Department Health Aggregation
    const departmentHealth = departments.map((dept: any) => {
      const deptEmployees = employees.filter((e: any) => e.departmentId === dept.id).map((e: any) => e.id);
      const deptTasks = tasks.filter((t: any) => deptEmployees.includes(t.employeeId));
      const deptCompleted = deptTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const deptBlocked = deptTasks.filter((t: any) => t.status === 'BLOCKED').length;
      const total = deptTasks.length || 1;
      
      return {
        id: dept.id,
        name: dept.name,
        managerId: dept.managerId,
        employeesCount: deptEmployees.length,
        tasksCount: deptTasks.length,
        completedCount: deptCompleted,
        productivity: Math.round((deptCompleted / total) * 100),
        status: deptBlocked > 0 ? 'attention' : 'healthy'
      };
    });

    // Derive active missions from high priority tasks
    const activeMissions = tasks.filter((t: any) => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'COMPLETED').slice(0, 5);

    // Derive alerts from blocked tasks and pipeline events
    const alerts = blockedTasks.map((t: any) => ({
      id: t.id,
      type: 'blocked_task',
      message: `Task Blocked: ${t.title} requires attention.`,
      severity: 'high'
    }));
    if (activeEmployees === 0 && employees.length > 0) {
       alerts.push({ id: 'offline_workforce', type: 'system', message: 'No active AI employees found.', severity: 'medium' });
    }

    return NextResponse.json({
      success: true,
      data: {
        businessName: business.name,
        overview: {
          totalEmployees: employees.length,
          activeEmployees,
          departmentsCount: departments.length,
          knowledgeCount: knowledgeDocs.length,
          completedTasks: completedTasks.length,
          runningAutomations: 0, // placeholder until automation table exists
          boardroomSessions: meetings.length,
          healthScore
        },
        workforceStatus,
        timelineEvents,
        departmentHealth,
        activeMissions,
        alerts,
        recentReports: reports.slice(0, 3),
        recommendations: insights
      }
    });
  } catch (error: any) {
    console.error('Mission Control GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
