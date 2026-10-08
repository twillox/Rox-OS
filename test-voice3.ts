import 'module-alias/register';
import { VoiceStudioService } from './src/lib/services/VoiceStudioService';
import prisma from './src/lib/prisma';

async function testVoice() {
  try {
    const businessId = 'system'; // Using system or a generic id for testing, or we can find one
    console.log('Testing VoiceStudioService.processTurn...');
    
    // We need a dummy threadId and session to test just the LLM part
    // Let's create a fake session
    const sessionId = `test_session_${Date.now()}`;
    const employeeId = 'jarvis';
    
    console.log('Starting session...');
    const session = await VoiceStudioService.startSession(businessId, employeeId, 'System');
    console.log('Session started:', session.id);

    console.log('Processing turn...');
    const result = await VoiceStudioService.processTurn(businessId, session.id, 'Hello, can you hear me?');
    console.log('Turn processed successfully. AI Response:', result);

  } catch (error) {
    console.error('Test failed:', error);
  }
}
testVoice();
