'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Presentation, FileText, Send, CheckCircle2 } from 'lucide-react';
import { useMissionEngine } from '@/components/providers/MissionEngineProvider';

interface Employee {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
}

export default function AIBoardroom() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  
  // Meeting Setup State
  const [topic, setTopic] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  
  // Active Meeting State
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [transcript, setTranscript] = useState<{speaker: string, text: string, id: string}[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [ceoInput, setCeoInput] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Fetch employees
  useEffect(() => {
    fetch('/api/os/galaxy?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        const allEmployees = data?.departments?.flatMap((d: any) => d.employees) || [];
        const floaters = data?.employees || [];
        const employeeMap = new Map<string, any>();
        [...allEmployees, ...floaters].forEach((emp: any) => {
          if (emp?.id && !employeeMap.has(emp.id)) {
            employeeMap.set(emp.id, emp);
          }
        });
        setEmployees(Array.from(employeeMap.values()));
        setLoadingEmployees(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingEmployees(false);
      });
  }, []);

  const toggleParticipant = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length < 4) setSelectedIds([...selectedIds, id]);
    }
  };

  const startMeeting = async () => {
    if (!topic || selectedIds.length === 0) return;
    
    try {
      const res = await fetch('/api/os/boardroom/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, participantIds: selectedIds })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMeetingId(data.id);
        setIsMeetingActive(true);
        triggerNextTurn(data.id, selectedIds[0]); // Start with the first participant
      }
    } catch (e) {
      console.error(e);
    }
  };

  // State ref to prevent double-firing in strict mode
  const turnInProgress = useRef(false);

  const triggerNextTurn = async (mId: string, currentSpeakerId: string) => {
    if (turnInProgress.current) return;
    turnInProgress.current = true;
    setActiveSpeakerId(currentSpeakerId);
    
    try {
      const res = await fetch('/api/os/boardroom/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId: mId, speakerId: currentSpeakerId })
      });
      const data = await res.json();
      
      if (res.ok) {
        setTranscript(prev => [...prev, { speaker: data.speaker, text: data.text, id: data.id }]);
      }
    } catch (e) {
      console.error(e);
    }
    
    setActiveSpeakerId(null);
    turnInProgress.current = false;
  };

  const submitCeoMessage = async () => {
    if (!ceoInput.trim() || !meetingId) return;
    
    const msg = ceoInput;
    setCeoInput('');
    setTranscript(prev => [...prev, { speaker: 'CEO', text: msg, id: `ceo_${Date.now()}` }]);
    
    try {
      await fetch('/api/os/boardroom/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, speakerId: 'ceo', ceoMessage: msg })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Cycle to next speaker manually for this MVP
  const handleNextSpeaker = (id: string) => {
    if (meetingId) triggerNextTurn(meetingId, id);
  };

  const { pipeline } = useMissionEngine();

  const endMeeting = async () => {
    if (!meetingId) return;
    setIsSummarizing(true);
    setIsMeetingActive(false);
    
    try {
      const res = await fetch(`/api/os/boardroom/${meetingId}/summarize`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setDecisions(data.result.decisions || []);
        
        setSummary('Meeting concluded. Decisions generated below.');
      }
    } catch (e) {
      console.error(e);
    }
    setIsSummarizing(false);
  };

  const approveDecision = async (id: string) => {
    try {
      const res = await fetch(`/api/os/boardroom/decisions/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setDecisions(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED' } : d));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loadingEmployees) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Boardroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Presentation className="w-8 h-8 text-indigo-600" />
            AI Boardroom
          </h1>
          <p className="text-gray-500 text-base font-medium mt-2">Real-time collaborative strategy across AI departments</p>
        </div>
        {isMeetingActive && (
          <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-700 font-bold text-xs tracking-widest uppercase">Live Session</span>
          </div>
        )}
      </div>

      {!meetingId && !summary && (
        <div className="max-w-2xl bg-white border border-gray-200 p-10 rounded-3xl mx-auto mt-6 shadow-sm w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Create New Board Meeting</h2>
          
          <div className="mb-8">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Meeting Topic / Agenda</label>
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Q4 Strategy, resolving marketing budget blockages..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-inner"
            />
          </div>

          <div className="mb-10">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Invite Participants (Max 4)</label>
            <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
              {employees.map((emp, idx) => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                  <div 
                    key={emp.id ? `${emp.id}-${idx}` : `meet-emp-${idx}`} 
                    onClick={() => toggleParticipant(emp.id)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-4 transition-all shadow-sm ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg shadow-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 truncate max-w-[110px]">{emp.name}</h4>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate max-w-[110px] mt-0.5">{emp.role}</p>
                    </div>
                  </div>
                )
              })}
              {employees.length === 0 && (
                <div className="col-span-2 p-10 border border-gray-200 bg-gray-50 border-dashed rounded-3xl flex flex-col items-center justify-center text-center">
                  <Users className="w-10 h-10 text-gray-500 mb-4" />
                  <p className="text-sm font-medium text-gray-500 mb-6">Your boardroom is empty. Hire some AI Executives to begin.</p>
                  <a href="/dashboard/workforce/marketplace" className="px-5 py-2.5 bg-indigo-60 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors border border-indigo-100 shadow-sm">
                    Go to Marketplace
                  </a>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={startMeeting}
            disabled={!topic || selectedIds.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-gray-900 font-bold rounded-xl transition-all shadow-sm"
          >
            Start Meeting
          </button>
        </div>
      )}

      {meetingId && (
        <div className="flex-1 flex gap-10 min-h-0">
          
          {/* Virtual Table */}
          <div className="flex-1 relative bg-white border border-gray-200 rounded-3xl p-10 flex flex-col shadow-sm">
            <h2 className="text-center font-bold text-2xl mb-10 text-gray-900">{topic}</h2>
            
            <div className="flex-1 relative flex items-center justify-center">
              <div className="absolute inset-10 border border-gray-100 rounded-[100px] bg-gray-50 shadow-inner flex items-center justify-center">
                <div className="text-center opacity-10">
                  <Users className="w-20 h-20 text-gray-500 mx-auto mb-4" />
                </div>
              </div>

              {/* Participants Grid / Circle approximation */}
              <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-16 z-10 pointer-events-none">
                {selectedIds.map(id => {
                  const emp = employees.find(e => e.id === id);
                  if (!emp) return null;
                  const isSpeaking = activeSpeakerId === id;
                  return (
                    <motion.div 
                      key={id}
                      animate={isSpeaking ? { scale: 1.05 } : { scale: 1 }}
                      className={`relative flex flex-col items-center gap-4 p-5 rounded-3xl bg-white/90 backdrop-blur-md border transition-all pointer-events-auto ${
                        isSpeaking ? 'border-indigo-300 shadow-lg ring-4 ring-indigo-50' : 'border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-3xl text-indigo-600 shadow-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-gray-900 text-base">{emp.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mt-1">{emp.role}</p>
                      </div>
                      
                      {isMeetingActive && !activeSpeakerId && (
                        <button 
                          onClick={() => handleNextSpeaker(id)}
                          className="mt-3 text-[10px] px-4 py-1.5 bg-gray-100 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg uppercase font-bold tracking-widest transition-colors border border-gray-200 hover:border-indigo-100 shadow-sm"
                        >
                          Request Input
                        </button>
                      )}
                      {isSpeaking && (
                        <div className="mt-3 px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                          Generating...
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
            
            {isMeetingActive && (
              <div className="mt-10 flex justify-center">
                <button 
                  onClick={endMeeting}
                  className="px-10 py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-colors border border-rose-200 shadow-sm"
                >
                  Conclude & Summarize
                </button>
              </div>
            )}
          </div>

          {/* Transcript Log */}
          <div className="w-[440px] flex flex-col gap-6">
            <div className="flex-1 bg-white border border-gray-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" /> Live Transcript
                </h3>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-white">
                {transcript.map((msg, idx) => (
                  <motion.div 
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{msg.speaker}</span>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none text-sm font-medium text-gray-700 leading-relaxed shadow-sm">
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {isMeetingActive && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                  <input 
                    type="text"
                    value={ceoInput}
                    onChange={e => setCeoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitCeoMessage()}
                    placeholder="CEO Input..."
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 shadow-inner transition-all"
                  />
                  <button onClick={submitCeoMessage} className="p-3 bg-indigo-600 text-gray-900 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {isSummarizing && (
              <div className="p-6 border border-emerald-200 bg-emerald-50 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-emerald-700 font-bold text-sm">Generating Executive Summary...</span>
              </div>
            )}
            
            {summary && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 overflow-y-auto max-h-[300px] custom-scrollbar shadow-sm"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-bold text-emerald-700 uppercase tracking-widest text-sm">Executive Summary</h3>
                </div>
                <div className="text-sm text-emerald-900 font-medium whitespace-pre-wrap leading-relaxed mb-6">
                  {summary}
                </div>
                <div className="flex flex-col gap-4">
                  {decisions.map((dec, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900">{dec.title}</h4>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                          dec.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {dec.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{dec.description}</p>
                      
                      {dec.status === 'DRAFT' && (
                        <button 
                          onClick={() => approveDecision(dec.id)}
                          className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Create Tasks
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
