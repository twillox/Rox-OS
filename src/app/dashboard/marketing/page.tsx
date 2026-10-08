'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus, Search, Megaphone, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingHubPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: '', channels: '', targetAudience: '', budget: '' });

  useEffect(() => {
    fetch('/api/os/marketing')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.data);
        }
        setLoading(false);
      });
  }, []);

  const handleCreate = async () => {
    if (!newCampaign.name) return;
    const res = await fetch('/api/os/marketing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCampaign,
        channels: newCampaign.channels.split(',').map(c => c.trim())
      })
    });
    const data = await res.json();
    if (data.success) {
      setCampaigns([data.data, ...campaigns]);
      setIsCreating(false);
      setNewCampaign({ name: '', objective: '', channels: '', targetAudience: '', budget: '' });
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading Marketing Hub...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-rose-500" />
            Marketing Hub
          </h1>
          <p className="text-gray-500 text-lg">Autonomous campaign execution and audience targeting.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-gray-900 rounded-xl transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-white border border-gray-200 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Launch Autonomous Campaign</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Campaign Name" 
              value={newCampaign.name}
              onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-rose-500"
            />
            <input 
              type="text" 
              placeholder="Objective (e.g. Lead Generation)" 
              value={newCampaign.objective}
              onChange={e => setNewCampaign({...newCampaign, objective: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-rose-500"
            />
            <input 
              type="text" 
              placeholder="Channels (comma separated)" 
              value={newCampaign.channels}
              onChange={e => setNewCampaign({...newCampaign, channels: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-rose-500"
            />
            <input 
              type="text" 
              placeholder="Target Audience" 
              value={newCampaign.targetAudience}
              onChange={e => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-rose-500"
            />
            <input 
              type="number" 
              placeholder="Budget ($)" 
              value={newCampaign.budget}
              onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-rose-500"
            />
          </div>
          <div className="flex gap-4">
            <button onClick={handleCreate} className="px-6 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl font-bold transition-colors">
              Deploy Campaign
            </button>
            <button onClick={() => setIsCreating(false)} className="px-6 py-2 bg-white hover:bg-gray-50 rounded-xl font-bold transition-colors border border-gray-200">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-max">
        <AnimatePresence>
          {campaigns.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-gray-100 border-dashed rounded-3xl bg-white">
              <Megaphone className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Active Campaigns</h3>
              <p className="text-gray-500">Deploy a marketing campaign and let your AI marketers handle the rest.</p>
            </div>
          ) : (
            campaigns.map((campaign, idx) => (
              <motion.div 
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-600/20 border border-rose-500/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Status: <span className="text-rose-400 font-medium">{campaign.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">${campaign.budget.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Budget</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Objective</div>
                    <div className="text-sm font-medium">{campaign.objectives || 'Not set'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Target Audience</div>
                    <div className="text-sm font-medium">{campaign.audience || 'General'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500 italic">No channels configured</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
