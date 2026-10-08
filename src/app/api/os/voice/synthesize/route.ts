import { NextResponse } from 'next/server';
import { EdgeTTS } from '@/lib/edge-tts';

export async function POST(req: Request) {
  try {
    const { text, voice, pitch, rate } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const stream = await EdgeTTS.synthesize(text, {
      voice,
      pitch,
      rate
    });

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('TTS synthesize error:', error);
    return NextResponse.json({ error: error.message || 'Failed to synthesize speech', stack: error.stack }, { status: 500 });
  }
}
