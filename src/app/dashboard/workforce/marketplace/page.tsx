'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Brain, BookOpen, CheckCircle, Shield, 
  Mic, Zap, FileText, Upload, Sliders, Play, Plus, X, Server, LayoutDashboard, Database, ArrowRight, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HiringConfig {
  templateId: string;
  name: string;
  role: string;
  department: string;
  tagline: string;
  
  personality: string;
  communicationStyle: string;
  humorLevel: number;
  confidenceLevel: number;
  formality: number;
  empathy: number;

  knowledgeDocs: number;
  knowledgeUrls: number;
  knowledgeItems: { type: 'text' | 'url', title: string, content: string }[];

  responsibilities: string[];
  goals: string[];
  kpis: string[];

  rulesGeneral: string[];
  permissions: { can: string[]; cannot: string[] };
  decisionBoundaries: string;
  behaviorRules: { condition: string; action: string }[];

  voiceId: string;
  integrations: string[];
}

const TEMPLATES = [
  { id: 'sales_exec', name: 'Sales Executive', role: 'Senior Sales Exec', dept: 'Sales', desc: 'Outbound sales and lead generation.', personality: 'Energetic' },
  { id: 'cs_agent', name: 'Customer Support Agent', role: 'Support Specialist', dept: 'Support', desc: 'Handles tickets and resolves customer issues.', personality: 'Empathetic' },
  { id: 'marketing_mgr', name: 'Marketing Manager', role: 'Marketing Lead', dept: 'Marketing', desc: 'Campaigns, copy, and brand strategy.', personality: 'Creative' },
  { id: 'hr_assistant', name: 'HR Assistant', role: 'HR Coordinator', dept: 'Human Resources', desc: 'Onboarding and internal communications.', personality: 'Friendly' },
  { id: 'finance_analyst', name: 'Finance Analyst', role: 'Financial Analyst', dept: 'Finance', desc: 'Reporting, forecasting, and budgets.', personality: 'Analytical' },
  { id: 'ops_manager', name: 'Operations Manager', role: 'Operations Lead', dept: 'Operations', desc: 'Process optimization and task management.', personality: 'Professional' },
  { id: 'exec_assistant', name: 'Executive Assistant', role: 'Executive Assistant', dept: 'General', desc: 'Scheduling, emails, and daily organization.', personality: 'Formal' },
  { id: 'ceo_advisor', name: 'CEO Advisor', role: 'Strategic Advisor', dept: 'Executive', desc: 'High-level strategy and market analysis.', personality: 'Leadership' },
  { id: 'custom', name: 'Custom Employee', role: 'Custom Role', dept: 'Custom', desc: 'Build an employee from scratch.', personality: 'Professional' },
];

const STEPS = [
  'Template Selection', 'Employee Identity', 'Personality Engine', 'Knowledge & Training', 
  'Responsibilities', 'Rules & Boundaries', 'Voice Configuration', 'Integrations', 'Review', 'Build & Deploy'
];

export default function HiringWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [createdEmployeeId, setCreatedEmployeeId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        let voices = window.speechSynthesis.getVoices().filter((v: any) => v.lang.startsWith('en'));
        if (voices.length === 0) voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const previewVoice = (e: React.MouseEvent, voice: any) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hello, I am ready to join your company. How can I assist you today?");
      utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const [config, setConfig] = useState<HiringConfig>({
    templateId: '', name: '', role: '', department: '', tagline: '',
    personality: 'Professional', communicationStyle: 'Formal',
    humorLevel: 50, confidenceLevel: 75, formality: 80, empathy: 60,
    knowledgeDocs: 0, knowledgeUrls: 0, knowledgeItems: [],
    responsibilities: ['Handle customer support', 'Manage CRM'], goals: ['Increase satisfaction'], kpis: ['Response time < 5m'],
    rulesGeneral: ['Never disclose confidential information', 'Never hallucinate'],
    permissions: { can: ['Access CRM', 'Send Emails'], cannot: ['Delete Company Data', 'Modify Financial Records'] },
    decisionBoundaries: 'Semi Autonomous',
    behaviorRules: [{ condition: 'customer is angry', action: 'Stay calm' }],
    voiceId: 'kokoro-af_bella',
    integrations: []
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 10));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  const updateConfig = (updates: Partial<HiringConfig>) => setConfig(prev => ({ ...prev, ...updates }));

  const startDeployment = async () => {
    setIsDeploying(true);
    setDeployLogs([]);
    
    const deploymentSteps = [
      'Initializing Identity...',
      'Injecting Personality...',
      'Training Company Knowledge...',
      'Applying Rules...',
      'Assigning Voice...',
      'Connecting Integrations...',
      'Generating Memory...',
      'Deploying Runtime...',
      'Synchronizing Company Brain...'
    ];

    for (let i = 0; i < deploymentSteps.length; i++) {
      await new Promise(r => setTimeout(r, 800)); // Cinematic delay
      setDeployLogs(prev => [...prev, deploymentSteps[i]]);
    }

    // Call API
    try {
      const galaxyRes = await fetch('/api/os/galaxy');
      const galaxy = await galaxyRes.json();
      
      const res = await fetch('/api/os/workforce/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateId: config.templateId || 'custom', 
          businessId: galaxy.id,
          customConfig: config 
        })
      });
      
      if (res.ok) {
        const emp = await res.json();
        setCreatedEmployeeId(emp.id);
        await new Promise(r => setTimeout(r, 500));
        setDeployLogs(prev => [...prev, 'Employee Successfully Hired.']);
        setTimeout(() => setDeploySuccess(true), 1000);
      } else {
        setDeployLogs(prev => [...prev, 'ERROR: Deployment Failed. Check API logs.']);
      }
    } catch (e) {
      setDeployLogs(prev => [...prev, 'ERROR: Network failure.']);
    }
  };

  // ----------------------------------------------------
  // STEP RENDERERS
  // ----------------------------------------------------

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Select Foundation Template</h2>
        <p className="text-gray-500 mt-2">Choose a baseline role to accelerate the onboarding process.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map(t => {
          const isCustom = t.id === 'custom';
          return (
          <div 
            key={t.id} 
            onClick={() => {
              updateConfig({ 
                templateId: t.id, 
                name: `Agent ${Math.floor(Math.random() * 1000)}`, 
                role: t.role, 
                department: t.dept, 
                personality: t.personality 
              });
              nextStep();
            }}
            className={`p-6 rounded-2xl border transition-all cursor-pointer group ${config.templateId === t.id ? 'bg-indigo-50 border-indigo-500 shadow-md' : isCustom ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-400 hover:shadow-md shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-indigo-400/50'}`}
          >
            <Users className={`w-8 h-8 mb-4 ${config.templateId === t.id ? 'text-indigo-600' : isCustom ? 'text-indigo-500' : 'text-gray-500 group-hover:text-indigo-600'}`} />
            <h3 className={`text-xl font-bold mb-1 ${isCustom ? 'text-indigo-900' : 'text-gray-900'}`}>{t.name}</h3>
            <p className="text-sm text-indigo-600 mb-3 font-semibold">{t.dept}</p>
            <p className="text-sm text-gray-500">{t.desc}</p>
          </div>
        )})}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Employee Identity</h2>
        <p className="text-gray-500 mt-2">Define the core identity of your new digital workforce member.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-5xl text-gray-900 shadow-2xl border border-indigo-500/30 overflow-hidden relative group cursor-pointer">
          <span className="relative z-10">{config.name ? config.name.charAt(0) : 'A'}</span>
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <Upload className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Employee Name</label>
          <input type="text" value={config.name} onChange={e => updateConfig({ name: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Alex Morgan" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Role / Designation</label>
          <input type="text" value={config.role} onChange={e => updateConfig({ role: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Senior Sales Manager" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Department</label>
          <input type="text" value={config.department} onChange={e => updateConfig({ department: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Sales" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Employee Tagline</label>
          <input type="text" value={config.tagline} onChange={e => updateConfig({ tagline: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder='e.g. "Turning conversations into revenue."' />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><Brain className="w-8 h-8 text-indigo-400" /> Personality Engine</h2>
        <p className="text-gray-500 mt-2">Tune the behavioral matrix that dictates how this agent interacts.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Core Archetype</label>
          <select value={config.personality} onChange={e => updateConfig({ personality: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
            <option className="bg-white">Professional</option>
            <option className="bg-white">Friendly</option>
            <option className="bg-white">Analytical</option>
            <option className="bg-white">Creative</option>
            <option className="bg-white">Leadership</option>
            <option className="bg-white">Energetic</option>
            <option className="bg-white">Empathetic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Communication Style</label>
          <select value={config.communicationStyle} onChange={e => updateConfig({ communicationStyle: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
            <option className="bg-white">Formal</option>
            <option className="bg-white">Direct</option>
            <option className="bg-white">Casual</option>
            <option className="bg-white">Persuasive</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-8 rounded-3xl space-y-8">
        {[
          { label: 'Formality', key: 'formality' as keyof HiringConfig },
          { label: 'Confidence', key: 'confidenceLevel' as keyof HiringConfig },
          { label: 'Empathy', key: 'empathy' as keyof HiringConfig },
          { label: 'Humor Level', key: 'humorLevel' as keyof HiringConfig }
        ].map(slider => (
          <div key={slider.label}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-400" /> {slider.label}</label>
              <span className="text-indigo-400 font-bold">{config[slider.key] as unknown as number}%</span>
            </div>
            <input 
              type="range" min="0" max="100" 
              value={config[slider.key] as unknown as number} 
              onChange={e => updateConfig({ [slider.key]: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const [knowledgeInput, setKnowledgeInput] = useState<{title: string, content: string}>({title: '', content: ''});
  const [knowledgeType, setKnowledgeType] = useState<'text'|'url'|null>(null);

  const handleAddKnowledge = () => {
    if (!knowledgeInput.title || !knowledgeInput.content || !knowledgeType) return;
    
    updateConfig({
       knowledgeItems: [...(config.knowledgeItems || []), { type: knowledgeType, title: knowledgeInput.title, content: knowledgeInput.content }],
       knowledgeDocs: knowledgeType === 'text' ? config.knowledgeDocs + 1 : config.knowledgeDocs,
       knowledgeUrls: knowledgeType === 'url' ? config.knowledgeUrls + 1 : config.knowledgeUrls,
    });
    setKnowledgeInput({title: '', content: ''});
    setKnowledgeType(null);
  };

  const renderStep4 = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><BookOpen className="w-8 h-8 text-indigo-400" /> Knowledge & Training</h2>
        <p className="text-gray-500 mt-2">Upload SOPs, FAQs, and documentation to inject into the agent's memory core.</p>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-3xl">
        <div className="flex gap-4 mb-6">
           <button onClick={() => setKnowledgeType('text')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${knowledgeType === 'text' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Raw Text / SOP</button>
           <button onClick={() => setKnowledgeType('url')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${knowledgeType === 'url' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Website URL</button>
        </div>

        {knowledgeType && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <input 
              type="text" 
              placeholder={knowledgeType === 'url' ? "e.g., Company Pricing Page" : "e.g., Refund Policy"}
              value={knowledgeInput.title}
              onChange={e => setKnowledgeInput({...knowledgeInput, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 font-medium"
            />
            {knowledgeType === 'url' ? (
              <input 
                type="url" 
                placeholder="https://example.com/pricing"
                value={knowledgeInput.content}
                onChange={e => setKnowledgeInput({...knowledgeInput, content: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 font-medium"
              />
            ) : (
              <textarea 
                placeholder="Paste the raw text content here..."
                value={knowledgeInput.content}
                onChange={e => setKnowledgeInput({...knowledgeInput, content: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-indigo-500 font-medium h-32"
              />
            )}
            <button 
              onClick={handleAddKnowledge}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Inject to Brain
            </button>
          </div>
        )}

        {config.knowledgeItems?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">Injected Knowledge Base</h4>
            {config.knowledgeItems.map((k, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm">
                 {k.type === 'url' ? <Database className="w-4 h-4 text-purple-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                 <span className="font-bold">{k.title}</span>
                 <span className="text-gray-400 truncate flex-1 pl-4">{k.content}</span>
                 <button onClick={() => {
                    const newItems = [...config.knowledgeItems];
                    newItems.splice(i, 1);
                    updateConfig({ 
                      knowledgeItems: newItems,
                      knowledgeDocs: k.type === 'text' ? config.knowledgeDocs - 1 : config.knowledgeDocs,
                      knowledgeUrls: k.type === 'url' ? config.knowledgeUrls - 1 : config.knowledgeUrls
                    });
                 }} className="text-gray-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center justify-around">
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">{config.knowledgeDocs || 0}</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Docs Injected</p>
        </div>
        <div className="h-12 w-px bg-gray-50"></div>
        <div className="text-center">
          <p className="text-4xl font-black text-gray-900">{config.knowledgeUrls || 0}</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Websites Injected</p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><FileText className="w-8 h-8 text-indigo-400" /> Responsibilities</h2>
        <p className="text-gray-500 mt-2">Define daily tasks, goals, and KPIs.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Responsibilities</h3>
          <ul className="space-y-3">
            {config.responsibilities.map((r, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> {r}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input type="text" placeholder="Add responsibility..." className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-500" onKeyDown={e => { if (e.key === 'Enter') updateConfig({ responsibilities: [...config.responsibilities, e.currentTarget.value] }); }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Objectives / Goals</h3>
            <ul className="space-y-2 mb-4">
              {config.goals.map((g, i) => <li key={i} className="text-sm text-gray-500">• {g}</li>)}
            </ul>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Target KPIs</h3>
            <ul className="space-y-2 mb-4">
              {config.kpis.map((k, i) => <li key={i} className="text-sm text-gray-500">• {k}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><Shield className="w-8 h-8 text-indigo-400" /> Rules & Boundaries</h2>
        <p className="text-gray-500 mt-2">Establish firm guardrails for autonomous operations.</p>
      </div>

      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
        <div>
          <h3 className="text-rose-600 font-bold mb-1">MANDATORY GENERAL RULES (Immutable)</h3>
          <ul className="text-sm text-rose-600 space-y-1">
            {config.rulesGeneral.map((r, i) => <li key={i}>• {r}</li>)}
            <li>• Never approve payments.</li>
            <li>• Always escalate critical issues.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Permissions (CAN)</h3>
          <ul className="space-y-2">
            {config.permissions.can.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-emerald-600 bg-emerald-900/20 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-medium text-sm">
                <CheckCircle className="w-4 h-4" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Restrictions (CANNOT)</h3>
          <ul className="space-y-2">
            {config.permissions.cannot.map((p, i) => (
              <li key={i} className="flex items-center gap-3 text-rose-600 bg-rose-900/20 border border-rose-500/20 px-4 py-2.5 rounded-xl font-medium text-sm">
                <X className="w-4 h-4" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded-3xl mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Decision Boundaries</h3>
        <select value={config.decisionBoundaries} onChange={e => updateConfig({ decisionBoundaries: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
          <option>Manual (Drafts only, requires approval)</option>
          <option>Semi Autonomous (Action within rules, escalate otherwise)</option>
          <option>Fully Autonomous (End-to-end execution)</option>
        </select>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><Mic className="w-8 h-8 text-indigo-400" /> Voice Configuration</h2>
        <p className="text-gray-500 mt-2">Select the voice identity for phone calls, meetings, and voice studio.</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {availableVoices.length > 0 ? availableVoices.map((voice, idx) => (
          <div 
            key={voice.voiceURI + idx}
            onClick={() => updateConfig({ voiceId: voice.voiceURI })}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${config.voiceId === voice.voiceURI ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.voiceId === voice.voiceURI ? 'bg-indigo-500 text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{voice.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{voice.lang}</p>
              </div>
            </div>
            <button onClick={(e) => previewVoice(e, voice)} className="p-3 bg-gray-50 hover:bg-white rounded-full transition-colors text-gray-900" title="Preview Voice">
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        )) : (
          <p className="text-gray-500 text-center py-8">Loading available voices...</p>
        )}
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3"><Zap className="w-8 h-8 text-indigo-400" /> App Integrations</h2>
        <p className="text-gray-500 mt-2">Connect this agent to external platforms to grant operational access.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'gmail', name: 'Gmail', icon: 'M' },
          { id: 'slack', name: 'Slack', icon: '#' },
          { id: 'hubspot', name: 'HubSpot', icon: 'H' },
          { id: 'stripe', name: 'Stripe', icon: '$' },
          { id: 'calendar', name: 'Calendar', icon: 'C' },
          { id: 'whatsapp', name: 'WhatsApp', icon: 'W' },
          { id: 'github', name: 'GitHub', icon: 'G' },
          { id: 'notion', name: 'Notion', icon: 'N' },
        ].map(app => {
          const isSelected = config.integrations.includes(app.id);
          return (
            <div 
              key={app.id}
              onClick={() => {
                if (isSelected) updateConfig({ integrations: config.integrations.filter(i => i !== app.id) });
                else updateConfig({ integrations: [...config.integrations, app.id] });
              }}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${isSelected ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${isSelected ? 'bg-indigo-500 text-gray-900' : 'bg-gray-100 text-gray-500'}`}>
                {app.icon}
              </div>
              <h3 className="font-bold text-gray-900">{app.name}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Review & Deploy</h2>
        <p className="text-gray-500 mt-2">Verify agent configurations before initializing deployment.</p>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-200 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Server className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center font-bold text-4xl text-indigo-400 border border-indigo-500/30">
              {config.name.charAt(0) || 'A'}
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900">{config.name}</h3>
              <p className="text-indigo-400 font-bold">{config.role} • {config.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Personality</span>
              <p className="text-gray-900 font-medium">{config.personality} + {config.communicationStyle}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Knowledge</span>
              <p className="text-gray-900 font-medium">{config.knowledgeDocs} Documents, {config.knowledgeUrls} Websites</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Autonomy</span>
              <p className="text-emerald-600 font-bold">{config.decisionBoundaries}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Voice Profile</span>
              <p className="text-gray-900 font-medium truncate max-w-[150px]" title={config.voiceId}>{config.voiceId.replace('kokoro-', '')}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Key Responsibilities</span>
            <ul className="text-sm text-gray-600 space-y-1">
              {config.responsibilities.slice(0,3).map((r,i) => <li key={i}>• {r}</li>)}
              {config.responsibilities.length > 3 && <li className="text-indigo-400 italic">+{config.responsibilities.length - 3} more</li>}
            </ul>
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 block">Active Integrations</span>
            <div className="flex gap-2">
              {config.integrations.length > 0 ? config.integrations.map(i => (
                <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 capitalize">{i}</span>
              )) : <span className="text-gray-500 text-sm">None</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep10 = () => {
    if (deploySuccess) {
      return (
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-32 h-32 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.4)]">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">Congratulations!</h1>
            <p className="text-xl text-emerald-600 font-medium mb-6">{config.name} has joined your organization.</p>
            <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
              He will work 24/7, follow company rules, collaborate with your team, and continuously contribute to business growth across all integrated systems.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => router.push(`/dashboard/workforce/employees/${createdEmployeeId}`)}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-gray-900 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" /> Open Employee Profile
            </button>
            <button 
              onClick={() => router.push(`/dashboard/voice`)}
              className="w-full sm:w-auto px-8 py-4 bg-gray-50 hover:bg-white/20 text-gray-900 font-bold rounded-xl transition-all border border-gray-200 flex items-center justify-center gap-2"
            >
              <Mic className="w-5 h-5" /> Start Voice Conversation
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center h-full min-h-[500px]">
        <div className="w-24 h-24 mb-12 relative">
          <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
          <div className="absolute inset-2 border-4 border-indigo-400/50 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 border-4 border-indigo-300 rounded-full animate-spin"></div>
        </div>
        
        <div className="w-full max-w-md bg-white border border-indigo-500/30 rounded-2xl p-6 font-mono text-sm h-64 overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(99,102,241,0.1)]">
          {deployLogs.map((log, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className={`mb-2 ${log.includes('Successfully') ? 'text-emerald-600 font-bold' : log.includes('ERROR') ? 'text-rose-600' : 'text-indigo-600'}`}
            >
              <span className="text-gray-600 mr-2">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
              {log}
            </motion.div>
          ))}
          <div ref={el => el?.scrollIntoView()} />
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] text-gray-800 overflow-hidden relative selection:bg-indigo-500/30">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[150px] opacity-20 bg-indigo-600" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-10 bg-purple-600" />
      </div>

      {/* Header Area */}
      {!isDeploying && (
        <div className="relative z-10 px-10 pt-10 pb-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <UserPlus className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hire Employee</h1>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-1">Creation Pipeline</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/workforce')} className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Progress Bar */}
      {!isDeploying && (
        <div className="relative z-10 px-10 py-4 border-b border-gray-200 bg-white backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step {step} of 9</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{STEPS[step-1]}</span>
          </div>
          <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: `${((step - 1) / 9) * 100}%` }}
              animate={{ width: `${(step / 9) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
            {step === 6 && renderStep6()}
            {step === 7 && renderStep7()}
            {step === 8 && renderStep8()}
            {step === 9 && renderStep9()}
            {step === 10 && renderStep10()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {!isDeploying && (
        <div className="relative z-10 px-10 py-6 border-t border-gray-200 bg-white backdrop-blur-xl flex items-center justify-between shrink-0">
          <button 
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl text-gray-900 font-bold disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          
          {step < 9 ? (
            <button 
              onClick={nextStep}
              className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => { nextStep(); startDeployment(); }}
              className="px-10 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-gray-900 font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Initialize Deployment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
