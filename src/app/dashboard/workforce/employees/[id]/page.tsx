'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Mic, PhoneOff,
  BookOpen, Clock, Zap, Target, History, Users, Activity,
  Save, CheckCircle2, AlertCircle, Edit2, Plus
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useVoice } from '@/components/providers/VoiceProvider';
import { MOCK_INTEGRATIONS } from '@/lib/mock/integrations/data';

export default function EmployeeOffice() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [coworkers, setCoworkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('brain');
  
  const [agentApps, setAgentApps] = useState<any[]>([]);
  const [showAppSelector, setShowAppSelector] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { startCall, endCall, voiceState, activeEmployeeId } = useVoice();
  const isVoiceMode = voiceState !== 'idle' && activeEmployeeId === employee?.id;

  useEffect(() => {
    fetch(`/api/os/workforce/employee/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.employee) {
          setEmployee(data.employee);
          setEditForm({
            personality: data.employee.personality || '',
            responsibilities: Array.isArray(data.employee.responsibilities) ? data.employee.responsibilities.join('\n') : data.employee.responsibilities || '',
            goals: Array.isArray(data.employee.goals) ? data.employee.goals.join('\n') : data.employee.goals || '',
            decisionBoundaries: data.employee.decisionBoundaries || '',
            speakingStyle: data.employee.speakingStyle || '',
          });
          setActivities(data.activities || []);
          setKnowledge(data.knowledge || []);
          setCoworkers(data.coworkers || []);
          
          // Load agent integrations from local storage or set empty
          const savedAgentApps = localStorage.getItem(`agent_apps_${params.id}`);
          if (savedAgentApps) setAgentApps(JSON.parse(savedAgentApps));
        }
        setLoading(false);
      });
  }, [params.id]);

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      endCall();
    } else {
      startCall(employee.id, employee.name, employee.role);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/os/workforce/employee/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          responsibilities: editForm.responsibilities.split('\n').filter(Boolean),
          goals: editForm.goals.split('\n').filter(Boolean),
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setEmployee((prev: any) => ({ ...prev, ...updated }));
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium uppercase tracking-widest text-xs">Booting AI Runtime...</p>
      </div>
    </div>
  );
  
  if (!employee) return <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">Employee Not Found</div>;

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-[#0A0A0B] text-gray-100 selection:bg-indigo-500/30">
      
      {/* Ambient Office Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 bg-gradient-to-br ${employee.department?.name === 'Marketing' ? 'from-pink-600 to-purple-600' : employee.department?.name === 'Finance' ? 'from-emerald-600 to-teal-600' : 'from-indigo-600 to-blue-600'}`} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] opacity-10 bg-indigo-500" />
      </div>

      <AnimatePresence>
        {isVoiceMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center mb-16">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-8xl text-white shadow-[0_0_100px_rgba(99,102,241,0.6)] z-10 relative opacity-80 border-4 border-white/10">
                {employee.name.charAt(0)}
                {voiceState === 'speaking' && (
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-indigo-400"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Glassmorphic Header */}
      <div className="relative z-10 px-12 pt-14 pb-10 border-b border-white/5 bg-black/40 backdrop-blur-xl flex flex-col gap-8 md:flex-row items-start justify-between">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center font-bold text-5xl text-white shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
              <span className="relative z-10">{employee.name.charAt(0)}</span>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-gray-900 border border-emerald-500/50 text-emerald-400 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ONLINE
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-5xl font-black text-white tracking-tight">{employee.name}</h1>
              <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest border border-white/5 backdrop-blur-md">
                {employee.department?.name || 'General'}
              </span>
            </div>
            <p className="text-indigo-400 font-semibold text-xl mb-6">{employee.role}</p>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <Activity className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Mood</span>
                  <span className="text-gray-100 text-sm font-semibold">{employee.mood || 'Focused'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Autonomy</span>
                  <span className="text-gray-100 text-sm font-semibold">{employee.runtimeConfig?.autonomyLevel || 'High'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-4">
          <button 
            onClick={toggleVoiceMode} 
            className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 hover:scale-105 ${
              isVoiceMode
                ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                : 'bg-white text-black hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]'
            }`}
          >
            {isVoiceMode ? (
              <>
                <PhoneOff className="w-5 h-5" />
                End Voice Comms
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-indigo-600" />
                Direct Voice Comms
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-12 border-b border-white/10 bg-black/20 flex gap-8 backdrop-blur-xl">
            {[
              { id: 'brain', label: 'Brain & DNA', icon: BrainCircuit },
              { id: 'desk', label: 'Active Desk', icon: Clock },
              { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
              { id: 'relationships', label: 'Coworkers', icon: Users },
              { id: 'integrations', label: 'App Integrations', icon: Zap },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-5 flex items-center gap-2 border-b-2 transition-all ${
                    isActive 
                      ? 'border-indigo-400 text-white font-bold' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
            
            {/* BRAIN & DNA TAB */}
            {activeTab === 'brain' && (
              <div className="max-w-4xl space-y-8 pb-20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <BrainCircuit className="w-6 h-6 text-indigo-400" /> 
                      Core Intelligence & DNA
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">Define how this agent thinks, speaks, and acts within the company.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {saveSuccess && (
                      <span className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 animate-pulse">
                        <CheckCircle2 className="w-4 h-4" /> Saved Successfully
                      </span>
                    )}
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 font-bold transition-all text-sm"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-sm flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Edit DNA
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Personality */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" /> Personality & Persona
                    </h3>
                    {isEditing ? (
                      <textarea 
                        value={editForm.personality}
                        onChange={e => setEditForm({...editForm, personality: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[100px]"
                        placeholder="Define the core personality..."
                      />
                    ) : (
                      <p className="text-gray-300 leading-relaxed text-lg">{employee.personality || 'Standard professional AI.'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Responsibilities */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" /> Responsibilities
                      </h3>
                      {isEditing ? (
                        <textarea 
                          value={editForm.responsibilities}
                          onChange={e => setEditForm({...editForm, responsibilities: e.target.value})}
                          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition-all min-h-[150px]"
                          placeholder="One responsibility per line..."
                        />
                      ) : (
                        <ul className="space-y-3">
                          {(Array.isArray(employee.responsibilities) ? employee.responsibilities : [employee.responsibilities]).filter(Boolean).map((resp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                              <span className="leading-relaxed">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Goals */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-400" /> Operational Goals
                      </h3>
                      {isEditing ? (
                        <textarea 
                          value={editForm.goals}
                          onChange={e => setEditForm({...editForm, goals: e.target.value})}
                          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition-all min-h-[150px]"
                          placeholder="One goal per line..."
                        />
                      ) : (
                        <ul className="space-y-3">
                          {(Array.isArray(employee.goals) ? employee.goals : [employee.goals]).filter(Boolean).map((goal: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                              <span className="leading-relaxed">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Boundaries */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" /> Decision Boundaries
                    </h3>
                    {isEditing ? (
                      <textarea 
                        value={editForm.decisionBoundaries}
                        onChange={e => setEditForm({...editForm, decisionBoundaries: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition-all min-h-[100px]"
                        placeholder="Define strict limitations and boundaries..."
                      />
                    ) : (
                      <p className="text-gray-300 leading-relaxed bg-red-900/20 border border-red-500/20 p-4 rounded-xl text-lg">
                        {employee.decisionBoundaries || 'No specific boundaries defined.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DESK TAB */}
            {activeTab === 'desk' && (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-indigo-400" /> Live Activity & Tasks
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                  {activities.length > 0 ? (
                    <div className="space-y-6">
                      {activities.map((act) => (
                        <div key={act.id} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                            <Activity className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{act.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">No recent activity detected on this desk.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KNOWLEDGE TAB */}
            {activeTab === 'knowledge' && (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-indigo-400" /> Knowledge Access
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                   <p className="text-gray-300 leading-relaxed mb-6">
                      This agent has automatic read-access to all knowledge base documents tagged with <span className="font-bold text-indigo-400">"{employee.department?.name}"</span>. 
                   </p>
                   {knowledge.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {knowledge.map(k => (
                           <div key={k.id} className="p-4 bg-black/30 border border-white/5 rounded-xl">
                              <h4 className="font-bold text-white mb-1">{k.title}</h4>
                              <p className="text-xs text-gray-500">{k.department} • {k.tags?.join(', ') || 'General'}</p>
                           </div>
                        ))}
                     </div>
                   ) : (
                      <div className="p-6 bg-black/30 border border-white/5 rounded-xl text-center text-gray-400">
                         No specific knowledge documents found for this department.
                      </div>
                   )}
                </div>
              </div>
            )}

            {/* COWORKERS TAB */}
            {activeTab === 'relationships' && (
              <div className="max-w-4xl pb-20">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <Users className="w-6 h-6 text-indigo-400" /> Department Coworkers
                </h2>
                
                {coworkers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {coworkers.map((peer: any) => (
                      <div key={peer.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center font-bold text-2xl text-indigo-400 border border-indigo-500/30 shrink-0">
                            {peer.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{peer.name}</h3>
                            <p className="text-sm text-gray-400 font-medium">{peer.role} • {peer.department?.name || 'General'}</p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-[200px] bg-black/30 border border-white/5 rounded-xl p-3">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Current Task</span>
                          {peer.tasks && peer.tasks.length > 0 ? (
                             <p className="text-sm text-gray-200 truncate">{peer.tasks[0].title}</p>
                          ) : (
                             <p className="text-sm text-gray-500 italic">Idle - No active tasks.</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                           <button 
                             onClick={() => router.push(`/dashboard/workforce/employees/${peer.id}`)}
                             className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-all"
                           >
                             View Profile
                           </button>
                           <button 
                             onClick={() => {
                               // Start call with coworker instead
                               endCall(); // End current if any
                               setTimeout(() => {
                                 startCall(peer.id, peer.name, peer.role);
                               }, 300);
                             }}
                             className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-lg"
                           >
                             <Mic className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <Users className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-300 text-lg mb-2">No coworkers found.</p>
                    <p className="text-gray-500 max-w-md">This agent is currently the only one assigned to the {employee.department?.name} department.</p>
                  </div>
                )}
              </div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div className="max-w-4xl pb-20 relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                      <Zap className="w-6 h-6 text-indigo-400" /> App Integrations
                    </h2>
                    <p className="text-gray-400">Connect {employee.name} to external applications.</p>
                  </div>
                  <button 
                    onClick={() => setShowAppSelector(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Connection
                  </button>
                </div>
                
                {agentApps.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <Zap className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-300 text-lg mb-2">No apps connected.</p>
                    <p className="text-gray-500 max-w-md">Give this agent superpowers by linking external tools like Slack, Gmail, or Stripe.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agentApps.map(app => (
                      <div key={app.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4 group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                            {app.logoUrl ? <img src={app.logoUrl} alt={app.name} className="w-7 h-7 object-contain" /> : <Zap className="w-6 h-6 text-gray-400" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">{app.name}</h3>
                            <span className="text-xs font-bold px-2 py-1 bg-emerald-900/50 text-emerald-400 border border-emerald-500/20 rounded-md uppercase tracking-wider">Active</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 flex-1">{app.description}</p>
                        <button 
                          onClick={() => {
                            const newApps = agentApps.filter(a => a.id !== app.id);
                            setAgentApps(newApps);
                            localStorage.setItem(`agent_apps_${params.id}`, JSON.stringify(newApps));
                          }}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600/30 border border-red-500/20 text-red-400 font-bold rounded-xl transition-colors text-sm mt-2"
                        >
                          Remove Access
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* App Selector Modal */}
                {showAppSelector && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gray-900/50">
                        <h3 className="text-xl font-bold text-white">Select App to Connect</h3>
                        <button onClick={() => setShowAppSelector(false)} className="p-2 text-gray-400 hover:text-white rounded-full transition-colors">×</button>
                      </div>
                      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 gap-3">
                          {MOCK_INTEGRATIONS.map(integration => {
                            const isConnected = agentApps.some(a => a.id === integration.id);
                            return (
                              <button 
                                key={integration.id}
                                disabled={isConnected}
                                onClick={() => {
                                  const newApps = [...agentApps, integration];
                                  setAgentApps(newApps);
                                  localStorage.setItem(`agent_apps_${params.id}`, JSON.stringify(newApps));
                                  setShowAppSelector(false);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isConnected ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50 cursor-pointer'}`}
                              >
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                                  {integration.logoUrl ? <img src={integration.logoUrl} alt={integration.name} className="w-6 h-6 object-contain" /> : <Zap className="w-5 h-5 text-gray-400" />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-white">{integration.name}</h4>
                                  <p className="text-xs text-gray-400 line-clamp-1">{integration.description}</p>
                                </div>
                                {isConnected && <span className="text-xs font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-md">Connected</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
