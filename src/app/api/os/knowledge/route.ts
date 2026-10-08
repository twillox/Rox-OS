import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'No business configured' }, { status: 404 });

    let knowledge = await IntelligenceService.getKnowledgeBase(business.id);

    // LOGICAL SEPARATION: Filter out raw intelligence facts. Keep only Document records.
    knowledge = knowledge.filter((doc: any) => doc.type !== 'INTELLIGENCE' && doc.status);

    // Apply metadata filters
    if (department) knowledge = knowledge.filter((k: any) => k.department === department);
    if (type) knowledge = knowledge.filter((k: any) => k.type === type);
    if (status) knowledge = knowledge.filter((k: any) => k.status === status);
    if (search) {
      const q = search.toLowerCase();
      knowledge = knowledge.filter((k: any) => 
        (k.title && k.title.toLowerCase().includes(q)) || 
        (k.aiSummary && k.aiSummary.toLowerCase().includes(q)) ||
        (k.tags && k.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (k.keywords && k.keywords.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // Format for UI
    const formattedKnowledge = knowledge.map((node: any) => ({
      id: node.id,
      title: node.title || 'Untitled Document',
      aiSummary: node.aiSummary || node.content || 'Processing document...',
      status: node.status || 'AVAILABLE',
      type: node.type || 'DOCUMENT',
      department: node.department || 'General',
      sourceUrl: node.sourceUrl,
      fileSize: node.fileSize || 0,
      tags: node.tags || node.keywords || [],
      uploaderId: node.uploaderId,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt
    }));

    return NextResponse.json({ success: true, data: formattedKnowledge });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
