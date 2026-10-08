'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, AlertTriangle, ShieldCheck, Activity, Users, ChevronRight,
  BrainCircuit, LayoutGrid, FileText, Zap, Shield, PlayCircle, Network,
  Briefcase, Plus, Mic
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MissionControlPanel() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/os/mission-control');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Mission Control Error', e);
        setError(true);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh for near real-time

    // Background fetch insights to populate pipeline
    fetch('/api/os/brain/analyze', { method: 'POST' }).catch(() => { });

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Synchronizing Command Center</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="text-red-500 flex flex-col items-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-semibold">Failed to establish connection to Platform Core.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full p-6 lg:p-10 bg-[#FAFAFA] flex flex-col gap-6 custom-scrollbar pb-32">

      {/* 1. CEO Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{data.businessName}</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Mission Control &bull; {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/workforce')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-sm hover:border-gray-300">
            <Plus className="w-3.5 h-3.5" /> Hire
          </button>
          <button onClick={() => router.push('/dashboard/knowledge')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-sm hover:border-gray-300">
            <Zap className="w-3.5 h-3.5 text-yellow-500" /> Train
          </button>
          <button onClick={() => router.push('/dashboard/meetings')} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-indigo-700">
            <PlayCircle className="w-3.5 h-3.5" /> Start Boardroom
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT COLUMN: Overview, Departments, Timeline */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">

          {/* 2. Company Health Overview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Health Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Health Score</div>
                <div className="text-2xl font-bold text-emerald-600">{data.overview.healthScore}%</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">AI Workforce</div>
                <div className="text-2xl font-bold text-gray-900">{data.overview.activeEmployees}/{data.overview.totalEmployees}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Knowledge</div>
                <div className="text-xl font-bold text-gray-900">{data.overview.knowledgeCount} Docs</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Completed</div>
                <div className="text-xl font-bold text-gray-900">{data.overview.completedTasks} Tasks</div>
              </div>
            </div>
          </div>

          {/* 10. Quick Navigation & Galaxy Preview */}
          <div
            onClick={() => router.push('/dashboard/galaxy')}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer group"
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Network className="w-full h-full text-indigo-500 absolute -right-12 -bottom-12 transform scale-150" strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-300" />
                  Galaxy Organization
                </h3>
                <p className="text-indigo-200 text-xs mt-1">View the live AI network topology.</p>
              </div>
              <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enter Galaxy <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 5. Department Health */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5" /> Departments
            </h3>
            <div className="space-y-4">
              {data.departmentHealth.length === 0 && <p className="text-xs text-gray-500 italic">No departments active.</p>}
              {data.departmentHealth.map((dept: any) => (
                <div key={dept.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-gray-800">{dept.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dept.status === 'healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {dept.productivity}% Prod
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dept.productivity}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: Workforce, Missions, Alerts */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

          {/* 8. Alerts */}
          {data.alerts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="w-full">
                <h3 className="text-sm font-bold text-red-900 mb-2">Requires Immediate Attention</h3>
                <div className="space-y-2">
                  {data.alerts.map((alert: any) => (
                    <div key={alert.id} className="bg-white rounded-lg border border-red-100 p-2.5 shadow-sm flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-800">{alert.message}</span>
                      <button className="text-[10px] font-bold text-red-600 uppercase tracking-wide hover:underline">Review</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. AI Workforce Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> AI Workforce Live
              </h3>
              <button onClick={() => router.push('/dashboard/workforce')} className="text-xs font-semibold text-indigo-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {data.workforceStatus.length === 0 && <p className="text-sm text-gray-500 italic">No AI employees hired yet.</p>}
              {data.workforceStatus.map((emp: any, idx: number) => (
                <div key={emp.id ? `${emp.id}-${idx}` : `mc-emp-${idx}`} onClick={() => router.push(`/dashboard/workforce/employees/${emp.id}`)} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{emp.name}</div>
                      <div className="text-[10px] font-medium text-gray-500">{emp.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-500 max-w-[140px] truncate">
                        {emp.currentTask ? emp.currentTask.title : 'Idle'}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${emp.healthStatus === 'blocked' ? 'bg-red-500' : emp.currentTask ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Active Missions (Derived from High Priority Tasks) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-500" /> Active Missions
            </h3>
            <div className="space-y-3">
              {data.activeMissions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">All critical missions completed.</p>
              ) : (
                data.activeMissions.map((mission: any) => (
                  <div key={mission.id} className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-900 text-sm font-semibold">{mission.title}</span>
                      <span className="text-indigo-600 text-[10px] font-bold px-2 py-0.5 bg-indigo-100 rounded-full">Executing</span>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 font-medium">Assigned to: {mission.employee?.name || 'System Agent'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Insights, Reports, Timeline */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">

          {/* 7. Executive Insights */}
          <div className="bg-indigo-50/80 rounded-2xl border border-indigo-100 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="w-16 h-16 text-indigo-900" />
            </div>
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Executive Insights
            </h3>
            <div className="space-y-3 relative z-10">
              {data.recommendations.length === 0 ? (
                <p className="text-xs text-indigo-700/60 italic">Intelligence pipeline analyzing...</p>
              ) : (
                data.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-200/50 shadow-sm">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 mb-1">{rec.type || 'Insight'}</div>
                    <div className="text-gray-900 text-xs font-semibold mb-1">{rec.title}</div>
                    <p className="text-gray-600 text-[10px] leading-relaxed">{rec.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 9. Recent Reports */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Recent Reports
            </h3>
            <div className="space-y-2">
              {data.recentReports.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No reports generated yet.</p>
              ) : (
                data.recentReports.map((report: any) => (
                  <div key={report.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 truncate">{report.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Company Activity Feed */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Activity Feed
            </h3>
            <div className="space-y-4">
              {data.timelineEvents.length === 0 && <p className="text-xs text-gray-500 italic">No recent activity.</p>}
              {data.timelineEvents.slice(0, 5).map((event: any) => (
                <div key={event.id} className="flex gap-3 relative before:absolute before:left-[3px] before:top-4 before:bottom-[-16px] before:w-px before:bg-gray-100 last:before:hidden">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-1 shrink-0 relative z-10 ring-4 ring-white" />
                  <div>
                    <div className="text-xs font-bold text-gray-900">{event.title}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{event.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
