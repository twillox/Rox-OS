'use client';

import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Palette, 
  Layout, 
  Image as ImageIcon, 
  MousePointerClick, 
  Sliders, 
  Plus, 
  Trash2, 
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { WebsiteSection, WebsiteTheme, SectionContent, SectionItem } from '../types';

interface SectionEditorPanelProps {
  section: WebsiteSection | null;
  onUpdateSection: (updated: WebsiteSection) => void;
  theme: WebsiteTheme;
  onUpdateTheme: (theme: WebsiteTheme) => void;
  activeTab: 'content' | 'theme';
  setActiveTab: (tab: 'content' | 'theme') => void;
}

const PRESET_IMAGES = [
  { label: 'Minimalist Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Luxury Living', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Audio Tech', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Artisan Workshop', url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Bistro Cafe', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200' }
];

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#0f172a', '#111827',
  '#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#64748b', '#000000'
];

export default function SectionEditorPanel({
  section,
  onUpdateSection,
  theme,
  onUpdateTheme,
  activeTab,
  setActiveTab
}: SectionEditorPanelProps) {
  const [subTab, setSubTab] = useState<'text' | 'style' | 'media' | 'items' | 'links'>('text');

  useEffect(() => {
    if (subTab === 'items' && !section?.content?.items) {
      setSubTab('text');
    } else if (subTab === 'links' && !section?.content?.links) {
      setSubTab('text');
    }
  }, [section?.id, section?.content?.items, section?.content?.links, subTab]);

  if (activeTab === 'theme') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" /> Global Theme Settings
          </h3>
          <button 
            onClick={() => setActiveTab('content')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Back to Section
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* Theme Colors */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Brand Colors
            </label>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">Primary Accent Color</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme.colors.primary || '#4f46e5'}
                    onChange={(e) => onUpdateTheme({
                      ...theme,
                      colors: { ...theme.colors, primary: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input 
                    type="text" 
                    value={theme.colors.primary || '#4f46e5'}
                    onChange={(e) => onUpdateTheme({
                      ...theme,
                      colors: { ...theme.colors, primary: e.target.value }
                    })}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">Secondary / Dark Base</span>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme.colors.secondary || '#111827'}
                    onChange={(e) => onUpdateTheme({
                      ...theme,
                      colors: { ...theme.colors, secondary: e.target.value }
                    })}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input 
                    type="text" 
                    value={theme.colors.secondary || '#111827'}
                    onChange={(e) => onUpdateTheme({
                      ...theme,
                      colors: { ...theme.colors, secondary: e.target.value }
                    })}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Theme Typography */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Typography
            </label>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">Heading Font Family</span>
                <select 
                  value={theme.typography.heading || 'Inter'}
                  onChange={(e) => onUpdateTheme({
                    ...theme,
                    typography: { ...theme.typography, heading: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="Inter">Inter (Modern Clean)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Luxury Serif)</option>
                  <option value="'Roboto', sans-serif">Roboto (Geometric)</option>
                  <option value="'Outfit', sans-serif">Outfit (Contemporary)</option>
                  <option value="system-ui, sans-serif">System UI</option>
                  <option value="monospace">Monospace (Technical)</option>
                </select>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1.5">Body Font Family</span>
                <select 
                  value={theme.typography.body || 'Inter'}
                  onChange={(e) => onUpdateTheme({
                    ...theme,
                    typography: { ...theme.typography, body: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="Inter">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Outfit', sans-serif">Outfit</option>
                  <option value="system-ui, sans-serif">System UI</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
        <MousePointerClick className="w-10 h-10 text-gray-300 mb-3 animate-bounce" />
        <h4 className="text-sm font-bold text-gray-800">No Section Selected</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          Click any section in the live preview or sidebar to customize its design and content.
        </p>
      </div>
    );
  }

  const { content } = section;

  const updateContent = (updates: Partial<SectionContent>) => {
    onUpdateSection({
      ...section,
      content: { ...content, ...updates }
    });
  };

  const updateItem = (itemId: string, itemUpdates: Partial<SectionItem>) => {
    const items = (content.items || []).map((it) => 
      it.id === itemId ? { ...it, ...itemUpdates } : it
    );
    updateContent({ items });
  };

  const addItem = () => {
    const newItem: SectionItem = {
      id: `item_${Date.now()}`,
      title: 'New Item',
      description: 'Item description and features.',
      price: '$99.00',
      question: 'New Question?',
      answer: 'Answer to the question goes here.',
      author: 'Customer Name',
      role: 'Verified Buyer',
      rating: 5
    };
    updateContent({ items: [...(content.items || []), newItem] });
  };

  const removeItem = (itemId: string) => {
    updateContent({ items: (content.items || []).filter(it => it.id !== itemId) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateContent({ imageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemFileUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = event.target.result as string;
          updateItem(itemId, { image: res, avatar: res });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addLink = () => {
    const newLink = {
      id: `link_${Date.now()}`,
      label: 'New Page',
      url: '#'
    };
    updateContent({ links: [...(content.links || []), newLink] });
  };

  const updateLink = (linkId: string, linkUpdates: Partial<{ label: string; url: string }>) => {
    const updatedLinks = (content.links || []).map((l) => 
      l.id === linkId ? { ...l, ...linkUpdates } : l
    );
    updateContent({ links: updatedLinks });
  };

  const removeLink = (linkId: string) => {
    updateContent({ links: (content.links || []).filter((l) => l.id !== linkId) });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
            {section.type}
          </span>
          <h3 className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
            {section.name}
          </h3>
        </div>
        <button
          onClick={() => setActiveTab('theme')}
          className="text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
        >
          <Palette className="w-3.5 h-3.5" /> Theme
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 gap-1">
        <button
          onClick={() => setSubTab('text')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            subTab === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Type className="w-3.5 h-3.5" /> Text
        </button>
        <button
          onClick={() => setSubTab('style')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            subTab === 'style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Style
        </button>
        <button
          onClick={() => setSubTab('media')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            subTab === 'media' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Media
        </button>
        {content.items && (
          <button
            onClick={() => setSubTab('items')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              subTab === 'items' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" /> Items
          </button>
        )}
        {content.links && (
          <button
            onClick={() => setSubTab('links')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              subTab === 'links' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Links
          </button>
        )}
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {subTab === 'text' && (
          <div className="space-y-4">
            {/* Badge / Pill */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Badge / Pre-heading</label>
              <input 
                type="text" 
                value={content.badge || ''} 
                onChange={(e) => updateContent({ badge: e.target.value })}
                placeholder="e.g. SPECIAL OFFER or NEW RELEASE"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Main Heading */}
            {content.heading !== undefined && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Heading</label>
                <textarea 
                  rows={2}
                  value={content.heading || ''} 
                  onChange={(e) => updateContent({ heading: e.target.value })}
                  placeholder="Enter main headline"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Subheading */}
            {content.subheading !== undefined && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Subheading</label>
                <textarea 
                  rows={3}
                  value={content.subheading || ''} 
                  onChange={(e) => updateContent({ subheading: e.target.value })}
                  placeholder="Enter supporting paragraph"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Body */}
            {content.body !== undefined && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Body Text</label>
                <textarea 
                  rows={4}
                  value={content.body || ''} 
                  onChange={(e) => updateContent({ body: e.target.value })}
                  placeholder="Enter detailed content"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Price (Product Highlight) */}
            {content.price !== undefined && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Product Price</label>
                <input 
                  type="text" 
                  value={content.price || ''} 
                  onChange={(e) => updateContent({ price: e.target.value })}
                  placeholder="e.g. $399.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Brand Name for Header/Footer */}
            {content.brandName !== undefined && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Brand Name</label>
                <input 
                  type="text" 
                  value={content.brandName || ''} 
                  onChange={(e) => updateContent({ brandName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            )}

            {/* Primary Button */}
            {content.buttonText !== undefined && (
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Call to Action (Button)
                </label>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={content.buttonText || ''} 
                    onChange={(e) => updateContent({ buttonText: e.target.value })}
                    placeholder="Button Label (e.g. Shop Now)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                  <input 
                    type="text" 
                    value={content.buttonLink || ''} 
                    onChange={(e) => updateContent({ buttonLink: e.target.value })}
                    placeholder="Link Target (e.g. #products)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Secondary Button */}
            {content.secondaryButtonText !== undefined && (
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Secondary Action
                </label>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={content.secondaryButtonText || ''} 
                    onChange={(e) => updateContent({ secondaryButtonText: e.target.value })}
                    placeholder="Secondary Button Label"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                  <input 
                    type="text" 
                    value={content.secondaryButtonLink || ''} 
                    onChange={(e) => updateContent({ secondaryButtonLink: e.target.value })}
                    placeholder="Link Target (e.g. #about)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'style' && (
          <div className="space-y-6">
            {/* Colors */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                Colors
              </label>
              
              <div className="space-y-3">
                {/* Background Color */}
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Section Background</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={content.backgroundColor || '#ffffff'}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <div className="flex gap-1 overflow-x-auto py-1">
                      {PRESET_COLORS.slice(0, 8).map((c) => (
                        <button 
                          key={c}
                          onClick={() => updateContent({ backgroundColor: c })}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded-full border border-gray-200 shadow-sm shrink-0 hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Text Color</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={content.textColor || '#111827'}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <div className="flex gap-1 overflow-x-auto py-1">
                      {PRESET_COLORS.slice(0, 8).map((c) => (
                        <button 
                          key={c}
                          onClick={() => updateContent({ textColor: c })}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded-full border border-gray-200 shadow-sm shrink-0 hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Button Color */}
                {content.buttonText && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Button Color & Text Color</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={content.buttonColor || '#4f46e5'}
                        onChange={(e) => updateContent({ buttonColor: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      />
                      <input 
                        type="color" 
                        value={content.buttonTextColor || '#ffffff'}
                        onChange={(e) => updateContent({ buttonTextColor: e.target.value })}
                        title="Button Text Color"
                        className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      />
                      <span className="text-[11px] text-gray-400">Background / Label</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Typography & Alignment */}
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                Typography & Alignment
              </label>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Font Family</span>
                  <select
                    value={content.fontFamily || ''}
                    onChange={(e) => updateContent({ fontFamily: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="">Inherit from Theme</option>
                    <option value="Inter">Inter (Clean)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Luxury)</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Outfit', sans-serif">Outfit</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Heading Size</span>
                  <select
                    value={content.fontSize || 'base'}
                    onChange={(e) => updateContent({ fontSize: e.target.value as any })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="sm">Small</option>
                    <option value="base">Standard</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">Display 2X</option>
                    <option value="3xl">Hero Impact 3X</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Font Weight</span>
                  <select
                    value={content.fontWeight || 'bold'}
                    onChange={(e) => updateContent({ fontWeight: e.target.value as any })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="normal">Normal (400)</option>
                    <option value="medium">Medium (500)</option>
                    <option value="semibold">Semibold (600)</option>
                    <option value="bold">Bold (700)</option>
                    <option value="extrabold">Extra Bold (800)</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Text Alignment</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateContent({ textAlign: 'left' })}
                      className={`flex-1 py-1.5 border rounded-lg flex items-center justify-center ${content.textAlign === 'left' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-200 text-gray-600'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateContent({ textAlign: 'center' })}
                      className={`flex-1 py-1.5 border rounded-lg flex items-center justify-center ${content.textAlign === 'center' || !content.textAlign ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-200 text-gray-600'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateContent({ textAlign: 'right' })}
                      className={`flex-1 py-1.5 border rounded-lg flex items-center justify-center ${content.textAlign === 'right' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-200 text-gray-600'}`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Button Corner Radius</span>
                  <select
                    value={content.buttonRadius || 'md'}
                    onChange={(e) => updateContent({ buttonRadius: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="none">Square (0px)</option>
                    <option value="md">Rounded (6px)</option>
                    <option value="lg">Soft Rounded (8px)</option>
                    <option value="xl">Pill Large (16px)</option>
                    <option value="full">Full Rounded Pill</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Button Size</span>
                  <select
                    value={content.buttonSize || 'md'}
                    onChange={(e) => updateContent({ buttonSize: e.target.value as any })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="sm">Small Compact</option>
                    <option value="md">Medium Standard</option>
                    <option value="lg">Large Bold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Spacing & Layout */}
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                Spacing & Grid
              </label>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block mb-1">Section Vertical Padding</span>
                  <select
                    value={content.paddingY || 'md'}
                    onChange={(e) => updateContent({ paddingY: e.target.value as any })}
                    className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="none">None (0px)</option>
                    <option value="sm">Compact (24px)</option>
                    <option value="md">Standard (48px)</option>
                    <option value="lg">Spacious (80px)</option>
                    <option value="xl">Hero Large (112px)</option>
                  </select>
                </div>

                {content.columns !== undefined && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Grid Columns</span>
                    <select
                      value={content.columns}
                      onChange={(e) => updateContent({ columns: Number(e.target.value) as any })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                )}

                {content.layout && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 block mb-1">Layout Placement</span>
                    <select
                      value={content.layout}
                      onChange={(e) => updateContent({ layout: e.target.value as any })}
                      className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
                    >
                      <option value="split-right">Image on Right</option>
                      <option value="split-left">Image on Left</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {subTab === 'media' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Upload or Paste Image</label>
              
              {/* File Upload Button */}
              <div className="flex gap-2 mb-2">
                <label className="flex-1 cursor-pointer py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-100">
                  <Upload className="w-3.5 h-3.5" /> Upload File
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
                {content.imageUrl && (
                  <button
                    onClick={() => updateContent({ imageUrl: '' })}
                    className="px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>

              <input 
                type="text" 
                value={content.imageUrl || ''} 
                onChange={(e) => updateContent({ imageUrl: e.target.value })}
                placeholder="Or paste image URL (https://...)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono mb-2"
              />

              {content.imageUrl && (
                <div className="relative rounded-xl overflow-hidden h-40 border border-gray-200 shadow-inner">
                  <img src={content.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Image Height & Sizing */}
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">Image Banner Height</span>
              <select
                value={content.imageHeight || '400px'}
                onChange={(e) => updateContent({ imageHeight: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs bg-white"
              >
                <option value="250px">Compact (250px)</option>
                <option value="350px">Standard (350px)</option>
                <option value="450px">Medium (450px)</option>
                <option value="600px">Large Full (600px)</option>
              </select>
            </div>

            {/* Quick Unsplash Curated Presets */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Curated Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    onClick={() => updateContent({ imageUrl: img.url })}
                    className="p-1 border border-gray-200 hover:border-indigo-500 rounded-lg text-left transition-colors group flex flex-col gap-1"
                  >
                    <img src={img.url} alt={img.label} className="w-full h-14 object-cover rounded" />
                    <span className="text-[10px] font-semibold text-gray-600 group-hover:text-indigo-600 truncate px-1">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay opacity for Hero */}
            {section.type === 'hero' && (
              <div>
                <span className="text-xs font-semibold text-gray-700 block mb-1">
                  Background Dark Overlay ({content.overlayOpacity ?? 40}%)
                </span>
                <input 
                  type="range" 
                  min="0" 
                  max="90" 
                  value={content.overlayOpacity ?? 40}
                  onChange={(e) => updateContent({ overlayOpacity: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>
        )}

        {subTab === 'items' && content.items && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Manage Items ({content.items.length})
              </span>
              <button
                onClick={addItem}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {content.items.map((it, idx) => (
                <div key={it.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">#{idx + 1} {it.title || it.question || 'Item'}</span>
                    <button 
                      onClick={() => removeItem(it.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title / Question */}
                  {(it.title !== undefined || it.question !== undefined) && (
                    <input 
                      type="text" 
                      value={it.title ?? it.question ?? ''}
                      onChange={(e) => {
                        if (it.question !== undefined) updateItem(it.id, { question: e.target.value });
                        else updateItem(it.id, { title: e.target.value });
                      }}
                      placeholder="Title or Question"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  )}

                  {/* Price */}
                  {it.price !== undefined && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={it.price || ''}
                        onChange={(e) => updateItem(it.id, { price: e.target.value })}
                        placeholder="Price (e.g. $149)"
                        className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                      <input 
                        type="text" 
                        value={it.badge || ''}
                        onChange={(e) => updateItem(it.id, { badge: e.target.value })}
                        placeholder="Badge (e.g. Sale)"
                        className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  {/* Description / Answer */}
                  {(it.description !== undefined || it.answer !== undefined) && (
                    <textarea 
                      rows={2}
                      value={it.description ?? it.answer ?? ''}
                      onChange={(e) => {
                        if (it.answer !== undefined) updateItem(it.id, { answer: e.target.value });
                        else updateItem(it.id, { description: e.target.value });
                      }}
                      placeholder="Description or Answer"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  )}

                  {/* Item Image / Avatar */}
                  {(it.image !== undefined || it.avatar !== undefined) && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-500">Item Image</span>
                        <div className="flex gap-1.5">
                          <label className="cursor-pointer px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors">
                            <Upload className="w-2.5 h-2.5" /> Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleItemFileUpload(it.id, e)} 
                              className="hidden" 
                            />
                          </label>
                          {(it.image || it.avatar) && (
                            <button
                              onClick={() => updateItem(it.id, { image: '', avatar: '' })}
                              className="px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50 rounded"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        {(it.image || it.avatar) && (
                          <img 
                            src={it.image || it.avatar} 
                            alt="Thumb" 
                            className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" 
                          />
                        )}
                        <input 
                          type="text" 
                          value={it.image ?? it.avatar ?? ''}
                          onChange={(e) => updateItem(it.id, { image: e.target.value, avatar: e.target.value })}
                          placeholder="Or paste image URL"
                          className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links Subtab for Header, Navigation, Footer */}
        {subTab === 'links' && content.links && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Menu Links ({content.links.length})
              </span>
              <button
                onClick={addLink}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>

            <div className="space-y-2.5">
              {content.links.map((link, idx) => (
                <div key={link.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Link #{idx + 1}</span>
                    <button 
                      onClick={() => removeLink(link.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      value={link.label || ''} 
                      onChange={(e) => updateLink(link.id, { label: e.target.value })}
                      placeholder="Menu Label (e.g. Products)"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <input 
                      type="text" 
                      value={link.url || ''} 
                      onChange={(e) => updateLink(link.id, { url: e.target.value })}
                      placeholder="Target URL (e.g. #products or /about)"
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
