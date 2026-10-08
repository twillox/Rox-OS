'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Rocket, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingSelection() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] relative">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center space-y-8"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-600">R</span>
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Initializing Roxten OS</h1>
              <p className="text-gray-500 font-medium animate-pulse">Establishing secure connection...</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full flex flex-col items-center justify-center space-y-12"
          >
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Roxten AI-OS</span>
              </h1>
              <p className="text-lg text-gray-900/60 max-w-2xl mx-auto">
                You are about to deploy an autonomous AI workforce. How would you like to begin?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Existing Business */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/onboarding/existing-business')}
                className="group relative p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 space-y-6">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">Existing Business</h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Import your current company structure, inject your knowledge base, and hire specific AI agents to automate existing workflows.
                    </p>
                  </div>

                  <div className="pt-4 flex items-center text-sm font-bold text-indigo-600 group-hover:translate-x-2 transition-transform duration-300">
                    Configure AI Workforce <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </motion.button>

              {/* New Startup */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/onboarding/co-founder')}
                className="group relative p-8 rounded-3xl bg-white border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 space-y-6">
                  <div className="h-14 w-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Rocket className="w-6 h-6 text-purple-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-900 transition-colors">Startup Idea</h3>
                    <p className="text-gray-500 font-medium leading-relaxed">
                      Meet your AI Architect. Speak with JARVIS to refine your business blueprint and automatically build your initial AI organization.
                    </p>
                  </div>

                  <div className="pt-4 flex items-center text-sm font-bold text-purple-600 group-hover:translate-x-2 transition-transform duration-300">
                    Meet your AI Co-Founder <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
