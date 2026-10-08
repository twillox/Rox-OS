'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Save, 
  Undo, 
  Redo, 
  GripVertical, 
  Bot, 
  Send, 
  Eye, 
  EyeOff, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  SlidersHorizontal,
  CheckCircle2,
  ExternalLink,
  Layers,
  Palette
} from 'lucide-react';
import { WebsiteSection, WebsiteTheme, SectionType, createDefaultSectionContent } from '../../types';
import WebsiteSectionRenderer from '../../components/WebsiteSectionRenderer';
import SectionEditorPanel from '../../components/SectionEditorPanel';
import AddSectionModal from '../../components/AddSectionModal';

export default function AppearanceEditor() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;

  // View & UI Modes
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'customizer' | 'ai'>('customizer');
  const [customizerTab, setCustomizerTab] = useState<'content' | 'theme'>('content');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Core Data
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [websiteTheme, setWebsiteTheme] = useState<WebsiteTheme>({
    colors: { primary: '#4f46e5', secondary: '#111827' },
    typography: { heading: 'Inter', body: 'System UI' }
  });

  // Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Undo / Redo History
  const [historyPast, setHistoryPast] = useState<Array<{ sections: WebsiteSection[]; theme: WebsiteTheme }>>([]);
  const [historyFuture, setHistoryFuture] = useState<Array<{ sections: WebsiteSection[]; theme: WebsiteTheme }>>([]);

  // AI Assistant Chat
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { 
      role: 'assistant', 
      content: 'Hi! I am your AI Website Builder Assistant. Ask me anything, such as:\n• "Make the hero section dark blue and change heading to \'Build Your Dream Store\'"\n• "Add a FAQ section"\n• "Switch primary accent color to emerald green"' 
    }
  ]);

  // Push State to History Stack
  const lastHistoryPushRef = React.useRef<number>(0);

  const pushHistory = useCallback((newSections: WebsiteSection[], newTheme: WebsiteTheme) => {
    setHistoryPast((prev) => [...prev.slice(-30), { sections, theme: websiteTheme }]);
    setHistoryFuture([]);
    lastHistoryPushRef.current = Date.now();
  }, [sections, websiteTheme]);

  const pushHistoryDebounced = useCallback(() => {
    const now = Date.now();
    if (now - lastHistoryPushRef.current > 1000) {
      setHistoryPast((prev) => [...prev.slice(-30), { sections, theme: websiteTheme }]);
      setHistoryFuture([]);
      lastHistoryPushRef.current = now;
    }
  }, [sections, websiteTheme]);

  // Load website data
  useEffect(() => {
    fetch(`/api/os/websites/editor?websiteId=${websiteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.website) {
          setWebsite(data.website);
          if (data.website.theme) {
            setWebsiteTheme(data.website.theme);
          }
        }
        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
          const loadedSections = data.sections.map((sec: any, idx: number) => ({
            id: sec.id || `sec_${idx}`,
            name: sec.name || 'Section',
            type: (sec.type || 'hero') as SectionType,
            orderIndex: sec.orderIndex ?? idx,
            content: sec.content && Object.keys(sec.content).length > 0 
              ? sec.content 
              : createDefaultSectionContent((sec.type || 'hero') as SectionType)
          }));
          setSections(loadedSections);
          setSelectedSectionId(loadedSections[0]?.id || null);
        } else {
          // Initialize with default store layout if empty
          const initialSections: WebsiteSection[] = [
            { id: 'sec_announcement', name: 'Announcement Bar', type: 'announcement-bar', orderIndex: 0, content: createDefaultSectionContent('announcement-bar') },
            { id: 'sec_header', name: 'Header', type: 'header', orderIndex: 1, content: createDefaultSectionContent('header') },
            { id: 'sec_hero', name: 'Hero Section', type: 'hero', orderIndex: 2, content: createDefaultSectionContent('hero') },
            { id: 'sec_products', name: 'Product Grid', type: 'product-grid', orderIndex: 3, content: createDefaultSectionContent('product-grid') },
            { id: 'sec_testimonials', name: 'Testimonials', type: 'testimonials', orderIndex: 4, content: createDefaultSectionContent('testimonials') },
            { id: 'sec_faq', name: 'FAQ', type: 'faq', orderIndex: 5, content: createDefaultSectionContent('faq') },
            { id: 'sec_footer', name: 'Footer', type: 'footer', orderIndex: 6, content: createDefaultSectionContent('footer') }
          ];
          setSections(initialSections);
          setSelectedSectionId(initialSections[2]?.id || null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load website:', err);
        setLoading(false);
      });
  }, [websiteId]);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture((prev) => [{ sections, theme: websiteTheme }, ...prev]);
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setSections(previous.sections);
    setWebsiteTheme(previous.theme);
  }, [historyPast, sections, websiteTheme]);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryPast((prev) => [...prev, { sections, theme: websiteTheme }]);
    setHistoryFuture((prev) => prev.slice(1));
    setSections(next.sections);
    setWebsiteTheme(next.theme);
  }, [historyFuture, sections, websiteTheme]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Move Section Up/Down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      pushHistory(sections, websiteTheme);
      const newSections = [...sections];
      const temp = newSections[index];
      newSections[index] = newSections[index - 1];
      newSections[index - 1] = temp;
      newSections.forEach((s, idx) => { s.orderIndex = idx; });
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      pushHistory(sections, websiteTheme);
      const newSections = [...sections];
      const temp = newSections[index];
      newSections[index] = newSections[index + 1];
      newSections[index + 1] = temp;
      newSections.forEach((s, idx) => { s.orderIndex = idx; });
      setSections(newSections);
    }
  };

  // Drag and drop state & handlers
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    pushHistory(sections, websiteTheme);
    const newSections = [...sections];
    const draggedItem = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);
    newSections.forEach((s, idx) => { s.orderIndex = idx; });
    setSections(newSections);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Add Section
  const handleAddSection = (type: SectionType, name: string) => {
    pushHistory(sections, websiteTheme);
    const newSec: WebsiteSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name,
      type: type,
      orderIndex: sections.length,
      content: createDefaultSectionContent(type)
    };
    setSections((prev) => [...prev, newSec]);
    setSelectedSectionId(newSec.id);
    setRightPanelTab('customizer');
    setCustomizerTab('content');
  };

  // Duplicate Section
  const handleDuplicateSection = (id: string) => {
    const targetIdx = sections.findIndex((s) => s.id === id);
    if (targetIdx === -1) return;
    pushHistory(sections, websiteTheme);
    const target = sections[targetIdx];
    const duplicated: WebsiteSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} (Copy)`,
      type: target.type,
      orderIndex: targetIdx + 1,
      content: JSON.parse(JSON.stringify(target.content))
    };
    const updated = [...sections];
    updated.splice(targetIdx + 1, 0, duplicated);
    updated.forEach((s, idx) => { s.orderIndex = idx; });
    setSections(updated);
    setSelectedSectionId(duplicated.id);
  };

  // Delete Section
  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('Your website must have at least one section.');
      return;
    }
    pushHistory(sections, websiteTheme);
    const updated = sections.filter((s) => s.id !== id);
    updated.forEach((s, idx) => { s.orderIndex = idx; });
    setSections(updated);
    if (selectedSectionId === id) {
      setSelectedSectionId(updated[0]?.id || null);
    }
  };

  // Update Section Content
  const handleUpdateSection = (updated: WebsiteSection) => {
    pushHistoryDebounced();
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Update Theme
  const handleUpdateTheme = (updatedTheme: WebsiteTheme) => {
    pushHistoryDebounced();
    setWebsiteTheme(updatedTheme);
  };

  // Save to Backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/os/websites/editor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteId, 
          theme: websiteTheme, 
          sections 
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        alert('Failed to save website changes.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error while saving website.');
    } finally {
      setSaving(false);
    }
  };

  // AI Chat Submit
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiLoading(true);
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('/api/os/websites/editor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          message: userMsg,
          currentSections: sections,
          currentTheme: websiteTheme
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [...prev, { role: 'assistant', content: data.aiResponse }]);
        pushHistory(sections, websiteTheme);
        if (data.updatedSections) {
          setSections(data.updatedSections);
          if (data.updatedSections.length > 0 && !selectedSectionId) {
            setSelectedSectionId(data.updatedSections[0].id);
          }
        }
        if (data.updatedTheme) {
          setWebsiteTheme(data.updatedTheme);
        }
      } else {
        setChatHistory((prev) => [
          ...prev, 
          { role: 'assistant', content: 'Sorry, I encountered an issue updating the website. Please try again.' }
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev, 
        { role: 'assistant', content: 'Connection error while communicating with AI assistant.' }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-700">Loading Visual Website Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 shadow-xs">
        {/* Left: Navigation & Site title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/dashboard/website-studio/${websiteId}`)} 
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-gray-900 tracking-tight">
              {website?.name || 'Website Studio'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Live Editor
            </span>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('desktop')} 
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'desktop' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button 
            onClick={() => setViewMode('tablet')} 
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'tablet' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button 
            onClick={() => setViewMode('mobile')} 
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'mobile' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Right: Undo/Redo, Preview Mode & Save Button */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
            <button 
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                historyPast.length > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              className={`p-1.5 rounded-lg transition-colors ${
                historyFuture.length > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Full Preview Mode */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isPreviewMode 
                ? 'bg-amber-100 text-amber-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle Clean Preview Mode"
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>

          {/* Save Button */}
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 ${
              saveSuccess 
                ? 'bg-emerald-600' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Builder Body */}
      <div className="flex flex-1 min-h-0 h-[calc(100%-3.5rem)] overflow-hidden relative">
        {/* Left Sidebar: Section Tree & Catalog (Hidden in Preview Mode) */}
        {!isPreviewMode && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full min-h-0 shrink-0 z-20 shadow-xs">
            {/* Header & Add Button */}
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Sections</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Section List (Draggable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
              {sections.map((sec, idx) => {
                const isSelected = selectedSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setSelectedSectionId(sec.id);
                      setRightPanelTab('customizer');
                      setCustomizerTab('content');
                    }}
                    className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-700'
                    } ${dragOverIndex === idx ? 'border-t-2 border-t-indigo-600 bg-indigo-50/40' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-500">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <div className="truncate">
                        <div className="font-bold truncate">{sec.name}</div>
                        <div className="text-[10px] text-gray-400 capitalize">{sec.type}</div>
                      </div>
                    </div>

                    {/* Quick Section Controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSection(idx, 'down');
                        }}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSection(sec.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600"
                        title="Duplicate Section"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(sec.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Section Button at Bottom */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
          </aside>
        )}

        {/* Center Live Canvas Preview with Full Vertical Scroll */}
        <main className="flex-1 min-h-0 h-full flex flex-col items-center overflow-y-auto overflow-x-hidden custom-scrollbar p-4 md:p-8 bg-gray-100">
          <div
            className={`bg-white shadow-2xl transition-all duration-300 origin-top overflow-hidden border border-gray-200 rounded-xl mb-32 shrink-0 ${
              viewMode === 'desktop' ? 'w-full max-w-[1240px]' : ''
            } ${
              viewMode === 'tablet' ? 'w-[768px]' : ''
            } ${
              viewMode === 'mobile' ? 'w-[375px]' : ''
            }`}
            style={{ minHeight: '900px' }}
          >
            {/* Live Rendered Sections */}
            <div className="flex flex-col min-h-full">
              {sections.map((section) => (
                <WebsiteSectionRenderer
                  key={section.id}
                  section={section}
                  isSelected={!isPreviewMode && selectedSectionId === section.id}
                  onSelect={() => {
                    if (!isPreviewMode) {
                      setSelectedSectionId(section.id);
                      setRightPanelTab('customizer');
                      setCustomizerTab('content');
                    }
                  }}
                  viewMode={viewMode}
                  theme={websiteTheme}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Contextual Editor Panel & AI Assistant (Hidden in Preview Mode) */}
        {!isPreviewMode && (
          <aside className="w-80 md:w-88 bg-white border-l border-gray-200 flex flex-col h-full shrink-0 z-20 shadow-xs">
            {/* Tab Header Switcher */}
            <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1">
              <button
                onClick={() => setRightPanelTab('customizer')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  rightPanelTab === 'customizer' 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Customize
              </button>
              <button
                onClick={() => setRightPanelTab('ai')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  rightPanelTab === 'ai' 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> AI Assistant
              </button>
            </div>

            {/* Panel Tab 1: Section Customizer */}
            {rightPanelTab === 'customizer' && (
              <SectionEditorPanel
                section={selectedSection}
                onUpdateSection={handleUpdateSection}
                theme={websiteTheme}
                onUpdateTheme={handleUpdateTheme}
                activeTab={customizerTab}
                setActiveTab={setCustomizerTab}
              />
            )}

            {/* Panel Tab 2: Roxten AI Assistant */}
            {rightPanelTab === 'ai' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> Roxten AI Web Builder
                  </h3>
                  <p className="text-[11px] text-indigo-100 mt-0.5">
                    Chat with AI to redesign sections, update colors, or add content.
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                        msg.role === 'assistant'
                          ? 'bg-gray-100 text-gray-800 self-start rounded-tl-none whitespace-pre-line'
                          : 'bg-indigo-600 text-white self-end rounded-tr-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="p-3 bg-gray-100 text-gray-500 rounded-2xl rounded-tl-none text-xs self-start flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Updating your website...
                    </div>
                  )}
                </div>

                {/* Input Prompt Box */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <form onSubmit={handleAiSubmit} className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Make hero dark blue..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      disabled={aiLoading}
                      className="w-full pl-3 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading || !aiInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
