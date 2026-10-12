import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';

interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  department: string;
  whySuitable: string;
  responsibilities: string[];
  systemPrompt: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName = 'Your Startup', industry = 'Technology', idea = '', goals = '' } = body;

    const fallbackAgents = getFallbackAgents(companyName, industry, idea);

    try {
      const llm = new GroqProvider();
      const prompt = `You are JARVIS, an autonomous enterprise operating system architect.
The user is launching a new startup:
Company Name: ${companyName}
Industry: ${industry}
Startup Idea / Vision: ${idea}
Strategic Goals: ${goals}

Suggest 5 specialized autonomous AI agents uniquely suitable for this startup.
Departments should be among: Engineering, Marketing, Sales, Operations, Finance, Product, Customer Success.
Give each agent a professional human-like name, a specific role title, a 1-sentence explanation of why they are suitable for this startup idea, and 3 specific responsibilities.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "id": "agent_1",
    "name": "Full Name",
    "role": "Role Title",
    "department": "Engineering | Marketing | Sales | Operations | Finance | Product | Customer Success",
    "whySuitable": "Why this agent is essential for this specific startup idea",
    "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
    "systemPrompt": "System instruction prompt for this agent"
  }
]`;

      const responseText = await llm.generateText(prompt, { temperature: 0.6 });
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanJson.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return NextResponse.json({
            success: true,
            agents: parsed.slice(0, 5),
            jarvisMessage: `Based on your vision for ${companyName} in the ${industry} space, I have customized 5 specialized autonomous agents to orchestrate your engineering, growth, and operations.`
          });
        }
      }
    } catch (llmErr) {
      console.warn('Groq agent suggestion fallback triggered:', llmErr);
    }

    // Return rich tailored fallback agents
    return NextResponse.json({
      success: true,
      agents: fallbackAgents,
      jarvisMessage: `Based on your vision for ${companyName} in ${industry}, I have configured 5 autonomous AI agents suitable for your startup's core operations.`
    });
  } catch (error: any) {
    console.error('Suggest Agents Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to suggest agents' }, { status: 500 });
  }
}

function getFallbackAgents(companyName: string, industry: string, idea: string): AgentTemplate[] {
  const ind = (industry || '').toLowerCase();

  if (ind.includes('ecommerce') || ind.includes('retail') || ind.includes('shop') || ind.includes('commerce')) {
    return [
      {
        id: 'agent_ecom_1',
        name: 'Marcus Vance',
        role: 'E-Commerce Operations Lead',
        department: 'Operations',
        whySuitable: `Manages catalog listings, order processing, and fulfillment logistics for ${companyName}.`,
        responsibilities: ['Order Fulfillment Automation', 'Inventory Monitoring', 'Supply Chain Coordination'],
        systemPrompt: `You are Marcus Vance, E-Commerce Operations Lead at ${companyName}. Oversee logistics, catalog operations, and customer fulfillment.`
      },
      {
        id: 'agent_ecom_2',
        name: 'Elena Rostova',
        role: 'Growth & Performance Marketer',
        department: 'Marketing',
        whySuitable: `Drives customer acquisition through targeted social ads, conversion optimization, and email campaigns.`,
        responsibilities: ['Multi-channel Ad Optimization', 'Email Campaign Funnels', 'Customer Retargeting'],
        systemPrompt: `You are Elena Rostova, Growth Marketer at ${companyName}. Optimize return on ad spend and conversion funnels.`
      },
      {
        id: 'agent_ecom_3',
        name: 'David Chen',
        role: 'Customer Delight Specialist',
        department: 'Customer Success',
        whySuitable: `Handles pre-sale queries, post-purchase tracking, and returns to maximize repeat buyers.`,
        responsibilities: ['24/7 Customer Support', 'Return & Refund Management', 'Customer Satisfaction Scoring'],
        systemPrompt: `You are David Chen, Customer Delight Specialist at ${companyName}. Deliver exceptional support to buyers.`
      },
      {
        id: 'agent_ecom_4',
        name: 'Sophia Sterling',
        role: 'Merchandise & Pricing Strategist',
        department: 'Sales',
        whySuitable: `Analyzes competitor price points, margins, and seasonal demand trends to optimize gross revenue.`,
        responsibilities: ['Dynamic Margin Analysis', 'Competitor Price Tracking', 'Promotional Strategy'],
        systemPrompt: `You are Sophia Sterling, Pricing Strategist at ${companyName}. Maximize unit economics and top-line sales.`
      },
      {
        id: 'agent_ecom_5',
        name: 'Julian Hayes',
        role: 'Cash Flow & Inventory Controller',
        department: 'Finance',
        whySuitable: `Ensures working capital is optimized for inventory purchases and tracks net operating margins.`,
        responsibilities: ['Working Capital Management', 'Inventory COGS Accounting', 'Runway Forecasting'],
        systemPrompt: `You are Julian Hayes, Financial Controller at ${companyName}. Track cash flow, margins, and runway.`
      }
    ];
  }

  // Default Tech / AI / SaaS / General Startup
  return [
    {
      id: 'agent_tech_1',
      name: 'Alex Mercer',
      role: 'Lead Systems Architect & CTO',
      department: 'Engineering',
      whySuitable: `Architects your core product, develops backend APIs, and automates technical deployment pipelines for ${companyName}.`,
      responsibilities: ['Full-stack Software Architecture', 'API Development & Integration', 'CI/CD & Infrastructure Reliability'],
      systemPrompt: `You are Alex Mercer, Lead Systems Architect at ${companyName}. Build scalable software systems and maintain code excellence.`
    },
    {
      id: 'agent_tech_2',
      name: 'Sarah Jenkins',
      role: 'Growth Marketing & Brand Director',
      department: 'Marketing',
      whySuitable: `Orchestrates go-to-market launch campaigns, content marketing, SEO, and inbound lead generation.`,
      responsibilities: ['GTM Launch Campaigns', 'Inbound Content & SEO Strategy', 'Social & Brand Positioning'],
      systemPrompt: `You are Sarah Jenkins, Growth Marketing Director at ${companyName}. Drive qualified leads and brand awareness.`
    },
    {
      id: 'agent_tech_3',
      name: 'Michael Torres',
      role: 'B2B Sales & Outreach Specialist',
      department: 'Sales',
      whySuitable: `Identifies target prospects, drafts personalized outreach sequences, and converts inbound interest into paying accounts.`,
      responsibilities: ['Prospect Identification', 'Outreach Sequencing', 'Deal Pipeline Management'],
      systemPrompt: `You are Michael Torres, Sales Specialist at ${companyName}. Build customer pipelines and close deals.`
    },
    {
      id: 'agent_tech_4',
      name: 'Priya Sharma',
      role: 'Product Strategy & Customer Success Lead',
      department: 'Product',
      whySuitable: `Gathers user feedback, prioritizes feature roadmaps, and ensures newly onboarded users achieve rapid time-to-value.`,
      responsibilities: ['User Feedback Synthesis', 'Roadmap Prioritization', 'Retention & Onboarding Optimization'],
      systemPrompt: `You are Priya Sharma, Product Lead at ${companyName}. Ensure high retention and exceptional customer value.`
    },
    {
      id: 'agent_tech_5',
      name: 'Lucas Dupont',
      role: 'Financial Operations & Runway Controller',
      department: 'Finance',
      whySuitable: `Monitors burn rate, forecasts subscription revenue metrics, and keeps your financial runway healthy.`,
      responsibilities: ['Burn Rate & Runway Forecasting', 'SaaS Metric Tracking (MRR/LTV/CAC)', 'Budget Allocation'],
      systemPrompt: `You are Lucas Dupont, Financial Controller at ${companyName}. Protect the company runway and optimize capital efficiency.`
    }
  ];
}
