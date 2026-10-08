'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Loader2, Link as LinkIcon, Globe } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export function KnowledgeUploader({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [mode, setMode] = useState<'file' | 'url'>('file');
  
  const businessId = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('businessId='))?.split('=')[1]
      : null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const activeBizId = businessId || 'system';
    
    if (mode === 'file' && files.length === 0) return;
    if (mode === 'url' && !urlInput.trim()) return;

    setIsProcessing(true);
    setStatus('Initializing ingestion...');
    
    try {
      if (mode === 'file') {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('businessId', activeBizId);
          formData.append('uploaderId', user?.uid || 'System');
          formData.append('sourceTitle', file.name);

          setStatus(`Processing ${file.name}...`);
          const ingestRes = await fetch('/api/os/knowledge/ingest', {
             method: 'POST',
             body: formData
          });

          if (!ingestRes.ok) {
             const errorData = await ingestRes.json().catch(() => null);
             throw new Error(errorData?.error || `Failed to ingest ${file.name}`);
          }
        }
      } else if (mode === 'url') {
        setStatus(`Scraping website: ${urlInput}...`);
        const scrapeRes = await fetch('/api/os/knowledge/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput })
        });
        
        if (!scrapeRes.ok) throw new Error('Failed to scrape website');
      }
      
      setStatus('Complete!');
      setTimeout(() => {
         setFiles([]);
         setUrlInput('');
         setStatus('');
         setIsProcessing(false);
         if (onComplete) onComplete();
      }, 2000);

    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || 'Upload failed. Please try again.'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-600" /> Ingest Knowledge
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setMode('file')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            File
          </button>
          <button 
            onClick={() => setMode('url')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Website
          </button>
        </div>
      </div>
      
      {mode === 'file' ? (
        <div 
          onDragOver={e => e.preventDefault()} 
          onDrop={handleFileDrop}
          className="w-full rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center p-8 bg-gray-50/50 group cursor-pointer relative"
        >
          <input 
            type="file" 
            multiple 
            onChange={(e) => {
              if (e.target.files) {
                setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-indigo-500 mb-3 transition-colors" />
          <p className="text-gray-900 font-bold mb-1 group-hover:text-indigo-700">Drag & Drop Documents</p>
          <p className="text-gray-500 text-xs text-center font-medium">PDF, DOCX, TXT, CSV</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative">
            <Globe className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input 
              type="url"
              placeholder="https://example.com"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-900 font-medium"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1">The AI will scrape the URL, read the semantic content, and extract structural facts.</p>
        </div>
      )}

      {mode === 'file' && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-700 truncate max-w-[200px]">{f.name}</span>
                <span className="text-gray-400 text-xs">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
              </div>
              {!isProcessing && (
                 <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {((mode === 'file' && files.length > 0) || (mode === 'url' && urlInput.trim().length > 0)) && (
        <button 
          onClick={handleUpload}
          disabled={isProcessing}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {status || 'Processing...'}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Ingest to Brain
            </>
          )}
        </button>
      )}
    </div>
  );
}

