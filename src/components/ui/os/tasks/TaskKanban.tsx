import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, LayoutList, GripVertical } from 'lucide-react';

interface TaskKanbanProps {
  tasks: any[];
  onUpdateStatus: (id: string, status: string) => void;
  onSelectTask: (task: any) => void;
}

export function TaskKanban({ tasks, onUpdateStatus, onSelectTask }: TaskKanbanProps) {
  const columns = [
    { id: 'PENDING', title: 'Pending', accent: 'bg-indigo-500' },
    { id: 'IN_PROGRESS', title: 'In Progress', accent: 'bg-blue-500' },
    { id: 'BLOCKED', title: 'Blocked', accent: 'bg-rose-500' },
    { id: 'COMPLETED', title: 'Completed', accent: 'bg-emerald-500' },
  ];

  // Minimal drag-and-drop support (UI only for visual, relies on quick actions for real state changes right now)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateStatus(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-6 h-[650px] overflow-x-auto custom-scrollbar pb-6 px-1">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        
        return (
          <div 
            key={col.id} 
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={handleDragOver}
            className="flex-1 min-w-[320px] flex flex-col bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 overflow-hidden shadow-sm relative group"
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${col.accent} opacity-50`} />

            <div className="p-5 border-b border-gray-100/50 bg-white/60 shadow-sm z-10 flex justify-between items-center sticky top-0 backdrop-blur-xl">
              <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2 uppercase">
                {col.title}
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-bold shadow-sm">{colTasks.length}</span>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              <AnimatePresence>
                {colTasks.map(task => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onSelectTask(task)}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                    className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all rounded-2xl flex flex-col group/card shadow-sm cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                    {/* Hover drag indicator */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-20 transition-opacity">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase border shadow-sm ${
                        task.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        task.priority === 'MEDIUM' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {task.priority || 'MEDIUM'}
                      </span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        {col.id === 'PENDING' && (
                          <button onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')} className="p-1.5 bg-white hover:bg-indigo-50 border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors shadow-sm" title="Start Task">
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(col.id === 'PENDING' || col.id === 'IN_PROGRESS') && (
                          <button onClick={() => onUpdateStatus(task.id, 'COMPLETED')} className="p-1.5 bg-white hover:bg-emerald-50 border border-gray-200 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors shadow-sm" title="Complete Task">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {col.id !== 'BLOCKED' && col.id !== 'COMPLETED' && (
                          <button onClick={() => onUpdateStatus(task.id, 'BLOCKED')} className="p-1.5 bg-white hover:bg-rose-50 border border-gray-200 rounded-lg text-gray-500 hover:text-rose-600 transition-colors shadow-sm" title="Mark Blocked">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight pr-4">{task.title}</h4>
                    {task.description && <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3">{task.description}</p>}
                    
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[10px] shadow-sm">
                          {task.employee?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-700 leading-none">{task.employee?.name || 'Unassigned'}</span>
                          {task.department && <span className="text-[9px] font-medium text-gray-400 leading-none mt-1">{task.department.name}</span>}
                        </div>
                      </div>
                      
                      {task.dueDate && (
                         <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                           {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                         </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
