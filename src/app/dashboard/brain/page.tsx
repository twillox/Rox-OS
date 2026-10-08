'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Database, Search, Send, Activity, FileText, FileCode2, Info } from 'lucide-react';
import { KnowledgeUploader } from '@/components/ui/os/KnowledgeUploader';

export default function BrainDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [queryInput, setQueryInput] = useState('');
  const [queryActive, setQueryActive] = useState(false);
  const [queryHistory, setQueryHistory] = useState<{user: string, ai: string, sources?: string[], confidence?: number}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/os/brain?t=' + Date.now())
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
        // Trigger background intelligence check asynchronously
        fetch('/api/os/brain/analyze', { method: 'POST' }).catch(console.error);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [queryHistory, queryActive]);

  const handleQuery = async () => {
    if (!queryInput.trim() || queryActive) return;
    const q = queryInput;
    setQueryInput('');
    setQueryActive(true);
    setQueryHistory(prev => [...prev, { user: q, ai: 'Searching Company Brain...' }]);
    
    try {
      const res = await fetch('/api/os/brain/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const result = await res.json();
      
      setQueryHistory(prev => {
        const newH = [...prev];
        newH[newH.length - 1].ai = result.answer || 'I could not find an answer.';
        newH[newH.length - 1].sources = result.sources;
        newH[newH.length - 1].confidence = result.confidence;
        return newH;
      });
    } catch (e) {
      console.error(e);
      setQueryHistory(prev => {
        const newH = [...prev];
        newH[newH.length - 1].ai = 'Error querying the brain.';
        return newH;
      });
    }
    setQueryActive(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Synchronizing Brain...</p>
        </div>
      </div>
    );
  }

  const memories = data?.memories || [];
  const knowledge = data?.knowledge || [];
  const meetings = data?.meetings || [];
  const insights = data?.insights || [];
  const timelineEvents = data?.timelineEvents || [];
  const dna = data?.dna;

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="px-10 pt-10 pb-6 shrink-0 relative z-10 border-b border-gray-200 bg-white0 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              Company Brain
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              The centralized intelligence and memory of your entire organization.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <Database className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Memories</div>
                <div className="font-bold text-gray-900 leading-tight">{memories.length}</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Docs</div>
                <div className="font-bold text-gray-900 leading-tight">{knowledge.length}</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
              <Activity className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Events</div>
                <div className="font-bold text-gray-900 leading-tight">{timelineEvents.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-10 p-8 gap-8 max-w-[1400px] w-full mx-auto">
        
        {/* Left Column: Query Interface */}
        <div className="w-[500px] flex flex-col gap-4">
          <div className="flex-1 bg-white border border-gray-200 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-indigo-600" /> Query Brain
            </h2>
            <p className="text-xs text-gray-500 font-medium mb-4">Ask anything about company operations, past decisions, or employee knowledge.</p>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {queryHistory.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  Try asking: <br/>
                  <span className="text-indigo-600 font-medium block mt-3 text-sm cursor-pointer hover:underline" onClick={() => setQueryInput("What were the key decisions in the last meeting?")}>"What were the key decisions in the last meeting?"</span>
                  <span className="text-indigo-600 font-medium block mt-2 text-sm cursor-pointer hover:underline" onClick={() => setQueryInput("What are the current active missions?")}>"What are the current active missions?"</span>
                </div>
              )}
              {queryHistory.map((q, i) => (
                <div key={i} className="space-y-3">
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-none p-3.5 text-sm ml-8 text-right text-gray-700 shadow-sm">
                    {q.user}
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-none p-4 text-sm mr-8 text-indigo-900 whitespace-pre-wrap shadow-sm flex flex-col gap-3">
                    <div>{q.ai}</div>
                    {(q.sources?.length ?? 0) > 0 && (
                      <div className="pt-2 border-t border-indigo-100/50">
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Sources</div>
                        <ul className="text-xs text-indigo-700/80 space-y-1">
                          {q.sources?.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.confidence !== undefined && (
                      <div className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest text-right mt-1">
                        Confidence: {q.confidence}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 relative">
              <input 
                type="text"
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuery()}
                placeholder="Message the Company Brain..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-900 placeholder-gray-400 font-medium shadow-inner"
                disabled={queryActive}
              />
              <button 
                onClick={handleQuery}
                disabled={queryActive || !queryInput.trim()}
                className="absolute right-2 top-[22px] p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Data Streams */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4 pb-8">
          
          <div className="shrink-0">
            <KnowledgeUploader onComplete={() => window.location.reload()} />
          </div>

          {/* Company DNA Widget */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-100">
                  <Brain className="w-5 h-5 text-indigo-400" /> Company DNA
                </h3>
                {dna && <div className="text-[10px] px-2 py-1 bg-indigo-500/20 text-indigo-200 rounded-md uppercase font-bold tracking-widest border border-indigo-500/30">Verified</div>}
              </div>

              {!dna ? (
                <div className="text-sm text-indigo-200/70 italic flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" /> DNA is currently synthesizing from knowledge...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1">Core Mission</div>
                    <div className="text-sm font-medium text-white/90 leading-relaxed">{dna.mission}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Primary Objectives</div>
                      <ul className="space-y-1">
                        {dna.primaryObjectives?.slice(0, 3).map((obj: string, i: number) => (
                          <li key={i} className="text-xs text-white/80 flex items-start gap-1.5">
                            <span className="text-indigo-400 mt-0.5 opacity-50">▹</span>
                            <span className="leading-tight">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Core Values</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dna.coreValues?.slice(0, 4).map((val: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/5 font-medium whitespace-nowrap">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 shrink-0 h-[500px]">
            {/* Knowledge & Meetings */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-600" /> Knowledge Base
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {meetings.map((m: any) => (
                  <div key={m.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="text-[10px] text-indigo-600 uppercase tracking-widest font-bold mb-1">Meeting</div>
                    <div className="font-semibold text-sm text-gray-900">{m.topic}</div>
                  </div>
                ))}
                {knowledge.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="text-[10px] text-blue-600 uppercase tracking-widest font-bold mb-1">Document</div>
                    <div className="font-semibold text-sm text-gray-900">{doc.title}</div>
                  </div>
                ))}
                {meetings.length === 0 && knowledge.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No knowledge stored yet.</p>
                )}
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm">
              <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-600" /> Strategic Insights
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {insights.map((ins: any) => (
                  <div key={ins.id} className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-[10px] uppercase tracking-widest text-emerald-700">{ins.type}</div>
                      <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{ins.priority}</div>
                    </div>
                    <div className="font-bold text-sm text-gray-900 mb-1">{ins.title}</div>
                    <div className="text-xs text-gray-600 font-medium leading-relaxed">{ins.description}</div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No strategic insights generated yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Advanced / Memory Toggle (Progressive Disclosure) */}
          <details className="group">
            <summary className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors flex items-center gap-2 select-none">
              Raw Brain Memory (Advanced)
              <div className="h-px bg-gray-200 flex-1 ml-2 transition-colors group-hover:bg-gray-300" />
            </summary>
            <div className="mt-4 pt-2 space-y-2 h-[200px] overflow-y-auto custom-scrollbar">
               {memories.length === 0 ? (
                 <p className="text-gray-500 text-sm italic">No raw memory blocks stored. Upload a document to populate the brain.</p>
               ) : (
                 memories.map((mem: any) => (
                   <div key={mem.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex gap-4">
                     <div className="font-bold text-xs text-gray-500 w-1/3 truncate">{mem.title || mem.category || 'Memory Node'}</div>
                     <div className="text-xs text-gray-700 font-mono flex-1 truncate">{mem.content || mem.actionable || ''}</div>
                   </div>
                 ))
               )}
            </div>
          </details>
          
        </div>
      </div>
    </div>
  );
}
