import { GroqProvider } from '../providers/GroqProvider';
import { ExecutionGraph, ExecutionNode } from '../models/MissionContext';
import prisma from '@/lib/prisma';

export class GraphGenerator {
  private llm: GroqProvider;

  constructor() {
    this.llm = new GroqProvider();
  }

  public async generateGraph(objective: string): Promise<ExecutionGraph> {
    
    // Fetch enterprise context to make planning intelligent
    const business = await prisma.business.findFirst();
    let contextStr = '';

    if (business) {
      const [employees, knowledge, activeTasks] = await Promise.all([
        prisma.employee.findMany({ where: { businessId: business.id }, include: { department: true } }),
        prisma.businessKnowledge.findMany({ where: { businessId: business.id }, take: 10 }),
        prisma.task.findMany({ where: { businessId: business.id, status: { in: ['PENDING', 'IN_PROGRESS'] } } })
      ]);

      contextStr = `
COMPANY CONTEXT:
Active Workforce:
${employees.map(e => `- ${e.name} (${e.role} in ${e.department?.name || 'General'}). Skills: ${e.knowledgeAccessTags.join(', ')}`).join('\n')}

Active Company Workload:
- There are currently ${activeTasks.length} tasks in progress across the company.

Key Company Knowledge:
${knowledge.map(k => `- ${k.title}`).join('\n')}
`;
    }

    const prompt = `
You are an expert autonomous business orchestrator.
A CEO has given you the following objective: "${objective}"

${contextStr}

You must break this objective down into a directed acyclic graph (DAG) of execution nodes.
Each node represents a major chunk of work that MUST be assigned to an existing department or explicitly matched to the capabilities of our Active Workforce.

Rules:
1. Return strictly valid JSON matching the schema below.
2. Nodes must have unique string IDs.
3. Dependencies should be an array of node IDs that must complete before this node can start.
4. "department" must be an actual department from the Active Workforce if possible.
5. "capabilities" should describe what skills are required for the node.

Schema:
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "department": "string",
      "capabilities": ["string"],
      "eta": 60, // Estimated minutes
      "dependencies": ["string"] // IDs of other nodes
    }
  ]
}
    `;

    try {
      const response = await this.llm.generateJSON<{ nodes: any[] }>(prompt);
      
      const nodes: ExecutionNode[] = response.nodes.map(n => ({
        ...n,
        status: 'pending',
        assignedWorkers: [],
        progress: 0,
        confidence: 0,
      }));

      const edges: any[] = [];
      for (const node of nodes) {
        if (node.dependencies) {
          for (const dep of node.dependencies) {
            edges.push({ source: dep, target: node.id, active: false });
          }
        }
      }

      return { nodes, edges };
    } catch (e) {
      console.error('Graph generation failed, returning fallback.', e);
      // Fallback
      return {
        nodes: [{
          id: 'task_1',
          label: 'Execute Objective',
          department: 'General',
          capabilities: ['General Task'],
          status: 'pending',
          assignedWorkers: [],
          dependencies: [],
          progress: 0,
          confidence: 0,
          eta: 60
        }],
        edges: []
      };
    }
  }
}
