'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, CheckCircle2, Sparkles, Layout, Box } from 'lucide-react';

export default function TemplatePreview() {
  const router = useRouter();
  const params = useParams();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/os/websites/templates')
      .then(res => res.json())
      .then(data => {
        const found = data.find((t: any) => t.id === params.id);
        setTemplate(found);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full">Loading...</div>;
  }

  if (!template) {
    return <div className="p-8 flex items-center justify-center h-full">Template not found.</div>;
  }

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar Details */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-1">{template.category}</div>
            <h1 className="text-xl font-extrabold text-gray-900">{template.name}</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div>
            <p className="text-gray-500 text-sm leading-relaxed">{template.description}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              AI Features
            </h3>
            <div className="space-y-3">
              {(template.aiFeatures || []).map((f: string) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-500" />
              Features Included
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {(template.features || []).map((f: string) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
              <Layout className="w-4 h-4 text-orange-500" />
              Pages Included
            </h3>
            <div className="flex flex-wrap gap-2">
              {(template.pages || []).map((p: string) => (
                <span key={p} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button 
            disabled={creating}
            onClick={async () => {
              try {
                setCreating(true);
                const res = await fetch('/api/os/websites', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    templateId: template.id,
                    templateName: template.name,
                    templateType: template.type,
                    dashboardConfig: template.dashboard || []
                  })
                });
                if (res.ok) {
                  const data = await res.json();
                  router.push(`/dashboard/website-studio/${data.websiteId}/editor`);
                } else {
                  router.push(`/dashboard/website-studio/web_${Date.now()}/editor`);
                }
              } catch (e) {
                router.push(`/dashboard/website-studio/web_${Date.now()}/editor`);
              }
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting up Website...
              </>
            ) : (
              'Use Template'
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center bg-gray-100/50">
        <div className="w-full h-16 border-b border-gray-200 bg-white flex items-center justify-center gap-2">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('tablet')}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'tablet' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Tablet className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex items-start justify-center p-8">
          {/* Abstract Website Preview Wrapper */}
          <div 
            className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-500 origin-top
              ${viewMode === 'desktop' ? 'w-full max-w-5xl' : ''}
              ${viewMode === 'tablet' ? 'w-[768px]' : ''}
              ${viewMode === 'mobile' ? 'w-[375px]' : ''}
            `}
            style={{ minHeight: '800px' }}
          >
            {/* Header Mock */}
            <div className="h-16 border-b border-gray-100 px-8 flex items-center justify-between">
              <div className="font-bold text-gray-900 tracking-tight">Logo</div>
              <div className="flex gap-6">
                <div className="w-12 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-2 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Hero Mock */}
            <div className="relative h-[400px] w-full">
              <img src={template.image} className="w-full h-full object-cover" alt="Hero" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-2/3 h-8 bg-white/20 rounded-lg mb-4 backdrop-blur-md"></div>
                <div className="w-1/2 h-4 bg-white/20 rounded-lg mb-8 backdrop-blur-md"></div>
                <div className="w-32 h-10 bg-indigo-500 rounded-lg"></div>
              </div>
            </div>

            {/* Content Mock */}
            <div className="p-12">
              <div className="w-48 h-6 bg-gray-200 rounded-lg mb-12 mx-auto"></div>
              
              <div className={`grid gap-8 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-4">
                    <div className="w-full h-40 bg-gray-100 rounded-xl"></div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-full h-2 bg-gray-100 rounded"></div>
                    <div className="w-5/6 h-2 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
