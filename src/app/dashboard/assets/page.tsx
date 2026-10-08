'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, FileText, UploadCloud, Video, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssetLibraryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/os/assets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssets(data.data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading Asset Library...</div>;
  }

  const getIcon = (tags: string[]) => {
    if (tags.includes('image')) return <ImageIcon className="w-5 h-5 text-amber-400" />;
    if (tags.includes('video')) return <Video className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="h-full w-full flex flex-col p-8 bg-[#FAFAFA] text-gray-900 overflow-hidden">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-amber-500" />
            Asset Library
          </h1>
          <p className="text-gray-500 text-lg">Central repository for media, brand guidelines, and documents.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-gray-900 rounded-xl transition-colors font-medium">
          <UploadCloud className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-max">
        <AnimatePresence>
          {assets.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-gray-100 border-dashed rounded-3xl bg-white">
              <UploadCloud className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Assets Uploaded</h3>
              <p className="text-gray-500">Upload media and documents for your AI workforce to utilize.</p>
            </div>
          ) : (
            assets.map((asset, idx) => (
              <motion.div 
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 hover:border-white/20 transition-all flex flex-col group cursor-pointer relative overflow-hidden"
              >
                <div className="aspect-square bg-gray-50 rounded-xl mb-4 flex items-center justify-center border border-gray-100 group-hover:border-amber-500/30 transition-colors">
                  {getIcon(asset.tags)}
                </div>
                
                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{asset.title}</h3>
                <p className="text-xs text-gray-500 truncate mb-3">Added {new Date(asset.createdAt).toLocaleDateString()}</p>
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white hover:bg-white rounded-lg text-gray-900 border border-gray-200 shadow-xl">
                    <Download className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
                  {asset.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-white text-[10px] uppercase font-bold text-gray-500 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
