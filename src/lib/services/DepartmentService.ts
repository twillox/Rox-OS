import prisma from '@/lib/prisma';

export class DepartmentService {
  /**
   * Retrieves an overview of all departments for a business.
   * Aggregates employees and task metrics efficiently.
   */
  static async getDepartmentsOverview(businessId: string) {
    const [rawDepartments, allEmployees, activeTasks, completedTasks] = await Promise.all([
      prisma.department.findMany({ where: { businessId } }),
      prisma.employee.findMany({ where: { businessId } }),
      prisma.task.findMany({ where: { businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.task.findMany({ where: { businessId, status: 'COMPLETED' } })
    ]);

    const departments = rawDepartments.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return departments.map((dept: any) => {
      const deptEmployees = allEmployees.filter((e: any) => 
        e.departmentId === dept.id || 
        (e.department && dept.name && e.department.toLowerCase() === dept.name.toLowerCase())
      );
      
      const deptActiveTasks = activeTasks.filter((t: any) => 
        t.departmentId === dept.id || 
        t.title?.toLowerCase().includes(dept.name?.toLowerCase() || '')
      );
      const deptCompletedTasks = completedTasks.filter((t: any) => 
        t.departmentId === dept.id ||
        t.title?.toLowerCase().includes(dept.name?.toLowerCase() || '')
      );

      const leadId = dept.leadEmployeeId;
      const leadEmployee = leadId ? allEmployees.find((e: any) => e.id === leadId) : (deptEmployees[0] || null);

      return {
        ...dept,
        employees: deptEmployees,
        activeTaskCount: deptActiveTasks.length,
        completedTaskCount: deptCompletedTasks.length,
        leadEmployee: leadEmployee || null
      };
    });
  }

  /**
   * Retrieves deep details for a single department.
   */
  static async getDepartmentDetails(businessId: string, departmentId: string) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || department.businessId !== businessId) return null;

    const [employees, allTasks, timelineEvents, knowledgeBase] = await Promise.all([
      prisma.employee.findMany({ where: { businessId, departmentId, isDeployed: true } }),
      prisma.task.findMany({ where: { businessId, departmentId }, orderBy: { updatedAt: 'desc' } }),
      prisma.businessTimelineEvent.findMany({ where: { businessId, departmentId }, orderBy: { createdAt: 'desc' } }),
      prisma.knowledgeBase.findMany({ where: { businessId } })
    ]);

    const activeTasks = allTasks.filter((t: any) => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED');

    // Filter knowledge logically: either department string matches, or relatedDepartments array contains it.
    const deptKnowledge = knowledgeBase.filter((k: any) => 
      k.department === department.name || 
      (k.relatedDepartments && k.relatedDepartments.includes(department.name))
    );

    const leadId = department.leadEmployeeId;
    const leadEmployee = leadId ? employees.find((e: any) => e.id === leadId) : null;

    // Attach current task to employees for the roster view
    const roster = employees.map((emp: any) => ({
      ...emp,
      currentTask: activeTasks.find((t: any) => t.employeeId === emp.id) || null
    }));

    // Performance Summary calculation
    const totalTasks = activeTasks.length + completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    
    let workloadStatus = 'Idle';
    if (activeTasks.length > employees.length * 2) {
      workloadStatus = 'High';
    } else if (activeTasks.length > 0) {
      workloadStatus = 'Moderate';
    }

    return {
      ...department,
      leadEmployee: leadEmployee || null,
      employees: roster,
      activeTasks,
      completedTasks,
      timelineEvents: timelineEvents.slice(0, 20), // Top 20 recent events
      knowledgeSources: deptKnowledge,
      metrics: {
        totalTasks,
        completionRate,
        workloadStatus,
        activeTaskCount: activeTasks.length,
        completedTaskCount: completedTasks.length
      }
    };
  }
}
