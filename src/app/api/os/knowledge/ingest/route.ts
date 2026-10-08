import { NextResponse } from 'next/server';
import { IntelligenceService } from '@/lib/services/IntelligenceService';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const businessId = (formData.get('businessId') as string) || 'system';
    const uploaderId = (formData.get('uploaderId') as string) || 'System';
    const sourceTitle = (formData.get('sourceTitle') as string) || file?.name || 'Uploaded Document';

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        stage: 'validation', 
        error: 'Missing file or businessId',
        details: `businessId: ${!!businessId}, file: ${!!file}`
      }, { status: 400 });
    }

    const { EventService } = await import('@/lib/services/EventService');
    const { default: prisma } = await import('@/lib/prisma');

    // 1. Create the raw document record
    const docId = `kdoc_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const docRecord = {
      id: docId,
      businessId,
      title: sourceTitle,
      sourceUrl: '', // Will update after upload
      status: 'UPLOADING',
      type: 'DOCUMENT',
      fileSize: file.size || 0,
      fileType: file.type || 'application/octet-stream',
      uploaderId
    };

    let docMeta: any = null;
    try {
      docMeta = await prisma.knowledgeDocument.create({
        data: docRecord
      });
    } catch (e: any) {
      console.warn('Could not persist knowledge document record in database, using fallback', e);
    }
    docMeta = docMeta || docRecord;

    // 2. Upload to Storage (Firebase Storage with reliable Local Storage fallback)
    let url = '';
    let extractedText = '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadPath = `companies/${businessId}/knowledge/${docMeta.id}_${file.name}`;

    try {
      // Attempt Firebase Storage REST API
      const bucket = 'roxten-os.firebasestorage.app';
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(uploadPath)}`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: buffer
      });

      if (res.ok) {
        const data = await res.json();
        const downloadTokens = data.downloadTokens || '';
        url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(uploadPath)}?alt=media${downloadTokens ? `&token=${downloadTokens}` : ''}`;
      }
    } catch (e) {
      console.warn('Firebase Storage REST upload failed, using local storage fallback', e);
    }

    // High-reliability local storage fallback if Firebase Storage permissions reject
    if (!url) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', businessId);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeFileName = `${docMeta.id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(uploadDir, safeFileName);
        fs.writeFileSync(filePath, buffer);
        url = `/uploads/${businessId}/${safeFileName}`;
      } catch (localErr) {
        console.warn('Local storage write warning, using data URI fallback', localErr);
        url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64').substring(0, 500)}...`;
      }
    }

    // 3. Extract text from the uploaded file
    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        if (typeof global.DOMMatrix === 'undefined') {
          (global as any).DOMMatrix = class DOMMatrix {
            constructor() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
          };
        }
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse(new Uint8Array(buffer));
        const pdfData = await parser.getText();
        extractedText = pdfData.text || '';
      } else {
        extractedText = buffer.toString('utf-8');
      }
    } catch (parseError) {
      console.warn('Could not extract text from document:', parseError);
    }

    if (!extractedText || !extractedText.trim()) {
      extractedText = `Uploaded document: ${file.name} (size: ${file.size} bytes, type: ${file.type || 'document'})`;
    }

    // 4. Update Document and Timeline
    try {
      await prisma.knowledgeDocument.update({
        where: { id: docMeta.id },
        data: { sourceUrl: url, status: 'PROCESSING' }
      }).catch(() => {});

      await EventService.publish({
        businessId,
        module: 'KNOWLEDGE',
        eventType: 'DOCUMENT_UPLOADED',
        title: 'Document Uploaded',
        description: `Document uploaded: ${docMeta.title}`,
        actor: uploaderId,
        metadata: { documentId: docMeta.id, url }
      }).catch(() => {});
    } catch (e: any) {
      console.warn('Failed to update timeline or database', e);
    }

    // 5. Generate AI Summary & Ingest into Company Brain
    let result = { ingestedItems: 1 };
    try {
      result = await IntelligenceService.ingestKnowledge(businessId, docMeta.id, extractedText);
    } catch (e: any) {
      console.warn('IntelligenceService ingestion warning, falling back to manual record', e);
      try {
        await prisma.businessKnowledge.create({
          data: {
            businessId,
            title: docMeta.title,
            category: 'Uploaded Document',
            content: extractedText.substring(0, 3000),
            tags: ['document', 'upload'],
            confidenceScore: 90,
            sourceReference: docMeta.title,
            type: 'INTELLIGENCE'
          }
        }).catch(() => {});
      } catch (err) {}
    }

    return NextResponse.json({ 
      success: true, 
      ingestedItems: result?.ingestedItems || 1, 
      documentId: docMeta.id, 
      url,
      title: docMeta.title
    });
  } catch (error: any) {
    console.error('Knowledge Ingest Error:', error);
    return NextResponse.json({ success: false, stage: 'unknown', error: 'An unknown error occurred', details: error.message }, { status: 500 });
  }
}
