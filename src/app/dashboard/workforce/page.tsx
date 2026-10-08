'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Target, Award, BrainCircuit, Activity, ChevronRight, BarChart, Mic, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { useVoice } from '@/components/providers/VoiceProvider';

export default function WorkforceHub() {
  const { startCall, voiceState, activeEmployeeId } = useVoice();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/galaxy?t=' + Date.now())
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Workforce...</p>
        </div>
      </div>
    );
  }

  const allEmployees = data?.departments?.flatMap((d: any) => d.employees) || [];
  const floaters = data?.employees || [];
  const employeeMap = new Map<string, any>();
  [...allEmployees, ...floaters].forEach((emp: any) => {
    if (emp?.id && !employeeMap.has(emp.id)) {
      employeeMap.set(emp.id, emp);
    }
  });
  const totalEmployees = Array.from(employeeMap.values());

  const modules = [
    { title: 'Agent Marketplace', desc: 'Discover, interview, and hire specialized AI agents for your business.', icon: UserPlus, link: '/dashboard/workforce/marketplace', color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-200' },
    { title: 'Active Directory', desc: 'Manage your active workforce, assign roles, and configure rules.', icon: Users, link: '/dashboard/workforce/directory', color: 'bg-emerald-50 text-emerald-600', borderColor: 'border-emerald-200' },
    { title: 'Performance Analytics', desc: 'View agent KPIs, mission success rates, and compute costs.', icon: BarChart, link: '/dashboard/workforce/analytics', color: 'bg-purple-50 text-purple-600', borderColor: 'border-purple-200' },
    { title: 'Training & Knowledge', desc: 'Upload documents and train agents on company-specific processes.', icon: BrainCircuit, link: '/dashboard/workforce/training', color: 'bg-amber-50 text-amber-600', borderColor: 'border-amber-200' },
  ];

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-auto pb-24 custom-scrollbar">
      {/* Header */}
      <div className="px-10 pt-10 pb-8 border-b border-gray-200 bg-white shadow-sm relative">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 relative z-10">
          AI Workforce
        </h1>
        <p className="text-gray-500 max-w-2xl text-base font-medium relative z-10">
          The operational heart of your company. Hire, manage, and monitor your autonomous employees.
        </p>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10 relative z-10">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Active Agents
            </div>
            <div className="text-4xl font-bold text-gray-900">{data?.pulseMetrics?.activeEmployees || totalEmployees.length || 0}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> Assigned Tasks
            </div>
            <div className="text-4xl font-bold text-gray-900">{data?.pulseMetrics?.tasksCount || 0}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" /> Completed Tasks
            </div>
            <div className="text-4xl font-bold text-gray-900">{data?.pulseMetrics?.completedTasks || 0}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-600" /> Voice Sessions
            </div>
            <div className="text-4xl font-bold text-gray-900">{data?.pulseMetrics?.voiceSessions || 0}</div>
          </div>
        </div>
      </div>

      <div className="p-12 max-w-[1400px] mx-auto space-y-16">
        {/* Core Modules */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Workforce Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod, idx) => (
              <Link key={idx} href={mod.link}>
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-white border border-gray-200 hover:shadow-md hover:border-gray-300 p-8 rounded-3xl cursor-pointer transition-all group relative overflow-hidden h-full flex flex-col"
                >
                  <div className={`w-14 h-14 rounded-2xl ${mod.color} border ${mod.borderColor} flex items-center justify-center mb-6`}>
                    <mod.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{mod.title}</h3>
                  <p className="text-gray-500 font-medium mb-6 flex-1">{mod.desc}</p>
                  <div className="flex items-center text-sm font-bold text-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
                    Access Module <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Agent Roster */}
        <section>
          <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Deployed Agents</h2>
            <Link href="/dashboard/workforce/directory" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View Directory &rarr;</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {totalEmployees.map((emp: any, idx: number) => {
              const isCallingThisEmp = voiceState !== 'idle' && activeEmployeeId === emp.id;
              return (
                <div key={emp.id ? `${emp.id}-${idx}` : `emp-${idx}`} className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between group">
                  <Link href={`/dashboard/workforce/employees/${emp.id}`} className="block">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:bg-indigo-50 transition-colors shadow-sm">
                        <span className="font-bold text-gray-700 text-lg group-hover:text-indigo-600">{emp.name?.charAt(0) || 'A'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{emp.name}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{emp.role}</p>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-gray-100">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Active</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startCall(emp.id, emp.name, emp.role);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                        isCallingThisEmp
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{isCallingThisEmp ? 'In Call' : 'Call Voice'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {totalEmployees.length === 0 && (
              <div className="col-span-full text-center p-16 bg-gray-50 border border-gray-200 border-dashed rounded-3xl">
                <p className="text-gray-500 mb-4 font-medium text-lg">No agents currently deployed in your workforce.</p>
                <Link href="/dashboard/workforce/marketplace">
                  <button className="px-6 py-3 bg-indigo-600 text-gray-900 font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    Hire First Agent
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
