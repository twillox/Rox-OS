'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TimelineAnalytics } from '@/components/ui/os/timeline/TimelineAnalytics';
import { TimelineFilters } from '@/components/ui/os/timeline/TimelineFilters';
import { TimelineFeed } from '@/components/ui/os/timeline/TimelineFeed';
import { TimelineDetailsPanel } from '@/components/ui/os/timeline/TimelineDetailsPanel';

export default function TimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    module: '',
    severity: '',
    search: ''
  });

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (filters.module) query.append('module', filters.module);
      if (filters.severity) query.append('severity', filters.severity);
      if (filters.search) query.append('search', filters.search);
      query.append('limit', '100'); // Load recent 100 for view

      const res = await fetch(`/api/os/timeline?${query.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setEvents(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filters]);

  // Initial load & Polling
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // Live polling every 10s
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "roxten_timeline_export.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FAFAFA]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#FAFAFA] flex flex-col p-6 lg:p-10 overflow-y-auto custom-scrollbar relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" /> Immutable Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium max-w-xl">
            The permanent audit log of all business events and AI operations across Roxten OS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-400" /> Export JSON
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <TimelineAnalytics events={events} />
        <TimelineFilters filters={filters} setFilters={setFilters} />
        
        <TimelineFeed events={events} onSelectEvent={setSelectedEvent} />
      </div>

      {/* Side Panel Details */}
      <TimelineDetailsPanel 
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

    </div>
  );
}
