'use client';

import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Megaphone, 
  PanelTop, 
  Compass, 
  Sparkles, 
  SplitSquareVertical, 
  Image as ImageIcon, 
  ShoppingBag, 
  Star, 
  PackageCheck, 
  Grid3X3, 
  FileText, 
  HelpCircle, 
  MessageSquareQuote, 
  Mail, 
  Send, 
  PanelBottom, 
  Plus
} from 'lucide-react';
import { SECTION_CATALOG, SectionType, SectionCatalogItem } from '../types';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (type: SectionType, name: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Megaphone: <Megaphone className="w-5 h-5 text-indigo-500" />,
  PanelTop: <PanelTop className="w-5 h-5 text-indigo-500" />,
  Compass: <Compass className="w-5 h-5 text-indigo-500" />,
  Sparkles: <Sparkles className="w-5 h-5 text-indigo-500" />,
  SplitSquareVertical: <SplitSquareVertical className="w-5 h-5 text-indigo-500" />,
  Image: <ImageIcon className="w-5 h-5 text-indigo-500" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5 text-indigo-500" />,
  Star: <Star className="w-5 h-5 text-indigo-500" />,
  PackageCheck: <PackageCheck className="w-5 h-5 text-indigo-500" />,
  Grid3X3: <Grid3X3 className="w-5 h-5 text-indigo-500" />,
  FileText: <FileText className="w-5 h-5 text-indigo-500" />,
  HelpCircle: <HelpCircle className="w-5 h-5 text-indigo-500" />,
  MessageSquareQuote: <MessageSquareQuote className="w-5 h-5 text-indigo-500" />,
  Mail: <Mail className="w-5 h-5 text-indigo-500" />,
  Send: <Send className="w-5 h-5 text-indigo-500" />,
  PanelBottom: <PanelBottom className="w-5 h-5 text-indigo-500" />
};

export default function AddSectionModal({
  isOpen,
  onClose,
  onAddSection
}: AddSectionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = [
    'All',
    'Header & Nav',
    'Hero & Banner',
    'Products & Store',
    'Content & Media',
    'Social Proof & FAQ',
    'Conversion & Footer'
  ];

  const filtered = SECTION_CATALOG.filter((sec) => {
    const matchesCat = selectedCategory === 'All' || sec.category === selectedCategory;
    const matchesSearch = sec.name.toLowerCase().includes(search.toLowerCase()) || 
                          sec.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Add a Website Section</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a modular section to insert into your page layout.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search sections (e.g. Hero, Products, Testimonials)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.type}
              onClick={() => {
                onAddSection(item.type, item.name);
                onClose();
              }}
              className="group p-4 bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-colors duration-200">
                <span className="group-hover:text-white transition-colors duration-200">
                  {ICON_MAP[item.icon] || <Sparkles className="w-5 h-5 text-indigo-500 group-hover:text-white" />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </h4>
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 py-12 text-center text-gray-400 text-xs">
              No sections found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
