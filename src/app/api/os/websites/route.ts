import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultSectionContent, SectionType } from '@/app/dashboard/website-studio/types';

export async function POST(req: Request) {
  try {
    const { templateId, templateName, templateType, dashboardConfig } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    const websiteId = `web_${uuidv4()}`;

    // 1. Create Website Record
    const website = await prisma.website.create({
      data: {
        id: websiteId,
        businessId,
        templateId,
        name: `${templateName} Project`,
        type: templateType,
        status: 'DRAFT',
        domain: `draft-${websiteId.substring(0, 8)}.roxten.app`,
        metadata: {
          dashboard: dashboardConfig,
          analyticsInitialized: true,
          aiEnabled: true,
          createdAt: new Date().toISOString()
        },
        theme: {
          colors: {
            primary: '#4f46e5',
            secondary: '#111827'
          },
          typography: {
            heading: 'Inter',
            body: 'System UI'
          }
        }
      }
    });

    // 2. Initialize WebsiteSections tailored to template concept
    let defaultSections: Array<{ name: string; type: SectionType }> = [];

    switch (templateType) {
      case 'portfolio':
        defaultSections = [
          { name: 'Header', type: 'header' },
          { name: 'Hero Showcase', type: 'hero' },
          { name: 'About Studio', type: 'image-text' },
          { name: 'Featured Works', type: 'product-grid' },
          { name: 'Client Testimonials', type: 'testimonials' },
          { name: 'Get In Touch', type: 'contact' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      case 'restaurant':
        defaultSections = [
          { name: 'Announcement Bar', type: 'announcement-bar' },
          { name: 'Header', type: 'header' },
          { name: 'Hero Section', type: 'hero' },
          { name: 'Menu Categories', type: 'collection-grid' },
          { name: 'Chef Philosophy', type: 'image-text' },
          { name: 'Guest Reviews', type: 'testimonials' },
          { name: 'Reservations & Hours', type: 'contact' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      case 'saas':
        defaultSections = [
          { name: 'Announcement Bar', type: 'announcement-bar' },
          { name: 'Header', type: 'header' },
          { name: 'Hero Platform', type: 'hero' },
          { name: 'Platform Features', type: 'product-grid' },
          { name: 'Integration Story', type: 'image-text' },
          { name: 'FAQ Accordion', type: 'faq' },
          { name: 'Customer Testimonials', type: 'testimonials' },
          { name: 'Get Started Today', type: 'newsletter' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      case 'personal-brand':
        defaultSections = [
          { name: 'Header', type: 'header' },
          { name: 'Hero Bio', type: 'hero' },
          { name: 'My Journey', type: 'image-text' },
          { name: 'Latest Publication', type: 'product-detail' },
          { name: 'Praise & Awards', type: 'testimonials' },
          { name: 'Join Weekly Letter', type: 'newsletter' },
          { name: 'Speaker Inquiries', type: 'contact' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      case 'blog':
        defaultSections = [
          { name: 'Header', type: 'header' },
          { name: 'Topics Navigation', type: 'navigation' },
          { name: 'Featured Story', type: 'hero' },
          { name: 'Latest Articles', type: 'product-grid' },
          { name: 'Subscribe to Newsletter', type: 'newsletter' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      case 'landing-page':
        defaultSections = [
          { name: 'Urgent Announcement', type: 'announcement-bar' },
          { name: 'Hero Offer', type: 'hero' },
          { name: 'Flagship Edition', type: 'product-detail' },
          { name: 'Why Choose Us', type: 'image-text' },
          { name: 'Verified Reviews', type: 'testimonials' },
          { name: 'FAQ', type: 'faq' },
          { name: 'Claim Your Discount', type: 'newsletter' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
      default: // ecommerce
        defaultSections = [
          { name: 'Announcement Bar', type: 'announcement-bar' },
          { name: 'Header', type: 'header' },
          { name: 'Hero Banner', type: 'hero' },
          { name: 'Trending Products', type: 'product-grid' },
          { name: 'Shop Categories', type: 'collection-grid' },
          { name: 'Our Craftsmanship', type: 'image-text' },
          { name: 'Customer Reviews', type: 'testimonials' },
          { name: 'FAQ Accordion', type: 'faq' },
          { name: 'Newsletter Signup', type: 'newsletter' },
          { name: 'Footer', type: 'footer' }
        ];
        break;
    }

    for (let i = 0; i < defaultSections.length; i++) {
      const section = defaultSections[i];
      await prisma.websiteSection.create({
        data: {
          id: `sec_${uuidv4()}`,
          websiteId: websiteId,
          name: section.name,
          type: section.type,
          orderIndex: i,
          content: createDefaultSectionContent(section.type)
        }
      });
    }

    return NextResponse.json({ success: true, websiteId });
  } catch (error: any) {
    console.error('Create Website Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    const websites = await prisma.website.findMany({
      where: { businessId }
    });

    return NextResponse.json(websites);
  } catch (error: any) {
    console.error('Get Websites Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
    }

    // Delete sections
    const sections = await prisma.websiteSection.findMany({
      where: { websiteId }
    });
    for (const sec of sections) {
      await prisma.websiteSection.delete({ where: { id: sec.id } });
    }

    // Delete website
    await prisma.website.delete({ where: { id: websiteId } });

    return NextResponse.json({ success: true, websiteId });
  } catch (error: any) {
    console.error('Delete Website Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
