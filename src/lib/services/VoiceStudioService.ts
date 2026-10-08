import prisma from '@/lib/prisma';
import { CommunicationService } from './CommunicationService';
import { EventService } from './EventService';
import { ContextBuilder } from './ContextBuilder';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { IntelligenceService } from './IntelligenceService';
import crypto from 'crypto';

export class VoiceStudioService {
  // In-memory session registry so voice sessions NEVER fail even if Firestore is restricted/offline
  public static activeSessions = new Map<string, any>();

  /**
   * Starts a new Voice Session and binds it to a dedicated Communication thread.
   */
  static async startSession(businessId?: string, employeeId: string = 'jarvis', creatorId: string = 'CEO') {
    const effectiveBizId = businessId || 'system';

    // 1. Create a specialized Communication Thread
    let threadId = `act_comm_${Date.now()}`;
    try {
      threadId = await CommunicationService.createThread(effectiveBizId, employeeId, creatorId, 'VOICE_CALL');
    } catch (e) {
      console.warn('Could not create thread for voice call, using fallback id', e);
    }

    // 2. Create the Voice Session record
    const sessionId = `vs_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const sessionRecord = {
      id: sessionId,
      sessionId,
      businessId: effectiveBizId,
      threadId,
      employeeId,
      sessionType: 'VOICE_TO_AI',
      status: 'ACTIVE',
      startedAt: new Date(),
      metadata: {}
    };

    let session = null;
    try {
      session = await prisma.voiceSession.create({
        data: {
          id: sessionId,
          businessId: effectiveBizId,
          threadId,
          employeeId,
          sessionType: 'VOICE_TO_AI',
          status: 'ACTIVE',
          startedAt: new Date(),
          metadata: {}
        }
      });
    } catch (e) {
      console.warn('Could not persist voice session in database, using fallback', e);
    }

    const finalSession = session || sessionRecord;
    VoiceStudioService.activeSessions.set(sessionId, { ...sessionRecord, ...(session || {}) });

    // 3. Log to Timeline
    try {
      await EventService.publish({
        businessId: effectiveBizId,
        module: 'VOICE',
        eventType: 'VOICE_STARTED',
        title: 'Voice Call Started',
        description: `A voice session was started with ${employeeId}.`,
        actor: creatorId,
        targetEntity: 'Employee',
        relatedEntityId: employeeId,
        metadata: { sessionId, threadId }
      });
    } catch (e) {
      console.warn('EventService publish skipped for voice session start', e);
    }

    return finalSession;
  }

  /**
   * Processes a single conversational turn in the voice session.
   * 1. Records STT input to Communication thread.
   * 2. Builds context & queries LLM.
   * 3. Records LLM output to Communication thread.
   * 4. Returns text for the frontend to pass to TTS.
   */
  static async processTurn(businessId?: string, sessionId: string = '', text: string = '', actor: string = 'CEO', fallbackEmployeeId?: string) {
    let session = VoiceStudioService.activeSessions.get(sessionId);
    if (!session) {
      session = await prisma.voiceSession.findUnique({ where: { id: sessionId } }).catch(() => null);
    }
    
    // Graceful fallback if session record was not created or in-memory test
    if (!session) {
      session = {
        id: sessionId,
        sessionId,
        businessId: businessId || 'system',
        threadId: `thread_${sessionId}`,
        employeeId: fallbackEmployeeId || 'jarvis'
      };
      VoiceStudioService.activeSessions.set(sessionId, session);
    } else if (fallbackEmployeeId && fallbackEmployeeId !== 'jarvis') {
      session.employeeId = fallbackEmployeeId;
    }

    const threadId = session.threadId;
    const effectiveBizId = session.businessId || businessId || 'system';

    // 1. Record user speech as a message in the thread
    try {
      await CommunicationService.sendMessage(effectiveBizId, threadId, actor, text, 'DELIVERED');
    } catch (e) {
      console.warn('Could not save user message to thread', e);
    }

    // 2. Query LLM via EmployeeRuntime
    const llm = new GroqProvider();
    const { EmployeeRuntime } = await import('@/core/runtime/EmployeeRuntime');

    let runtime: any;
    let empName = 'AI Assistant';

    // Check if JARVIS
    if (!session.employeeId || session.employeeId.toLowerCase() === 'jarvis') {
      empName = 'JARVIS';
      runtime = new EmployeeRuntime({
        id: 'jarvis',
        businessId: effectiveBizId,
        name: 'JARVIS',
        role: 'System Intelligence',
        department: 'Executive Operations',
        personality: 'Warm, highly helpful, human, and loyal executive assistant.',
        rules: [
          'Serve the CEO with maximum clarity and speed',
          'Speak in a very natural, simple, human tone using clear everyday Indian English words (e.g. sure sir, haan bilkul, don\'t worry, straightaway)',
          'Provide concise spoken answers (1-2 sentences max)',
          'Never use robotic clichés, pretentious jargon, or complicated words'
        ],
        knowledgeTags: ['executive', 'system', 'company'],
        voiceId: 'en-IN-NeerjaNeural',
        speakingStyle: 'simple, friendly Indian English, conversational and human',
        mood: 'helpful',
        temperature: 0.6,
        context: 'You are JARVIS, the primary AI operating system intelligence. You are on a live voice call with the CEO. Speak in a very human way using simple normal Indian English words and crisp sentences. Never sound robotic or overly advanced.'
      }, llm, null as any);
    } else {
      let employee: any = null;
      try {
        employee = await prisma.employee.findUnique({ 
          where: { id: session.employeeId },
          include: { department: true }
        });
      } catch (e) {
        console.warn('Error finding employee by id', e);
      }

      if (!employee) {
        try {
          employee = await prisma.employee.findFirst({
            where: { id: { contains: session.employeeId } },
            include: { department: true }
          });
        } catch (e) {}
      }

      if (!employee) {
        try {
          employee = await prisma.employee.findFirst({
            where: { name: { contains: session.employeeId, mode: 'insensitive' } },
            include: { department: true }
          });
        } catch (e) {}
      }

      if (employee) {
        empName = employee.name || 'AI Assistant';
        const employeeRules: string[] = [
          ...(Array.isArray(employee.rules) ? employee.rules : (employee.rules ? [employee.rules] : [])),
          ...(Array.isArray(employee.decisionBoundaries) ? employee.decisionBoundaries : (employee.decisionBoundaries ? [employee.decisionBoundaries] : []))
        ];

        const employeeSkills: string[] = Array.isArray(employee.skills) 
          ? employee.skills 
          : (typeof employee.skills === 'string' ? employee.skills.split(',').map((s: string) => s.trim()) : []);

        const responsibilitiesStr = Array.isArray(employee.responsibilities) 
          ? employee.responsibilities.join('; ') 
          : (employee.responsibilities || '');

        runtime = new EmployeeRuntime({
          id: employee.id,
          businessId: employee.businessId || effectiveBizId,
          name: employee.name,
          role: employee.role,
          department: employee.department?.name || 'General',
          personality: employee.personality || 'Professional, crisp, and executive',
          rules: employeeRules,
          skills: employeeSkills,
          responsibilities: responsibilitiesStr,
          decisionBoundaries: employee.decisionBoundaries || '',
          knowledgeTags: employee.knowledgeAccessTags || [],
          voiceId: employee.voiceId || employee.selectedVoiceId || 'default',
          speakingStyle: employee.communicationStyle || employee.speakingStyle || 'natural and concise',
          mood: employee.mood || 'neutral',
          temperature: employee.temperature || 0.7,
          context: `You are ${employee.name}, the ${employee.role} in ${employee.department?.name || 'General'}.
Your responsibilities: ${responsibilitiesStr || 'General duties'}.
Your goals: ${employee.goals || 'Serve the company'}.
Your communication style: ${employee.communicationStyle || 'Professional'}.
Your decision boundaries: ${employee.decisionBoundaries || 'None specified'}.`
        }, llm, null as any);
      } else {
        // Fallback colleague so the voice agent NEVER fails
        empName = session.employeeId;
        runtime = new EmployeeRuntime({
          id: session.employeeId,
          businessId: effectiveBizId,
          name: empName,
          role: 'AI Team Specialist',
          department: 'Operations',
          personality: 'Highly competent, articulate, helpful colleague.',
          rules: [],
          knowledgeTags: [],
          voiceId: 'default',
          speakingStyle: 'natural and concise',
          mood: 'neutral',
          temperature: 0.7,
          context: `You are an AI team specialist named ${empName} speaking directly with the company CEO on a live voice call.`
        }, llm, null as any);
      }
    }

    // Fetch History for the prompt
    let historyFormatted: any[] = [];
    try {
      const events = await prisma.activityEvent.findMany({
        where: { activityId: threadId },
        orderBy: { createdAt: 'asc' }
      });
      historyFormatted = events.map((e: any) => ({
        role: e.actor === empName ? 'assistant' : 'user',
        content: e.content
      }));
    } catch (e) {
      console.warn('Could not load history for voice session', e);
    }

    // Load Company Context safely
    try {
      const companyBrain = await IntelligenceService.getCompanyBrain(effectiveBizId).catch(() => []);
      const dnaMemories = (companyBrain || []).map((c: any) => ({ key: `Company DNA: ${c.title || c.topic || 'Fact'}`, value: c.content || c.summary }));

      const memories = session.employeeId !== 'jarvis' 
        ? await IntelligenceService.getEmployeeMemories(effectiveBizId, session.employeeId).catch(() => []) 
        : [];
      const employeeMemories = (memories || []).map((m: any) => ({ key: m.topic || 'Memory', value: m.content || m.summary || '' }));

      await runtime.initializeMemory([...dnaMemories, ...employeeMemories]);
    } catch (e) {
      console.warn('Could not load context memories for voice session', e);
    }

    // Process the conversational turn through the Runtime
    const { text: responseText } = await runtime.processMessage(text, historyFormatted);

    // Record AI speech to thread
    try {
      await CommunicationService.sendMessage(effectiveBizId, threadId, empName, responseText.trim(), 'DELIVERED');
    } catch (e) {}

    return {
      text: responseText.trim(),
      employeeName: empName
    };
  }

  /**
   * Ends a voice session and logs it.
   */
  static async endSession(businessId?: string, sessionId: string = '') {
    if (!sessionId) return true;
    try {
      VoiceStudioService.activeSessions.delete(sessionId);
      const session = await prisma.voiceSession.findUnique({ where: { id: sessionId } }).catch(() => null);
      if (!session) return true;

      await prisma.voiceSession.update({
        where: { id: sessionId },
        data: {
          status: 'ENDED',
          endedAt: new Date()
        }
      }).catch(() => {});

      await EventService.publish({
        businessId: businessId || session.businessId || 'system',
        module: 'VOICE',
        eventType: 'VOICE_ENDED',
        title: 'Voice Call Ended',
        description: `The voice session with ${session.employeeId} has ended.`,
        actor: 'System',
        targetEntity: 'Employee',
        relatedEntityId: session.employeeId,
        metadata: { sessionId }
      });
    } catch (e) {
      console.warn('Error ending voice session', e);
    }

    return true;
  }
}
