import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DepartmentService } from '@/lib/services/DepartmentService';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    const departmentDetails = await DepartmentService.getDepartmentDetails(business.id, id);

    if (!departmentDetails) {
       return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: departmentDetails });
  } catch (error: any) {
    console.error('Error fetching department details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
