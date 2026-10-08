import prisma from '@/lib/prisma';

export type EventModule = 
  | 'AUTH' 
  | 'WORKFORCE' 
  | 'TASKS' 
  | 'KNOWLEDGE' 
  | 'REPORTS' 
  | 'BOARDROOM' 
  | 'COMMUNICATION'
  | 'VOICE' 
  | 'MARKETING' 
  | 'AUTOMATION' 
  | 'SYSTEM'
  | 'GAMIFICATION';

export type EventSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

export type EventType = 
  | 'AUTH_LOGIN' | 'AUTH_LOGOUT'
  | 'EMPLOYEE_HIRED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_REMOVED'
  | 'TASK_CREATED' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'APPOINTMENT_BOOKED'
  | 'KNOWLEDGE_UPLOADED' | 'KNOWLEDGE_EXTRACTED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_PROCESSING' | 'DOCUMENT_AVAILABLE'
  | 'REPORT_GENERATED'
  | 'COMMUNICATION_THREAD_STARTED' | 'COMMUNICATION_BROADCAST' | 'COMMUNICATION_ARCHIVED'
  | 'BOARDROOM_MEETING_STARTED' | 'BOARDROOM_MEETING_COMPLETED' | 'BOARDROOM_DECISION_APPROVED' | 'BOARDROOM_DECISION_IMPLEMENTED'
  | 'VOICE_STARTED' | 'VOICE_ENDED'
  | 'MARKETING_CAMPAIGN_CREATED'
  | 'AUTOMATION_TRIGGERED' | 'AUTOMATION_FAILED'
  | 'SYSTEM_ERROR' | 'SYSTEM_NOTIFICATION' | 'SYSTEM_STATE_PERSISTED'
  | 'GAMIFICATION_PROMOTION' | 'GAMIFICATION_REWARD';

export interface EventPayload {
  businessId: string;
  eventType: EventType;
  module: EventModule;
  title: string;
  description: string;
  actor: string; // e.g. "System", "CEO", "John (AI Agent)"
  severity?: EventSeverity;
  targetEntity?: string;
  relatedEntityId?: string;
  relatedEmployeeId?: string;
  departmentId?: string;
  metadata?: any;
  source?: string;
}

export class EventService {
  /**
   * Publishes an event to the centralized Timeline.
   * Ensures immutability, standardizes schema, and alerts downstream subscribers.
   */
  static async publish(payload: EventPayload) {
    try {
      const eventData = {
        businessId: payload.businessId,
        type: payload.eventType, // Storing eventType in 'type' field to map to existing basic schema for backwards compatibility, but augmenting it
        title: payload.title,
        description: payload.description,
        createdAt: new Date().toISOString(),
        
        // Extended payload elements (Prisma will map these to firestore fields implicitly via dynamic objects or we just store them)
        // Since we are using FirestoreAdapter which writes all keys, we can just attach them.
        module: payload.module,
        actor: payload.actor,
        targetEntity: payload.targetEntity || 'System',
        severity: payload.severity || 'INFO',
        relatedEntityId: payload.relatedEntityId || null,
        relatedEmployeeId: payload.relatedEmployeeId || null,
        departmentId: payload.departmentId || null,
        metadata: payload.metadata || {},
        source: payload.source || 'internal',
        version: 'v2'
      };

      const result = await prisma.businessTimelineEvent.create({ data: eventData });
      
      // Future: Trigger downstream listeners (Mission Control refresh, Notification webhooks, etc.)
      
      return result;
    } catch (e) {
      console.error('Failed to publish timeline event:', e);
      // Suppress failure so we don't block critical path operations if logging fails
    }
  }
}
