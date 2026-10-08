import { NextResponse } from 'next/server';
import { EdgeTTS } from '@/lib/edge-tts';

// Cache voices in memory so we don't spam the Edge API every load
let cachedVoices: any = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export async function GET() {
  try {
    const now = Date.now();
    if (!cachedVoices || now - lastFetch > CACHE_DURATION) {
      const voices = await EdgeTTS.getVoices();
      cachedVoices = voices;
      lastFetch = now;
    }

    return NextResponse.json({ success: true, voices: cachedVoices });
  } catch (error: any) {
    console.error('Failed to list Edge TTS voices:', error);
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }
}
