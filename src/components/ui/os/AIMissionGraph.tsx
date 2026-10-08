'use client';

import React, { useEffect, useState } from 'react';
import { SystemEvent } from '@/core/interfaces';
import { ExecutionGraph, ExecutionNode, ExecutionEdge } from '@/core/models/MissionContext';
import { motion } from 'framer-motion';
import { Network, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';

interface AIMissionGraphProps {
  activeMission: string | null;
  events: SystemEvent[];
}

export function AIMissionGraph({ activeMission, events }: AIMissionGraphProps) {
  const [graph, setGraph] = useState<ExecutionGraph | null>(null);

  useEffect(() => {
    if (!activeMission) return;

    // Try to find the latest GRAPH_CREATED or update event for this mission
    const graphEvents = events.filter(e => e.missionId === activeMission && e.intent === 'GRAPH_CREATED');
    if (graphEvents.length > 0) {
      const latestGraph = graphEvents[graphEvents.length - 1].payload.graph;
      const updatedGraph = JSON.parse(JSON.stringify(latestGraph)) as ExecutionGraph;
      
      events.forEach(e => {
        if (e.missionId !== activeMission) return;
        
        if (e.type === 'DEPARTMENT_ACTIVATED' && e.payload.node) {
          const node = updatedGraph.nodes.find((n: ExecutionNode) => n.id === e.payload.node.id);
          if (node) node.status = 'active';
        }
        
        if (e.type === 'TASK_COMPLETED' && e.payload.nodeId) {
          const node = updatedGraph.nodes.find((n: ExecutionNode) => n.id === e.payload.nodeId);
          if (node) node.status = 'completed';
        }
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGraph(updatedGraph);
    }
  }, [events, activeMission]);

  if (!activeMission) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Network className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-lg">AI Mission Graph</h2>
          <p className="text-xs text-gray-500">Live Execution Topology</p>
        </div>
      </div>

      {!graph ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p>Jarvis is constructing the execution graph...</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center">
          <div className="relative w-full h-[400px]">
            {graph.nodes.map((node: ExecutionNode, i: number) => {
              // Dynamic circular layout
              const totalNodes = graph.nodes.length;
              const angle = (i / totalNodes) * 2 * Math.PI - Math.PI / 2;
              const radius = 40; // percentage
              
              const top = `${50 + radius * Math.sin(angle)}%`;
              const left = `${50 + radius * Math.cos(angle)}%`;

              const isCompleted = node.status === 'completed';
              const isActive = node.status === 'active';

              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2`}
                  style={{ top, left }}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-500 relative
                    ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/20' : 
                      isActive ? 'bg-indigo-500/20 border-indigo-500 shadow-indigo-500/40' : 
                      'bg-white border-gray-200'}`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping opacity-20" />
                    )}
                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    ) : (
                      <CircleDashed className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{node.label}</p>
                    <p className="text-xs text-gray-500">{node.department}</p>
                  </div>
                </motion.div>
              );
            })}

            {/* SVG Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
              {graph.edges.map((edge: ExecutionEdge, i: number) => {
                const totalNodes = graph.nodes.length;
                const sourceIndex = graph.nodes.findIndex((n: ExecutionNode) => n.id === edge.source);
                const targetIndex = graph.nodes.findIndex((n: ExecutionNode) => n.id === edge.target);
                
                if (sourceIndex === -1 || targetIndex === -1) return null;
                
                const getCoords = (index: number): [number, number] => {
                  const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
                  const radius = 40;
                  return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
                };

                const s = getCoords(sourceIndex);
                const t = getCoords(targetIndex);
                const sourceCompleted = graph.nodes[sourceIndex].status === 'completed';

                return (
                  <g key={i}>
                    <line 
                      x1={`${s[0]}%`} y1={`${s[1]}%`} 
                      x2={`${t[0]}%`} y2={`${t[1]}%`} 
                      stroke="rgba(255,255,255,0.1)" 
                      strokeWidth="2"
                    />
                    {/* Animate data packets if source is completed */}
                    {sourceCompleted && (
                      <circle r="4" fill="#818cf8">
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M ${s[0]*8} ${s[1]*4} L ${t[0]*8} ${t[1]*4}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
