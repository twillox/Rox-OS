import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'biz_roxten_corp';
    const business = await (await import('@/lib/services/SeedService')).ensureBusinessInitialized(businessId);

    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');
    const severity = searchParams.get('severity');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    // Note: Prisma in this proxy setup doesn't cleanly handle cursors yet, so we will fetch more and filter

    const whereClause: any = { businessId: business.id };
    
    // Add dynamic filters
    if (module) whereClause.module = module;
    if (severity) whereClause.severity = severity;

    let timeline = await prisma.businessTimelineEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 200 // overfetch for client-side search indexing if needed
    });

    // Handle text search locally since FirestoreAdapter doesn't support complex text search
    if (search) {
      const s = search.toLowerCase();
      timeline = timeline.filter((e: any) => 
        (e.title && e.title.toLowerCase().includes(s)) || 
        (e.description && e.description.toLowerCase().includes(s)) ||
        (e.actor && e.actor.toLowerCase().includes(s)) ||
        (e.type && e.type.toLowerCase().includes(s))
      );
    }

    // Apply strict limit
    timeline = timeline.slice(0, limit);

    return NextResponse.json({ success: true, data: timeline });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.eventType || !body.module || !body.title || !body.description) {
      return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    const event = await EventService.publish({
      businessId,
      eventType: body.eventType,
      module: body.module,
      title: body.title,
      description: body.description,
      actor: body.actor || 'Client',
      severity: body.severity || 'INFO',
      targetEntity: body.targetEntity,
      relatedEntityId: body.relatedEntityId,
      metadata: body.metadata,
      source: 'client_api'
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
