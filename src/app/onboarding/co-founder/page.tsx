'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Building2, ChevronRight, CheckCircle2, Mic, MicOff, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useVoice } from '@/components/providers/VoiceProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CoFounderOnboarding() {
  const router = useRouter();
  const { startCall, voiceState, history, endCall, isMuted, toggleMute, handleVoiceInput } = useVoice();
  const { user, refreshUserData } = useAuth();
  
  const [stage, setStage] = useState<'intro' | 'interview' | 'generating' | 'complete'>('intro');
  const [orgChart, setOrgChart] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, stage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleReady = () => {
      endCall();
      setStage('generating');
      setTimeout(() => {
        // Send the history (with the final ready message) to generate
        generateBusiness(history);
      }, 3000);
    };

    window.addEventListener('roxten_onboarding_ready', handleReady);
    return () => {
      window.removeEventListener('roxten_onboarding_ready', handleReady);
    };
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

  const startInterview = () => {
    setStage('interview');
    // Start a voice call with JARVIS using the specific onboarding endpoint.
    // skipGreeting is set to false so JARVIS initiates the conversation!
    startCall('jarvis', 'JARVIS', 'System Intelligence', false, '/api/os/onboarding/chat');
  };

  const generateBusiness = async (finalMessages: any[]) => {
    try {
      const res = await fetch('/api/os/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages })
      });
      const data = await res.json();
      
      if (data.success && data.orgChart) {
        const { business, orgChart } = data;

        // Ensure user document has businessId to prevent redirect loops
        if (user?.uid && business?.id) {
          try {
            const { db } = await import('@/lib/firebase');
            const { doc, updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'users', user.uid), {
              businessId: business.id
            });
          } catch (usrErr: any) {
            console.warn('Co-founder client user updateDoc skipped (permission fallback):', usrErr?.message);
          }
        }
        
        document.cookie = `businessId=${business.id}; path=/`;
        await refreshUserData();
        
        setOrgChart(orgChart);
        setStage('complete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[85vh]">
      <AnimatePresence mode="wait">
        
        {/* INTRO STAGE */}
        {stage === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
              <div className="h-32 w-32 rounded-full border-2 border-purple-500/50 bg-white flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10" />
                <Sparkles className="w-12 h-12 text-purple-600" />
              </div>
            </div>
            
            <div className="space-y-4 max-w-xl">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Meet Your AI Co-Founder</h1>
              <p className="text-gray-900/60 text-lg leading-relaxed">
                I will architect your business plan, define your brand, and auto-provision your entire AI workforce based on a short voice interview.
              </p>
            </div>

            <button 
              onClick={startInterview}
              className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 hover:scale-105 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              Start Voice Interview <Mic className="w-5 h-5 ml-1" />
            </button>
          </motion.div>
        )}

        {/* INTERVIEW STAGE */}
        {stage === 'interview' && (
          <motion.div 
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${voiceState === 'speaking' ? 'bg-purple-500/50 opacity-100 animate-pulse' : 'opacity-0'}`} />
                  <div className="h-12 w-12 rounded-full bg-white border border-purple-200 flex items-center justify-center relative z-10 shadow-sm">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">JARVIS</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                    <span className="relative flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 ${voiceState === 'speaking' || voiceState === 'listening' ? 'animate-ping' : ''}`}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    {voiceState === 'speaking' ? 'Speaking...' : voiceState === 'listening' ? 'Listening...' : 'Thinking...'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-xl border transition-colors ${
                    isMuted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => endCall()}
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                  title="End Call"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
             {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6">
                   <div className="p-6 bg-purple-50 rounded-full">
                     <Mic className="w-12 h-12 text-purple-600" />
                   </div>
                   <p className="text-lg font-medium opacity-80">Start speaking or click below to begin the conversation...</p>
                   <button 
                     onClick={() => handleVoiceInput("Hello")}
                     className="px-8 py-3 bg-purple-600 text-white rounded-full font-bold shadow-lg hover:bg-purple-700 hover:scale-105 transition-all flex items-center gap-2"
                   >
                     Start Conversation
                   </button>
                </div>
              )}
              {history.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-sm' 
                      : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-100'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
               {isMuted ? "Microphone muted. Click the mic icon to resume." : "Speak naturally into your microphone."}
            </div>
          </motion.div>
        )}

        {/* GENERATING STAGE */}
        {stage === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Synthesizing Business Plan</h2>
              <p className="text-gray-500 font-medium">Drafting company structure, brand voice, and auto-provisioning AI workforce.</p>
            </div>
            
            <div className="w-64 space-y-4 pt-8">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Generating Executive Summary
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Defining Target Audience
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /> 
                Provisioning AI Departments
              </div>
            </div>
          </motion.div>
        )}

        {/* COMPLETE STAGE */}
        {stage === 'complete' && (
          <motion.div 
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="w-24 h-24 bg-green-50 border border-green-200 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-gray-900">Your AI Company is Ready</h2>
              <p className="text-gray-500 font-medium text-lg">We have successfully generated your business plan and hired your initial AI workforce.</p>
            </div>

            <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-gray-200/50">
              <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-wider text-center">Initial Org Chart</h4>
              <div className="flex flex-wrap justify-center gap-4">
                {orgChart?.map((emp: any) => (
                  <div key={emp.id} className={`px-4 py-3 rounded-xl border flex flex-col items-center gap-2 ${
                    emp.type === 'executive' 
                      ? 'bg-purple-50 border-purple-200 w-full mb-4 shadow-sm' 
                      : 'bg-gray-50 border-gray-200 w-[45%]'
                  }`}>
                    <span className={`font-bold ${emp.type === 'executive' ? 'text-purple-900' : 'text-gray-700'}`}>{emp.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
            >
              Enter Command Center <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
