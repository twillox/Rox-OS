import React from 'react';
import { SystemEvent } from '@/core/interfaces';
import { Activity, Brain, Server } from 'lucide-react';

interface CompanyPulseProps {
  companyState: any;
  events: SystemEvent[];
  activeMission: string | null;
}

export function CompanyPulse({ companyState, events, activeMission }: CompanyPulseProps) {
  
  // Filter events for the active mission
  const activeEvents = activeMission 
    ? events.filter(e => e.missionId === activeMission)
    : events.slice(-5); // show last 5 if no active mission

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Pulse Status Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Company Pulse
          </h3>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">{companyState.health}% Healthy</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Active Missions</span>
            <span className="text-gray-900 font-mono">{companyState.activeMissions}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Completed Tasks</span>
            <span className="text-gray-900 font-mono">{companyState.completedTasks}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Department Load</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(companyState.departmentLoad || {}).map(([dept, load]) => (
              <div key={dept} className="px-2 py-1 rounded bg-white border border-gray-200 text-xs text-gray-600">
                {dept}: <span className="text-indigo-400">{load as number}</span>
              </div>
            ))}
            {Object.keys(companyState.departmentLoad || {}).length === 0 && (
              <span className="text-xs text-gray-600">All systems nominal</span>
            )}
          </div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 backdrop-blur-md overflow-hidden flex flex-col">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-blue-400" />
          Event Pipeline
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {[...activeEvents].reverse().map((event, i) => (
            <div key={event.id || i} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${
                  event.priority === 'critical' ? 'bg-red-500' :
                  event.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <span className="text-xs text-gray-500 font-mono">
                  {new Date(event.timestamp).toISOString().split('T')[1].slice(0, -1)}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">{event.sender}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-gray-600">
                <p className="text-xs font-medium text-gray-900 mb-1">{event.intent}</p>
                {event.payload?.message ? (
                  <p className="text-xs text-gray-500">{event.payload.message}</p>
                ) : (
                  <pre className="text-[10px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                    {JSON.stringify(event.payload)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          {activeEvents.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-8">
              Awaiting system events...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
