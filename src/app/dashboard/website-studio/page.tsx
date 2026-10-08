'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutTemplate, 
  Code2, 
  ArrowRight, 
  Monitor, 
  ExternalLink, 
  Trash2, 
  Plus, 
  Globe, 
  Sparkles, 
  Layers,
  Settings
} from 'lucide-react';

export default function WebsiteStudioLanding() {
  const router = useRouter();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/os/websites');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWebsites(data);
        }
      }
    } catch (err) {
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this website? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/os/websites?websiteId=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWebsites((prev) => prev.filter((w) => w.id !== id));
      } else {
        alert('Failed to delete website.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting website.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 bg-gray-50 overflow-y-auto custom-scrollbar h-full flex flex-col items-center">
      {/* Header Banner */}
      <div className="w-full max-w-5xl mt-6 mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Visual Commerce
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Website Studio</h1>
        <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
          Design, customize, and launch world-class websites with visual drag-and-drop editing, AI assistance, and developer support.
        </p>
      </div>

      {/* Creation Mode Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Templates Card */}
        <div 
          onClick={() => router.push('/dashboard/website-studio/templates')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[260px]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:translate-x-2">
            <LayoutTemplate size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 border border-indigo-100 group-hover:bg-indigo-600 transition-colors duration-300">
            <LayoutTemplate className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Template Marketplace</h2>
          <p className="text-gray-500 flex-1 leading-relaxed text-sm pr-6">
            Launch instantly with high-converting templates for E-Commerce, SaaS, Portfolios, and Restaurants.
          </p>
          <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm group-hover:text-indigo-700">
            Explore 10+ Templates <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Custom with Developer Card */}
        <div 
          onClick={() => router.push('/dashboard/website-studio/custom')}
          className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[260px]"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-110 group-hover:-translate-y-2 group-hover:translate-x-2">
            <Code2 size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 border border-emerald-100 group-hover:bg-emerald-600 transition-colors duration-300">
            <Code2 className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Custom with Developer</h2>
          <p className="text-gray-500 flex-1 leading-relaxed text-sm pr-6">
            Work directly with Roxten's senior developers to architect a bespoke, custom-coded web application.
          </p>
          <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm group-hover:text-emerald-700">
            Start Custom Request <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Your Websites Section */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Websites</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-200/70 text-gray-700 rounded-full">
              {websites.length}
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard/website-studio/templates')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Website
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
                <div className="h-6 bg-gray-100 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : websites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center shadow-xs">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No websites created yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
              Get started by choosing a template from the marketplace or submitting a custom project request.
            </p>
            <button
              onClick={() => router.push('/dashboard/website-studio/templates')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" /> Pick a Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {site.type || 'E-Commerce'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {site.status || 'DRAFT'}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 tracking-tight line-clamp-1 mb-1">
                    {site.name}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 truncate mb-5">
                    {site.domain || `${site.id}.roxten.app`}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/website-studio/${site.id}/editor`)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Monitor className="w-3.5 h-3.5" /> Edit in Studio
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/website-studio/${site.id}/preview`)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Live Preview"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, site.id)}
                      disabled={deletingId === site.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                      title="Delete Website"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard/website-studio/${site.id}`)}
                    className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Settings className="w-3 h-3" /> Dashboard & Settings
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
