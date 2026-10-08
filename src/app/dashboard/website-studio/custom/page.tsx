'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function CustomWebsiteForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    websiteType: 'E-Commerce',
    features: '',
    budget: '$5,000 - $10,000',
    deadline: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/os/websites/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const { projectId } = await res.json();
        router.push(`/dashboard/website-studio/custom/${projectId}`);
      } else {
        alert('Failed to submit custom project. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while submitting project request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-3xl mx-auto p-8">
        <button onClick={() => router.back()} className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Start a Custom Project</h1>
          <p className="text-gray-500 mb-10 text-lg">Work directly with Roxten's elite development team to build a completely bespoke digital experience for your brand.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Business Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                  placeholder="e.g. Acme Corp" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Industry</label>
                <input 
                  type="text" 
                  required
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                  placeholder="e.g. Luxury Real Estate" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Website Type</label>
                <select 
                  value={formData.websiteType}
                  onChange={e => setFormData({...formData, websiteType: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option>E-Commerce Store</option>
                  <option>Corporate Site</option>
                  <option>Web Application</option>
                  <option>Portfolio / Agency</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Target Deadline</label>
                <input 
                  type="date" 
                  required
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Required Features & Details</label>
              <textarea 
                rows={4}
                required
                value={formData.features}
                onChange={e => setFormData({...formData, features: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 custom-scrollbar" 
                placeholder="Describe what you need built..." 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Budget Range</label>
              <select 
                value={formData.budget}
                onChange={e => setFormData({...formData, budget: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>$5,000 - $10,000</option>
                <option>$10,000 - $25,000</option>
                <option>$25,000 - $50,000</option>
                <option>$50,000+</option>
              </select>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-lg"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Project Request <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
