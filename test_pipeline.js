const path = require('path');
const fs = require('fs');

// Register ts-node or just compile a quick test
require('ts-node').register({
  compilerOptions: { module: 'commonjs' }
});

const { VoiceWorker } = require('./src/core/providers/voice/VoiceWorker');

async function test() {
  try {
    const worker = VoiceWorker.getInstance();
    
    // Create dummy audio
    const dummyPath = path.join(process.cwd(), 'dummy_test.wav');
    fs.writeFileSync(dummyPath, 'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00w\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00');
    
    console.log("Running pipeline on dummy file...");
    const res = await worker.execute({
      action: 'clone',
      payload: { ref_audio: dummyPath }
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("PIPELINE FAILED WITH ERROR:");
    console.error(e);
  }
}

test();
