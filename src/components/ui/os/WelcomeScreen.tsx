'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, Settings } from 'lucide-react';
import { useVoice } from '@/components/providers/VoiceProvider';

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [stage, setStage] = useState<'particles' | 'greeting' | 'briefing'>('particles');
  const { startCall, voiceState, stopSpeaking, simulateAIResponse } = useVoice();
  const [hasStartedJarvis, setHasStartedJarvis] = useState(false);
  const [briefing, setBriefing] = useState<{points: string[], spokenScript: string} | null>(null);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome_v1');
    if (hasSeenWelcome) return;
    
    setIsVisible(true);
    sessionStorage.setItem('hasSeenWelcome_v1', 'true');

    fetch('/api/os/brain/briefing')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.summary) setBriefing(data.summary);
      })
      .catch(() => {});

    setTimeout(() => setStage('greeting'), 2000);
    setTimeout(() => {
      setStage('briefing');
      checkAutoSpeak();
    }, 4500);
  }, []);

  useEffect(() => {
     // Close welcome screen when JARVIS finishes speaking if we started him here
     if (hasStartedJarvis && voiceState === 'idle') {
         setTimeout(() => setIsVisible(false), 2000);
     }
  }, [voiceState, hasStartedJarvis]);

  const checkAutoSpeak = () => {
    const autoSpeak = localStorage.getItem('autoSpeakBriefing');
    if (autoSpeak === 'true') {
      setTimeout(() => speakBriefing(), 500);
    }
  };

  const speakBriefing = async () => {
    setHasStartedJarvis(true);
    // Explicitly set the VoiceContext to JARVIS without triggering the initial 'greeting' API call.
    startCall('jarvis', 'JARVIS', 'System Intelligence', true);
    setTimeout(() => {
        simulateAIResponse(briefing?.spokenScript || "Good morning. I am finalizing the briefing.");
    }, 100);
  };

  const handleSkip = () => {
    stopSpeaking();
    setIsVisible(false);
  };

  const handleAlwaysSpeak = () => {
    localStorage.setItem('autoSpeakBriefing', 'true');
    speakBriefing();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
        className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Neural Particles Background */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Stage 1 & 2: Logo and Greeting */}
        <AnimatePresence mode="wait">
          {stage === 'greeting' && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-8 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-600">R</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Good Morning, CEO.
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 3: Briefing Card */}
        <AnimatePresence>
          {stage === 'briefing' && briefing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-2xl p-4"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-gray-100/50 to-transparent rounded-3xl blur-md" />
              <div className="relative bg-white/80 backdrop-blur-2xl border border-gray-200 rounded-3xl p-10 shadow-2xl flex flex-col max-h-[85vh]">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  JARVIS wants to brief you.
                </h3>
                
                <div className="overflow-y-auto custom-scrollbar pr-4 flex-1 mb-8 space-y-4">
                  {briefing.points.map((point, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 + 0.5 }}
                      className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <p className="text-gray-700 font-medium leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 shrink-0 mt-2">
                  {!hasStartedJarvis ? (
                    <>
                      <button 
                        onClick={() => speakBriefing()}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-gray-900 font-bold transition-all shadow-sm"
                      >
                        <Play className="w-5 h-5" /> Let JARVIS Speak
                      </button>
                      <button 
                        onClick={handleAlwaysSpeak}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold transition-all shadow-sm"
                      >
                        <Settings className="w-5 h-5" /> Always Speak Automatically
                      </button>
                      <button 
                        onClick={handleSkip}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-transparent hover:bg-gray-100 rounded-xl text-gray-500 font-bold transition-all"
                      >
                        <SkipForward className="w-5 h-5" /> Skip
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-4">
                      <div className="flex gap-1.5 items-center h-10">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ['20%', '100%', '20%'] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                            className="w-2 bg-indigo-600 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-indigo-600 font-bold tracking-widest uppercase">Speaking...</span>
                      <button 
                        onClick={handleSkip}
                        className="mt-4 px-8 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold text-gray-500 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
