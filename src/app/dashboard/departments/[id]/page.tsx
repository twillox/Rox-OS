'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Target, Activity, BrainCircuit, CheckCircle2, Clock, ShieldAlert, Award, Briefcase, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(`/api/os/departments/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartment(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFA]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Department Not Found</h2>
        <p className="text-gray-500 mb-6">This department does not exist or has been removed.</p>
        <button onClick={() => router.push('/dashboard/departments')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl">Go Back</button>
      </div>
    );
  }

  const { metrics, employees, activeTasks, completedTasks, timelineEvents, knowledgeSources, leadEmployee } = department;

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] text-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-10 pt-10 pb-8 border-b border-gray-200 bg-white shadow-sm shrink-0">
        <button onClick={() => router.push('/dashboard/departments')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-bold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Departments
        </button>
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">{department.name}</h1>
            </div>
            <p className="text-gray-500 text-base font-medium max-w-2xl mt-4">
              {department.description || "Organizational unit managing dedicated AI workforce and tasks."}
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Department Lead</p>
              <div className="flex items-center gap-2">
                {leadEmployee ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {leadEmployee.name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-900">{leadEmployee.name}</span>
                  </>
                ) : (
                  <span className="font-bold text-gray-400 italic">No Department Lead Assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 mt-10 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'roster', label: 'Roster', icon: Users },
            { id: 'missions', label: 'Missions', icon: Target },
            { id: 'timeline', label: 'Activity Log', icon: Clock },
            { id: 'knowledge', label: 'Knowledge', icon: BrainCircuit }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-colors relative ${
                activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.id === 'roster' && employees.length > 0 && (
                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{employees.length}</span>
              )}
              {tab.id === 'missions' && activeTasks.length > 0 && (
                <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1">{activeTasks.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
        <div className="max-w-[1400px] mx-auto">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" /> Completion Rate
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{metrics.completionRate}%</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" /> Active Tasks
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{metrics.activeTaskCount}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Completed
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{metrics.completedTaskCount}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" /> Workload
                  </div>
                  <div className={`text-4xl font-bold ${metrics.workloadStatus === 'High' ? 'text-rose-600' : metrics.workloadStatus === 'Moderate' ? 'text-amber-600' : 'text-gray-900'}`}>
                    {metrics.workloadStatus}
                  </div>
                </div>
              </div>

              {/* Roster & Recent Tasks Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/> Deployed Agents</h3>
                     <button onClick={() => setActiveTab('roster')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                  </div>
                  {employees.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No employees assigned.</p>
                  ) : (
                    <div className="space-y-4">
                      {employees.slice(0, 4).map((emp: any, idx: number) => (
                        <div key={emp.id ? `${emp.id}-${idx}` : `dept-emp-${idx}`} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-900">{emp.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600"/> Recent Activity</h3>
                     <button onClick={() => setActiveTab('timeline')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View Log</button>
                  </div>
                  {timelineEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No recent activity.</p>
                  ) : (
                    <div className="space-y-4">
                      {timelineEvents.slice(0, 4).map((evt: any) => (
                        <div key={evt.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{evt.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{evt.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ROSTER TAB */}
          {activeTab === 'roster' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.length === 0 ? (
                  <div className="col-span-full p-12 text-center border-2 border-gray-200 border-dashed rounded-3xl bg-gray-50">
                    <p className="text-gray-500 font-medium">No agents deployed in this department.</p>
                  </div>
                ) : (
                  employees.map((emp: any, idx: number) => (
                    <div key={emp.id ? `${emp.id}-${idx}` : `roster-${idx}`} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-2xl text-indigo-600">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{emp.name}</h3>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{emp.role}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-6 h-[80px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Current Task</p>
                        {emp.currentTask ? (
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{emp.currentTask.title}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Idle / Available</p>
                        )}
                      </div>

                      <button onClick={() => router.push(`/dashboard/workforce/employees/${emp.id}`)} className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-bold rounded-xl text-sm transition-colors shadow-sm">
                        View Profile
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* MISSIONS TAB */}
          {activeTab === 'missions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Department Tasks ({activeTasks.length})</h3>
                <button onClick={() => router.push('/dashboard/tasks')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Go to Task Center</button>
              </div>
              <div className="divide-y divide-gray-100">
                {activeTasks.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium italic">No active missions for this department.</div>
                ) : (
                  activeTasks.map((task: any) => (
                    <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>
                      {task.employeeId && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assigned To:</span>
                          <span className="text-sm font-semibold text-gray-900">{employees.find((e:any) => e.id === task.employeeId)?.name || 'Unknown Agent'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Department Activity Log</h3>
                {timelineEvents.length === 0 ? (
                  <p className="text-gray-500 italic text-center p-8">No historical activity found.</p>
                ) : (
                  <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-8">
                    {timelineEvents.map((event: any, idx: number) => (
                      <div key={event.id} className="relative pl-8">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                          event.severity === 'ERROR' ? 'bg-rose-500' :
                          event.severity === 'SUCCESS' ? 'bg-emerald-500' :
                          event.severity === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`} />
                        <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl hover:border-gray-200 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{event.title}</h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(event.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Users className="w-3 h-3" /> Actor: {event.actor || 'System'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* KNOWLEDGE TAB */}
          {activeTab === 'knowledge' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connected Knowledge</h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">Information sources available to agents in this department.</p>
                
                {knowledgeSources.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                     <BrainCircuit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                     <p className="text-gray-500 font-medium">No specialized knowledge assigned.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {knowledgeSources.map((k: any) => (
                      <div key={k.id} className="flex gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                         <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                           <FileText className="w-5 h-5" />
                         </div>
                         <div>
                           <h4 className="font-bold text-gray-900 text-sm mb-1">{k.title}</h4>
                           <p className="text-xs text-gray-500 line-clamp-2">{k.content}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
