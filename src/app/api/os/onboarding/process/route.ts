import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { companyName, industry, goals, extractedText } = await req.json();

    if (!companyName || !industry) {
      return NextResponse.json({ error: 'Company Name and Industry are required' }, { status: 400 });
    }

    const llm = new GroqProvider();
    
    // We only send a subset of the text if it's too large to prevent token limits
    const maxTextLength = 15000;
    const documentExcerpt = extractedText && extractedText.length > 0 
        ? extractedText.substring(0, maxTextLength) 
        : 'No internal documents provided.';

    const systemPrompt = `You are a visionary AI Operating System initializing a new company profile.
Based on the following user input and internal document excerpt, you need to synthesize the company's brain, structure, and insights.

Company Name: ${companyName}
Industry: ${industry}
Goals: ${goals}
Document Excerpt:
${documentExcerpt}

Return ONLY valid JSON matching this schema:
{
  "business": {
    "name": "${companyName}",
    "description": "Short 2-sentence description of what the company does based on the context",
    "industry": "${industry}"
  },
  "orgChart": [
    { "role": "AI CEO (Co-Founder)", "type": "executive" },
    { "role": "Marketing AI", "type": "department" },
    { "role": "Sales AI", "type": "department" },
    { "role": "Support AI", "type": "department" }
  ],
  "insights": [
    {
      "category": "Market Positioning",
      "insight": "A key insight derived from the documents about their position",
      "actionable": "How they should leverage this"
    },
    {
      "category": "Target Audience",
      "insight": "Who they are selling to based on the documents",
      "actionable": "How to reach them effectively"
    },
    {
      "category": "Operational Bottleneck",
      "insight": "A potential risk or bottleneck mentioned in the docs or typical for the industry",
      "actionable": "How the AI workforce can solve this"
    }
  ]
}`;

    const dataText = await llm.generateText(systemPrompt, { temperature: 0.7 });
    
    let parsedData;
    try {
      const jsonMatch = dataText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : dataText;
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse LLM JSON:", dataText);
      throw new Error("Invalid generation format from LLM");
    }

    // Now we store everything in the DB

    // 1. Create Business
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    const businessData = {
      name: parsedData.business.name || companyName,
      industry: parsedData.business.industry || industry,
      goals: goals,
      description: parsedData.business.description,
      userId: userId
    };

    const business = await prisma.business.create({ data: businessData });

    // Link businessId to user if userId is present
    if (userId && business?.id) {
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        await adminDb.collection('users').doc(userId).update({
          businessId: business.id
        });
      } catch (e) {
        console.error('Failed to update user doc with businessId', e);
      }
    }

    // 2. Create Departments (Removed: Departments are now created manually by the user)

    // 3. Create Insights
    if (parsedData.insights && parsedData.insights.length > 0) {
      const insightPromises = parsedData.insights.map((insight: any) => 
        prisma.businessInsight.create({
          data: {
            businessId: business.id,
            category: insight.category,
            content: insight.insight,
            actionable: insight.actionable,
            impact: "High"
          }
        })
      );
      await Promise.all(insightPromises);
    }

    // 4. Hire initial employees automatically from templates
    const templates = await prisma.employeeTemplate.findMany();
    if (templates && templates.length > 0) {
      // Pick 2 random templates to hire
      const toHire = templates.slice(0, 2);
      for (const tpl of toHire) {
        await prisma.employee.create({
          data: {
            businessId: business.id,
            templateId: tpl.id,
            name: tpl.name,
            role: tpl.role,
            department: tpl.department,
            systemPrompt: tpl.systemPrompt,
            status: "active"
          }
        });
      }
    }

    return NextResponse.json({ success: true, businessId: business.id, data: parsedData });
  } catch (error: any) {
    console.error('Onboarding Process Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
