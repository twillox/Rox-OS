const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const templateId = 'template_marketing_0';
    console.log('Finding template...');
    const template = await prisma.employeeTemplate.findUnique({
      where: { id: templateId },
      include: { TemplateRule: true }
    });
    console.log('Template:', template?.id);
    
    const phase = 'Introduction';
    const phaseInstructions = {
      'Introduction': `Introduce yourself. State your name, role, and a brief overview of your background. Wait for the interviewer's next question.`,
      'Experience': `Detail your experience specifically related to ${template?.role} and ${template?.department}.`,
      'Working Philosophy': `Explain your core working philosophy and how your personality (${template?.personality}) influences it.`,
      'Strengths': `Highlight your top strengths: ${template?.strengths?.join(', ')}.`,
      'Weaknesses': `Discuss your limitations transparently: ${template?.limitations?.join(', ')}.`,
      'Scenario Questions': `The user will give you a scenario. Answer how you would handle it using your skills.`,
      'Ask Anything': `Answer any free-form questions from the CEO.`,
      'Recommendation': `Give a final closing statement on why you should be hired for this company.`
    };

    const instruction = phaseInstructions[phase] || 'Answer the user.';

    const systemPrompt = `
You are ${template?.name}, a candidate interviewing for the role of ${template?.role} in the ${template?.department} department.
Your Personality: ${template?.personality}
Your Rules: ${template?.TemplateRule?.map((r) => r.name).join(', ')}
Current Interview Phase: ${phase}
Phase Instruction: ${instruction}
`;
    console.log(systemPrompt);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
