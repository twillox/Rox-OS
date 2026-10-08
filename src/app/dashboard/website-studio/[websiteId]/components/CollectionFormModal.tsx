'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import { Collection, Product } from '../commerce-types';

interface CollectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionData: Partial<Collection>) => Promise<void>;
  collection?: Collection | null;
  products: Product[];
}

const PRESET_COLLECTIONS = [
  { label: 'Summer Breeze', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800' },
  { label: 'Minimalist Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
  { label: 'Urban Streetwear', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800' },
  { label: 'Luxury Essentials', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800' }
];

export default function CollectionFormModal({
  isOpen,
  onClose,
  onSave,
  collection,
  products
}: CollectionFormModalProps) {
  const isEditing = Boolean(collection);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PRESET_COLLECTIONS[0].url);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (collection) {
      setTitle(collection.title || '');
      setDescription(collection.description || '');
      setImage(collection.image || PRESET_COLLECTIONS[0].url);
      setSelectedProductIds(collection.productIds || []);
    } else {
      setTitle('');
      setDescription('');
      setImage(PRESET_COLLECTIONS[0].url);
      setSelectedProductIds([]);
    }
  }, [collection, isOpen]);

  if (!isOpen) return null;

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: collection?.id,
        title: title.trim(),
        description: description.trim(),
        image,
        productIds: selectedProductIds
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isEditing ? 'Edit Collection' : 'Create New Collection'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Group your products into curated categories like Summer, Best Sellers, etc.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Collection Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Collection, New Arrivals"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of this collection..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Image */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Cover Image</label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Presets:
              </span>
              {PRESET_COLLECTIONS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setImage(p.url)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                    image === p.url
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">
                Products in this Collection ({selectedProductIds.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedProductIds.length === products.length) {
                    setSelectedProductIds([]);
                  } else {
                    setSelectedProductIds(products.map((p) => p.id));
                  }
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {selectedProductIds.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-gray-400 p-4 border border-dashed border-gray-200 rounded-xl text-center">
                No products found. Add products first to include them here.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl divide-y divide-gray-100">
                {products.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isChecked ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-400">
                            ${p.price.toFixed(2)} • SKU: {p.sku}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
