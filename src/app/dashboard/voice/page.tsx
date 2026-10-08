'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Settings, Save, Search, Volume2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceStudioPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [edgeVoices, setEdgeVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/os/workforce/employee').then(r => r.json()),
      fetch('/api/os/voice/list').then(r => r.json())
    ]).then(([empData, voiceData]) => {
       if (empData.employees) {
         const empMap = new Map<string, any>();
         empData.employees.forEach((e: any) => {
           if (e?.id && !empMap.has(e.id)) empMap.set(e.id, e);
         });
         const uniqueEmployees = Array.from(empMap.values());
         setEmployees(uniqueEmployees);
         if (uniqueEmployees.length > 0) {
           handleSelectEmployee(uniqueEmployees[0]);
         }
       }
       if (voiceData.voices) {
         setEdgeVoices(voiceData.voices);
       }
       setLoading(false);
    });
  }, []);

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmpId(emp.id);
    setFormData({
      voiceId: emp.voiceId || 'en-US-AriaNeural',
      gender: emp.gender || 'Female',
      accent: emp.accent || 'American',
      voiceSpeed: emp.voiceSpeed || 1.0,
      voicePitch: emp.voicePitch || 1.0,
      speakingStyle: emp.speakingStyle || emp.personality || 'Professional',
      temperature: emp.temperature || 0.7
    });
  };

  const getPercentageStr = (val: number) => {
    const diff = Math.round((val - 1) * 100);
    return diff >= 0 ? `+${diff}%` : `${diff}%`;
  };

  const handlePreview = async () => {
    if (activeAudioRef.current) {
       activeAudioRef.current.pause();
       activeAudioRef.current.src = "";
       activeAudioRef.current = null;
    }

    const empName = employees.find(e => e.id === selectedEmpId)?.name || "there";
    const text = `Hello, I'm ${empName}. This is my configured voice.`;

    try {
      const res = await fetch('/api/os/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           text,
           voice: formData.voiceId,
           pitch: getPercentageStr(formData.voicePitch),
           rate: getPercentageStr(formData.voiceSpeed)
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play();
        return;
      }
    } catch (e) {
      console.warn("Server TTS synthesize error, falling back to Web Speech", e);
    }

    // High fidelity fallback: Browser Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = formData.voiceSpeed || 1.0;
      utterance.pitch = formData.voicePitch || 1.0;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const match = voices.find(v => 
          (formData.voiceId && v.name.toLowerCase().includes(formData.voiceId.toLowerCase())) ||
          (formData.gender === 'Female' ? v.name.includes('Female') || v.name.includes('Zira') : v.name.includes('Male') || v.name.includes('David'))
        ) || voices[0];
        if (match) utterance.voice = match;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = async () => {
    if (!selectedEmpId) return;
    setIsSaving(true);
    
    // Also extract the gender and locale to save based on selected voice
    const voiceMeta = edgeVoices.find(v => v.ShortName === formData.voiceId);
    let extraData = {};
    if (voiceMeta) {
      extraData = {
        gender: voiceMeta.Gender,
        accent: voiceMeta.Locale
      };
    }

    const payload = { ...formData, ...extraData };

    try {
      await fetch(`/api/os/workforce/employee/${selectedEmpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setEmployees(prev => prev.map(e => e.id === selectedEmpId ? { ...e, ...payload } : e));
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#FAFAFA] text-gray-900">Loading Voice Studio...</div>;

  // Derive unique languages
  const uniqueLocales = Array.from(new Set(edgeVoices.map(v => v.Locale))).sort();
  
  const filteredVoices = edgeVoices.filter(v => {
    if (searchQuery && !v.FriendlyName.toLowerCase().includes(searchQuery.toLowerCase()) && !v.ShortName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterLang && !v.Locale.startsWith(filterLang)) return false;
    if (filterGender && v.Gender !== filterGender) return false;
    return true;
  });

  return (
    <div className="h-full w-full flex bg-[#FAFAFA] text-gray-900 overflow-hidden">
      
      {/* Sidebar: Employees */}
      <div className="w-80 border-r border-gray-100 bg-gray-50 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-white backdrop-blur-md">
          <h2 className="text-xl font-bold flex items-center gap-2"><Mic className="w-5 h-5 text-fuchsia-500" /> Voice Studio</h2>
          <p className="text-xs text-gray-500 mt-1">Manage AI employee voice profiles</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {employees.map((emp, idx) => (
            <button
              key={emp.id ? `${emp.id}-${idx}` : `v-emp-${idx}`}
              onClick={() => handleSelectEmployee(emp)}
              className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all border ${
                selectedEmpId === emp.id 
                  ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-gray-900' 
                  : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-gray-900 shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate">{emp.name}</p>
                <p className="text-[10px] uppercase tracking-wider">{emp.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Configuration */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
        {selectedEmpId ? (
          <div className="p-10 max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                  <Volume2 className="w-7 h-7 text-indigo-400" />
                  Neural Voice Configuration
                </h1>
                <p className="text-gray-500">Assign high-quality Microsoft Edge neural voices to your AI workforce.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handlePreview} className="px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium transition-all flex items-center gap-2 shadow-sm border border-gray-200">
                  <Play className="w-4 h-4" /> Preview
                </button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2">
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Parameters */}
              <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-fuchsia-400"/> Prosody</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Speed</span>
                      <span className="text-indigo-400">{formData.voiceSpeed}x</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" 
                      value={formData.voiceSpeed}
                      onChange={e => setFormData({...formData, voiceSpeed: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                      <span>Pitch</span>
                      <span className="text-indigo-400">{formData.voicePitch}x</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1" 
                      value={formData.voicePitch}
                      onChange={e => setFormData({...formData, voicePitch: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
                    Adjusting speed and pitch creates unique voice profiles even when using the same base neural voice.
                  </div>
                </div>
              </div>
              
              {/* Voice Info */}
              <div className="bg-gradient-to-br from-indigo-50 to-fuchsia-50 border border-indigo-100 rounded-3xl p-8 backdrop-blur-md">
                 <h3 className="text-lg font-bold mb-6 text-indigo-900">Active Profile</h3>
                 <div className="space-y-4">
                    <div className="bg-white/60 p-4 rounded-xl border border-white">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Assigned Voice</p>
                      <p className="font-semibold text-lg text-gray-900">{formData.voiceId}</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-xl border border-white flex justify-between">
                       <div>
                         <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Gender</p>
                         <p className="font-semibold text-gray-900">{formData.gender}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Locale</p>
                         <p className="font-semibold text-gray-900">{formData.accent}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Voice Catalog */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-md mb-20">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500"/> Voice Catalog</h3>
              
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select 
                  value={filterLang} 
                  onChange={e => setFilterLang(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 min-w-[150px]"
                >
                  <option value="">All Languages</option>
                  {uniqueLocales.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <select 
                  value={filterGender} 
                  onChange={e => setFilterGender(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* List */}
              <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {filteredVoices.map(voice => (
                  <div 
                    key={voice.ShortName}
                    onClick={() => setFormData({...formData, voiceId: voice.ShortName, gender: voice.Gender, accent: voice.Locale})}
                    className={`cursor-pointer border p-4 rounded-2xl transition-all ${
                      formData.voiceId === voice.ShortName 
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                        : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900">{voice.FriendlyName.split(' - ')[1] || voice.ShortName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        voice.Gender === 'Female' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {voice.Gender}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{voice.Locale} • {voice.VoiceTag?.VoicePersonalities?.[0] || 'Neural'}</p>
                  </div>
                ))}
                {filteredVoices.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-gray-400">No voices match your filters.</div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="m-auto text-center">
            <Mic className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Select an employee to configure their voice</p>
          </div>
        )}
      </div>
    </div>
  );
}
