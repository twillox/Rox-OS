import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dna = await IntelligenceService.getCompanyDNA(businessId);
    
    return NextResponse.json({ dna: dna || null });
  } catch (error: any) {
    console.error('DNA GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Manually force regenerate DNA
    const dna = await IntelligenceService.generateCompanyDNA(businessId);

    return NextResponse.json({ success: true, dna });
  } catch (error: any) {
    console.error('DNA POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
