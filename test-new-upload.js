const fs = require('fs');
const path = require('path');

async function testNewPipeline() {
  console.log('--- TEST NEW INGEST PIPELINE ---');
  
  // 1. Create a dummy text file
  fs.writeFileSync('test_new.txt', 'This is a test file for the unified knowledge pipeline.');

  // 2. Prepare FormData
  const formData = new FormData();
  const fileBlob = new Blob([fs.readFileSync('test_new.txt')], { type: 'text/plain' });
  formData.append('file', fileBlob, 'test_new.txt');
  formData.append('businessId', 'system'); // Use 'system' since it exists in the test DB
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

    // 3. Test missing file validation
    console.log('\n--- TEST VALIDATION (Missing File) ---');
    const missingFileFormData = new FormData();
    missingFileFormData.append('businessId', 'system');
    
    const validateRes = await fetch('http://localhost:3000/api/os/knowledge/ingest', {
      method: 'POST',
      body: missingFileFormData
    });
    
    console.log(`Validation Response [${validateRes.status}]:`, await validateRes.text());
    
  } catch (e) {
    console.error('Error during test:', e);
  }
}

testNewPipeline();
