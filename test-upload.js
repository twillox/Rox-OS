const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function testUploadPipeline() {
  console.log('--- PHASE 1: Generate Test PDF ---');
  const testPdfPath = path.join(__dirname, 'test.pdf');
  
  // Create a dummy text file
  fs.writeFileSync('test.txt', 'This is a test file for knowledge ingestion.');

  // Let's first test the backend with a dummy text file but mimicking the exact frontend behavior.
  // The frontend sends a FormData with file and path.

  console.log('--- PHASE 2: Upload to Storage API ---');
  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync('test.txt')], { type: 'text/plain' });
  formData.append('file', fileBlob, 'test.txt');
  formData.append('path', 'companies/test1234/knowledge/test.txt');

  try {
    const uploadRes = await fetch('http://localhost:3000/api/os/storage/upload', {
      method: 'POST',
      body: formData
    });

    const uploadStatus = uploadRes.status;
    const uploadText = await uploadRes.text();
    console.log(`Storage API Response [${uploadStatus}]:`, uploadText);

    if (uploadStatus !== 200) {
      console.log('Storage API failed, stopping test.');
      return;
    }

    const { url, text } = JSON.parse(uploadText);
    console.log('Extracted Text length:', text ? text.length : 0);
    console.log('Extracted Text content:', text);

    console.log('\n--- PHASE 3: Ingest API ---');
    const ingestPayload = {
      businessId: 'test1234',
      text: text, // This will be empty for PDFs or if extraction fails
      sourceUrl: url,
      sourceTitle: 'test.txt',
      fileSize: 1024,
      fileType: 'text/plain',
      uploaderId: 'System'
    };

    console.log('Sending to Ingest API:', JSON.stringify(ingestPayload, null, 2));

    const ingestRes = await fetch('http://localhost:3000/api/os/knowledge/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ingestPayload)
    });

    const ingestStatus = ingestRes.status;
    const ingestResponseText = await ingestRes.text();
    console.log(`Ingest API Response [${ingestStatus}]:`, ingestResponseText);

    // Let's force an empty text to simulate the PDF parse failure
    console.log('\n--- PHASE 4: Simulate PDF failure (text="") ---');
    const pdfSimulatePayload = { ...ingestPayload, text: '' };
    console.log('Sending to Ingest API (simulating PDF failure):', JSON.stringify(pdfSimulatePayload, null, 2));

    const ingestRes2 = await fetch('http://localhost:3000/api/os/knowledge/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdfSimulatePayload)
    });

    const ingestStatus2 = ingestRes2.status;
    const ingestResponseText2 = await ingestRes2.text();
    console.log(`Ingest API Response [${ingestStatus2}]:`, ingestResponseText2);

  } catch (e) {
    console.error('Error during test:', e);
  }
}

testUploadPipeline();
