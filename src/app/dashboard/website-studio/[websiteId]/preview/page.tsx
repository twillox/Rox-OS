'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { WebsiteSection, WebsiteTheme, SectionType, createDefaultSectionContent } from '../../types';
import WebsiteSectionRenderer from '../../components/WebsiteSectionRenderer';

export default function WebsiteLivePreview() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;

  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [website, setWebsite] = useState<any>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [websiteTheme, setWebsiteTheme] = useState<WebsiteTheme>({
    colors: { primary: '#4f46e5', secondary: '#111827' },
    typography: { heading: 'Inter', body: 'System UI' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/os/websites/editor?websiteId=${websiteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.website) {
          setWebsite(data.website);
          if (data.website.theme) setWebsiteTheme(data.website.theme);
        }
        if (data.sections && Array.isArray(data.sections)) {
          const loaded = data.sections.map((sec: any, idx: number) => ({
            id: sec.id || `sec_${idx}`,
            name: sec.name || 'Section',
            type: (sec.type || 'hero') as SectionType,
            orderIndex: sec.orderIndex ?? idx,
            content: sec.content && Object.keys(sec.content).length > 0 
              ? sec.content 
              : createDefaultSectionContent((sec.type || 'hero') as SectionType)
          }));
          setSections(loaded);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [websiteId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Live Preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      {/* Floating Preview Control Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/website-studio/${websiteId}/editor`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Back to Editor
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">{website?.name || 'Website Preview'}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Live Preview
            </span>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'desktop' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewMode('tablet')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'tablet' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'mobile' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Canvas */}
      <main className="flex-1 flex justify-center p-4 md:p-8 overflow-y-auto">
        <div
          className={`bg-white shadow-2xl transition-all duration-300 origin-top overflow-hidden border border-gray-200 rounded-2xl min-h-[900px] ${
            viewMode === 'desktop' ? 'w-full max-w-[1240px]' : ''
          } ${
            viewMode === 'tablet' ? 'w-[768px]' : ''
          } ${
            viewMode === 'mobile' ? 'w-[375px]' : ''
          }`}
        >
          <div className="flex flex-col min-h-full">
            {sections.map((section) => (
              <WebsiteSectionRenderer
                key={section.id}
                section={section}
                isSelected={false}
                viewMode={viewMode}
                theme={websiteTheme}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
