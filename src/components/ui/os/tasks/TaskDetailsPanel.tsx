import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Tag, Clock, Activity, MessageSquare } from 'lucide-react';

interface TaskDetailsPanelProps {
  task: any | null;
  onClose: () => void;
  employees: any[];
  onUpdate: (id: string, updates: any) => void;
}

export function TaskDetailsPanel({ task, onClose, employees = [], onUpdate }: TaskDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Sync formData when task changes
  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        employeeId: task.employeeId || '',
        progress: task.progress || 0
      });
      setEditMode(false);
      setActiveTab('details');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, formData);
    setEditMode(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase border shadow-sm ${
                  task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                  task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {task.priority || 'MEDIUM'}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">
                  {task.status}
                </span>
              </div>
              {editMode ? (
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-indigo-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{task.title}</h2>
              )}
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-4 gap-6 border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'details' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}
            >
              Details
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}
            >
              History
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'details' && (
              <div className="space-y-6">
                
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Description
                  </h3>
                  {editMode ? (
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full min-h-[100px] bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 custom-scrollbar"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
                      {task.description || <span className="text-gray-400 italic">No description provided.</span>}
                    </p>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Assignee</div>
                    {editMode ? (
                      <select 
                        value={formData.employeeId} 
                        onChange={e => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp, idx) => <option key={emp.id ? `${emp.id}-${idx}` : `opt-${idx}`} value={emp.id}>{emp.name}</option>)}
                      </select>
                    ) : (
                      <div className="text-sm font-bold text-gray-900">{task.employee?.name || 'Unassigned'}</div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Created At</div>
                    <div className="text-sm font-bold text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Priority</div>
                    {editMode ? (
                      <select 
                        value={formData.priority} 
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none"
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    ) : (
                      <div className="text-sm font-bold text-gray-900">{task.priority || 'MEDIUM'}</div>
                    )}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Progress</div>
                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" min="0" max="100" 
                          value={formData.progress} 
                          onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})}
                          className="w-full"
                        />
                        <span className="text-xs font-bold w-8">{formData.progress}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{task.progress || 0}%</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                  <div className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">Task Created</div>
                      <div className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  {task.updatedAt !== task.createdAt && (
                    <div className="flex gap-4 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Last Updated</div>
                        <div className="text-xs text-gray-500">{new Date(task.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  {/* Real history would come from activity events if we fetched them */}
                  <div className="pt-4 text-center text-xs text-gray-400 italic">History tracking enabled in Timeline.</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditMode(true)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                  Edit Task
                </button>
                {task.status !== 'COMPLETED' && (
                  <button onClick={() => onUpdate(task.id, { status: 'COMPLETED' })} className="flex-1 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                    Mark Complete
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
