import prisma from '@/lib/prisma';

export class WorkforceService {
  /**
   * Returns only fully initialized and deployed employees for a business.
   * This acts as the single source of truth for all workforce metrics.
   */
  static async getDeployedEmployees(businessId: string) {
    const employees = await prisma.employee.findMany({
      where: { businessId }
    });
    return employees;
  }

  /**
   * Returns the assembled Galaxy graph (Business -> Departments -> Employees)
   * used by Active Directory, Galaxy View, etc.
   */
  static async getGalaxy(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) return null;

    const departments = await prisma.department.findMany({
      where: { businessId }
    });

    // Fetch all employees
    const employees = await this.getDeployedEmployees(businessId);
    
    // Fetch all active tasks to join with employees
    const activeTasks = await prisma.task.findMany({
      where: {
        businessId,
        status: { in: ['IN_PROGRESS', 'PENDING'] }
      }
    });

    // Attach tasks to employees
    const employeesWithTasks = employees.map((emp: any) => ({
      ...emp,
      tasks: activeTasks.filter((t: any) => t.employeeId === emp.id)
    }));

    // Assemble departments without duplicates
    const assignedEmployeeIds = new Set<string>();
    const assembledDepartments = departments.map((dept: any) => {
      const deptEmployees = employeesWithTasks.filter((emp: any) => {
        if (assignedEmployeeIds.has(emp.id)) return false;
        const matches = emp.departmentId === dept.id || 
          (emp.department && dept.name && emp.department.toLowerCase() === dept.name.toLowerCase());
        if (matches) {
          assignedEmployeeIds.add(emp.id);
          return true;
        }
        return false;
      });
      return {
        ...dept,
        employees: deptEmployees
      };
    });

    // Assemble floaters (strictly employees not assigned to any department)
    const floaters = employeesWithTasks.filter((emp: any) => !assignedEmployeeIds.has(emp.id));

    return {
      ...business,
      departments: assembledDepartments,
      employees: floaters
    };
  }

  static async getPulseMetrics(businessId: string) {
    const employees = await this.getDeployedEmployees(businessId);
    
    // Fetch real metrics
    const [activeTasks, completedTasks, voiceSessions] = await Promise.all([
      prisma.task.findMany({
        where: { businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
      }),
      prisma.task.findMany({
        where: { businessId, status: 'COMPLETED' }
      }),
      prisma.activity.findMany({
        where: { businessId, source: 'voice_session' }
      })
    ]);

    const activeEmployeesCount = employees.length;
    const runningTasksCount = activeTasks.length;

    // A running task in IN_PROGRESS means the employee is working/speaking
    const workingEmployees = activeTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const idleEmployees = Math.max(0, activeEmployeesCount - workingEmployees);

    return {
      activeEmployees: activeEmployeesCount,
      tasksCount: runningTasksCount, // Assigned Tasks
      completedTasks: completedTasks.length, // Completed Tasks
      voiceSessions: voiceSessions.length, // Total Voice Sessions
      workingEmployees,
      idleEmployees,
      averageRuntimeHealth: 100, // Placeholder for runtime health checks
      averageKnowledgeConfidence: 95 // Placeholder for RAG confidence
    };
  }
}
