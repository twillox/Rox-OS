import { NextResponse } from 'next/server';
import { createPipelineJob, runIntelligencePipeline } from '@/lib/pipeline';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, industry, goals, extractedText, websiteUrl, userId: bodyUserId } = body;

    if (!companyName || !industry) {
      return NextResponse.json({ error: 'Company Name and Industry are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('userId')?.value;
    const effectiveUserId = bodyUserId || cookieUserId || `user_${Date.now()}`;

    // 1. Create a background job tracker
    const jobId = await createPipelineJob(effectiveUserId);

    // 2. Fire the background pipeline without awaiting it
    // Note: Next.js locally will let this run in the background. On Vercel Edge, we'd use waitUntil().
    runIntelligencePipeline(jobId, effectiveUserId, companyName, industry, goals, extractedText, websiteUrl)
        .catch(e => console.error('Background pipeline error:', e));

    // 3. Return immediately to the client
    return NextResponse.json({ success: true, jobId }, { status: 202 });
  } catch (error: any) {
    console.error('Pipeline Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
