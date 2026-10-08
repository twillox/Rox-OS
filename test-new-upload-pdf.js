const fs = require('fs');
const path = require('path');

async function testPdfUpload() {
  console.log('--- TEST PDF INGEST PIPELINE ---');
  
  // 1. Create a dummy PDF
  const dummyPdf = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
    '4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Test PDF Document) Tj ET\nendstream\nendobj\n' +
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
    'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000224 00000 n \n0000000319 00000 n \n' +
    'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n407\n%%EOF\n', 
    'utf-8'
  );
  fs.writeFileSync('test_new.pdf', dummyPdf);

  // 2. Prepare FormData
  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync('test_new.pdf')], { type: 'application/pdf' });
  formData.append('file', fileBlob, 'test_new.pdf');
  formData.append('businessId', 'system'); 
  formData.append('uploaderId', 'tester');

  try {
    console.log('Sending FormData to /api/os/knowledge/ingest...');
    const ingestRes = await fetch('http://localhost:3000/api/os/knowledge/ingest', {
      method: 'POST',
      body: formData
    });

    const status = ingestRes.status;
    const text = await ingestRes.text();
    console.log(`Ingest API Response [${status}]:`, text);
    
  } catch (e) {
    console.error('Error during test:', e);
  }
}

testPdfUpload();
