'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Zap, Send, Plus, Check, CheckCheck } from 'lucide-react';

export default function CommunicationFeed() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTarget, setNewThreadTarget] = useState('');
  const [newThreadMsg, setNewThreadMsg] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, thrRes] = await Promise.all([
        fetch('/api/os/galaxy?t=' + Date.now()),
        fetch('/api/os/communication')
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        const allEmployees = empData?.departments?.flatMap((d: any) => d.employees) || [];
        const floaters = empData?.employees || [];
        const employeeMap = new Map<string, any>();
        [...allEmployees, ...floaters].forEach((emp: any) => {
          if (emp?.id && !employeeMap.has(emp.id)) {
            employeeMap.set(emp.id, emp);
          }
        });
        setEmployees(Array.from(employeeMap.values()));
      }
      
      if (thrRes.ok) {
        const thrData = await thrRes.json();
        setThreads(thrData);
        if (thrData.length > 0 && !activeThreadId) {
          setActiveThreadId(thrData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark thread as read
    if (activeThreadId) {
      fetch('/api/os/communication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activeThreadId })
      }).catch(console.error);
    }
  }, [threads, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeThreadId || isSending) return;
    
    setIsSending(true);
    const msg = messageInput;
    setMessageInput('');

    // Optimistic UI update
    const tempId = `temp_${Date.now()}`;
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          ActivityEvent: [...t.ActivityEvent, { id: tempId, actor: 'CEO', content: msg, eventType: 'MESSAGE', metadata: { status: 'CREATED' } }]
        };
      }
      return t;
    }));

    try {
      // Find the employee to respond (for MVP, we assume the thread is between CEO and the thread's assigned employee)
      // If thread employeeId is 'general', we could just log it. But let's try to pass the employeeId
      const targetEmp = activeThread.employeeId !== 'general' ? activeThread.employeeId : null;

      await fetch('/api/os/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activeThreadId, message: msg, actor: 'CEO', targetEmployeeId: targetEmp })
      });
      
      // Refresh to get AI response
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    setIsSending(false);
  };

  const handleStartThread = async () => {
    if (!newThreadMsg.trim() || !newThreadTarget || isSending) return;
    
    setIsSending(true);
    try {
      await fetch('/api/os/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newThreadMsg, actor: 'CEO', targetEmployeeId: newThreadTarget })
      });
      
      setShowNewThread(false);
      setNewThreadMsg('');
      setNewThreadTarget('');
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    setIsSending(false);
  };

  if (loading && threads.length === 0) {
    return <div className="p-8 text-gray-900">Loading Communications...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Company Communications</h1>
          <p className="text-gray-500 text-lg">Direct internal messaging and cross-department threads.</p>
        </div>
        <button 
          onClick={() => setShowNewThread(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-colors"
        >
          <Plus className="w-5 h-5" /> New Thread
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Thread List Sidebar */}
        <div className="w-80 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Active Threads
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {threads.map(thread => {
              const lastEvent = thread.ActivityEvent[thread.ActivityEvent.length - 1];
              const isActive = activeThreadId === thread.id;
              return (
                <div 
                  key={thread.id} 
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-colors ${isActive ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-gray-50 border-gray-100 hover:border-white/20'}`}
                >
                  <h4 className="text-sm font-bold text-gray-200 truncate">
                    {thread.employeeId === 'general' ? 'General Broadcast' : employees.find(e => e.id === thread.employeeId)?.name || 'Direct Thread'}
                  </h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 truncate w-[80%]">
                      {lastEvent ? `${lastEvent.actor}: ${lastEvent.content}` : 'No messages yet'}
                    </p>
                    {lastEvent?.actor === 'CEO' && lastEvent.metadata?.status && (
                      <span className="text-indigo-400">
                        {lastEvent.metadata.status === 'READ' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {threads.length === 0 && (
              <p className="text-sm text-gray-500 text-center mt-10">No active threads</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#FAFAFA] border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
          
          {showNewThread ? (
            <div className="absolute inset-0 z-20 bg-[#FAFAFA] p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Start New Thread</h2>
                <button onClick={() => setShowNewThread(false)} className="text-gray-500 hover:text-gray-900">Cancel</button>
              </div>
              <div className="max-w-xl space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Target Employee</label>
                  <select 
                    value={newThreadTarget}
                    onChange={e => setNewThreadTarget(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Message</label>
                  <textarea 
                    value={newThreadMsg}
                    onChange={e => setNewThreadMsg(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Type your message..."
                  />
                </div>
                <button 
                  onClick={handleStartThread}
                  disabled={!newThreadTarget || !newThreadMsg || isSending}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-bold rounded-xl"
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          ) : activeThread ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">
                  Thread: {activeThread.employeeId === 'general' ? 'General' : employees.find(e => e.id === activeThread.employeeId)?.name || 'Direct'}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <AnimatePresence>
                  {activeThread.ActivityEvent.map((msg: any) => {
                    const isCeo = msg.actor === 'CEO';
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${isCeo ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-gray-900 shadow-lg shrink-0 ${isCeo ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                          {msg.actor.charAt(0)}
                        </div>
                        
                        <div className={`max-w-[70%] flex flex-col ${isCeo ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">{msg.actor}</span>
                          </div>
                          
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            isCeo ? 'bg-emerald-900/20 border border-emerald-500/30 rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                          
                          {isCeo && msg.metadata?.status && (
                            <div className="mt-1 text-gray-400">
                              {msg.metadata.status === 'READ' ? (
                                <CheckCheck className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                  
                  {isSending && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-gray-900 shadow-lg shrink-0 bg-indigo-600">
                        AI
                      </div>
                      <div className="max-w-[70%] flex flex-col items-start">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-sm">Typing...</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-gray-200 rounded-tl-none flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                <input 
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSending || !messageInput.trim()}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-gray-900 rounded-xl flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-gray-200">
                <MessageSquare className="w-8 h-8 text-indigo-400/50" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Thread Selected</h3>
              <p className="text-sm text-gray-500 max-w-sm">Select an active thread from the sidebar or start a new conversation with your AI workforce.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
