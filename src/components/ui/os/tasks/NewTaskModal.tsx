import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, Target, Users, Clock, Tag } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: any) => Promise<void>;
  departments: any[];
  employees: any[];
}

export function NewTaskModal({ isOpen, onClose, onSubmit, departments, employees }: NewTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    departmentId: '',
    employeeId: '',
    dueDate: '',
    estimatedDuration: '',
    tags: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        departmentId: '',
        employeeId: '',
        dueDate: '',
        estimatedDuration: '',
        tags: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData]); // eslint-disable-line

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validate = () => {
    const newErrs: Record<string, string> = {};
    if (!formData.title.trim()) newErrs.title = 'Title is required';
    if (formData.title.length > 100) newErrs.title = 'Title too long';
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await onSubmit(formattedData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full bg-white/50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-sm shadow-sm";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100/50 bg-white/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" /> New Task
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Assign work across the AI workforce</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form id="new-task-form" onSubmit={handleSubmit} className="space-y-5">
              
              {/* Title */}
              <div>
                <label className={labelClasses}><Hash className="w-3.5 h-3.5" /> Task Title</label>
                <input 
                  ref={titleInputRef}
                  type="text"
                  placeholder="e.g. Optimize marketing campaign"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className={`${inputClasses} ${errors.title ? 'border-rose-300 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                />
                {errors.title && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className={labelClasses}>Description</label>
                <textarea 
                  placeholder="Provide context and instructions..."
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  className={`${inputClasses} min-h-[100px] resize-y`}
                />
              </div>

              {/* Grid properties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={e => handleChange('priority', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className={labelClasses}><Calendar className="w-3.5 h-3.5" /> Due Date</label>
                  <input 
                    type="date"
                    value={formData.dueDate}
                    onChange={e => handleChange('dueDate', e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}><Users className="w-3.5 h-3.5" /> Department</label>
                  <select 
                    value={formData.departmentId} 
                    onChange={e => handleChange('departmentId', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Any Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClasses}><Target className="w-3.5 h-3.5" /> Assignee</label>
                  <select 
                    value={formData.employeeId} 
                    onChange={e => handleChange('employeeId', e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Unassigned</option>
                    {employees
                      .filter(e => !formData.departmentId || e.departmentId === formData.departmentId)
                      .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className={labelClasses}><Clock className="w-3.5 h-3.5" /> Est. Duration</label>
                  <input 
                    type="text"
                    placeholder="e.g. 2 hours, 1 day"
                    value={formData.estimatedDuration}
                    onChange={e => handleChange('estimatedDuration', e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className={labelClasses}><Tag className="w-3.5 h-3.5" /> Tags</label>
                  <input 
                    type="text"
                    placeholder="Comma separated (e.g. core, q3)"
                    value={formData.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100/50 bg-gray-50/50 flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">
              <span className="hidden sm:inline">Press <kbd className="font-sans px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 shadow-sm">Ctrl</kbd> + <kbd className="font-sans px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500 shadow-sm">Enter</kbd> to save</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="new-task-form"
                disabled={isSubmitting}
                className="relative overflow-hidden group px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Create Task
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
