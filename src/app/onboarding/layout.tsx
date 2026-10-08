import React from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-20"></div>
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-gray-200">
              <span className="font-bold text-gray-900 text-sm">R</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-gray-900/90">Roxten AI-OS</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
