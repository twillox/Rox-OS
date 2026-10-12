'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Building2, ChevronRight, CheckCircle2, Mic, MicOff, 
  Send, Globe, ArrowRight, Shield, Workflow, MessageSquare, 
  Mail, Calendar, Share2, FileText, Code2, Users, Bot, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface RecommendedAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  whySuitable: string;
  responsibilities: string[];
  systemPrompt?: string;
  selected?: boolean;
}

export default function CoFounderOnboarding() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth();

  // STAGES: 1. pitch -> 2. form -> 3. agents -> 4. integrations
  const [stage, setStage] = useState<'pitch' | 'form' | 'agents' | 'integrations'>('pitch');

  // Stage 1 Inputs (ASAP Pitch)
  const [founderName, setFounderName] = useState('');
  const [ideaPitch, setIdeaPitch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Jarvis Spoken Status
  const [jarvisSpokenMessage, setJarvisSpokenMessage] = useState<string>(
    "Hello! I am JARVIS, your AI Co-Founder. Tell me your name, and a quick two-line explanation of your startup idea."
  );

  // Stage 2 Inputs (Startup Details Form)
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology & AI');
  const [goals, setGoals] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Stage 3 Data (Agent Recommendations)
  const [suggestedAgents, setSuggestedAgents] = useState<RecommendedAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Stage 4 State & Saving
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);

  // TTS Voice helper for Jarvis
  const speakJarvis = (text: string) => {
    setJarvisSpokenMessage(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        // Select an English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('David')));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS playback skipped:', e);
      }
    }
  };

  // Initial greeting speech
  useEffect(() => {
    const timer = setTimeout(() => {
      speakJarvis("Hello! I am JARVIS, your AI Co-Founder. Tell me your name, and a quick two-line explanation of your startup idea.");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Web Speech Recognition Setup for Microphone Input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setIdeaPitch(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  // ==========================================
  // STEP 1 -> STEP 2 (Complete ASAP!)
  // ==========================================
  const handlePitchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // Auto-infer company name or set default
    let inferredName = '';
    const nameMatch = ideaPitch.match(/(?:called|named|startup is|company is)\s+([A-Za-z0-9\s]+?)(?:\.|,|\s+which|\s+that|$)/i);
    if (nameMatch && nameMatch[1]) {
      inferredName = nameMatch[1].trim();
    }

    if (inferredName) setCompanyName(inferredName);
    if (ideaPitch) setGoals(ideaPitch);

    // Prompt Jarvis to thank the user and show required fields
    const thankYouText = "Thank you for your time! Please fill out the required fields below to finalize your startup profile.";
    speakJarvis(thankYouText);

    // Transition smoothly to Step 2
    setStage('form');
  };

  // ==========================================
  // STEP 2 -> STEP 3 (Analyze & Suggest Agents)
  // ==========================================
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry.trim()) return;

    setIsLoadingAgents(true);
    setStage('agents');

    const analyzingText = `Analyzing ${companyName}... Formulating your custom autonomous AI workforce.`;
    speakJarvis(analyzingText);

    try {
      const res = await fetch('/api/os/onboarding/suggest-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          industry: industry.trim(),
          idea: ideaPitch || goals,
          goals: goals.trim()
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        const enriched = data.agents.map((a: any) => ({ ...a, selected: true }));
        setSuggestedAgents(enriched);

        const promptText = `Based on your startup idea in ${industry}, I have configured the specialized autonomous agents suitable for ${companyName}. Review your workforce below.`;
        speakJarvis(promptText);
      } else {
        throw new Error(data.error || 'Failed to suggest agents');
      }
    } catch (err: any) {
      console.warn('Agent suggestion error, using curated defaults:', err?.message);
      // Fallback agents
      setSuggestedAgents([
        {
          id: 'agent_1',
          name: 'Alex Mercer',
          role: 'Lead Systems Architect & CTO',
          department: 'Engineering',
          whySuitable: `Builds and automates your core product architecture and APIs for ${companyName}.`,
          responsibilities: ['Core Architecture', 'API Integrations', 'System Reliability'],
          selected: true
        },
        {
          id: 'agent_2',
          name: 'Sarah Jenkins',
          role: 'Growth Marketing & GTM Director',
          department: 'Marketing',
          whySuitable: `Executes your launch strategy, outbound user acquisition, and search positioning.`,
          responsibilities: ['Growth Funnels', 'Inbound SEO', 'Campaign Automation'],
          selected: true
        },
        {
          id: 'agent_3',
          name: 'Michael Torres',
          role: 'Sales & Client Outreach Specialist',
          department: 'Sales',
          whySuitable: `Identifies high-value prospects and automates outbound customer conversations.`,
          responsibilities: ['Pipeline Building', 'Deal Closing', 'Customer Qualification'],
          selected: true
        },
        {
          id: 'agent_4',
          name: 'Priya Sharma',
          role: 'Product Strategy & Customer Success Lead',
          department: 'Operations',
          whySuitable: `Gathers customer feedback and optimizes initial user onboarding.`,
          responsibilities: ['User Retention', 'Feedback Loops', 'Operational SOPs'],
          selected: true
        },
        {
          id: 'agent_5',
          name: 'Lucas Dupont',
          role: 'Runway & Financial Controller',
          department: 'Finance',
          whySuitable: `Maintains unit economics, tracks cash flow, and monitors operating margins.`,
          responsibilities: ['Runway Protection', 'Budget Allocation', 'Financial Forecasting'],
          selected: true
        }
      ]);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const toggleAgent = (index: number) => {
    setSuggestedAgents(prev => prev.map((ag, i) => i === index ? { ...ag, selected: !ag.selected } : ag));
  };

  // ==========================================
  // STEP 3 -> STEP 4 (Agent Confirmation -> App Integrations Suggestion)
  // ==========================================
  const handleProceedToIntegrations = () => {
    setStage('integrations');
    const integrationPitch = "Your AI workforce is provisioned! To ensure seamless communication and daily autonomous execution, I strongly recommend connecting your workplace apps now. Integrating tools like Slack, Gmail, Google Calendar, Notion, and LinkedIn allows your agents to handle communications, schedule meetings, and post updates automatically.";
    speakJarvis(integrationPitch);
  };

  // ==========================================
  // FINAL CREATION & ROUTING
  // ==========================================
  const handleFinalizeStartup = async (destination: 'dashboard' | 'integrations') => {
    setIsCreatingBusiness(true);

    try {
      const selectedAgents = suggestedAgents.filter(a => a.selected);
      const res = await fetch('/api/os/onboarding/create-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          industry: industry.trim(),
          goals: goals.trim() || ideaPitch,
          websiteUrl: websiteUrl.trim(),
          founderName: founderName.trim(),
          agents: selectedAgents.length > 0 ? selectedAgents : suggestedAgents,
          userId: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize startup');
      }

      const newBizId = data.businessId;
      setCreatedBusinessId(newBizId);

      // Set cookie client-side as well
      document.cookie = `businessId=${newBizId}; path=/; SameSite=Lax`;

      // Update Firestore client SDK
      if (user?.uid) {
        try {
          const { db } = await import('@/lib/firebase');
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'users', user.uid), {
            businessId: newBizId,
            onboardingCompleted: true
          });
        } catch (fbErr: any) {
          console.warn('Client user updateDoc fallback:', fbErr?.message);
        }
      }

      await refreshUserData();

      if (destination === 'integrations') {
        router.push('/dashboard/integrations');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      console.error('Error finalizing startup:', e);
      setIsCreatingBusiness(false);
      alert(e.message || 'Error initializing your startup. Please retry.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col min-h-[85vh] justify-center py-8 px-4">
      
      {/* Top JARVIS Hologram Header */}
      <div className="w-full mb-8 flex items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">JARVIS Core</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                AI Co-Founder
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium truncate max-w-md md:max-w-xl">
              {jarvisSpokenMessage}
            </p>
          </div>
        </div>

        {/* Stage Progress Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <span className={`px-2 py-1 rounded-md ${stage === 'pitch' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-gray-100'}`}>1. Pitch</span>
          <span>&rarr;</span>
          <span className={`px-2 py-1 rounded-md ${stage === 'form' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-gray-100'}`}>2. Profile</span>
          <span>&rarr;</span>
          <span className={`px-2 py-1 rounded-md ${stage === 'agents' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-gray-100'}`}>3. Agents</span>
          <span>&rarr;</span>
          <span className={`px-2 py-1 rounded-md ${stage === 'integrations' ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-gray-100'}`}>4. Apps</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ============================================================== */}
        {/* STAGE 1: RAPID PITCH TO JARVIS (COMPLETES ASAP!) */}
        {/* ============================================================== */}
        {stage === 'pitch' && (
          <motion.div 
            key="pitch"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-gray-200/90 rounded-3xl p-8 md:p-10 shadow-2xl shadow-purple-500/5 relative overflow-hidden"
          >
            <div className="relative z-10 space-y-8">
              
              <div className="text-center space-y-3 max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Rapid Startup Initialization
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Tell JARVIS Your Idea
                </h1>
                <p className="text-gray-500 text-sm md:text-base font-medium">
                  State your name and a brief two-line explanation of your startup idea. You can speak with voice or type below to proceed immediately.
                </p>
              </div>

              {/* Voice Orb Interaction */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative group cursor-pointer" onClick={toggleRecording}>
                  <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${isRecording ? 'bg-purple-500/50 scale-125 animate-pulse' : 'bg-purple-200/40'}`} />
                  <div className={`h-24 w-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isRecording 
                      ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-500/30 scale-110' 
                      : 'bg-white border-purple-200 text-purple-600 hover:border-purple-400 hover:shadow-lg'
                  }`}>
                    {isRecording ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-9 h-9" />}
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-gray-500">
                  {isRecording ? 'Listening... Speak your name & 2-line idea' : 'Click microphone to speak or type below'}
                </p>
              </div>

              {/* Quick Input Fields */}
              <form onSubmit={handlePitchSubmit} className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Your Name / Founder Name
                  </label>
                  <input 
                    type="text"
                    value={founderName}
                    onChange={e => setFounderName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    required
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white text-sm font-medium transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Startup Idea (2 Lines Explanation)
                  </label>
                  <textarea 
                    value={ideaPitch}
                    onChange={e => setIdeaPitch(e.target.value)}
                    placeholder="e.g. An AI-powered platform for B2B procurement that automates vendor negotiations, purchase orders, and supplier risk scoring in real time."
                    required
                    rows={3}
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white text-sm font-medium transition-all shadow-inner resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">
                    Fast track setup &bull; Completes in under 60 seconds
                  </p>

                  <button 
                    type="submit"
                    disabled={!founderName.trim() || !ideaPitch.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Submit Pitch & Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* STAGE 2: STARTUP DETAILS FORM (SAME AS EXISTING BUSINESS) */}
        {/* ============================================================== */}
        {stage === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            {/* Top Thank You Banner */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Thank you for your time, {founderName || 'Founder'}!
                </h4>
                <p className="text-xs text-gray-600 font-medium">
                  Please fill out the required startup details below. Website is completely optional.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Startup Details</h2>
                <p className="text-sm text-gray-500">Configure your business baseline so Jarvis can architect your AI workforce.</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Startup / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. NovaWave Labs"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white text-sm font-medium shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Industry Sector <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      placeholder="e.g. AI & SaaS, E-Commerce, HealthTech, FinTech"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white text-sm font-medium shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Core Goals & Vision for AI Workforce <span className="text-red-500">*</span>
                  </label>
                  <textarea 
                    value={goals}
                    onChange={e => setGoals(e.target.value)}
                    placeholder="Describe your primary milestones, target demographic, and what you want your autonomous agents to execute..."
                    required
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white text-sm font-medium shadow-inner resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Company Website</label>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">Optional Everywhere</span>
                    </div>
                    <input 
                      type="url"
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com (optional)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white text-sm font-medium shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">CEO / Founder Name</label>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">Optional</span>
                    </div>
                    <input 
                      type="text"
                      value={founderName}
                      onChange={e => setFounderName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white text-sm font-medium shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => setStage('pitch')}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    &larr; Back to Pitch
                  </button>

                  <button 
                    type="submit"
                    disabled={!companyName.trim() || !industry.trim()}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Analyze & Suggest AI Agents <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* STAGE 3: JARVIS SUGGESTS REQUIRED AGENTS SUITABLE FOR STARTUP */}
        {/* ============================================================== */}
        {stage === 'agents' && (
          <motion.div 
            key="agents"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            {isLoadingAgents ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="h-16 w-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                <h3 className="text-xl font-bold text-gray-900">JARVIS is Architecting Your Workforce...</h3>
                <p className="text-sm text-gray-500 max-w-md text-center">
                  Matching specialized autonomous roles, operational responsibilities, and system prompts tailored to {companyName || 'your startup'}.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                      <Check className="w-3.5 h-3.5" /> Tailored AI Workforce Ready
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Recommended Agents for {companyName}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                      JARVIS has identified the key operational agents suitable for your startup's domain in {industry}.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl self-start md:self-auto">
                    {suggestedAgents.filter(a => a.selected).length} of {suggestedAgents.length} Agents Selected
                  </span>
                </div>

                {/* Agents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                  {suggestedAgents.map((agent, idx) => (
                    <div 
                      key={agent.id || idx}
                      onClick={() => toggleAgent(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        agent.selected 
                          ? 'bg-purple-50/40 border-purple-300 shadow-sm' 
                          : 'bg-gray-50/60 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 leading-tight">{agent.name}</h4>
                              <p className="text-xs font-medium text-purple-700">{agent.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                              {agent.department}
                            </span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              agent.selected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'
                            }`}>
                              {agent.selected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed pt-1">
                          <span className="font-semibold text-gray-800">Why suitable: </span>
                          {agent.whySuitable}
                        </p>
                      </div>

                      {agent.responsibilities && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
                          {agent.responsibilities.map((resp, rIdx) => (
                            <span key={rIdx} className="text-[10px] font-medium bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
                              {resp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => setStage('form')}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    &larr; Back to Details
                  </button>

                  <button 
                    type="button"
                    onClick={handleProceedToIntegrations}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/20 flex items-center gap-2"
                  >
                    Deploy Workforce & Next: App Integrations <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* STAGE 4: APP INTEGRATIONS RECOMMENDATION & LAUNCH */}
        {/* ============================================================== */}
        {stage === 'integrations' && (
          <motion.div 
            key="integrations"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden space-y-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider">
                <Workflow className="w-3.5 h-3.5" /> High-Efficiency Autonomous Setup
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                Integrate Workplace Apps
              </h2>
              <p className="text-sm text-gray-600 max-w-2xl font-medium leading-relaxed">
                To unlock maximum productivity and communication, connect your everyday tools. Integrating these apps allows your AI agents to send emails, manage calendars, sync docs, and communicate directly with your team.
              </p>
            </div>

            {/* Integration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Google Workspace */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Google Workspace</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Gmail & Google Calendar</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Empower agents to draft and send client emails, process incoming messages, and schedule team meetings automatically.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommended for Sales & Ops
                  </span>
                  <a 
                    href="/api/integrations/google/connect" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Connect Google &rarr;
                  </a>
                </div>
              </div>

              {/* Slack */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Slack</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Real-Time Team Workspace</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Deploy AI agents into company channels to answer queries, summarize updates, and dispatch tasks in real time.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommended for Team Chat
                  </span>
                  <a 
                    href="/api/integrations/slack/connect" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Connect Slack &rarr;
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">LinkedIn</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Company Brand & Social</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Allow marketing agents to publish thought leadership articles, brand announcements, and monitor industry engagement.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommended for Brand Growth
                  </span>
                  <a 
                    href="/api/integrations/linkedin/connect" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Connect LinkedIn &rarr;
                  </a>
                </div>
              </div>

              {/* Notion */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Notion</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Docs, Wiki & SOPs</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Sync project documentation, employee SOPs, and product roadmaps between Roxten OS and Notion workspace.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommended for Knowledge
                  </span>
                  <a 
                    href="/api/integrations/notion/connect" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Connect Notion &rarr;
                  </a>
                </div>
              </div>

            </div>

            {/* Launch Call To Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button 
                type="button" 
                onClick={() => setStage('agents')}
                disabled={isCreatingBusiness}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                &larr; Back to Agents
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => handleFinalizeStartup('integrations')}
                  disabled={isCreatingBusiness}
                  className="flex-1 sm:flex-initial px-5 py-3 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  {isCreatingBusiness ? 'Finalizing...' : 'Go to Integrations Hub &rarr;'}
                </button>

                <button 
                  type="button"
                  onClick={() => handleFinalizeStartup('dashboard')}
                  disabled={isCreatingBusiness}
                  className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
                >
                  {isCreatingBusiness ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Company...
                    </>
                  ) : (
                    <>
                      Launch Command Center <Rocket className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function Rocket(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
