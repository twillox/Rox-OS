'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Product, Collection, ProductStatus, ProductVariant } from '../commerce-types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  product?: Product | null;
  collections: Collection[];
}

const PRESET_IMAGES = [
  { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' },
  { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800' },
  { label: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800' },
  { label: 'Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
  { label: 'Perfume', url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800' },
  { label: 'Eyewear', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800' },
  { label: 'T-Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800' }
];

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  product,
  collections
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('99.00');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('25');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [category, setCategory] = useState('General');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [tagsInput, setTagsInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '0');
      setCompareAtPrice(product.compareAtPrice ? product.compareAtPrice.toString() : '');
      setSku(product.sku || '');
      setStock(product.stock !== undefined ? product.stock.toString() : '0');
      setStatus(product.status || 'active');
      setCategory(product.category || 'General');
      setSelectedCollections(product.collections || []);
      setImage(product.image || PRESET_IMAGES[0].url);
      setTagsInput((product.tags || []).join(', '));
      setVariants(product.variants || []);
    } else {
      setName('');
      setDescription('');
      setPrice('99.00');
      setCompareAtPrice('129.00');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setStock('25');
      setStatus('active');
      setCategory('Apparel');
      setSelectedCollections([]);
      setImage(PRESET_IMAGES[0].url);
      setTagsInput('trending, popular');
      setVariants([
        { name: 'Size', options: ['S', 'M', 'L', 'XL'] }
      ]);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const toggleCollection = (colId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { name: 'Color', options: ['Black', 'White'] }]);
  };

  const updateVariantName = (idx: number, val: string) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx].name = val;
      return copy;
    });
  };

  const updateVariantOptions = (idx: number, optionsStr: string) => {
    const opts = optionsStr.split(',').map((o) => o.trim()).filter(Boolean);
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx].options = opts;
      return copy;
    });
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        id: product?.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        sku: sku.trim(),
        stock: parseInt(stock, 10) || 0,
        status,
        category: category.trim(),
        collections: selectedCollections,
        image,
        variants,
        tags
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Fill in product details, pricing, inventory, and assign to collections.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nike Air Max 90"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe product highlights, materials, and benefits..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Compare-at ($)</label>
              <input
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="NK-AIR-001"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Stock Qty</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Product Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="active">Active (Visible in store)</option>
                <option value="draft">Draft (Work in progress)</option>
                <option value="archived">Archived (Hidden)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Footwear, Apparel, Tech"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Product Image */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Product Image URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            {/* Image Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Presets:
              </span>
              {PRESET_IMAGES.map((p) => (
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

          {/* Collections Selector */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60">
            <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 block mb-2">
              Assign to Collections
            </label>
            {collections.length === 0 ? (
              <p className="text-xs text-gray-500">
                No collections available. You can create collections in the Collections tab!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {collections.map((col) => {
                  const isChecked = selectedCollections.includes(col.id);
                  return (
                    <label
                      key={col.id}
                      onClick={() => toggleCollection(col.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-indigo-100/80 border-indigo-300 text-indigo-900 font-bold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent click
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs truncate">{col.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700">Product Variants</label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>
            {variants.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">
                No variants configured. Click "+ Add Option" to add Size, Color, etc.
              </p>
            ) : (
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariantName(idx, e.target.value)}
                      placeholder="Option (e.g. Size)"
                      className="w-28 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={(v.options || []).join(', ')}
                      onChange={(e) => updateVariantOptions(idx, e.target.value)}
                      placeholder="Values separated by commas: S, M, L, XL"
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Product Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. streetwear, trending, unisex, sale"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
              disabled={saving || !name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {saving ? 'Saving Product...' : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
