import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { EventPipeline } from '@/core/messaging/EventPipeline';

export async function POST(req: Request) {
  try {
    const rawPayload = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const githubEvent = req.headers.get('x-github-event') || 'unknown';
    const deliveryId = req.headers.get('x-github-delivery') || crypto.randomUUID();

    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    // Validate webhook signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { success: false, error: 'Missing x-hub-signature-256 header' },
          { status: 401 }
        );
      }

      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex')}`;

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        console.warn('GitHub webhook signature mismatch rejected.');
        return NextResponse.json(
          { success: false, error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const action = payload.action || '';
    const repoName = payload.repository?.full_name || 'unknown/repo';

    // Construct standard Roxten SystemEvent type & intent
    let eventType = `github.${githubEvent}`;
    if (action) {
      eventType = `${eventType}.${action}`;
    }

    const intent = `code.${githubEvent}.${action || 'updated'}`;

    // Dispatch to Roxten OS EventPipeline
    const pipeline = EventPipeline.getInstance();
    const dispatched = pipeline.dispatch({
      type: eventType,
      sender: `webhook.github.${repoName}`,
      receiver: 'all',
      intent,
      payload: {
        deliveryId,
        event: githubEvent,
        action,
        repository: repoName,
        sender: payload.sender?.login,
        pullRequest: payload.pull_request ? {
          number: payload.pull_request.number,
          title: payload.pull_request.title,
          url: payload.pull_request.html_url,
          user: payload.pull_request.user?.login,
        } : undefined,
        issue: payload.issue ? {
          number: payload.issue.number,
          title: payload.issue.title,
          url: payload.issue.html_url,
        } : undefined,
        commitsCount: payload.commits?.length,
        raw: payload,
      },
      priority: githubEvent === 'pull_request' ? 'high' : 'normal',
      status: 'pending',
    });

    console.log(`GitHub Webhook processed [${eventType}] from ${repoName} (Delivery: ${deliveryId})`);

    return NextResponse.json({
      success: true,
      received: true,
      eventId: dispatched.id,
      eventType,
    });
  } catch (error: any) {
    console.error('GitHub Webhook handler failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
