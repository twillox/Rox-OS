const { VoiceStudioService } = require('./src/lib/services/VoiceStudioService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVoice() {
  try {
    // 1. Get any business and employee
    const business = await prisma.business.findFirst();
    const employee = await prisma.employee.findFirst();

    if (!business || !employee) {
      console.log('No business or employee found');
      return;
    }

    console.log('Starting session...');
    const session = await VoiceStudioService.startSession(business.id, employee.id);
    console.log('Session started:', session.id);

    console.log('Processing turn...');
    const result = await VoiceStudioService.processTurn(business.id, session.id, 'Hello!');
    console.log('Turn processed:', result);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}
testVoice();
