import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const uploadPath = (formData.get('path') as string) || `uploads/${file?.name || 'file'}`;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let url = '';

    // 1. Attempt Firebase Storage upload
    try {
      const bucket = 'roxten-os.firebasestorage.app';
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(uploadPath)}`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: buffer
      });

      if (res.ok) {
        const data = await res.json();
        const downloadTokens = data.downloadTokens || '';
        url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(uploadPath)}?alt=media${downloadTokens ? `&token=${downloadTokens}` : ''}`;
      }
    } catch (e) {
      console.warn('Firebase Storage upload warning, falling back to local storage', e);
    }

    // 2. High-reliability fallback: Local filesystem in public/
    if (!url) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const sanitizedPath = uploadPath.replace(/[^a-zA-Z0-9/_.-]/g, '_');
        const localFilePath = path.join(process.cwd(), 'public', sanitizedPath);
        const dirName = path.dirname(localFilePath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(localFilePath, buffer);
        url = `/${sanitizedPath}`;
      } catch (localErr) {
        console.warn('Local storage write warning, using data URI fallback', localErr);
        url = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64').substring(0, 500)}...`;
      }
    }

    // 3. Extract text from the file for knowledge base processing
    let extractedText = '';
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
      console.warn('Could not parse file text:', parseError);
      extractedText = `File: ${file.name}`;
    }

    return NextResponse.json({ url, text: extractedText });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
