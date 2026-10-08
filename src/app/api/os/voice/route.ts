import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const voices = await prisma.voice.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayName: 'asc' }
    });

    return NextResponse.json({ success: true, data: voices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
