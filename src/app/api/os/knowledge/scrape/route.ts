import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as cheerio from 'cheerio';
import prisma from '@/lib/prisma';
import { IntelligenceService } from '@/lib/services/IntelligenceService';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Roxten OS Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      // Short timeout to avoid hanging on bad servers
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML
    const $ = cheerio.load(html);

    // Remove noisy elements
    $('script, style, noscript, iframe, img, svg, nav, footer, header, aside').remove();

    // Extract semantic text preserving structure
    let extractedText = '';

    // Prioritize main content if exists
    const mainContent = $('main, article, [role="main"]').length > 0 
      ? $('main, article, [role="main"]') 
      : $('body');

    mainContent.find('h1, h2, h3, h4, h5, h6, p, ul, ol').each((_, el) => {
      const tagName = el.tagName.toLowerCase();
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      
      if (!text) return;

      if (tagName.startsWith('h')) {
        extractedText += `\n\n## ${text}\n`;
      } else if (tagName === 'p') {
        extractedText += `${text}\n`;
      } else if (tagName === 'ul' || tagName === 'ol') {
        $(el).find('li').each((_, li) => {
          const liText = $(li).text().trim().replace(/\s+/g, ' ');
          if (liText) extractedText += `- ${liText}\n`;
        });
      }
    });

    if (!extractedText.trim()) {
      // Fallback if semantic tags failed
      extractedText = mainContent.text().trim().replace(/\s+/g, ' ');
    }

    const title = $('title').text().trim() || url;
    const userId = cookieStore.get('userId')?.value || 'System';

    // 1. Create Raw Document
    const { EventService } = await import('@/lib/services/EventService');
    const docMeta = await prisma.knowledgeDocument.create({
      data: {
        businessId: business.id,
        title,
        sourceUrl: url,
        status: 'UPLOADING',
        type: 'WEBSITE',
        fileSize: extractedText.length,
        fileType: 'text/html',
        uploaderId: userId
      }
    });

    await EventService.publish({
      businessId: business.id,
      module: 'KNOWLEDGE',
      eventType: 'DOCUMENT_UPLOADED',
      title: 'Website Scraped',
      description: `Website scraped: ${title}`,
      actor: userId,
      metadata: { documentId: docMeta.id }
    });

    // 2. Send to ingestion pipeline
    const result = await IntelligenceService.ingestKnowledge(business.id, docMeta.id, extractedText);

    return NextResponse.json({ success: true, ingestedItems: result.ingestedItems, title, documentId: docMeta.id });
  } catch (error: any) {
    console.error('Scrape Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape website' }, { status: 500 });
  }
}
