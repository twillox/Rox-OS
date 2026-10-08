import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getPipelineJob } from '@/lib/pipeline';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // 1. Check in-memory store first
    const memoryJob = getPipelineJob(jobId);
    if (memoryJob) {
      return NextResponse.json(memoryJob);
    }

    // 2. Fallback to Firestore if server restarted
    try {
      const docRef = doc(db, 'pipelineJobs', jobId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return NextResponse.json(docSnap.data());
      }
    } catch (e: any) {
      console.warn('Firestore getDoc pipelineJobs failed:', e?.message);
    }

    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Pipeline Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
