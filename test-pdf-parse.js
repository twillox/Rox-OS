const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function testPdfParse() {
  try {
    const buffer = fs.readFileSync('test_dummy.pdf');
    const parser = new PDFParse(new Uint8Array(buffer));
    const result = await parser.getText();
    console.log('Extracted Text:', result.text);
    
  } catch (error) {
    console.error('PDF Parse Error:', error);
  }
}

testPdfParse();
