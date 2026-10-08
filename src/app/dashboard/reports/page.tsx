'use client';

import React, { useState, useEffect } from 'react';
import { Layout, FileText, Download, TrendingUp, BarChart, X, AlertTriangle, Lightbulb, Target, Users, CheckCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchReports = () => {
    setLoading(true);
    fetch('/api/os/reports')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReports(data.data);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/os/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: 'WEEKLY' })
      });
      if (res.ok) {
        fetchReports();
      } else {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        alert(`Failed to generate report: ${errorText}`);
      }
    } catch (e: any) {
      console.error('Fetch Error:', e);
      alert(`Network error: ${e.message}`);
    }
    setGenerating(false);
  };

  const handleExport = (id: string, format: string) => {
    window.open(`/api/os/reports/${id}/export?format=${format}`, '_blank');
  };

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden relative">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <Layout className="w-8 h-8 text-indigo-600" />
            Executive Reports
          </h1>
          <p className="text-gray-500 text-base font-medium">Immutable snapshots of organizational performance powered by AI.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-md shadow-indigo-200 text-sm disabled:opacity-50"
        >
          {generating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {generating ? 'Generating Snapshot...' : 'Generate New Report'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-semibold tracking-widest uppercase text-[10px]">Loading Executive Reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50 max-w-3xl mx-auto mt-10">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Generated</h3>
            <p className="text-gray-500 font-medium">Click "Generate New Report" to compile a real-time metrics snapshot.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            <AnimatePresence>
              {reports.map((report, idx) => (
                <motion.div 
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors group-hover:text-white text-indigo-600">
                      <BarChart className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md shadow-sm">
                      {report.timeframe || 'REPORT'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Business Snapshot</h3>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  
                  <p className="text-xs text-gray-600 font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {report.summary}
                  </p>

                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">{report.highlights?.length || 0} Highlights</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'csv'); }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-10"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white shadow-sm border border-gray-200 rounded-xl">
                    <Layout className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Executive Snapshot</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">{selectedReport.timeframe}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(selectedReport.periodStart).toLocaleDateString()} - {new Date(selectedReport.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleExport(selectedReport.id, 'csv')} className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors shadow-sm">Export CSV</button>
                  <button onClick={() => handleExport(selectedReport.id, 'json')} className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors shadow-sm">Export JSON</button>
                  <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 ml-2">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                {/* Left Column - Narrative */}
                <div className="flex-1 space-y-8">
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2"><BarChart className="w-4 h-4" /> AI Executive Summary</h3>
                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl text-sm text-gray-800 leading-relaxed font-medium">
                      {selectedReport.summary}
                    </div>
                  </section>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Highlights</h3>
                      <ul className="space-y-3">
                        {selectedReport.highlights?.map((item: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex gap-2">
                            <span className="text-emerald-500 mt-1">•</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Opportunities</h3>
                      <ul className="space-y-3">
                        {selectedReport.opportunities?.map((item: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex gap-2">
                            <span className="text-amber-500 mt-1">•</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Risks</h3>
                      <ul className="space-y-3">
                        {selectedReport.risks?.map((item: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex gap-2">
                            <span className="text-rose-500 mt-1">•</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Recommendations</h3>
                      <ul className="space-y-3">
                        {selectedReport.recommendations?.map((item: string, i: number) => (
                          <li key={i} className="text-sm font-medium text-gray-700 flex gap-2">
                            <span className="text-blue-500 mt-1">•</span> <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>

                {/* Right Column - Hard Metrics Data */}
                <div className="w-[320px] space-y-6">
                  {selectedReport.metricsSnapshot && (
                    <>
                      {selectedReport.metricsSnapshot.tasks && (
                        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4"><CheckCircle className="w-3 h-3 text-indigo-500" /> Task Center</h4>
                          
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-black text-gray-900">{selectedReport.metricsSnapshot.tasks.completionRate}%</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Completion</span>
                          </div>
                          
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedReport.metricsSnapshot.tasks.completionRate}%` }} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</div>
                              <div className="text-lg font-bold text-gray-900">{selectedReport.metricsSnapshot.tasks.total}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">New</div>
                              <div className="text-lg font-bold text-gray-900">+{selectedReport.metricsSnapshot.tasks.createdInPeriod}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedReport.metricsSnapshot.workforce && (
                        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4"><Users className="w-3 h-3 text-emerald-500" /> Workforce</h4>
                          
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-black text-gray-900">{selectedReport.metricsSnapshot.workforce.aiUtilization}%</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Utilization</span>
                          </div>
                          
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedReport.metricsSnapshot.workforce.aiUtilization}%` }} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Humans</div>
                              <div className="text-lg font-bold text-gray-900">{selectedReport.metricsSnapshot.workforce.humanCount}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Agents</div>
                              <div className="text-lg font-bold text-gray-900">{selectedReport.metricsSnapshot.workforce.aiCount}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedReport.metricsSnapshot.knowledge && (
                        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4"><Database className="w-3 h-3 text-amber-500" /> Knowledge Base</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Indexed Docs</span>
                              <span className="text-sm font-black text-gray-900">{selectedReport.metricsSnapshot.knowledge.totalDocuments}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Extracted Facts</span>
                              <span className="text-sm font-black text-gray-900">{selectedReport.metricsSnapshot.knowledge.totalIntelligenceFacts}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Brain Insights</span>
                              <span className="text-sm font-black text-gray-900">{selectedReport.metricsSnapshot.knowledge.totalBrainInsights}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
