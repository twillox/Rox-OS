import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');
    
    if (!websiteId) return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    let website = await prisma.website.findFirst({
      where: { id: websiteId }
    });

    if (!website) {
      website = {
        id: websiteId,
        name: 'Website Studio Project',
        type: 'ecommerce',
        status: 'DRAFT',
        domain: `draft-${websiteId.substring(0, 8)}.roxten.app`,
        theme: {
          colors: { primary: '#4f46e5', secondary: '#111827' },
          typography: { heading: 'Inter', body: 'System UI' }
        }
      };
    }

    const sections = await prisma.websiteSection.findMany({
      where: { websiteId }
    });

    sections.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    return NextResponse.json({ website, sections });
  } catch (error: any) {
    console.error('Editor API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { websiteId, theme, sections } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    // Validate ownership or find website
    let website = await prisma.website.findFirst({
      where: { id: websiteId }
    });

    if (!website) {
      // Auto-create website record if it doesn't exist yet
      website = await prisma.website.create({
        data: {
          id: websiteId,
          businessId,
          name: 'Website Studio Project',
          type: 'ecommerce',
          status: 'DRAFT',
          domain: `draft-${websiteId.substring(0, 8)}.roxten.app`,
          theme: theme || {
            colors: { primary: '#4f46e5', secondary: '#111827' },
            typography: { heading: 'Inter', body: 'System UI' }
          }
        }
      });
    }

    // Update website theme
    if (theme) {
      await prisma.website.update({
        where: { id: websiteId },
        data: { theme }
      });
    }

    // Persist full sections state
    if (sections && Array.isArray(sections)) {
      const existingSections = await prisma.websiteSection.findMany({
        where: { websiteId }
      });
      const existingIdSet = new Set(existingSections.map((s: any) => s.id));
      const incomingIdSet = new Set<string>();

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const secId = sec.id || `sec_${uuidv4()}`;
        incomingIdSet.add(secId);

        if (existingIdSet.has(secId)) {
          // Update existing section
          await prisma.websiteSection.update({
            where: { id: secId },
            data: {
              name: sec.name || 'Section',
              type: sec.type || 'hero',
              orderIndex: i,
              content: sec.content || {}
            }
          });
        } else {
          // Create new section
          await prisma.websiteSection.create({
            data: {
              id: secId,
              websiteId: websiteId,
              name: sec.name || 'Section',
              type: sec.type || 'hero',
              orderIndex: i,
              content: sec.content || {}
            }
          });
        }
      }

      // Delete removed sections
      for (const existing of existingSections) {
        if (!incomingIdSet.has(existing.id)) {
          await prisma.websiteSection.delete({
            where: { id: existing.id }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Editor API Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
