import prisma from '@/lib/prisma';
import { EventService } from './EventService';
import { CommunicationService } from './CommunicationService';
import { ExecutiveContextBuilder } from './ExecutiveContextBuilder';
import { GroqProvider } from '@/core/providers/GroqProvider';
import { TaskService } from './TaskService';

export class BoardroomService {
  
  static async startMeeting(businessId: string, topic: string, participantIds: string[], creator: string = 'CEO') {
    // Create a specialized communication thread for the boardroom
    const threadId = await CommunicationService.createThread(businessId, 'general', creator, 'BOARDROOM');

    // Announce meeting start
    await CommunicationService.sendMessage(
      businessId, 
      threadId, 
      creator, 
      `Boardroom Meeting Started: ${topic}`,
      'DELIVERED'
    );

    // Save the Meeting Metadata
    const meeting = await prisma.meeting.create({
      data: {
        id: threadId, // Map meeting ID to thread ID 1:1
        businessId,
        topic,
        status: 'IN_PROGRESS',
        participants: participantIds,
        createdAt: new Date().toISOString()
      }
    });

    // Timeline event specifically for the Boardroom
    await EventService.publish({
      businessId,
      module: 'BOARDROOM',
      eventType: 'BOARDROOM_MEETING_STARTED',
      title: 'Boardroom Meeting Started',
      description: `Executive meeting started: ${topic}`,
      actor: creator,
      metadata: { meetingId: threadId }
    });

    return meeting;
  }

  static async processTurn(businessId: string, meetingId: string, speakerId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new Error('Meeting not found');

    // Generate the reply using the Executive Context
    const aiContext = await ExecutiveContextBuilder.buildExecutiveContext(businessId, speakerId);
    
    // Fetch History
    const activity = await prisma.activity.findUnique({
      where: { id: meetingId },
      include: { ActivityEvent: { orderBy: { createdAt: 'asc' } } }
    });
    const history = activity?.ActivityEvent.map((e: any) => `${e.actor}: ${e.content}`).join('\n') || '';

    const llm = new GroqProvider();
    
    // Identify speaker
    const employee = await prisma.employee.findUnique({ where: { id: speakerId }, include: { department: true } });
    if (!employee) throw new Error('Speaker not found');

    const prompt = `
${aiContext}

[BOARDROOM MEETING CONTEXT]
Meeting Topic: "${meeting.topic}"

Transcript So Far:
${history}

IMPORTANT INSTRUCTIONS FOR THIS RESPONSE:
- You are speaking in the boardroom in front of the CEO and other executives.
- Act completely in character based on your department.
- Speak in a natural, human tone using simple everyday Indian English phrasing (e.g., "Yes sure, looking at the numbers...", "I agree, but let us check the timeline...", "From my side, we should prioritize this...").
- GENUINELY DISAGREE with other executives if their plans violate your department's core responsibilities.
- Keep your response concise, human, and conversational (1-3 sentences max).

What is your next spoken contribution?`;

    const responseText = await llm.generateText(prompt);

    // Save to unified communication
    const replyEvent = await CommunicationService.sendMessage(businessId, meetingId, employee.name, responseText.trim(), 'DELIVERED');
    
    return { text: responseText.trim(), speaker: employee.name, id: replyEvent.id };
  }

  static async concludeMeeting(businessId: string, meetingId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new Error('Meeting not found');

    // Mark as completed
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' }
    });

    // Fetch full history
    const activity = await prisma.activity.findUnique({
      where: { id: meetingId },
      include: { ActivityEvent: { orderBy: { createdAt: 'asc' } } }
    });
    const history = activity?.ActivityEvent.map((e: any) => `${e.actor}: ${e.content}`).join('\n') || '';

    // Generate Draft Decisions
    const llm = new GroqProvider();
    const prompt = `
You are the AI Chief of Staff analyzing a completed boardroom meeting.
Meeting Topic: "${meeting.topic}"

Transcript:
${history}

Analyze the discussion and extract 1 to 3 core, strategic decisions or action plans that were agreed upon.
Do NOT invent metrics or fabricate approvals. Base this purely on the text.
Output a JSON array where each object has:
- title (string): A short, clear title for the decision
- description (string): The details of what must happen
- recommendedOwnerRole (string): The department or role that should own this (e.g., "Engineering", "Marketing")
`;

    const jsonSchema = {
      type: "object",
      properties: {
        decisions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              recommendedOwnerRole: { type: "string" }
            }
          }
        }
      }
    };

    const parsedData = await llm.generateJSON(prompt, jsonSchema) as any;
    
    // Save as DRAFT decisions
    const draftedDecisions: any[] = [];
    if (parsedData.decisions && parsedData.decisions.length > 0) {
      for (const dec of parsedData.decisions) {
        const dbDec = await prisma.boardroomDecision.create({
          data: {
            businessId,
            meetingId,
            title: dec.title,
            description: dec.description,
            recommendedOwnerRole: dec.recommendedOwnerRole,
            status: 'DRAFT',
            createdAt: new Date().toISOString()
          }
        });
        draftedDecisions.push(dbDec);
      }
    }

    // Timeline event
    await EventService.publish({
      businessId,
      module: 'BOARDROOM',
      eventType: 'BOARDROOM_MEETING_COMPLETED',
      title: 'Meeting Concluded',
      description: `Meeting concluded with ${draftedDecisions.length} draft decisions.`,
      actor: 'System',
      metadata: { meetingId }
    });

    return draftedDecisions;
  }

  static async approveDecision(businessId: string, decisionId: string, approvedBy: string = 'CEO') {
    const decision = await prisma.boardroomDecision.findUnique({ where: { id: decisionId } });
    if (!decision || decision.status !== 'DRAFT') throw new Error('Invalid decision or not in DRAFT state');

    // Update status to APPROVED
    await prisma.boardroomDecision.update({
      where: { id: decisionId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date().toISOString() }
    });

    // We must find an owner for the task
    const employees = await prisma.employee.findMany({ where: { businessId } });
    
    const ownerStr = decision.recommendedOwnerRole?.toLowerCase() || '';
    let assignedEmp = employees.find((e: any) => e.role?.toLowerCase().includes(ownerStr) || e.departmentId?.toLowerCase().includes(ownerStr));
    
    // Create actual Task
    await TaskService.createTask(businessId, {
      title: decision.title,
      description: `[Boardroom Decision] ${decision.description}`,
      priority: 'HIGH',
      status: 'TODO',
      assigneeId: assignedEmp ? assignedEmp.id : null,
      metadata: { sourceDecisionId: decisionId }
    });

    // Timeline event
    await EventService.publish({
      businessId,
      module: 'BOARDROOM',
      eventType: 'BOARDROOM_DECISION_APPROVED',
      title: 'Decision Approved',
      description: `Boardroom decision "${decision.title}" was approved by ${approvedBy}. Action items generated.`,
      actor: approvedBy,
      metadata: { decisionId }
    });

    return { success: true, decisionId };
  }
}
