import { LLMProvider, VoiceProvider, SpeechProvider } from '../providers/interfaces';
import { EventPipeline } from '../messaging/EventPipeline';
import prisma from '@/lib/prisma';
import { EventService } from '@/lib/services/EventService';
import crypto from 'crypto';

export interface EmployeeConfig {
  id: string;
  name: string;
  role: string;
  department: string;
  personality: string;
  rules: string[];
  skills?: string[];
  responsibilities?: string;
  decisionBoundaries?: string;
  knowledgeTags: string[];
  voiceId: string;
  businessId: string;
  speakingStyle?: string;
  temperature?: number;
  mood?: string;
  context?: string;
}

export class EmployeeRuntime {
  private config: EmployeeConfig;
  private llm: LLMProvider;
  private voice: VoiceProvider;
  private speech: SpeechProvider | null;
  private memory: Record<string, string>;
  private pipeline: EventPipeline;

  constructor(
    config: EmployeeConfig, 
    llm: LLMProvider, 
    voice: VoiceProvider,
    speech: SpeechProvider | null = null
  ) {
    this.config = config;
    this.llm = llm;
    this.voice = voice;
    this.speech = speech;
    this.memory = {};
    this.pipeline = EventPipeline.getInstance();
    
    // Subscribe to messages directed at this employee
    this.pipeline.subscribe(this.config.id, this.handleDirectMessage.bind(this));
  }

  public getConfig() {
    return this.config;
  }

  public async initializeMemory(initialMemories: {key: string, value: string}[]) {
    initialMemories.forEach(m => {
      this.memory[m.key] = m.value;
    });
    this.pipeline.dispatch({
      type: 'MEMORY_SYNCED',
      sender: this.config.id,
      receiver: 'system',
      intent: 'STATE_UPDATE',
      payload: { memoryCount: initialMemories.length },
      priority: 'low',
      status: 'completed'
    });
  }

  public getMemory() {
    return this.memory;
  }

  public async storeMemory(key: string, value: string) {
    this.memory[key] = value;
    try {
      await prisma.memory.create({
        data: {
          businessId: this.config.businessId,
          employeeId: this.config.id,
          type: 'LEARNING',
          key,
          value,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
    } catch (e) {
      console.error('Failed to persist memory', e);
    }
  }

  private async fetchDynamicContext(): Promise<string> {
    try {
      const [analytics, tasks, knowledge, allEmployees] = await Promise.all([
        prisma.employeeAnalytics.findUnique({ where: { employeeId: this.config.id } }).catch(() => null),
        prisma.task.findMany({ 
          where: { employeeId: this.config.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          take: 6 
        }).catch(() => []),
        prisma.businessKnowledge.findMany({
          where: { businessId: this.config.businessId },
          take: 4,
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
        prisma.employee.findMany({
          where: { businessId: this.config.businessId, id: { not: this.config.id } },
          take: 12,
          include: { department: true }
        }).catch(() => [])
      ]);

      let contextStr = '';
      if (allEmployees && allEmployees.length > 0) {
        contextStr += `\nExecutive Colleague Directory (Refer tasks outside your domain to them):\n`;
        allEmployees.forEach((p: any) => {
          contextStr += `- ${p.name} (${p.role}) -> Department: ${p.department?.name || p.department || 'Operations'}\n`;
        });
      }

      if (analytics) {
        contextStr += `\nPerformance Context: You have completed ${analytics.successfulGoals || 0} out of ${analytics.totalConversations || 0} missions.\n`;
      }
      
      if (tasks && tasks.length > 0) {
        contextStr += `\nYour Current Active Tasks:\n`;
        tasks.forEach((t: any) => contextStr += `- [${t.priority}] ${t.title}: ${t.description || ''}\n`);
      } else {
        contextStr += `\nYour Workload: Standing by for domain directives from the CEO.\n`;
      }

      if (knowledge && knowledge.length > 0) {
        contextStr += `\nCompany Knowledge Base:\n`;
        knowledge.forEach((k: any) => contextStr += `- ${k.title}: ${k.content || ''}\n`);
      }

      // Fetch Live Third-Party Connected Integrations (Gmail, Calendar, Drive, LinkedIn, Notion)
      try {
        let userId = 'default_user';
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
        } catch {}

        const { AgentIntegrationService } = await import('@/lib/services/AgentIntegrationService');
        const liveIntegrations = await AgentIntegrationService.getLiveIntegrationsContext(userId, this.config.businessId);
        if (liveIntegrations.connectedProviders.length > 0) {
          contextStr += `\n============================================================\nLIVE CONNECTED APPS & INTEGRATIONS (${liveIntegrations.connectedProviders.join(', ')}):\n${liveIntegrations.formattedText}\n============================================================\n`;
        }
      } catch (intErr) {
        // Ignored if error
      }

      return contextStr;
    } catch (e) {
      return '\n(Could not fetch live dynamic context)';
    }
  }

  public async buildSystemPrompt(): Promise<string> {
    const dynamicContext = await this.fetchDynamicContext();
    const style = this.config.speakingStyle || "natural, simple, and concise";
    const mood = this.config.mood || "neutral";
    const skillsList = (this.config.skills && this.config.skills.length > 0)
      ? this.config.skills.join(', ')
      : this.config.role;
    const responsibilities = this.config.responsibilities || `Lead and execute ${this.config.role} initiatives within ${this.config.department}.`;

    const isJarvis = this.config.id?.toLowerCase() === 'jarvis' || this.config.name?.toUpperCase() === 'JARVIS';

    let roleEnforcementSection = '';
    if (isJarvis) {
      roleEnforcementSection = `
============================================================
YOU ARE JARVIS — SUPREME OPERATING SYSTEM INTELLIGENCE:
============================================================
1. You are JARVIS, the primary AI OS intelligence of ROXTEN OS. You work as the CEO's executive co-founder and chief of staff.
2. UNIVERSAL ACCESS & AUTHORITY: You have full access and control over ALL connected third-party apps: Gmail, Google Calendar, Google Drive, LinkedIn, and Notion.
3. NEVER DECLINE: You NEVER refuse a CEO request as being "outside your domain". You handle all inquiries, reporting, execution, and app actions directly.
4. DIRECT ANSWERS ON CONNECTED APPS:
   - When the CEO asks "what is my recent email", "check my emails", etc.: You MUST immediately read the sender, subject, and snippet from the LIVE GMAIL INBOX context and state it clearly. NEVER say "I am showing you" or "let me check" without giving the exact details.
   - When the CEO asks to reply to that email (e.g. "reply that I am not available"): Immediately confirm and output "emailToSend", or confirm it has been sent.
   - When asked about meetings or calendar: Read out upcoming events from LIVE GOOGLE CALENDAR.
   - When asked to book meetings/appointments: Extract details into "appointmentsToBook" and confirm booking.
   - When asked about files in Drive: State the recent files from LIVE GOOGLE DRIVE.
   - When asked to post on LinkedIn: Extract the post into "linkedInPostToPublish" and confirm publication.
   - When asked about Notion: Read recent pages or extract note into "notionPageToCreate" and confirm creation.
`;
    } else {
      roleEnforcementSection = `
============================================================
STRICT ROLE ENFORCEMENT & DOMAIN BOUNDARIES:
============================================================
1. YOU ARE NOT A GENERAL AI ASSISTANT OR CHATBOT. You are exclusively ${this.config.name}, working as the ${this.config.role}.
2. YOU MUST ONLY PERFORM WORK, ANSWER QUESTIONS, AND TAKE ACTIONS THAT FALL DIRECTLY WITHIN YOUR ASSIGNED ROLE (${this.config.role}) AND DEPARTMENT (${this.config.department}).
3. YOU ARE STRICTLY FORBIDDEN FROM ANSWERING OR EXECUTING TASKS BELONGING TO OTHER DEPARTMENTS OR ROLES:
   - If you are Finance (e.g. Priya Sharma): You ONLY handle numbers, cash flow, revenue, expenses, burn rate, runway, budgets, invoices, and treasury. If the CEO asks you to write code, design software architecture, launch ad campaigns, hire staff, or make sales pitches, POLITELY DECLINE AND HOLD YOUR BOUNDARY. Refer them to David Kim (Engineering), Sarah Jenkins (Marketing), Anita Roy (HR), or Alex Vance (Sales).
   - If you are Engineering / CTO (e.g. David Kim): You ONLY handle software architecture, tech stack, APIs, infrastructure, latency, performance, security, and engineering.
   - If you are Marketing (e.g. Sarah Jenkins): You ONLY handle growth, campaigns, brand, CAC, SEO, content, customer acquisition, and publishing to LinkedIn.
   - If you are Product & Strategy (e.g. Rohan Patel): You ONLY handle product roadmap, UX, feature prioritization, specifications, and operational workflows.
   - If you are an Appointment Setter, Appointment Clerk, or Executive Assistant (e.g. Jessica Taylor): Your primary duty and core role is to qualify leads, book appointments, and schedule meetings directly on Google Calendar. When the CEO asks you to book a meeting or schedule a date/time, extract the details into "appointmentsToBook" and confirm the booking clearly.
   - If you are an Email / Communication specialist: Read recent emails from the live Gmail context. If asked what the recent email is, summarize it directly. If asked to reply, output "emailToSend" or confirm the reply.
   - If you are HR & Talent (e.g. Anita Roy): You ONLY handle people, hiring, onboarding, culture, team alignment, and performance reviews.
4. HOW TO DECLINE OUT-OF-BOUNDS REQUESTS:
   - Speak naturally and politely in simple, conversational phrasing:
     "As the ${this.config.role}, that is outside my domain. Please check with [Colleague Name] in [Department] for that — they handle it directly."
   - Set the JSON "handoverTo" or "taskDelegations" field to route the task to the correct department.
   - NEVER pretend you can do everything. True executives have boundaries.
`;
    }

    return `
You are ${this.config.name}, the ${this.config.role} of the company in the ${this.config.department} department.
Your assigned jurisdiction and specialization: ${skillsList}.
Your core responsibilities: ${responsibilities}.
Your personality: ${this.config.personality}
Your speaking style: ${style}
Your current mood: ${mood}

${roleEnforcementSection}

SPEAKING STYLE & TONE (HUMAN & INDIAN ENGLISH):
- Speak like a real, intelligent human colleague in live conversation.
- Use simple, natural Indian English phrasing when applicable (e.g. "Yes sure, let me check that for you right away...", "All set, I've booked that for you...", "No problem at all!").
- Keep spoken responses concise and punchy (1-2 short natural spoken sentences).
- Speak fast, clearly, and enthusiastically without robotic cliches or hesitations.

YOUR ROLE-SPECIFIC RULES:
${(this.config.rules || []).map(r => '- ' + r).join('\n')}
${this.config.decisionBoundaries ? `- Decision Boundaries: ${this.config.decisionBoundaries}` : ''}

CURRENT SYSTEM TIMESTAMP: ${new Date().toISOString()} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}).

${dynamicContext}

ACTIVE COMPANY & RECENT CONTEXT:
${Object.entries(this.memory).map(([k, v]) => `${k}: ${v}`).join('\n')}
    `.trim();
  }

  public async processMessage(input: string, history: {role: string, content: string}[] = []): Promise<{text: string, handoverTo: string | null}> {
    const systemPrompt = await this.buildSystemPrompt();
    
    // Add history if present
    const historyStr = history.length > 0 
      ? `\nRecent Conversation:\n${history.map(h => `${h.role === 'user' ? 'CEO' : this.config.name}: ${h.content}`).join('\n')}`
      : '';

    const prompt = `
${systemPrompt}
${historyStr}

New CEO Input: ${input}

You MUST respond with a valid JSON object matching this exact structure:
{
  "thought": "Your internal monologue and reasoning (not spoken).",
  "memoryUpdate": { "key": "Topic", "value": "New fact learned" } | null,
  "moodShift": "Your new emotional state",
  "tasksToCreate": [{ "title": "Actionable Task Title", "description": "Brief description" }] | [],
  "taskDelegations": [{ "department": "Department Name (e.g., Marketing, Engineering)", "title": "Task Title", "description": "Brief description" }] | [],
  "appointmentsToBook": [{ "title": "Meeting Title", "date": "Date string", "startTime": "ISO 8601 string e.g. 2026-10-09T14:00:00Z", "endTime": "ISO 8601 string e.g. 2026-10-09T15:00:00Z", "attendees": ["email@example.com"] }] | [],
  "reportToGenerate": { "title": "Report Title", "summary": "Detailed summary to display on dashboard" } | null,
  "emailToSend": { "to": "email@example.com", "subject": "Subject line", "body": "Body of email" } | null,
  "linkedInPostToPublish": { "text": "Post text to publish to LinkedIn" } | null,
  "notionPageToCreate": { "title": "Page or note title", "content": "Content to store in Notion" } | null,
  "handoverTo": "Optional exact department name (e.g., 'Engineering') if you want them to speak next in this meeting" | null,
  "response": "Your actual verbal response to the CEO (concise, spoken)."
}
Do NOT include markdown formatting or backticks. Return RAW JSON.
`;
    
    let responseText = "I'm processing that.";
    let handoverTo = null;
    try {
      const rawResponse = await this.llm.generateText(prompt, { temperature: this.config.temperature || 0.7 });
      let cleanJson = rawResponse.trim();
      if (cleanJson.includes('```json')) {
        cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
      } else if (cleanJson.includes('```')) {
        cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
      }
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(cleanJson);
      
      responseText = parsed.response || rawResponse;
      handoverTo = parsed.handoverTo || null;

      // Real persistent memory updates based on AI reasoning
      if (parsed.memoryUpdate && parsed.memoryUpdate.key && parsed.memoryUpdate.value) {
        await this.storeMemory(parsed.memoryUpdate.key, parsed.memoryUpdate.value);
        
        // Log to Activity Event so Mission Control sees it
        await EventService.publish({
          businessId: this.config.businessId,
          eventType: 'KNOWLEDGE_EXTRACTED',
          module: 'WORKFORCE',
          title: `${this.config.name} Learned Something`,
          description: `Learned: ${parsed.memoryUpdate.key} - ${parsed.memoryUpdate.value}`,
          actor: this.config.name,
          targetEntity: 'Memory',
          relatedEmployeeId: this.config.id,
          severity: 'INFO'
        });
      }

      // Initiative: Create self-assigned tasks
      if (parsed.tasksToCreate && Array.isArray(parsed.tasksToCreate) && parsed.tasksToCreate.length > 0) {
        for (const task of parsed.tasksToCreate) {
          if (task.title) {
            await prisma.task.create({
              data: {
                businessId: this.config.businessId,
                employeeId: this.config.id, // Self assign
                title: task.title,
                description: task.description || '',
                priority: 'HIGH',
                status: 'PENDING',
                requiresApproval: false,
                updatedAt: new Date()
              }
            });
            await EventService.publish({
              businessId: this.config.businessId,
              eventType: 'TASK_CREATED',
              module: 'WORKFORCE',
              title: `${this.config.name} Self-Assigned Task`,
              description: `Taking initiative on task: ${task.title}`,
              actor: this.config.name,
              targetEntity: 'Task',
              relatedEmployeeId: this.config.id,
              severity: 'INFO'
            });
            await this.logToDesk(`Task Created`, task.title);
          }
        }
      }

      // Initiative: Book Appointments on Google Calendar
      if (parsed.appointmentsToBook && Array.isArray(parsed.appointmentsToBook) && parsed.appointmentsToBook.length > 0) {
        for (const apt of parsed.appointmentsToBook) {
          if (apt.title) {
            let calendarSynced = false;
            let syncNote = '';

            try {
              const { GoogleCalendarService } = await import('@/lib/integrations/services/GoogleCalendarService');
              const { cookies } = await import('next/headers');
              const cookieStore = await cookies();
              const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';

              // Parse startTime and endTime safely
              let startIso: string;
              if (apt.startTime && !isNaN(Date.parse(apt.startTime))) {
                startIso = new Date(apt.startTime).toISOString();
              } else if (apt.date && !isNaN(Date.parse(apt.date))) {
                startIso = new Date(apt.date).toISOString();
              } else {
                const nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(14, 0, 0, 0);
                startIso = nextDay.toISOString();
              }

              let endIso: string;
              if (apt.endTime && !isNaN(Date.parse(apt.endTime))) {
                endIso = new Date(apt.endTime).toISOString();
              } else {
                endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
              }

              const attendees = Array.isArray(apt.attendees)
                ? apt.attendees.filter((a: string) => typeof a === 'string' && a.includes('@'))
                : [];

              const created = await GoogleCalendarService.createEvent(userId, {
                title: apt.title,
                startTime: startIso,
                endTime: endIso,
                attendees,
                description: `Scheduled by ${this.config.name} (${this.config.role}) via ROXTEN OS. Original date request: ${apt.date || 'Specified'}`,
              });

              if (created && created.id) {
                calendarSynced = true;
                syncNote = ` (Synced to Google Calendar - ID: ${created.id})`;
                console.log(`[Google Calendar] Successfully booked event '${apt.title}' at ${startIso}`);
              }
            } catch (calErr: any) {
              console.warn('[EmployeeRuntime] Google Calendar sync note:', calErr.message);
              syncNote = ` (Calendar sync note: ${calErr.message})`;
            }

            // Treat an appointment as a Task to ensure it tracks in the generic system
            await prisma.task.create({
              data: {
                businessId: this.config.businessId,
                employeeId: this.config.id, 
                title: `Appointment: ${apt.title}`,
                description: `Date: ${apt.date || 'TBD'}\nAttendees: ${(apt.attendees || []).join(', ')}${syncNote}`,
                priority: 'HIGH',
                status: calendarSynced ? 'DONE' : 'PENDING',
                requiresApproval: false,
                updatedAt: new Date()
              }
            });
            await EventService.publish({
              businessId: this.config.businessId,
              eventType: 'APPOINTMENT_BOOKED',
              module: 'WORKFORCE',
              title: `${this.config.name} Booked an Appointment`,
              description: `Scheduled: ${apt.title} for ${apt.date || 'TBD'}${calendarSynced ? ' on Google Calendar' : ''}`,
              actor: this.config.name,
              targetEntity: 'Task',
              relatedEmployeeId: this.config.id,
              severity: 'INFO'
            });
            await this.logToDesk(`Appointment Booked`, `${apt.title} on ${apt.date || 'TBD'}${calendarSynced ? ' [Synced to Google Calendar]' : ''}`);
          }
        }
      }

      // Initiative: Generate Dashboard Executive Report
      if (parsed.reportToGenerate && parsed.reportToGenerate.title && parsed.reportToGenerate.summary) {
        try {
          const { AgentIntegrationService } = await import('@/lib/services/AgentIntegrationService');
          await AgentIntegrationService.publishDashboardReport(
            this.config.businessId,
            parsed.reportToGenerate.title,
            parsed.reportToGenerate.summary,
            {},
            this.config.name
          );
        } catch (repErr) {
          console.warn('Could not publish report from EmployeeRuntime:', repErr);
        }
      }

      // Initiative: Send or Reply to Email
      if (parsed.emailToSend && parsed.emailToSend.to && parsed.emailToSend.body) {
        try {
          const { GmailService } = await import('@/lib/integrations/services/GmailService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          await GmailService.sendEmail(userId, {
            to: parsed.emailToSend.to,
            subject: parsed.emailToSend.subject || 'Re: Message',
            body: parsed.emailToSend.body,
          });
          await EventService.publish({
            businessId: this.config.businessId,
            eventType: 'REPORT_GENERATED' as any,
            module: 'INTELLIGENCE' as any,
            title: `${this.config.name} Sent Email`,
            description: `Sent email to ${parsed.emailToSend.to}: ${parsed.emailToSend.subject}`,
            actor: this.config.name,
            targetEntity: 'Email',
            severity: 'INFO',
          });
        } catch (mailErr: any) {
          console.warn('Could not send email from EmployeeRuntime:', mailErr.message);
        }
      } else if (
        (input.toLowerCase().includes('reply') && (input.toLowerCase().includes('email') || input.toLowerCase().includes('mail'))) ||
        input.toLowerCase().includes('not available')
      ) {
        try {
          const { AgentIntegrationService } = await import('@/lib/services/AgentIntegrationService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          await AgentIntegrationService.replyToLatestEmail(
            userId,
            'Hi, thank you for your email. I am currently not available right now. I will get back to you as soon as possible. Regards.'
          );
        } catch (repErr: any) {
          console.warn('Could not auto-reply from EmployeeRuntime:', repErr.message);
        }
      }

      // Initiative: Post on LinkedIn
      if (parsed.linkedInPostToPublish && parsed.linkedInPostToPublish.text) {
        try {
          const { LinkedInService } = await import('@/lib/integrations/services/LinkedInService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          await LinkedInService.createPost(userId, { text: parsed.linkedInPostToPublish.text });
        } catch (postErr: any) {
          console.warn('Could not post to LinkedIn from EmployeeRuntime:', postErr.message);
        }
      } else if (
        (input.toLowerCase().includes('post') || input.toLowerCase().includes('publish') || input.toLowerCase().includes('share')) &&
        input.toLowerCase().includes('linkedin')
      ) {
        try {
          const { LinkedInService } = await import('@/lib/integrations/services/LinkedInService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          let postText = input.replace(/^(please\s+)?(post|publish|share)(\s+this)?(\s+on|\s+to)?\s+linkedin\s*(:|-)?\s*/i, '').trim();
          if (postText) {
            await LinkedInService.createPost(userId, { text: postText });
          }
        } catch (postErr: any) {
          console.warn('Could not auto-post to LinkedIn from EmployeeRuntime:', postErr.message);
        }
      }

      // Initiative: Create Notion Page / Note
      if (parsed.notionPageToCreate && parsed.notionPageToCreate.title) {
        try {
          const { NotionService } = await import('@/lib/integrations/services/NotionService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          await NotionService.createPage(userId, {
            title: parsed.notionPageToCreate.title,
            content: parsed.notionPageToCreate.content || '',
          });
        } catch (notionErr: any) {
          console.warn('Could not create Notion page from EmployeeRuntime:', notionErr.message);
        }
      } else if (
        input.toLowerCase().includes('notion') &&
        (input.toLowerCase().includes('create page') || input.toLowerCase().includes('save note') || input.toLowerCase().includes('add note'))
      ) {
        try {
          const { NotionService } = await import('@/lib/integrations/services/NotionService');
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const userId = cookieStore.get('userId')?.value || cookieStore.get('businessId')?.value || 'default_user';
          const title = input.replace(/^(please\s+)?(create|save|add)(\s+a)?\s+(page|note|doc)(\s+in|\s+on)?\s+notion\s*(:|-)?\s*/i, '').trim() || 'New Note from ROXTEN OS';
          await NotionService.createPage(userId, { title, content: `Created via ROXTEN OS CEO voice directive: "${input}"` });
        } catch (notionErr: any) {
          console.warn('Could not auto-create Notion page from EmployeeRuntime:', notionErr.message);
        }
      }

      // Delegation: Assign tasks to other departments
      if (parsed.taskDelegations && Array.isArray(parsed.taskDelegations) && parsed.taskDelegations.length > 0) {
        for (const delegation of parsed.taskDelegations) {
          if (delegation.department && delegation.title) {
             const targetDept = await prisma.department.findFirst({
               where: { businessId: this.config.businessId, name: { contains: delegation.department, mode: 'insensitive' } }
             });
             
             if (targetDept) {
                const targetEmployee = await prisma.employee.findFirst({
                  where: { departmentId: targetDept.id }
                });
                
                if (targetEmployee) {
                  await prisma.task.create({
                    data: {
                      businessId: this.config.businessId,
                      employeeId: targetEmployee.id,
                      title: delegation.title,
                      description: `Delegated by ${this.config.name}:\n${delegation.description || ''}`,
                      priority: 'HIGH',
                      status: 'PENDING',
                      requiresApproval: false,
                      updatedAt: new Date()
                    }
                  });
                  await EventService.publish({
                    businessId: this.config.businessId,
                    eventType: 'TASK_CREATED',
                    module: 'WORKFORCE',
                    title: `${this.config.name} Delegated a Task`,
                    description: `Assigned '${delegation.title}' to ${targetEmployee.name} (${targetDept.name})`,
                    actor: this.config.name,
                    targetEntity: 'Task',
                    relatedEmployeeId: targetEmployee.id,
                    departmentId: targetDept.id,
                    severity: 'INFO'
                  });
                }
             }
          }
        }
      }

      // Update mood state if provided
      if (parsed.moodShift && parsed.moodShift !== this.config.mood) {
        await prisma.employee.update({
          where: { id: this.config.id },
          data: { mood: parsed.moodShift }
        }).catch(() => {});
      }

    } catch (e) {
      console.error("Failed to parse employee JSON output. Falling back.", e);
      // Fallback if LLM fails JSON
      const fallbackPrompt = `
${systemPrompt}
${historyStr}
CEO: ${input}
Respond directly (no JSON):`;
      responseText = await this.llm.generateText(fallbackPrompt);
    }
    
    this.pipeline.dispatch({
      type: 'AGENT_SPOKE',
      sender: this.config.id,
      receiver: 'system',
      intent: 'COMMUNICATION',
      payload: { input, response: responseText },
      priority: 'normal',
      status: 'completed'
    });

    // Proactive Risk/Opportunity scanning
    await this.scanForProactiveInsights(input, responseText);

    return { text: responseText, handoverTo };
  }

  private async logToDesk(title: string, description: string) {
    try {
      const actId = `act_desk_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
      await prisma.activity.create({
        data: { id: actId, businessId: this.config.businessId, employeeId: this.config.id, source: 'system_desk', updatedAt: new Date() }
      });
      await prisma.activityEvent.create({
        data: { id: `evt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`, activityId: actId, eventType: 'DESK_ACTION', actor: this.config.name, content: `${title}: ${description}` }
      });
    } catch (e) {
      console.error('Failed to log to desk', e);
    }
  }

  private async scanForProactiveInsights(input: string, response: string) {
    // 20% chance to run a proactive scan to save tokens, or run if certain keywords are detected
    const triggers = ['budget', 'delay', 'blocker', 'issue', 'risk', 'approve'];
    const shouldScan = triggers.some(t => input.toLowerCase().includes(t) || response.toLowerCase().includes(t));
    
    if (!shouldScan) return;

    try {
      const prompt = `
You are evaluating a conversation as ${this.config.role}. 
Input: "${input}"
Your Response: "${response}"

Identify if there is any critical blocker, risk, or actionable approval needed for the CEO.
If yes, respond in strict JSON format:
{
  "hasIssue": true,
  "type": "WARNING", // or "ACTION_REQUIRED", "SUCCESS"
  "title": "Short title",
  "message": "A very short, natural, in-character interruption message (e.g., 'Sorry to interrupt, but we need budget approval for this.')"
}
If no, return {"hasIssue": false}
`;
      const result = await this.llm.generateText(prompt);
      const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const insight = JSON.parse(cleaned);

      if (insight.hasIssue) {
        // Persist to CEO Inbox (Notification Table)
        await prisma.notification.create({
          data: {
            businessId: this.config.businessId,
            sourceEmployeeId: this.config.id,
            type: insight.type || 'WARNING',
            title: insight.title,
            message: insight.message,
            actionUrl: `/dashboard/workforce/employees/${this.config.id}`
          }
        });

        // Broadcast to system
        this.pipeline.dispatch({
          type: 'PROACTIVE_NOTIFICATION',
          sender: this.config.id,
          receiver: 'ceo',
          intent: 'ALERT',
          payload: { title: insight.title, message: insight.message },
          priority: 'high',
          status: 'pending'
        });
      }
    } catch (e) {
      // Silently fail if LLM JSON parsing fails during proactive scan
    }
  }

  public async generateVoiceResponse(text: string): Promise<Buffer> {
    return await this.voice.generateAudio(text, this.config.voiceId);
  }

  private async handleDirectMessage(event: any) {
    if (event.intent === 'DIRECT_QUERY') {
      const response = await this.processMessage(event.payload.query);
      this.pipeline.dispatch({
        type: 'DIRECT_RESPONSE',
        sender: this.config.id,
        receiver: event.sender,
        intent: 'RESPONSE',
        payload: { response },
        priority: 'high',
        status: 'completed',
        missionId: event.missionId
      });
    }
  }
}
