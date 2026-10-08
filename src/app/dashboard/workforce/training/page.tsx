'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WorkforceTraining() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/os/system/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'KNOWLEDGE_CREATED',
          sender: 'CEO',
          intent: 'STATE_UPDATE',
          priority: 'high',
          payload: {
            title,
            content,
            tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            sourceType: 'TRAINING'
          }
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTitle('');
        setContent('');
        setTags('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="h-full w-full bg-[#FAFAFA] text-gray-900 overflow-auto pb-24">
      <div className="p-12 pb-8 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
          <Link href="/dashboard/workforce" className="hover:text-gray-900 transition-colors">Workforce</Link>
          <span>/</span>
          <span className="text-amber-400">Training & Knowledge</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-4">
          <BrainCircuit className="w-10 h-10 text-amber-400" />
          Training Hub
        </h1>
        <p className="text-gray-500 max-w-2xl text-lg">
          Upload standard operating procedures, documentation, and logic rules to immediately update your agents' intelligence.
        </p>
      </div>

      <div className="p-12 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-amber-400" />
            Ingest New Knowledge
          </h2>
          
          <form onSubmit={handleTrain} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Document Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Marketing Guidelines"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Knowledge Content (Text)</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the documentation here..."
                rows={8}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-amber-500/50 transition-colors custom-scrollbar"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Access Tags (Comma Separated)</label>
              <input 
                type="text" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. marketing, sales, leadership"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Agents with matching tags will automatically inherit this knowledge.</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              {success ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" /> Knowledge Ingested & Propagated!
                </div>
              ) : (
                <div />
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="bg-amber-500 text-black font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <FileText className="w-5 h-5" />}
                {loading ? 'Processing...' : 'Train Agents'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
