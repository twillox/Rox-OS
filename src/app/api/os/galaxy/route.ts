import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WorkforceService } from '@/lib/services/WorkforceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const businessGalaxy = await WorkforceService.getGalaxy(businessId);
    const pulseMetrics = await WorkforceService.getPulseMetrics(businessId);

    if (!businessGalaxy) {
      return NextResponse.json({ departments: [], employees: [], pulseMetrics });
    }

    return NextResponse.json({ ...businessGalaxy, pulseMetrics });
  } catch (error: any) {
    console.error('Error fetching galaxy data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
