import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gradient?: 'none' | 'blue' | 'purple' | 'green';
  hover?: boolean;
}

export function GlassCard({ children, className = '', gradient = 'none', hover = false, ...props }: GlassCardProps) {
  const gradients = {
    none: 'bg-white/[0.02]',
    blue: 'bg-white/[0.02] hover:bg-blue-500/5',
    purple: 'bg-white/[0.02] hover:bg-purple-500/5',
    green: 'bg-white/[0.02] hover:bg-emerald-500/5',
  };

  const hoverEffect = hover ? 'hover:-translate-y-1 hover:shadow-xl hover:border-white/20 transition-all duration-300' : '';

  return (
    <div 
      className={`relative rounded-2xl border border-gray-200 backdrop-blur-md overflow-hidden ${gradients[gradient]} ${hoverEffect} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
