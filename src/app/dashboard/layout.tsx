import React from 'react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { CEOInbox } from '@/components/ui/os/CEOInbox';
import { Sidebar } from '@/components/ui/os/Sidebar';
import { LivePulseWidget } from '@/components/ui/os/LivePulseWidget';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#FAFAFA] text-gray-900 overflow-hidden relative">
      <CommandPalette />
      
      {/* Left Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Top Header - Tools only */}
        <header className="h-16 w-full border-b border-gray-200 flex items-center justify-end px-8 bg-white/80 backdrop-blur-md z-50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 mr-2 border border-gray-200 rounded-md px-2 py-1 bg-gray-50 font-medium shadow-sm">
              Cmd + K
            </div>
            <CEOInbox />
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-inner">
                <span className="text-[10px] font-bold text-gray-900">CEO</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Online</span>
            </div>
          </div>
        </header>

        {/* Main Execution Area */}
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>

      {/* 24/7 Autonomous Activity Pulse */}
      <LivePulseWidget />
    </div>
  );
}
