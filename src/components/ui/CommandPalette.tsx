'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Briefcase, Users, BrainCircuit, Activity, LayoutDashboard, Building2, UserPlus, PlayCircle, Settings, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Command = {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const executeAction = (action: () => void) => {
    setIsOpen(false);
    setQuery('');
    action();
  };

  const commands: Command[] = [
    { id: '1', title: 'Mission Control', icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" />, category: 'Navigation', action: () => router.push('/dashboard') },
    { id: '2', title: 'AI Workforce', icon: <Users className="w-4 h-4 text-blue-400" />, category: 'Navigation', action: () => router.push('/dashboard/workforce') },
    { id: '3', title: 'Company Galaxy', icon: <Activity className="w-4 h-4 text-purple-400" />, category: 'Navigation', action: () => router.push('/dashboard/galaxy') },
    { id: '4', title: 'Company Brain', icon: <BrainCircuit className="w-4 h-4 text-emerald-400" />, category: 'Navigation', action: () => router.push('/dashboard/brain') },
    { id: '5', title: 'Boardroom Meetings', icon: <Briefcase className="w-4 h-4 text-rose-400" />, category: 'Navigation', action: () => router.push('/dashboard/meetings') },
    { id: '6', title: 'Internal Network', icon: <Building2 className="w-4 h-4 text-orange-400" />, category: 'Navigation', action: () => router.push('/dashboard/communication') },
    { id: '10', title: 'Website Studio', icon: <Monitor className="w-4 h-4 text-pink-400" />, category: 'Navigation', action: () => router.push('/dashboard/website-studio') },
    
    { id: '7', title: 'Hire New Employee', icon: <UserPlus className="w-4 h-4 text-blue-400" />, category: 'Actions', action: () => router.push('/dashboard/workforce/marketplace') },
    { id: '8', title: 'Start a Meeting', icon: <PlayCircle className="w-4 h-4 text-rose-400" />, category: 'Actions', action: () => router.push('/dashboard/meetings') },
    { id: '9', title: 'Upload Knowledge', icon: <BrainCircuit className="w-4 h-4 text-emerald-400" />, category: 'Actions', action: () => router.push('/dashboard/workforce/training') },
  ];

  const filteredCommands = query === '' 
    ? commands 
    : commands.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()) || cmd.category.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-gray-100 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#FAFAFA] border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center border-b border-gray-200 bg-white">
          <Search className="absolute left-4 w-5 h-5 text-gray-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, actions, or employees... (Cmd+K)"
            className="w-full bg-transparent border-none text-gray-900 px-12 py-4 focus:outline-none placeholder:text-gray-500 text-lg"
          />
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="absolute right-4 p-1.5 text-gray-500 hover:text-gray-900 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {['Navigation', 'Actions'].map(category => {
                const categoryCmds = filteredCommands.filter(c => c.category === category);
                if (categoryCmds.length === 0) return null;
                return (
                  <div key={category}>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">{category}</div>
                    <div className="space-y-1">
                      {categoryCmds.map(cmd => (
                        <button
                          key={cmd.id}
                          onClick={() => executeAction(cmd.action)}
                          className="w-full text-left px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all flex items-center gap-3 group"
                        >
                          <div className="p-1.5 rounded-lg bg-white group-hover:bg-gray-50 transition-colors">
                            {cmd.icon}
                          </div>
                          <span className="font-medium">{cmd.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-mono">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-mono">Enter</kbd> to select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-mono">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
