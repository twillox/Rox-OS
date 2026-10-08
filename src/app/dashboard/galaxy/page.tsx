'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Building2, Users, Bot, Activity, ArrowRight, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { RuntimeSyncService } from '@/core/services/RuntimeSyncService';

export default function GalaxyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const syncService = RuntimeSyncService.getInstance();
    
    // Subscribe to the galaxy channel
    const unsubscribe = syncService.subscribe('galaxy', (newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-400 font-medium tracking-widest uppercase text-sm">Initializing Galaxy View...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA] text-gray-900">
        <p>No company data found. Please ensure the database is seeded.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-gray-200 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Network className="w-8 h-8 text-indigo-600" />
            Company Galaxy
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Live visualization of your autonomous workforce architecture.</p>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-semibold">
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Healthy
          </div>
          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm">
            <Server className="w-4 h-4" />
            JarvisCore Active
          </div>
        </div>
      </div>

      {/* Galaxy Map Area */}
      <div className="flex-1 relative overflow-auto p-12 custom-scrollbar">
        {/* Central Core: The Company / CEO */}
        <div className="flex flex-col items-center mb-24 relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-lg relative flex flex-col items-center min-w-[320px]">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{data.name}</h2>
              <p className="text-gray-500 font-bold tracking-widest text-[10px] uppercase">Central Command</p>
              
              <div className="mt-6 flex gap-8 w-full justify-center border-t border-gray-100 pt-6">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-gray-900">{data.departments?.length || 0}</div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Departments</div>
                 </div>
                 <div className="w-px bg-gray-200" />
                 <div className="text-center">
                   <div className="text-2xl font-bold text-gray-900">
                     {(data.departments?.reduce((acc: number, d: any) => acc + (d.employees?.length || 0), 0) || 0) + (data.employees?.length || 0)}
                   </div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Agents</div>
                 </div>
              </div>
            </div>
          </motion.div>
          {/* Connector to Departments */}
          {data.departments?.length > 0 && (
            <div className="absolute -bottom-24 w-px h-24 bg-gray-300" />
          )}
        </div>

        {/* Orbiting Departments */}
        <div className="flex flex-wrap justify-center gap-10 relative">
          {data.departments?.length > 0 && (
            <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gray-300" />
          )}

          {data.departments?.map((dept: any, index: number) => (
            <motion.div 
              key={dept.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              className="flex flex-col items-center relative"
            >
              {/* Connector line from horizontal to department */}
              <div className="w-px h-12 bg-gray-300 mb-0" />
              
              <div 
                className="bg-white border border-gray-200 p-6 rounded-3xl w-[320px] shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                onClick={() => router.push('/dashboard/departments')}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      {dept.name}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mt-1">{dept.description || 'Department Runtime Active'}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                </div>

                {/* Employees in this department */}
                <div className="space-y-3">
                  {dept.employees?.map((emp: any, idx: number) => (
                    <div 
                      key={emp.id ? `${emp.id}-${idx}` : `g-emp-${idx}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/workforce/employees/${emp.id}`);
                      }}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                          <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{emp.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100" title="Active">
                        <Activity className="w-3 h-3 text-emerald-600" />
                      </div>
                    </div>
                  ))}
                  
                  {(!dept.employees || dept.employees.length === 0) && (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-xl border border-gray-100 border-dashed text-center">
                      No active agents in this cluster
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
