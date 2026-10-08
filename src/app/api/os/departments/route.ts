import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DepartmentService } from '@/lib/services/DepartmentService';
import { ensureBusinessInitialized, DEFAULT_BUSINESS_ID } from '@/lib/services/SeedService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || DEFAULT_BUSINESS_ID;
    const business = await ensureBusinessInitialized(businessId);

    const departments = await DepartmentService.getDepartmentsOverview(business.id);

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, employeeIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const newDept = await prisma.department.create({
      data: {
        businessId,
        name,
        description: description || `Department for ${name}`,
      }
    });

    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      for (const empId of employeeIds) {
        await prisma.employee.update({
          where: { id: empId },
          data: { departmentId: newDept.id }
        });
      }
    }

    return NextResponse.json({ success: true, data: newDept });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
