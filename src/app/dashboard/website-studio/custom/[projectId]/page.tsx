'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, MessageSquare, Paperclip, FileCheck2, Clock, Send } from 'lucide-react';

export default function CustomProjectDashboard() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetch(`/api/os/websites/custom?projectId=${params.projectId}`)
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setLoading(false);
      });
  }, [params.projectId]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full">Loading Project...</div>;
  }

  if (!project || project.error) {
    return <div className="p-8 flex items-center justify-center h-full text-red-500">Project not found.</div>;
  }

  const timeline = project.timeline || [];
  const messages = project.messages || [];

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar / Timeline */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/website-studio')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-gray-900">Custom Project</h1>
            <div className="text-xs font-medium text-amber-500 flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Designing Phase
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Project Timeline</h3>
          
          <div className="space-y-6">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative flex gap-4">
                {idx !== timeline.length - 1 && (
                  <div className={`absolute left-[11px] top-6 bottom-[-24px] w-0.5 ${step.status === 'completed' ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
                )}
                
                <div className="relative z-10 shrink-0 mt-0.5">
                  {step.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-indigo-600 bg-white" />}
                  {step.status === 'current' && <Circle className="w-6 h-6 text-indigo-600 fill-indigo-50 border-white border-2 rounded-full" />}
                  {step.status === 'pending' && <Circle className="w-6 h-6 text-gray-300 bg-white" />}
                </div>
                
                <div className="flex-1 pb-2">
                  <div className={`text-sm font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</div>
                  <div className={`text-xs ${step.status === 'pending' ? 'text-gray-300' : 'text-gray-500'}`}>{step.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Project Overview</h2>
                <p className="text-sm text-gray-500">Your dedicated development team is currently reviewing requirements and preparing initial design mockups.</p>
              </div>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?u=dev" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Developer" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Alex Chen</div>
                  <div className="text-xs text-gray-500">Lead Developer</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Discussion</h3>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-gray-50/30">
                  {messages.length === 0 ? (
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mr-8">
                      <div className="text-xs font-bold text-gray-900 mb-1">Alex Chen</div>
                      <div className="text-sm text-gray-600">Hi there! I've reviewed your requirements. I'll have the first set of Figma mockups ready for your approval by tomorrow.</div>
                      <div className="text-[10px] text-gray-400 mt-2">Just now</div>
                    </div>
                  ) : (
                    messages.map((msg: any, i: number) => (
                      <div key={i} className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm ${msg.sender === 'User' ? 'ml-8 bg-indigo-50 border-indigo-100' : 'mr-8'}`}>
                        <div className="text-xs font-bold text-gray-900 mb-1">{msg.sender}</div>
                        <div className="text-sm text-gray-600">{msg.content}</div>
                        <div className="text-[10px] text-gray-400 mt-2">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white">
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!messageInput.trim() || sendingMessage) return;
                      const msg = messageInput;
                      setMessageInput('');
                      setSendingMessage(true);
                      
                      try {
                        const res = await fetch('/api/os/websites/custom/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ projectId: project.id, message: msg })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setProject((prev: any) => ({ ...prev, messages: data.messages }));
                        }
                      } catch (err) {
                        console.error('Chat error:', err);
                      } finally {
                        setSendingMessage(false);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      disabled={sendingMessage}
                      placeholder={sendingMessage ? "Alex Chen is replying..." : "Type a message..."} 
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60" 
                    />
                    <button 
                      type="submit" 
                      disabled={sendingMessage || !messageInput.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4"><Paperclip className="w-4 h-4" /> Project Files</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">DOC</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Requirements.pdf</div>
                          <div className="text-xs text-gray-500">2.4 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4"><FileCheck2 className="w-4 h-4" /> Approvals Needed</h3>
                  <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <Clock className="w-8 h-8 text-gray-300 mb-2" />
                    <div className="text-sm font-bold text-gray-900">No pending approvals</div>
                    <div className="text-xs text-gray-500">We will notify you when mockups are ready.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
