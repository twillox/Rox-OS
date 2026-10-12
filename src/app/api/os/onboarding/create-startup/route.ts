import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      industry,
      goals,
      websiteUrl = '',
      founderName = '',
      agents = [],
      userId: bodyUserId
    } = body;

    if (!companyName || !industry) {
      return NextResponse.json({ error: 'Company name and industry are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('userId')?.value;
    const effectiveUserId = bodyUserId || cookieUserId || `user_${Date.now()}`;

    // 1. Generate unique Business ID for the new startup
    const uniqueBusinessId = `biz_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // 2. Create the Business in Firestore / Prisma
    const businessData = {
      id: uniqueBusinessId,
      name: companyName.trim(),
      industry: industry.trim(),
      goals: goals ? goals.trim() : 'Launch MVP and scale autonomous customer operations',
      description: goals ? goals.trim() : `${companyName} operating in the ${industry} market.`,
      websiteUrl: websiteUrl ? websiteUrl.trim() : '',
      founderName: founderName ? founderName.trim() : 'CEO',
      tone: 'Friendly, Direct and Highly Pragmatic',
      values: ['High Ownership', 'Fast Execution', 'Customer Obsession'],
      executiveBriefing: `Good morning CEO! Welcome to ${companyName}. I have assembled your initial autonomous AI workforce with ${agents.length || 5} specialized agents. All systems and departments are active and ready for your command.`,
      briefingPlayed: false,
      userId: effectiveUserId
    };

    const business = await prisma.business.create({ data: businessData });

    // 3. Create Unique Departments derived from the agents
    const rawDepts = agents.length > 0 
      ? agents.map((a: any) => a.department || 'Operations') 
      : ['Engineering', 'Marketing', 'Sales', 'Finance', 'Operations'];
    const uniqueDepts = Array.from(new Set(rawDepts)) as string[];

    for (const deptName of uniqueDepts) {
      const cleanDeptId = `dept_${deptName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${uniqueBusinessId}`;
      await prisma.department.create({
        data: {
          id: cleanDeptId,
          name: deptName,
          description: `${deptName} department for ${companyName}.`,
          businessId: uniqueBusinessId,
          budget: 150000,
          metrics: {
            monthlyRevenue: 0,
            monthlyExpenses: 0,
            netMargin: 0,
            runwayMonths: 18,
            currency: 'USD'
          }
        }
      });
    }

    // 4. Create the Specialized Autonomous AI Employees
    const agentList = agents.length > 0 ? agents : [
      { name: 'Alex Mercer', role: 'Lead Systems Architect', department: 'Engineering' },
      { name: 'Sarah Jenkins', role: 'Growth Marketing Director', department: 'Marketing' },
      { name: 'Michael Torres', role: 'Sales Specialist', department: 'Sales' },
      { name: 'Priya Sharma', role: 'Product & Customer Success Lead', department: 'Operations' },
      { name: 'Lucas Dupont', role: 'Financial Operations Controller', department: 'Finance' },
    ];

    for (let i = 0; i < agentList.length; i++) {
      const agent = agentList[i];
      const empId = `emp_${uniqueBusinessId}_${i + 1}`;
      const deptName = agent.department || 'Operations';
      
      const customPrompt = agent.systemPrompt || `You are ${agent.name}, ${agent.role} at ${companyName}.
Company: ${companyName} (${industry})
Mission: ${goals || 'Deliver exceptional product quality and high execution speed.'}
Responsibilities: ${Array.isArray(agent.responsibilities) ? agent.responsibilities.join(', ') : 'Drive department outcomes.'}
Tone: Professional, proactive, and outcome-oriented.`;

      await prisma.employee.create({
        data: {
          id: empId,
          businessId: uniqueBusinessId,
          name: agent.name,
          role: agent.role,
          department: deptName,
          systemPrompt: customPrompt,
          status: 'active'
        }
      });
    }

    // 5. Create First Launch Mission Task
    await prisma.task.create({
      data: {
        businessId: uniqueBusinessId,
        title: `Initialize ${companyName} Autonomous Operations`,
        description: `Review startup parameters, connect workplace app integrations (Google, Slack, Notion, LinkedIn), and coordinate initial tasks with your AI agents.`,
        status: 'pending',
        priority: 'high'
      }
    });

    // 6. Create Initial Executive Intelligence Report
    try {
      await addDoc(collection(db, 'reports'), {
        businessId: uniqueBusinessId,
        title: `${companyName} Launch Readiness & Workforce Plan`,
        type: 'intelligence',
        content: `Autonomous intelligence overview for ${companyName}. Industry focus: ${industry}. Operating goals: ${goals || 'N/A'}. Provisioned with ${agentList.length} specialized agents across ${uniqueDepts.join(', ')}.`,
        createdAt: new Date().toISOString()
      });
    } catch (e: any) {
      console.warn('Reports addDoc skipped or failed:', e?.message);
    }

    // 7. Update User Document in Firestore
    if (effectiveUserId && !effectiveUserId.startsWith('user_')) {
      try {
        await updateDoc(doc(db, 'users', effectiveUserId), {
          businessId: uniqueBusinessId,
          onboardingCompleted: true
        });
      } catch (usrErr: any) {
        console.warn('User updateDoc fallback:', usrErr?.message);
      }
    }

    // 8. Prepare HTTP Response with Set-Cookie for seamless dashboard loading
    const response = NextResponse.json({
      success: true,
      businessId: uniqueBusinessId,
      business
    });

    response.cookies.set('businessId', uniqueBusinessId, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return response;
  } catch (error: any) {
    console.error('Create Startup Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create startup' }, { status: 500 });
  }
}
