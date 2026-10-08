'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Search, Filter, BookOpen, Database, BrainCircuit, Activity, Globe, Loader2, X, FileText, Clock, User, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeUploader } from '@/components/ui/os/KnowledgeUploader';

export default function KnowledgeBasePage() {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  
  // Modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const fetchKnowledge = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department) params.append('department', department);
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    fetch(`/api/os/knowledge?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setKnowledge(d.data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [search, department, type, status]);

  // Initial load & when filters change
  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchKnowledge();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchKnowledge]);

  const getSourceIcon = (sourceType: string) => {
    switch(sourceType?.toUpperCase()) {
      case 'WEBSITE': return <Globe className="w-5 h-5 text-indigo-600" />;
      case 'DOCUMENT': return <BookOpen className="w-5 h-5 text-emerald-600" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (docStatus: string) => {
    switch(docStatus?.toUpperCase()) {
      case 'UPLOADING':
      case 'PROCESSING': 
      case 'INDEXING':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-sm">
            <Loader2 className="w-3 h-3 animate-spin" /> {docStatus}
          </span>
        );
      case 'AVAILABLE':
        return (
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm">
            AVAILABLE
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
            {docStatus || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-10 bg-[#FAFAFA] text-gray-900 overflow-hidden relative">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-indigo-600" />
            Knowledge Base
          </h1>
          <p className="text-gray-500 text-base font-medium">Manage and monitor organizational documents and unstructured knowledge.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search metadata or summaries..." 
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all w-72 text-gray-900 placeholder-gray-400 font-medium shadow-sm"
            />
          </div>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Types</option>
            <option value="DOCUMENT">Document</option>
            <option value="WEBSITE">Website</option>
          </select>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="PROCESSING">Processing</option>
            <option value="UPLOADING">Uploading</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
        {/* Manual Ingestion */}
        <div className="max-w-2xl">
          <KnowledgeUploader onComplete={() => fetchKnowledge()} />
        </div>

        {/* Knowledge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">
        {loading ? (
          <div className="col-span-full p-16 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="font-semibold text-xs uppercase tracking-widest">Querying Knowledge Base...</span>
          </div>
        ) : knowledge.length === 0 ? (
          <div className="col-span-full p-16 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-500 font-medium">Try adjusting your filters or upload a new document.</p>
          </div>
        ) : (
          <AnimatePresence>
            {knowledge.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedDoc(item)}
                className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg hover:border-indigo-300 transition-all flex flex-col group cursor-pointer relative overflow-hidden"
              >
                {/* Loader overlay if processing */}
                {['PROCESSING', 'INDEXING', 'UPLOADING'].includes(item.status) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                     <div className="bg-white border border-indigo-100 shadow-lg rounded-2xl p-4 flex flex-col items-center">
                       <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                       <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-800">{item.status}</span>
                     </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-indigo-50 transition-colors">
                    {getSourceIcon(item.type)}
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">{item.title}</h3>
                <p className="text-xs text-gray-500 font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {item.aiSummary}
                </p>
                
                <div className="flex justify-between items-end mt-auto border-t border-gray-100 pt-4">
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Department</span>
                     <span className="text-xs font-semibold text-gray-700">{item.department}</span>
                   </div>
                   <div className="flex flex-col gap-1 text-right">
                     <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Size</span>
                     <span className="text-xs font-semibold text-gray-700">
                        {item.fileSize ? (item.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}
                     </span>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-10"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white shadow-sm border border-gray-200 rounded-xl">
                    {getSourceIcon(selectedDoc.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDoc.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      {getStatusBadge(selectedDoc.status)}
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedDoc.type}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 flex gap-8">
                {/* Left Col: Summary & Data */}
                <div className="flex-1 space-y-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4" /> AI Summary & Extraction
                    </h3>
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm text-gray-800 leading-relaxed font-medium">
                      {selectedDoc.aiSummary}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Source Reference
                    </h3>
                    {selectedDoc.sourceUrl ? (
                      <a href={selectedDoc.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                        {selectedDoc.sourceUrl}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Direct File Upload</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Metadata Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoc.tags?.length > 0 ? selectedDoc.tags.map((t: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                          {t}
                        </span>
                      )) : <span className="text-sm text-gray-400 italic">No tags assigned.</span>}
                    </div>
                  </div>
                </div>

                {/* Right Col: Metadata Properties */}
                <div className="w-72 space-y-6">
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><FolderOpen className="w-3 h-3" /> Department</div>
                      <div className="text-sm font-bold text-gray-900">{selectedDoc.department}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Uploaded By</div>
                      <div className="text-sm font-bold text-gray-900">{selectedDoc.uploaderId}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Upload Date</div>
                      <div className="text-sm font-bold text-gray-900">
                        {selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Last Updated</div>
                      <div className="text-sm font-bold text-gray-900">
                        {selectedDoc.updatedAt ? new Date(selectedDoc.updatedAt).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Database className="w-3 h-3" /> File Size</div>
                      <div className="text-sm font-bold text-gray-900">
                        {selectedDoc.fileSize ? (selectedDoc.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
