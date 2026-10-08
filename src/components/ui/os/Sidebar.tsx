'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Brain, MessageSquare, Presentation, Calendar, 
  Settings as SettingsIcon, Workflow, Layout, Activity, FolderOpen,
  Mic, Briefcase, Zap, Search, Bell, Target, Globe, Video, LogOut, Monitor
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

function NavGroup({ title, items, isHovered, pathname }: { title: string, items: any[], isHovered: boolean, pathname: string }) {
  return (
    <div className="mb-6">
      {isHovered && <h4 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 truncate">{title}</h4>}
      <div className="space-y-1">
        {items.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
              {isHovered && <span className="text-sm whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { signOut } = useAuth();

  const mainNav = [
    { name: 'Mission Control', href: '/dashboard', icon: Home },
    { name: 'Task Center', href: '/dashboard/tasks', icon: Target },
    { name: 'Timeline', href: '/dashboard/timeline', icon: Activity },
  ];

  const orgNav = [
    { name: 'Workforce', href: '/dashboard/workforce', icon: Users },
    { name: 'Galaxy (Org)', href: '/dashboard/galaxy', icon: Zap },
    { name: 'Departments', href: '/dashboard/departments', icon: Briefcase },
  ];

  const intelligenceNav = [
    { name: 'Company Brain', href: '/dashboard/brain', icon: Brain },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: FolderOpen },
    { name: 'Executive Reports', href: '/dashboard/reports', icon: Layout },
  ];

  const collaborationNav = [
    { name: 'Communications', href: '/dashboard/communication', icon: MessageSquare },
    { name: 'Boardroom', href: '/dashboard/meetings', icon: Presentation },
  ];

  const operationsNav = [
    { name: 'Website Studio', href: '/dashboard/website-studio', icon: Monitor },
    { name: 'Marketing', href: '/dashboard/marketing', icon: Globe },
    { name: 'Automation', href: '/dashboard/automation', icon: Workflow },
    { name: 'Voice Studio', href: '/dashboard/voice', icon: Mic },
    { name: 'Asset Library', href: '/dashboard/assets', icon: Video },
  ];

  const bottomNav = [
    { name: 'Integrations Hub', href: '/dashboard/integrations', icon: Workflow },
    { name: 'Business Profile', href: '/dashboard/profile', icon: Briefcase },
    { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <div 
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${isHovered ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-100 shrink-0 bg-white">
        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-md">
          <span className="font-bold text-gray-900 text-sm">R</span>
        </div>
        {isHovered && <span className="ml-3 font-bold text-lg tracking-tight text-gray-900">Roxten OS</span>}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <NavGroup title="Command" items={mainNav} isHovered={isHovered} pathname={pathname} />
        <NavGroup title="Organization" items={orgNav} isHovered={isHovered} pathname={pathname} />
        <NavGroup title="Intelligence" items={intelligenceNav} isHovered={isHovered} pathname={pathname} />
        <NavGroup title="Collaboration" items={collaborationNav} isHovered={isHovered} pathname={pathname} />
        <NavGroup title="Operations" items={operationsNav} isHovered={isHovered} pathname={pathname} />
      </div>

      <div className="p-3 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <NavGroup title="System" items={bottomNav} isHovered={isHovered} pathname={pathname} />
        
        <button 
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isHovered && <span className="text-sm font-semibold whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
