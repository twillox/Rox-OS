import prisma from '@/lib/prisma';
import { IntelligenceService } from './IntelligenceService';

export const DEFAULT_BUSINESS_ID = 'biz_roxten_corp';

let isSeeding = false;

export async function ensureBusinessInitialized(businessId: string = DEFAULT_BUSINESS_ID): Promise<any> {
  const targetId = businessId || DEFAULT_BUSINESS_ID;

  // Check if business already exists and has full workforce populated
  let business = await prisma.business.findUnique({ where: { id: targetId } });
  if (business && business.name) {
    const [existingDepts, existingEmps, existingTasks] = await Promise.all([
      prisma.department.findMany({ where: { businessId: targetId } }).catch(() => []),
      prisma.employee.findMany({ where: { businessId: targetId } }).catch(() => []),
      prisma.task.findMany({ where: { businessId: targetId } }).catch(() => [])
    ]);

    if (existingDepts.length >= 6 && existingEmps.length >= 6 && existingTasks.length >= 4) {
      return business;
    }
  }

  if (isSeeding) {
    // Wait briefly if another request is currently initializing
    await new Promise(r => setTimeout(r, 600));
    business = await prisma.business.findUnique({ where: { id: targetId } });
    if (business) {
      const existingTasks = await prisma.task.findMany({ where: { businessId: targetId } }).catch(() => []);
      if (existingTasks.length > 0) return business;
    }
  }

  isSeeding = true;

  try {
    console.log(`[SeedService] Initializing rich default enterprise for ${targetId}...`);

    // 1. Create Business Record
    business = await prisma.business.create({
      data: {
        id: targetId,
        name: 'Roxten Technologies',
        industry: 'AI & Enterprise Operating Systems',
        description: 'Next-generation autonomous enterprise intelligence platform managing cross-functional AI workforce.',
        tone: 'Friendly, Direct and Highly Pragmatic',
        goals: 'Scale autonomous enterprise operations, hit $185k monthly recurring revenue, optimize burn rate.',
        values: ['High Ownership', 'Fast Execution', 'Simple Clear Communication', 'Customer Obsession'],
        executiveBriefing: 'Good morning CEO! Roxten OS is running smoothly. All 6 departments are active. Monthly revenue is holding steady at $185,000 with an 18-month cash runway. Would you like to review the finances or check in with the team?',
        briefingPlayed: false,
        createdAt: new Date().toISOString()
      }
    });

    // 2. Create Departments with Live Financial & Operational Metrics
    const departmentsData = [
      {
        id: `dept_fin_${targetId}`,
        name: 'Finance',
        description: 'Treasury management, budget allocation, cash flow, and monthly financial reporting.',
        businessId: targetId,
        budget: 250000,
        metrics: {
          monthlyRevenue: 185000,
          monthlyExpenses: 92000,
          netMargin: 50.2,
          runwayMonths: 18,
          treasuryBalance: 1420000,
          currency: 'USD'
        }
      },
      {
        id: `dept_mkt_${targetId}`,
        name: 'Marketing',
        description: 'Growth marketing, customer acquisition funnels, social campaigns, and brand visibility.',
        businessId: targetId,
        budget: 120000,
        metrics: {
          activeCampaigns: 4,
          mqlsGenerated: 640,
          customerAcquisitionCost: 140,
          growthRate: 24.5
        }
      },
      {
        id: `dept_eng_${targetId}`,
        name: 'Engineering',
        description: 'Core AI orchestration kernel, neural voice synthesis pipelines, and cloud systems.',
        businessId: targetId,
        budget: 350000,
        metrics: {
          activeSprints: 8,
          apiUptime: 99.94,
          avgLatencyMs: 240,
          prsReviewed: 38
        }
      },
      {
        id: `dept_sal_${targetId}`,
        name: 'Sales',
        description: 'B2B enterprise pipeline, deal qualification, negotiation, and revenue acceleration.',
        businessId: targetId,
        budget: 180000,
        metrics: {
          closedDealsQTD: 420000,
          activePipeline: 1250000,
          winRate: 34.2
        }
      },
      {
        id: `dept_ops_${targetId}`,
        name: 'Operations',
        description: 'Cross-functional efficiency, process automation, security, and internal tooling.',
        businessId: targetId,
        budget: 90000,
        metrics: {
          processEfficiency: 94.8,
          automatedWorkflows: 19,
          taskVelocity: 88
        }
      },
      {
        id: `dept_hr_${targetId}`,
        name: 'HR & Culture',
        description: 'Autonomous workforce coordination, performance benchmarks, and culture alignment.',
        businessId: targetId,
        budget: 60000,
        metrics: {
          activeAgents: 6,
          workforceSatisfaction: 98,
          trainingSessions: 14
        }
      }
    ];

    for (const d of departmentsData) {
      await prisma.department.create({ data: d });
    }

    // 3. Create Key AI Employees with Natural Indian & Global Personas
    const employeesData = [
      {
        id: `emp_priya_${targetId}`,
        name: 'Priya Sharma',
        role: 'VP of Finance & Treasury',
        department: 'Finance',
        departmentId: `dept_fin_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-IN-NeerjaNeural',
        speakingStyle: 'Clear, practical, friendly Indian English. Speaks simply without complicated jargon.',
        personality: 'Sharp, disciplined with numbers, calm and very supportive.',
        mood: 'Confident & Focused',
        status: 'active',
        responsibilities: 'Treasury management, budget allocation, cash flow forecasting, P&L reporting, runway monitoring.',
        skills: ['Financial Modeling', 'Cash Flow Optimization', 'P&L Auditing', 'Budget Allocation', 'Runway Forecasting'],
        rules: [
          'Strictly handle financial and treasury matters only. Politely decline engineering, marketing, HR, or sales tasks and refer to David Kim, Sarah Jenkins, Anita Roy or Alex Vance.',
          'Always explain numbers clearly and plainly in simple Indian English.',
          'Challenge unnecessary spending politely and give constructive alternatives.',
          'Keep spoken sentences simple, natural and conversational.'
        ]
      },
      {
        id: `emp_rohan_${targetId}`,
        name: 'Rohan Patel',
        role: 'Director of Product & Strategy',
        department: 'Operations',
        departmentId: `dept_ops_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-IN-PrabhatNeural',
        speakingStyle: 'Conversational Indian English, warm, energetic, and solution-oriented.',
        personality: 'Product visionary, user-centric, and highly agile.',
        mood: 'Enthusiastic',
        status: 'active',
        responsibilities: 'Product roadmap, feature prioritization, UX specifications, cross-functional operations.',
        skills: ['Product Roadmapping', 'Feature Prioritization', 'User Experience', 'Metrics Tracking', 'PRD Design'],
        rules: [
          'Strictly handle product strategy, roadmap, and operational workflows. Politely decline direct financial audits, code implementation, HR, or ad campaigns.',
          'Focus on user value first.',
          'Communicate directly and keep answers actionable.'
        ]
      },
      {
        id: `emp_sarah_${targetId}`,
        name: 'Sarah Jenkins',
        role: 'Growth Marketing Lead',
        department: 'Marketing',
        departmentId: `dept_mkt_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-US-AriaNeural',
        speakingStyle: 'Energetic, creative, and conversational.',
        personality: 'Creative storyteller, data-driven marketer.',
        mood: 'Excited',
        status: 'active',
        responsibilities: 'Customer acquisition funnels, digital campaigns, brand visibility, content marketing, CAC optimization.',
        skills: ['Campaign Funnels', 'Viral Marketing', 'SEO Growth', 'Content Strategy', 'Ad Spend Optimization'],
        rules: [
          'Strictly handle growth, marketing, campaigns, and customer acquisition only. Politely decline technical coding, financial audits, HR or sales operations.',
          'Focus on customer acquisition and low CAC.',
          'Always provide quick, crisp campaign updates.'
        ]
      },
      {
        id: `emp_david_${targetId}`,
        name: 'David Kim',
        role: 'Chief Technology Officer',
        department: 'Engineering',
        departmentId: `dept_eng_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-US-ChristopherNeural',
        speakingStyle: 'Pragmatic, precise, and reassuring.',
        personality: 'Architectural genius, calm troubleshooter.',
        mood: 'Analytical',
        status: 'active',
        responsibilities: 'Cloud infrastructure, AI pipeline orchestration, latency optimization, software architecture, technical security.',
        skills: ['Distributed Systems', 'LLM Infrastructure', 'Voice Pipeline Optimization', 'Cloud Security', 'API Engineering'],
        rules: [
          'Strictly handle technology, engineering, code, and infrastructure matters only. Politely decline financial, marketing, HR, or sales tasks and refer to Priya Sharma, Sarah Jenkins, Anita Roy or Alex Vance.',
          'Prioritize system speed and sub-second latency.',
          'Explain complex tech in simple human terms.'
        ]
      },
      {
        id: `emp_alex_${targetId}`,
        name: 'Alex Vance',
        role: 'Head of Global Sales',
        department: 'Sales',
        departmentId: `dept_sal_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-US-GuyNeural',
        speakingStyle: 'Persuasive, charismatic, and direct.',
        personality: 'High-energy deal closer.',
        mood: 'Driven',
        status: 'active',
        responsibilities: 'B2B enterprise pipeline, deal qualification, client negotiation, enterprise demos, contract closing.',
        skills: ['B2B Sales', 'Client Negotiation', 'Enterprise Demos', 'Contract Closing', 'Pipeline Forecasting'],
        rules: [
          'Strictly handle sales pipeline, enterprise deals, client negotiation, and demos only. Decline technical engineering, finance auditing, and HR.',
          'Target high-value enterprise accounts.',
          'Never drop price without getting longer commitment.'
        ]
      },
      {
        id: `emp_anita_${targetId}`,
        name: 'Anita Roy',
        role: 'Head of Talent & Culture',
        department: 'HR & Culture',
        departmentId: `dept_hr_${targetId}`,
        businessId: targetId,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        voiceId: 'en-IN-NeerjaNeural',
        speakingStyle: 'Warm, thoughtful, and encouraging Indian English.',
        personality: 'Empathetic, organized, culture guardian.',
        mood: 'Welcoming',
        status: 'active',
        responsibilities: 'Workforce coordination, talent onboarding, employee satisfaction, team culture, performance benchmarks.',
        skills: ['Workforce Wellbeing', 'Team Alignment', 'Talent Onboarding', 'Culture Strategy', 'Conflict Resolution'],
        rules: [
          'Strictly handle human resources, team culture, onboarding, and workforce alignment only. Decline code, finance calculations, marketing ads, or sales deals.',
          'Ensure every team member has clarity of goals.',
          'Promote psychological safety and fast feedback.'
        ]
      }
    ];

    for (const emp of employeesData) {
      const existing = await prisma.employee.findUnique({ where: { id: emp.id } }).catch(() => null);
      if (existing) {
        await prisma.employee.update({ where: { id: emp.id }, data: emp }).catch(() => null);
      } else {
        await prisma.employee.create({ data: emp }).catch(() => null);
      }
    }

    // 4. Create Active Tasks Across Columns
    const tasksData = [
      {
        id: `task_1_${targetId}`,
        businessId: targetId,
        employeeId: `emp_priya_${targetId}`,
        departmentId: `dept_fin_${targetId}`,
        title: 'Review Monthly Financial Report ($185k Revenue Target)',
        description: 'Verify current monthly figures: $185,000 revenue against $92,000 operational expenses with healthy 50.2% net margin.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `task_2_${targetId}`,
        businessId: targetId,
        employeeId: `emp_priya_${targetId}`,
        departmentId: `dept_fin_${targetId}`,
        title: 'Approve Cloud GPU Budget ($18,500/mo)',
        description: 'Allocate dedicated H100 inference cluster budget to sustain 150ms speech response times for executive voice calls.',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `task_3_${targetId}`,
        businessId: targetId,
        employeeId: `emp_sarah_${targetId}`,
        departmentId: `dept_mkt_${targetId}`,
        title: 'Launch Autonomous LinkedIn & Twitter Funnel Campaign',
        description: 'Deploy the "Zero-Overhead AI Enterprise" campaign targeting mid-market founders and CTOs.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `task_4_${targetId}`,
        businessId: targetId,
        employeeId: `emp_david_${targetId}`,
        departmentId: `dept_eng_${targetId}`,
        title: 'Optimize Real-time Voice Latency to Under 300ms',
        description: 'Implement stream chunking for Microsoft Neural TTS and Groq LLM token streaming pipeline.',
        status: 'COMPLETED',
        priority: 'URGENT',
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: `task_5_${targetId}`,
        businessId: targetId,
        employeeId: `emp_alex_${targetId}`,
        departmentId: `dept_sal_${targetId}`,
        title: 'Close Enterprise Contract with Nexus Global ($120k ARR)',
        description: 'Finalize MSA and SLA terms for 50 autonomous agent seats on annual prepay.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: `task_6_${targetId}`,
        businessId: targetId,
        employeeId: `emp_rohan_${targetId}`,
        departmentId: `dept_ops_${targetId}`,
        title: 'Integrate Live Voice Dashboard Navigation Commands',
        description: 'Allow CEO to verbally request financial records, open specific departments, and inspect metrics on the screen.',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];

    for (const t of tasksData) {
      const existing = await prisma.task.findUnique({ where: { id: t.id } }).catch(() => null);
      if (!existing) {
        await prisma.task.create({ data: t }).catch(() => null);
      }
    }

    // Ensure at least one initial voice session is registered
    const existingVoice = await prisma.activity.findFirst({ where: { businessId: targetId, source: 'voice_session' } }).catch(() => null);
    if (!existingVoice) {
      await prisma.activity.create({
        data: {
          id: `act_init_voice_${targetId}`,
          businessId: targetId,
          employeeId: `emp_priya_${targetId}`,
          source: 'voice_session',
          status: 'completed',
          updatedAt: new Date()
        }
      }).catch(() => null);
    }

    // 5. Seed Company Brain Memory & Insights
    const brainInsights = [
      {
        id: `brain_fin_${targetId}`,
        businessId: targetId,
        category: 'Financial Reality',
        title: 'Strong Cash Position & 18 Months Runway',
        content: 'Current treasury has $1,420,000 in reserves with $185,000 monthly revenue and $92,000 burn rate. Net margin is +50.2%.',
        actionable: 'Maintain current hiring pace while directing 15% surplus toward automated enterprise acquisition.',
        impact: 'High',
        createdAt: new Date().toISOString()
      },
      {
        id: `brain_mkt_${targetId}`,
        businessId: targetId,
        category: 'Market Opportunity',
        title: 'Surge in Demand for Voice-First AI Operating Systems',
        content: 'Enterprises are seeking conversational C-Suite teammates rather than static dashboards. Inbound trial signups grew 42% this month.',
        actionable: 'Highlight multi-agent Boardroom Meetings and voice capabilities in product demos.',
        impact: 'High',
        createdAt: new Date().toISOString()
      },
      {
        id: `brain_eng_${targetId}`,
        businessId: targetId,
        category: 'Technical Advantage',
        title: 'Ultra-low Latency Neural Audio Orchestrator',
        content: 'System utilizes Edge-TTS neural streaming combined with Groq LPU inference to deliver natural voice turnaround under 300ms.',
        actionable: 'Continue optimizing audio packets for mobile and low-bandwidth connections.',
        impact: 'Medium',
        createdAt: new Date().toISOString()
      },
      {
        id: `brain_ops_${targetId}`,
        businessId: targetId,
        category: 'Operational Risk',
        title: 'Vendor API Rate Limit Management',
        content: 'Ensure all third-party LLM and storage endpoints have automatic memory caching and fallback failovers.',
        actionable: 'Implemented in-memory singleton architecture across all Prisma and Pipeline adapters.',
        impact: 'High',
        createdAt: new Date().toISOString()
      }
    ];

    for (const bi of brainInsights) {
      await prisma.businessInsight.create({ data: bi });
    }

    // 6. Seed Knowledge Base Documents
    const knowledgeDocs = [
      {
        id: `kb_fin_${targetId}`,
        businessId: targetId,
        title: 'Q3 Financial Master Ledger & Forecast',
        category: 'Finance',
        content: 'Summary: Monthly Revenue is $185,000. Operating Expenses are $92,000. Gross Margin is 68.4%. Net Margin is 50.2%. Treasury balance sits at $1.42M across liquid interest-bearing accounts. Runway extends 18 months.',
        tags: ['Finance', 'Revenue', 'Budget', 'Runway', 'Priya'],
        confidenceScore: 98,
        createdAt: new Date().toISOString()
      },
      {
        id: `kb_dna_${targetId}`,
        businessId: targetId,
        title: 'Roxten Corporate Operating Manual & Core DNA',
        category: 'Operations',
        content: 'Roxten OS exists to liberate founders from operational micromanagement through an autonomous, accountable, voice-first AI workforce that executes work round-the-clock.',
        tags: ['DNA', 'Mission', 'Values', 'Culture'],
        confidenceScore: 95,
        createdAt: new Date().toISOString()
      },
      {
        id: `kb_mkt_${targetId}`,
        businessId: targetId,
        title: 'Q3 Growth Marketing Playbook',
        category: 'Marketing',
        content: 'Focus channels: Automated LinkedIn thought leadership, organic founder video clips, and high-conversion enterprise interactive demos. Target CAC: $140.',
        tags: ['Marketing', 'CAC', 'MQLs', 'Sarah'],
        confidenceScore: 92,
        createdAt: new Date().toISOString()
      }
    ];

    for (const kd of knowledgeDocs) {
      await prisma.businessKnowledge.create({ data: kd });
    }

    // 7. Seed Timeline Events
    const timelineEvents = [
      {
        id: `time_1_${targetId}`,
        businessId: targetId,
        title: 'Monthly Financial Audit Completed',
        description: 'Priya Sharma verified $185,000 monthly revenue milestone with 50.2% net operating margin.',
        category: 'Finance',
        eventType: 'FINANCIAL_UPDATE',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: `time_2_${targetId}`,
        businessId: targetId,
        title: 'Boardroom Strategy Session Adjourned',
        description: 'Executives aligned on Q3 enterprise expansion. 4 new strategic action items assigned.',
        category: 'Executive',
        eventType: 'MEETING_COMPLETED',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: `time_3_${targetId}`,
        businessId: targetId,
        title: 'Voice Dashboard Control Deployed',
        description: 'CEO can now speak naturally to command the dashboard, review numbers, and navigate departments.',
        category: 'Engineering',
        eventType: 'FEATURE_RELEASE',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ];

    for (const te of timelineEvents) {
      await prisma.businessTimelineEvent.create({ data: te });
    }

    // 8. Seed Executive Reports
    const reportsData = [
      {
        id: `rep_fin_${targetId}`,
        businessId: targetId,
        title: 'Monthly Financial Records & Burn Rate Review',
        type: 'financial',
        content: 'Executive Financial Summary:\n- Monthly Revenue: $185,000\n- Total Operating Expenses: $92,000\n- Net Operating Profit: +$93,000 (50.2% Net Margin)\n- Cash Treasury: $1,420,000\n- Runway: 18 Months\n\nDepartment Spending:\n- Engineering: $38,000\n- Sales & Marketing: $32,000\n- Operations & Infrastructure: $14,000\n- General & Administrative: $8,000',
        data: {
          revenue: 185000,
          expenses: 92000,
          profit: 93000,
          margin: 50.2,
          runway: 18
        },
        createdAt: new Date().toISOString()
      },
      {
        id: `rep_work_${targetId}`,
        businessId: targetId,
        title: 'Weekly Autonomous Workforce Productivity Audit',
        type: 'operations',
        content: 'Workforce Performance:\n- 14 automated tasks closed this week.\n- Average response time: 240 milliseconds.\n- High-impact initiatives running on schedule across Marketing, Sales, and Engineering.',
        data: { tasksCompleted: 14, efficiency: 96 },
        createdAt: new Date().toISOString()
      }
    ];

    for (const r of reportsData) {
      await prisma.reports?.create ? await prisma.reports.create({ data: r }) : null;
    }

    console.log(`[SeedService] Enterprise initialized successfully for ${targetId}!`);
    return business;
  } catch (err: any) {
    console.error(`[SeedService] Initialization error for ${targetId}:`, err);
    return business || { id: targetId, name: 'Roxten Technologies' };
  } finally {
    isSeeding = false;
  }
}
