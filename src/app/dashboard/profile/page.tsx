'use client';

import React, { useState, useEffect } from 'react';
import { Building, Save, CheckCircle, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/os/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.data);
        } else {
          setProfile({
            name: '', industry: '', brandVoice: '', services: '', products: '', contactDetails: '', locations: ''
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/os/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading || !profile) {
    return <div className="h-full flex items-center justify-center">Loading Profile...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-500" />
            Business Profile
          </h1>
          <p className="text-gray-500 text-lg">Define the core identity of your company for the AI workforce.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-xl transition-colors font-bold disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
        <div className="max-w-4xl space-y-8">
          {/* General Information */}
          <section className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
              General Information
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={profile.name || ''}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Industry</label>
                <input 
                  type="text" 
                  value={profile.industry || ''}
                  onChange={e => setProfile({...profile, industry: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Brand Voice</label>
                <textarea 
                  value={profile.brandVoice || ''}
                  onChange={e => setProfile({...profile, brandVoice: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="e.g. Professional, authoritative, friendly..."
                />
              </div>
            </div>
          </section>

          {/* Offerings */}
          <section className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
              Offerings & Operations
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Products</label>
                <textarea 
                  value={profile.products || ''}
                  onChange={e => setProfile({...profile, products: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Describe your core products..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Services</label>
                <textarea 
                  value={profile.services || ''}
                  onChange={e => setProfile({...profile, services: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Describe your core services..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Locations & Headquarters</label>
                <input 
                  type="text" 
                  value={profile.locations || ''}
                  onChange={e => setProfile({...profile, locations: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
