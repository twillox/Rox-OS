'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Zap, BrainCircuit, Coffee, Star, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface EmployeeNode {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
  version: number;
}

interface DepartmentNode {
  id: string;
  name: string;
  employees: EmployeeNode[];
}

export function DynamicOrgChart() {
  const [data, setData] = useState<{ departments: DepartmentNode[], floaters: EmployeeNode[], businessName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/galaxy?t=' + Date.now())
      .then(res => res.json())
      .then(d => {
        setData({
          departments: d.departments || [],
          floaters: d.employees || [], // Employees with no department
          businessName: d.name || 'Company'
        });
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center pt-8 pb-32">
        <div className="w-64 h-24 bg-white rounded-2xl animate-pulse border border-gray-200 mb-8 shadow-sm" />
        <div className="w-px h-12 bg-gray-200" />
        <div className="w-full max-w-4xl h-px bg-gray-200 relative">
           <div className="absolute top-0 left-1/4 w-px h-6 bg-gray-200" />
           <div className="absolute top-0 right-1/4 w-px h-6 bg-gray-200" />
        </div>
        <div className="flex w-full max-w-4xl justify-around mt-6">
           <div className="w-56 h-20 bg-white rounded-xl animate-pulse border border-gray-200 shadow-sm" />
           <div className="w-56 h-20 bg-white rounded-xl animate-pulse border border-gray-200 shadow-sm" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const EmployeeCard = ({ employee, isLeader = false }: { employee: EmployeeNode, isLeader?: boolean }) => {
    const avatarInitials = employee.name.substring(0, 2).toUpperCase();
    
    return (
      <Link href={`/dashboard/workforce/employees/${employee.id}`}>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className={`relative p-4 rounded-2xl border ${isLeader ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'} cursor-pointer transition-all group w-64`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isLeader ? 'bg-indigo-600 text-gray-900 shadow-sm' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
              {avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 truncate">{employee.name}</h4>
              <p className="text-xs text-gray-500 truncate font-medium">{employee.role}</p>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center pt-8 pb-32 overflow-y-auto custom-scrollbar">
      
      {/* CEO Node */}
      <div className="flex flex-col items-center relative z-10">
        <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center font-bold text-gray-900 shadow-md">
              CEO
            </div>
            <div className="pr-2">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">You</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{data.businessName} Founder</p>
            </div>
          </div>
        </div>
        
        {/* Main Trunk Line */}
        <div className="w-px h-12 bg-gray-300"></div>
      </div>

      {/* Departments Container */}
      <div className="flex flex-wrap justify-center gap-12 max-w-7xl px-8 relative">
        
        {/* Horizontal connecting line */}
        {data.departments.length > 0 && (
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gray-300"></div>
        )}

        {data.departments.map((dept, index) => {
          // Simplistic logic: first employee is leader, rest are specialists
          const leader = dept.employees[0];
          const specialists = dept.employees.slice(1);

          return (
            <div key={dept.id} className="flex flex-col items-center relative min-w-[280px]">
              {/* Stem to horizontal line */}
              <div className="w-px h-6 bg-gray-300 absolute -top-6"></div>
              
              {/* Department Label */}
              <div className="mb-4 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3 text-indigo-600" />
                {dept.name}
              </div>

              {leader ? (
                <>
                  <div className="w-full relative z-10 flex justify-center">
                    <EmployeeCard employee={leader} isLeader={true} />
                  </div>
                  
                  {specialists.length > 0 && (
                    <>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="w-full flex flex-col items-center gap-3 relative border-l-2 border-gray-100 pl-6 ml-6">
                        {specialists.map(specialist => (
                          <div key={specialist.id} className="relative w-full flex justify-center">
                            <div className="absolute -left-6 top-1/2 w-6 h-0.5 bg-gray-100"></div>
                            <EmployeeCard employee={specialist} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500 italic p-4 bg-white rounded-xl border border-gray-100 border-dashed">
                  No agents hired in {dept.name}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Floaters (No department) */}
        {data.floaters.length > 0 && (
          <div className="flex flex-col items-center relative min-w-[280px]">
            <div className="w-px h-6 bg-gray-100 absolute -top-6"></div>
            <div className="mb-4 px-4 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-widest">
              Direct Reports
            </div>
            <div className="flex flex-col gap-4">
              {data.floaters.map(floater => (
                <div key={floater.id} className="relative z-10">
                  <EmployeeCard employee={floater} isLeader={true} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
