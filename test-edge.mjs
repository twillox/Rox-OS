import { EdgeTTS } from '@bestcodes/edge-tts';

async function test() {
  const tts = new EdgeTTS();
  const voices = await tts.getVoices();
  console.log('Voices:', voices.slice(0,2));
}

test().catch(console.error);
