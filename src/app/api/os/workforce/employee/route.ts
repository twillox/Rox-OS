import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { ensureBusinessInitialized, DEFAULT_BUSINESS_ID } from '@/lib/services/SeedService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || DEFAULT_BUSINESS_ID;
    await ensureBusinessInitialized(businessId);

    const employeesRaw = await prisma.employee.findMany({
      where: { businessId }
    });

    // Sort in memory to avoid missing Firestore composite index error
    const employees = employeesRaw.sort((a: any, b: any) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
