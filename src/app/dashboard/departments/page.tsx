'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Layout, Plus, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function DepartmentsPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams?.get('highlight') || '';
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch('/api/os/departments').then(r => r.json()),
      fetch('/api/os/workforce/employee').then(r => r.json())
    ]).then(([deptData, empData]) => {
      if (deptData.success) setDepartments(deptData.data);
      if (empData.success) setEmployees(empData.employees);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/os/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newDeptName, 
          description: newDeptDesc,
          employeeIds: selectedEmployees
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setNewDeptName('');
        setNewDeptDesc('');
        setSelectedEmployees([]);
        loadData();
      } else {
        alert(data.error || 'Failed to create department');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            Company Departments
          </h1>
          <p className="text-gray-500 text-base font-medium">Organizational units and their deployed AI workforce.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-gray-900 rounded-xl transition-colors font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Department
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 auto-rows-max">
        <AnimatePresence>
          {departments.length === 0 ? (
            <div className="col-span-full p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50">
              <Layout className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Departments Founded</h3>
              <p className="text-gray-500 font-medium">Hire employees from the marketplace to establish departments.</p>
            </div>
          ) : (
            departments.map((dept, idx) => {
              const isFinance = dept.name.toLowerCase() === 'finance';
              const isHighlighted = highlight && (dept.name.toLowerCase() === highlight.toLowerCase() || (isFinance && highlight.toLowerCase().includes('financ')));

              return (
                <motion.div 
                  key={dept.id}
                  id={`dept-${dept.name.toLowerCase()}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isHighlighted ? 1.02 : 1 
                  }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white border rounded-3xl p-8 transition-all group flex flex-col relative ${
                    isHighlighted 
                      ? 'border-emerald-500 shadow-2xl shadow-emerald-500/25 ring-4 ring-emerald-400/40' 
                      : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3.5 left-8 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      AI Active Focus: Viewing {dept.name} Records
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isFinance ? 'bg-emerald-50 border border-emerald-100' : 'bg-indigo-50 border border-indigo-100'
                      }`}>
                        <Layout className={`w-6 h-6 ${isFinance ? 'text-emerald-600' : 'text-indigo-600'}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                        <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          {dept.employees.length} Active Employees
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
                      <Activity className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Real Financial Digits Display for Finance Department */}
                  {isFinance && (
                    <div className="mb-6 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 p-4 rounded-2xl border border-emerald-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Monthly Financial Overview</span>
                        <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">Live Digits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100/60 shadow-sm">
                          <span className="text-[10px] font-semibold text-gray-500 block">Monthly Revenue</span>
                          <span className="text-lg font-extrabold text-emerald-600">$185,000</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100/60 shadow-sm">
                          <span className="text-[10px] font-semibold text-gray-500 block">Monthly Expenses</span>
                          <span className="text-lg font-extrabold text-gray-800">$92,000</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs bg-white/60 p-2 rounded-xl">
                        <div className="flex justify-between text-gray-600">
                          <span>Net Margin:</span>
                          <span className="font-bold text-emerald-700">+50.2% (+$93k)</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Runway:</span>
                          <span className="font-bold text-emerald-700">18 Months</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 mb-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Workforce Roster</h4>
                    {dept.employees.length === 0 ? (
                      <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-center">No employees assigned to this department yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {dept.employees.slice(0, 5).map((emp: any, idx: number) => (
                          <div key={emp.id ? `${emp.id}-${idx}` : `dept-emp-${idx}`} className="flex justify-between items-center bg-gray-50 px-3.5 py-2.5 rounded-2xl border border-gray-100 group/emp hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 font-bold text-xs">
                                {emp.name.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-900 font-bold">{emp.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white border border-gray-200 shadow-sm px-2 py-0.5 rounded-md">{emp.role}</span>
                          </div>
                        ))}
                        {dept.employees.length > 5 && (
                          <div className="text-center text-xs font-bold text-indigo-600 pt-1 hover:text-indigo-700 cursor-pointer">
                            + {dept.employees.length - 5} more employees
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-3 border-t border-gray-100 mb-4">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Active Tasks</p>
                      <p className="text-lg font-bold text-gray-900">{dept.activeTaskCount || 0}</p>
                    </div>
                    <div className="w-px bg-gray-100"></div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Completed</p>
                      <p className="text-lg font-bold text-gray-900">{dept.completedTaskCount || 0}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3 pt-2">
                    <Link href={`/dashboard/workforce/marketplace?department=${encodeURIComponent(dept.name)}`} className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors text-center border border-indigo-100 shadow-sm">
                      Hire Talent
                    </Link>
                    <Link href={`/dashboard/departments/${dept.id}`} className="flex-1 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors text-center border border-gray-200 shadow-sm inline-block">
                      View Analytics
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Department</h2>
            <p className="text-gray-500 mb-6 text-sm">Establish a new organizational unit.</p>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Department Name</label>
                <input 
                  type="text" 
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Engineering, Sales, HR"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Description (Optional)</label>
                <input 
                  type="text" 
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Brief summary of department goals"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Assign Employees</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 space-y-1 custom-scrollbar">
                  {employees.filter(e => !e.departmentId).length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-3 text-center">No unassigned employees available.</p>
                  ) : (
                    employees.filter(e => !e.departmentId).map((emp, idx) => (
                      <label key={emp.id ? `${emp.id}-${idx}` : `emp-chk-${idx}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                        <input 
                          type="checkbox" 
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                            else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs font-bold">{emp.name.charAt(0)}</div>
                           <span className="text-sm font-semibold text-gray-900">{emp.name}</span>
                           <span className="text-[10px] text-gray-500 uppercase font-bold">{emp.role}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-gray-900 font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
