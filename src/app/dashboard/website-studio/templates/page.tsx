'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Layout, Smartphone, Blocks, Star, ArrowRight } from 'lucide-react';

export default function TemplatesMarketplace() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/os/websites/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data);
        setLoading(false);
      });
  }, []);

  const categories = ['All', 'E-Commerce', 'Portfolio', 'Restaurant', 'SaaS', 'Personal Brand', 'Blog', 'Landing Page'];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-8 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Template Marketplace</h1>
        <p className="text-gray-500 mb-8">Choose a professionally designed template to jumpstart your business.</p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-100 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-100 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-full mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-100 rounded flex-1"></div>
                  <div className="h-8 bg-gray-100 rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {filteredTemplates.map(template => (
              <div key={template.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={template.image} 
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold tracking-wide text-gray-900 shadow-sm">
                    {template.category}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
                    {template.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-xs text-gray-500">
                      <Layout className="w-4 h-4 mr-2 text-indigo-500" />
                      {template.pages?.length || 0} Pages
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Blocks className="w-4 h-4 mr-2 text-emerald-500" />
                      {template.features?.length || 0} Features
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <button 
                      onClick={() => router.push(`/dashboard/website-studio/templates/${template.id}`)}
                      className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
                    >
                      Preview
                    </button>
                    <button 
                      disabled={creatingId === template.id}
                      onClick={async () => {
                        try {
                          setCreatingId(template.id);
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
                        } catch (err: any) {
                          console.error('Error in Use Template:', err);
                          router.push(`/dashboard/website-studio/web_${Date.now()}/editor`);
                        }
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center gap-1.5"
                    >
                      {creatingId === template.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Setting up...</span>
                        </>
                      ) : (
                        'Use Template'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
