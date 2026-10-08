import prisma from '@/lib/prisma';
import { GmailService } from '@/lib/integrations/services/GmailService';
import { GoogleCalendarService } from '@/lib/integrations/services/GoogleCalendarService';
import { GoogleDriveService } from '@/lib/integrations/services/GoogleDriveService';
import { GitHubService } from '@/lib/integrations/services/GitHubService';
import { NotionService } from '@/lib/integrations/services/NotionService';
import { EventService } from '@/lib/services/EventService';

export interface LiveIntegrationContextResult {
  formattedText: string;
  connectedProviders: string[];
  details: {
    emails?: any[];
    events?: any[];
    driveFiles?: any[];
    githubRepos?: any[];
    notionPages?: any[];
  };
}

interface CacheEntry {
  timestamp: number;
  data: LiveIntegrationContextResult;
}
const contextCache = new Map<string, CacheEntry>();

export class AgentIntegrationService {
  public static invalidateCache() {
    contextCache.clear();
  }

  /**
   * Fetches real-time live data from all connected user integrations
   * to enrich LLM prompts, JARVIS voice responses, and automated reports.
   */
  public static async getLiveIntegrationsContext(
    userId: string,
    businessId: string
  ): Promise<LiveIntegrationContextResult> {
    const cacheKey = `${userId}_${businessId}`;
    const cached = contextCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }

    const connectedProviders: string[] = [];
    const details: any = {};
    const textSections: string[] = [];

    try {
      // 1. Find connected integrations matching userId or fallback to any connected integration in DB
      let userIntegrations = await prisma.integration.findMany({
        where: {
          userId,
          status: 'Connected',
        },
      });

      if (!userIntegrations || userIntegrations.length === 0) {
        userIntegrations = await prisma.integration.findMany({
          where: {
            status: 'Connected',
          },
        });
      }

      const connectedMap = new Map<string, any>();
      (userIntegrations || []).forEach((i: any) => connectedMap.set(i.provider, i));

      // 1. GMAIL
      const gmailIntegration = connectedMap.get('google_gmail') || connectedMap.get('gmail');
      if (gmailIntegration) {
        try {
          const authUserId = gmailIntegration.userId || userId;
          const emails = await GmailService.getRecentEmails(authUserId, 5);
          details.emails = emails;
          connectedProviders.push('Gmail');

          if (emails.length > 0) {
            let emailText = `--- LIVE GMAIL INBOX (Recent ${emails.length} Emails) ---\n`;
            emails.forEach((em, i) => {
              emailText += `${i + 1}. From: "${em.from}", Subject: "${em.subject}", Date: ${em.date}\n   Snippet: "${em.snippet}"\n`;
            });
            textSections.push(emailText);
          } else {
            textSections.push(`--- LIVE GMAIL INBOX ---\n(Inbox is connected, zero emails returned.)\n`);
          }
        } catch (mailErr: any) {
          console.warn('Live Gmail fetch error for agent:', mailErr.message);
          textSections.push(`--- GMAIL ---\n(Connected, error fetching emails: ${mailErr.message})\n`);
        }
      }

      // 2. GOOGLE CALENDAR
      const calIntegration = connectedMap.get('google_calendar') || connectedMap.get('calendar');
      if (calIntegration) {
        try {
          const authUserId = calIntegration.userId || userId;
          const events = await GoogleCalendarService.getUpcomingEvents(authUserId, 'primary', 5);
          details.events = events;
          connectedProviders.push('Google Calendar');

          if (events.length > 0) {
            let calText = `--- LIVE GOOGLE CALENDAR (Upcoming ${events.length} Events) ---\n`;
            events.forEach((ev, i) => {
              calText += `${i + 1}. Event: "${ev.title}", Time: ${ev.startTime} to ${ev.endTime}, Attendees: ${(ev.attendees || []).join(', ') || 'None'}\n`;
            });
            textSections.push(calText);
          } else {
            textSections.push(`--- LIVE GOOGLE CALENDAR ---\n(Calendar is connected, no upcoming events today.)\n`);
          }
        } catch (calErr: any) {
          console.warn('Live Calendar fetch error for agent:', calErr.message);
        }
      }

      // 3. GOOGLE DRIVE
      const driveIntegration = connectedMap.get('google_drive') || connectedMap.get('drive');
      if (driveIntegration) {
        try {
          const authUserId = driveIntegration.userId || userId;
          const driveData = await GoogleDriveService.listFiles(authUserId, 5);
          const files = driveData.files || [];
          details.driveFiles = files;
          connectedProviders.push('Google Drive');

          if (files.length > 0) {
            let driveText = `--- LIVE GOOGLE DRIVE (Recent ${files.length} Files) ---\n`;
            files.forEach((f, i) => {
              driveText += `${i + 1}. Document: "${f.name}", MIME: ${f.mimeType}\n`;
            });
            textSections.push(driveText);
          }
        } catch (driveErr: any) {
          console.warn('Live Drive fetch error for agent:', driveErr.message);
        }
      }

      // 4. GITHUB
      const ghIntegration = connectedMap.get('github');
      if (ghIntegration) {
        try {
          const authUserId = ghIntegration.userId || userId;
          const repos = await GitHubService.listRepositories(authUserId, 5);
          details.githubRepos = repos;
          connectedProviders.push('GitHub');

          if (repos.length > 0) {
            let ghText = `--- LIVE GITHUB (Recent ${repos.length} Repositories) ---\n`;
            repos.forEach((r, i) => {
              ghText += `${i + 1}. Repo: "${r.full_name}", Stars: ${r.stargazers_count}, Description: "${r.description || 'None'}"\n`;
            });
            textSections.push(ghText);
          }
        } catch (ghErr: any) {
          console.warn('Live GitHub fetch error for agent:', ghErr.message);
        }
      }

      // 5. LINKEDIN
      const linkedInIntegration = connectedMap.get('linkedin');
      if (linkedInIntegration) {
        connectedProviders.push('LinkedIn');
        const memberName = linkedInIntegration.providerAccountName || 'Connected Member';
        textSections.push(`--- LIVE LINKEDIN ---\nAccount: "${memberName}" (Connected, ready to publish posts via official REST API)\n`);
      }

      // 6. NOTION
      const notionIntegration = connectedMap.get('notion');
      if (notionIntegration) {
        try {
          const authUserId = notionIntegration.userId || userId;
          const pages = await NotionService.searchPages(authUserId);
          details.notionPages = pages;
          connectedProviders.push('Notion');

          const workspaceName = notionIntegration.providerAccountName || 'Notion Workspace';
          if (pages.length > 0) {
            let notionText = `--- LIVE NOTION WORKSPACE (${workspaceName} - Recent ${pages.length} Pages) ---\n`;
            pages.forEach((p, i) => {
              notionText += `${i + 1}. Page: "${p.title}" (ID: ${p.id})\n`;
            });
            textSections.push(notionText);
          } else {
            textSections.push(`--- LIVE NOTION WORKSPACE (${workspaceName}) ---\n(Workspace connected. Ready to create notes and documents.)\n`);
          }
        } catch (notionErr: any) {
          console.warn('Live Notion fetch error for agent:', notionErr.message);
          textSections.push(`--- NOTION ---\n(Connected, error fetching pages: ${notionErr.message})\n`);
        }
      }
    } catch (e: any) {
      console.warn('Error reading user integrations for agent context:', e.message);
    }

    const formattedText = textSections.length > 0
      ? textSections.join('\n')
      : '(No third-party integrations connected yet. User can connect Gmail, Calendar, Drive, and GitHub in the Integrations Hub.)';

    const result: LiveIntegrationContextResult = {
      formattedText,
      connectedProviders,
      details,
    };

    contextCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  /**
   * Automatically replies to the most recent email in user's inbox
   */
  public static async replyToLatestEmail(
    userId: string,
    replyBody: string = 'Hi, I am currently not available. I will get back to you soon.'
  ): Promise<{ success: boolean; to: string; subject: string; error?: string }> {
    try {
      const liveContext = await this.getLiveIntegrationsContext(userId, '');
      const emails = liveContext.details?.emails || [];
      if (emails.length === 0) {
        throw new Error('No recent emails found in your connected Gmail inbox.');
      }

      const latestEmail = emails[0];
      const fromHeader = latestEmail.from || '';
      // Extract target email address e.g. "John Doe <john@acme.com>" -> "john@acme.com"
      const emailMatch = fromHeader.match(/<([^>]+)>/);
      const targetEmail = (emailMatch ? emailMatch[1] : fromHeader).trim();

      if (!targetEmail) {
        throw new Error(`Could not determine recipient email address from header: ${fromHeader}`);
      }

      const rawSubject = latestEmail.subject || 'Message';
      const subject = rawSubject.toLowerCase().startsWith('re:') ? rawSubject : `Re: ${rawSubject}`;

      await GmailService.sendEmail(userId, {
        to: targetEmail,
        subject,
        body: replyBody,
      });

      // Log event
      await EventService.publish({
        businessId: 'biz_roxten_corp',
        eventType: 'REPORT_GENERATED' as any,
        module: 'INTELLIGENCE' as any,
        title: `JARVIS Replied to Email: ${subject}`,
        description: `Sent reply to ${targetEmail}: "${replyBody}"`,
        actor: 'JARVIS',
        targetEntity: 'Email',
        severity: 'INFO',
      });

      AgentIntegrationService.invalidateCache();

      return {
        success: true,
        to: targetEmail,
        subject,
      };
    } catch (e: any) {
      console.error('replyToLatestEmail failed:', e.message);
      return {
        success: false,
        to: '',
        subject: '',
        error: e.message,
      };
    }
  }

  /**
   * Publishes an Executive Report & Dashboard Insight derived from live integration data
   */
  public static async publishDashboardReport(
    businessId: string,
    title: string,
    summary: string,
    keyMetrics?: Record<string, any>,
    author: string = 'JARVIS'
  ): Promise<any> {
    const reportId = `rep_int_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Create in Business Reports
    let createdReport: any = null;
    try {
      createdReport = await prisma.businessReport.create({
        data: {
          id: reportId,
          businessId,
          title,
          type: 'INTEGRATION_AUDIT',
          timeframe: 'DAILY',
          summary,
          sections: [
            {
              title: 'Executive Intelligence & Integration Audit',
              content: summary,
            },
          ],
          metrics: keyMetrics || {},
          generatedBy: author,
          status: 'COMPLETED',
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });
    } catch (e: any) {
      console.error('Failed to create BusinessReport:', e.message);
    }

    // 2. Create in Executive Insights (Mission Control Right Column)
    try {
      await prisma.businessInsight.create({
        data: {
          id: `ins_${Date.now()}`,
          businessId,
          type: 'Recommendation',
          title: title.length > 60 ? title.slice(0, 57) + '...' : title,
          description: summary.slice(0, 280),
          status: 'PENDING',
          updatedAt: nowIso,
        },
      });
    } catch (e: any) {
      console.error('Failed to create BusinessInsight:', e.message);
    }

    // 3. Publish to Timeline & Activity Feed
    try {
      await EventService.publish({
        businessId,
        eventType: 'REPORT_GENERATED' as any,
        module: 'INTELLIGENCE' as any,
        title: `${author}: ${title}`,
        description: summary.slice(0, 160),
        actor: author,
        targetEntity: 'Report',
        severity: 'INFO',
      });
    } catch (e: any) {
      console.error('Failed to publish timeline event:', e.message);
    }

    return createdReport;
  }
}
