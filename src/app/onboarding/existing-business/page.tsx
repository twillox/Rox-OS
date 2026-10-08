'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, UploadCloud, FileText, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ExistingBusinessOnboarding() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    goals: '',
    websiteUrl: ''
  });
  const [pipelineState, setPipelineState] = useState<{ status: string; progress: number; message: string } | null>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');

      // 1. Upload Files via server proxy and extract text
      const uploadedFiles: { name: string; url: string }[] = [];
      let combinedText = '';
      
      const tempId = user?.uid || Date.now().toString();

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `companies/${tempId}/knowledge/${file.name}`);

        const uploadRes = await fetch('/api/os/storage/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const { url, text } = await uploadRes.json();
        
        uploadedFiles.push({ name: file.name, url });
        if (text) combinedText += `\n\n--- Document: ${file.name} ---\n${text}`;
      }

      // 2. Start Intelligence Pipeline Background Job
      const processRes = await fetch('/api/os/onboarding/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          industry: formData.industry,
          goals: formData.goals,
          websiteUrl: formData.websiteUrl,
          extractedText: combinedText,
          userId: user?.uid || tempId
        })
      });

      if (!processRes.ok) {
        const text = await processRes.text();
        let errData;
        try { errData = JSON.parse(text); } catch { errData = { error: text }; }
        throw new Error(errData.error || 'Failed to start pipeline');
      }
      
      const { jobId } = await processRes.json();
      setPipelineState({ status: 'pending', progress: 0, message: 'Initializing pipeline...' });

      // 3. Poll for Pipeline Completion
      let businessId = null;
      while (true) {
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
        const statusRes = await fetch(`/api/os/onboarding/pipeline/status?jobId=${jobId}`);
        if (!statusRes.ok) continue;

        const job = await statusRes.json();
        setPipelineState({ status: job.status, progress: job.progress, message: job.message });

        if (job.status === 'completed') {
          businessId = job.businessId;
          break;
        } else if (job.status === 'error') {
          throw new Error(job.error || 'Pipeline failed');
        }
      }

      if (!businessId) throw new Error('No businessId returned from pipeline');

      // 4. Save Knowledge Base references to the newly created business
      for (const uf of uploadedFiles) {
        try {
          await addDoc(collection(db, 'knowledgeBase'), {
            businessId: businessId,
            title: uf.name,
            url: uf.url,
            createdAt: new Date().toISOString()
          });
        } catch (kbErr: any) {
          console.warn('Client knowledgeBase addDoc skipped (permission fallback):', kbErr?.message);
        }
      }

      // 5. Update the user's document using the Client SDK
      if (user?.uid) {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'users', user.uid), {
            businessId: businessId
          });
        } catch (usrErr: any) {
          console.warn('Client user updateDoc skipped (permission fallback):', usrErr?.message);
        }
      }

      document.cookie = `businessId=${businessId}; path=/`;
      await refreshUserData();
      // AuthProvider will automatically redirect to dashboard because userData.businessId is now set
    } catch (e) {
      console.error('Error in onboarding:', e);
      setIsProcessing(false);
      setPipelineState(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[85vh] justify-center relative">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SURVEY */}
        {step === 1 && !isProcessing && (
          <motion.div 
            key="survey"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-gray-200 rounded-3xl p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Building2 className="w-48 h-48 text-indigo-900" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl mb-4 text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Business Profile</h2>
                <p className="text-gray-500">Let's map out your current organization.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Company Name</label>
                  <input 
                    type="text" 
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Acme Corp"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Industry</label>
                  <input 
                    type="text" 
                    value={formData.industry}
                    onChange={e => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g. E-Commerce, Healthcare, SaaS"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors focus:bg-white shadow-inner"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Core Goal for AI Integration</label>
                  <textarea 
                    value={formData.goals}
                    onChange={e => setFormData({...formData, goals: e.target.value})}
                    placeholder="What do you want your AI workforce to achieve?"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none focus:bg-white shadow-inner"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Website</label>
                      <input 
                        type="url"
                        value={formData.websiteUrl}
                        onChange={e => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.companyName || !formData.industry}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: KNOWLEDGE UPLOAD */}
        {step === 2 && !isProcessing && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white border border-gray-200 rounded-3xl p-10 shadow-2xl shadow-indigo-500/5 relative overflow-hidden"
          >
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl mb-4 text-indigo-600">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Upload Knowledge</h2>
                <p className="text-gray-500">Provide SOPs, employee handbooks, or business plans for the Company Brain.</p>
              </div>

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="w-full h-48 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer group"
              >
                <UploadCloud className="w-10 h-10 text-indigo-300 group-hover:text-indigo-500 transition-colors mb-3" />
                <p className="text-sm font-semibold text-gray-700">Drag & drop files here</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT up to 50MB</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900">Queued Files</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-sm text-gray-700 truncate font-medium">{f.name}</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-500 font-bold hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleComplete}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Deploy AI Workforce
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROCESSING */}
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6" />
            <h3 className="text-xl font-bold text-gray-900">
              {pipelineState ? 'Initializing Company DNA' : 'Uploading Documents...'}
            </h3>
            <p className="text-gray-500 mt-2 text-center max-w-sm">
              {pipelineState ? pipelineState.message : 'Please wait while we establish your digital company.'}
            </p>
            {pipelineState && (
              <div className="w-64 h-2 bg-gray-100 rounded-full mt-6 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pipelineState.progress}%` }}
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                />
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
