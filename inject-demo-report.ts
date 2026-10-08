require('dotenv').config();
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import prisma from './src/lib/prisma';

async function injectDemoReportAll() {
  try {
    const snap = await getDocs(collection(db, 'companies'));
    if (snap.empty) {
      console.log('No companies found.');
      return;
    }
    
    for (const doc of snap.docs) {
      const businessId = doc.id;
      
      const demoReport = {
        businessId,
        type: 'Executive',
        timeframe: 'MONTHLY',
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        generatedBy: 'System AI Demo',
        metricsSnapshot: {
          period: { type: 'MONTHLY' },
          tasks: { total: 145, completedTotal: 132, completionRate: 91 },
          workforce: { total: 12, aiCount: 10, humanCount: 2, aiUtilization: 83 },
          departments: { total: 4 },
          knowledge: { totalDocuments: 45, totalIntelligenceFacts: 210, totalBrainInsights: 18 }
        },
        summary: "This is a demonstration report. Over the past month, the company has seen exceptional growth in AI utilization and task throughput. The integration of 10 new AI agents has resulted in a 91% task completion rate, significantly reducing operational bottlenecks. Knowledge base ingestion is healthy, providing the Company Brain with 210 intelligence facts.",
        highlights: [
          "Task completion rate reached an all-time high of 91%.",
          "Successfully onboarded 3 new AI agents in the Marketing department.",
          "Company Brain insights have increased decision-making speed by 40%."
        ],
        risks: [
          "High reliance on a single human supervisor (CEO) for critical approvals.",
          "Sales department tasks are showing a slight delay in completion compared to Engineering."
        ],
        opportunities: [
          "Implement automated approval workflows to reduce CEO bottleneck.",
          "Deploy a dedicated Sales AI agent to balance the workload."
        ],
        recommendations: [
          "Review and approve the pending marketing campaign.",
          "Hire a 'Sales Development Representative' AI agent from the Marketplace.",
          "Schedule a Boardroom meeting to discuss Q3 targets."
        ],
        status: 'PUBLISHED'
      };

      const saved = await prisma.businessReport.create({ data: demoReport });
      console.log(`Demo report injected for business ${businessId}:`, saved.id);
    }
  } catch (e) {
    console.error('Error injecting demo report:', e);
  }
}

injectDemoReportAll();
