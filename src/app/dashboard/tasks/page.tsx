'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Target, Plus, RefreshCw, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TaskOverview } from '@/components/ui/os/tasks/TaskOverview';
import { TaskFilters } from '@/components/ui/os/tasks/TaskFilters';
import { TaskKanban } from '@/components/ui/os/tasks/TaskKanban';
import { TaskDetailsPanel } from '@/components/ui/os/tasks/TaskDetailsPanel';
import { NewTaskModal } from '@/components/ui/os/tasks/NewTaskModal';

export default function TaskCenterPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '',
    departmentId: '',
    employeeId: '',
    status: '',
    priority: ''
  });

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (filters.departmentId) query.append('departmentId', filters.departmentId);
      if (filters.employeeId) query.append('employeeId', filters.employeeId);
      if (filters.status) query.append('status', filters.status);

      const [tasksRes, deptsRes, empsRes] = await Promise.all([
        fetch(`/api/os/tasks?${query.toString()}`),
        fetch('/api/os/departments'),
        fetch('/api/os/workforce/employee')
      ]);

      const [tasksJson, deptsJson, empsJson] = await Promise.all([
        tasksRes.json(),
        deptsRes.json(),
        empsRes.json()
      ]);

      if (tasksJson.success) setTasks(tasksJson.data);
      if (deptsJson.success) setDepartments(deptsJson.data);
      if (empsJson.success) setEmployees(empsJson.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Updates
  const updateTask = async (id: string, updates: any) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // If updating currently selected task in the panel
    if (selectedTask?.id === id) {
      setSelectedTask((prev: any) => ({ ...prev, ...updates }));
    }

    try {
      await fetch('/api/os/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
    } catch (e) {
      console.error(e);
      fetchData(); // Revert on failure
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/os/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.data, ...tasks]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runAiSuggestions = async () => {
    setIsSuggesting(true);
    setAiSuggestions([]);
    try {
      const res = await fetch('/api/os/tasks/ai-suggest');
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSuggesting(false);
  };

  // Filter tasks locally by search/priority since the backend handles the rest
  const visibleTasks = tasks.filter(t => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && t.priority !== filters.priority.toUpperCase()) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FAFAFA] flex flex-col p-6 lg:p-10 overflow-y-auto custom-scrollbar relative">
      
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-600" /> Task Center
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl">
            The operational hub of your company. Every decision, automation, and workforce action results in an executed task here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={runAiSuggestions}
            disabled={isSuggesting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSuggesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI Analyze Workflow
          </button>
          <button 
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* AI Suggestions Alert */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 relative z-10 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-lg border border-indigo-500/20"
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" /> Operational Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">{sug.type}</div>
                  <div className="text-sm font-bold text-white mb-2">{sug.title}</div>
                  <p className="text-xs text-indigo-100/80 leading-relaxed">{sug.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <TaskOverview tasks={tasks} />
        
        <TaskFilters 
          filters={filters} 
          setFilters={setFilters} 
          departments={departments} 
          employees={employees} 
        />

        <TaskKanban 
          tasks={visibleTasks} 
          onUpdateStatus={(id, status) => updateTask(id, { status })} 
          onSelectTask={setSelectedTask} 
        />
      </div>

      {/* Side Panel Details */}
      <TaskDetailsPanel 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        employees={employees}
        onUpdate={updateTask}
      />

      <NewTaskModal 
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        departments={departments}
        employees={employees}
      />

    </div>
  );
}
