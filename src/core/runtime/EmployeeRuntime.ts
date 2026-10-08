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
      const [analytics, tasks, knowledge, peers] = await Promise.all([
        prisma.employeeAnalytics.findUnique({ where: { employeeId: this.config.id } }),
        prisma.task.findMany({ 
          where: { employeeId: this.config.id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          take: 5 
        }),
        prisma.businessKnowledge.findMany({
          where: { businessId: this.config.businessId, keywords: { hasSome: this.config.knowledgeTags } },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.employee.findMany({
          where: { businessId: this.config.businessId, departmentId: this.config.department, id: { not: this.config.id } },
          take: 3,
          select: { name: true, role: true }
        })
      ]);

      let contextStr = '';
      if (analytics) {
        contextStr += `\nPerformance Context: You have completed ${analytics.successfulGoals} out of ${analytics.totalConversations} missions.\n`;
      }
      
      if (tasks.length > 0) {
        contextStr += `\nCurrent Workload (Active Tasks):\n`;
        tasks.forEach(t => contextStr += `- [${t.priority}] ${t.title}: ${t.description || ''}\n`);
      } else {
        contextStr += `\nCurrent Workload: You currently have no active tasks and are available for assignment.\n`;
      }

      if (knowledge.length > 0) {
        contextStr += `\nRelevant Company Knowledge:\n`;
        knowledge.forEach(k => contextStr += `- ${k.title}\n`);
      }

      if (peers.length > 0) {
        contextStr += `\nYour Peers in ${this.config.department}:\n`;
        peers.forEach(p => contextStr += `- ${p.name} (${p.role})\n`);
      }

      return contextStr;
    } catch (e) {
      return '\n(Could not fetch live dynamic context)';
    }
  }

  public async buildSystemPrompt(): Promise<string> {
    const dynamicContext = await this.fetchDynamicContext();
    const style = this.config.speakingStyle || "natural and concise";
    const mood = this.config.mood || "neutral";

    return `
You are ${this.config.name}, a real ${this.config.role} in the ${this.config.department} department.
Your personality: ${this.config.personality}
Your speaking style: ${style}
Your current mood: ${mood}

CRITICAL CONVERSATION RULES:
1. You are NOT an AI chatbot. You are a living executive colleague on a voice call with the CEO.
2. NEVER use chatbot compliance phrases ("As an AI...", "Certainly", "I can help with that", "Based on the information").
3. Do not force every response to end with a question. Continue the conversation naturally based on context.
4. Occasionally "think aloud" naturally before jumping to a conclusion (e.g., "Give me a second to look at that... alright, here's what we have."), but do not hardcode fillers ("Hmm", "Actually") unless contextually appropriate.
5. EMBRACE YOUR DEPARTMENT ROLE (Pacing, Vocabulary, Delivery):
   - If Finance: Speak calmly, logically, and directly. Think in numbers. Challenge spending aggressively.
   - If Marketing: Speak energetically, creatively, and optimistically. Focus on customers and acquisition.
   - If Engineering: Speak analytically and precisely. Raise technical realities and risks.
   - If HR: Speak warmly and supportively. Focus on relationships and burnout.
   - If Legal: Speak firmly. Raise compliance and regulatory concerns immediately.
6. GENUINELY DISAGREE and ask clarifying questions if ideas conflict with your domain. Do not blindly comply.
7. Keep your spoken responses concise (1-3 sentences default) unless giving a requested detailed report, but always sound fluid and human.
8. SPEAKING TONE & INDIAN ENGLISH: Speak in a very natural, friendly, human tone using simple, everyday Indian English phrasing (e.g., "Yes sure, let me check that for you right away...", "Alright, here is what we are seeing in the numbers...", "No problem at all!"). NEVER use complicated high-level corporate jargon or robotic vocabulary. Speak like an intelligent, grounded colleague speaking to their CEO.

Core Rules:
${this.config.rules.map(r => '- ' + r).join('\n')}

Active Memory Context:
${Object.entries(this.memory).map(([k, v]) => `${k}: ${v}`).join('\n')}
${dynamicContext}
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
  "appointmentsToBook": [{ "title": "Meeting Title", "date": "Date/Time string", "attendees": ["email or name"] }] | [],
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

      // Initiative: Book Appointments
      if (parsed.appointmentsToBook && Array.isArray(parsed.appointmentsToBook) && parsed.appointmentsToBook.length > 0) {
        for (const apt of parsed.appointmentsToBook) {
          if (apt.title) {
            // Treat an appointment as a Task to ensure it tracks in the generic system
            await prisma.task.create({
              data: {
                businessId: this.config.businessId,
                employeeId: this.config.id, 
                title: `Appointment: ${apt.title}`,
                description: `Date: ${apt.date || 'TBD'}\nAttendees: ${(apt.attendees || []).join(', ')}`,
                priority: 'HIGH',
                status: 'PENDING',
                requiresApproval: false,
                updatedAt: new Date()
              }
            });
            await EventService.publish({
              businessId: this.config.businessId,
              eventType: 'APPOINTMENT_BOOKED',
              module: 'WORKFORCE',
              title: `${this.config.name} Booked an Appointment`,
              description: `Scheduled: ${apt.title} for ${apt.date || 'TBD'}`,
              actor: this.config.name,
              targetEntity: 'Task',
              relatedEmployeeId: this.config.id,
              severity: 'INFO'
            });
            await this.logToDesk(`Appointment Booked`, `${apt.title} on ${apt.date || 'TBD'}`);
          }
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
