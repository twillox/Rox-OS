'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, Briefcase, Search, Filter, Activity, Brain, Volume2, Database, Clock, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/components/providers/VoiceProvider';

export default function WorkforceDirectory() {
  const { startCall, voiceState, activeEmployeeId } = useVoice();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Directory...</p>
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

  const filteredEmployees = totalEmployees.filter((emp: any) => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-auto pb-24 custom-scrollbar">
      {/* Header */}
      <div className="px-10 pt-10 pb-8 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 text-gray-500 text-sm font-bold mb-6">
          <Link href="/dashboard/workforce" className="hover:text-indigo-600 transition-colors">Workforce</Link>
          <span className="text-gray-300">/</span>
          <span className="text-indigo-600">Directory</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-4">
          <Users className="w-10 h-10 text-indigo-600" />
          Active Directory
        </h1>
        <p className="text-gray-500 max-w-2xl text-base font-medium">
          Manage your deployed AI workforce, view assignments, and monitor runtime health.
        </p>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-8">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all font-medium placeholder-gray-400 shadow-inner"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 text-gray-700 font-bold shadow-sm transition-colors">
            <Filter className="w-5 h-5" /> Filter
          </button>
        </div>
      </div>

      <div className="p-10 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEmployees.map((emp: any, idx: number) => {
            const activeTasks = emp.tasks?.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'PENDING') || [];
            const currentTask = activeTasks.length > 0 ? activeTasks[0].title : 'Idle';
            const deptName = data.departments?.find((d: any) => d.id === emp.departmentId)?.name || 'General';

            return (
              <div 
                key={emp.id ? `${emp.id}-${idx}` : `dir-${idx}`} 
                onClick={() => router.push(`/dashboard/workforce/employees/${emp.id}`)}
                className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                      <Bot className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xl">{emp.name}</h3>
                      <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mt-1">
                        <Briefcase className="w-4 h-4 text-gray-400" /> {emp.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Deployed
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{deptName}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <Activity className="w-3.5 h-3.5" /> Runtime
                    </div>
                    <div className="text-gray-900 font-bold text-sm">100% Healthy</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <Brain className="w-3.5 h-3.5" /> Memory
                    </div>
                    <div className="text-gray-900 font-bold text-sm text-emerald-600">Synchronized</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <Database className="w-3.5 h-3.5" /> Knowledge
                    </div>
                    <div className="text-gray-900 font-bold text-sm text-emerald-600">Indexed</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <Volume2 className="w-3.5 h-3.5" /> Voice
                    </div>
                    <div className="text-gray-900 font-bold text-sm truncate">{emp.voiceProvider || 'Ready'}</div>
                  </div>
                </div>

                <div className="mt-auto border-t border-gray-100 pt-5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Current Task
                    </span>
                    <span className="text-indigo-600 font-bold truncate max-w-[150px]">{currentTask}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                    <span className="text-gray-400 font-medium text-xs">Direct Voice Line</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startCall(emp.id, emp.name, emp.role);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                        voiceState !== 'idle' && activeEmployeeId === emp.id
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-100'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{voiceState !== 'idle' && activeEmployeeId === emp.id ? 'In Call' : 'Call Voice'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEmployees.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 border border-gray-200 border-dashed rounded-3xl flex flex-col items-center justify-center">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Deployed Agents</h3>
              <p className="text-gray-500 font-medium max-w-sm">No fully initialized and deployed agents found matching your search. Hire a new agent to populate the directory.</p>
              <Link href="/dashboard/workforce/marketplace" className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                Hire Agent
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
