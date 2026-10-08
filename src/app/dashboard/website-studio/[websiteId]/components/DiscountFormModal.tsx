'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Percent, DollarSign, Truck, Calendar, Users, Folder } from 'lucide-react';
import { Discount, DiscountType, Collection, Product } from '../commerce-types';

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (discountData: Partial<Discount>) => Promise<void>;
  discount?: Discount | null;
  collections: Collection[];
  products: Product[];
}

export default function DiscountFormModal({
  isOpen,
  onClose,
  onSave,
  discount,
  collections,
  products
}: DiscountFormModalProps) {
  const isEditing = Boolean(discount);

  const [code, setCode] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState('20');
  const [minOrderValue, setMinOrderValue] = useState('50');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('500');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerEligibility, setCustomerEligibility] = useState<'all' | 'vip' | 'new'>('all');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const monthLater = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];

    if (discount) {
      setCode(discount.code || '');
      setType(discount.type || 'percentage');
      setValue(discount.value !== undefined ? discount.value.toString() : '20');
      setMinOrderValue(discount.minOrderValue ? discount.minOrderValue.toString() : '');
      setMaxDiscountAmount(discount.maxDiscountAmount ? discount.maxDiscountAmount.toString() : '');
      setUsageLimit(discount.usageLimit ? discount.usageLimit.toString() : '');
      setStartDate(discount.startDate || today);
      setEndDate(discount.endDate || monthLater);
      setCustomerEligibility(discount.customerEligibility || 'all');
      setSelectedCollections(discount.applicableCollections || []);
      setIsActive(discount.isActive !== false);
    } else {
      setCode('SUMMER20');
      setType('percentage');
      setValue('20');
      setMinOrderValue('50');
      setMaxDiscountAmount('100');
      setUsageLimit('500');
      setStartDate(today);
      setEndDate(monthLater);
      setCustomerEligibility('all');
      setSelectedCollections([]);
      setIsActive(true);
    }
  }, [discount, isOpen]);

  if (!isOpen) return null;

  const toggleCollection = (colId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: discount?.id,
        code: code.trim().toUpperCase(),
        type,
        value: type === 'free_shipping' ? 0 : parseFloat(value) || 0,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
        startDate,
        endDate,
        customerEligibility,
        applicableCollections: selectedCollections,
        isActive
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {isEditing ? 'Edit Discount Code' : 'Create Discount Code'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Set promotional coupons, minimum order limits, and valid timeframes.
              </p>
            </div>
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
          {/* Code & Active Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Discount Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20, WELCOME10"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black tracking-wider text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-mono"
              />
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Discount Type Selector */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">Discount Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('percentage')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  type === 'percentage'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Percent className="w-4 h-4" /> Percentage
              </button>
              <button
                type="button"
                onClick={() => setType('fixed_amount')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  type === 'fixed_amount'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Fixed Amount
              </button>
              <button
                type="button"
                onClick={() => setType('free_shipping')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  type === 'free_shipping'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4" /> Free Shipping
              </button>
            </div>
          </div>

          {/* Value and Limits */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
            {type !== 'free_shipping' && (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {type === 'percentage' ? 'Percentage (% Off)' : 'Amount ($ Off)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={type === 'percentage' ? 100 : undefined}
                  step="0.1"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Min Order ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Usage Limit</label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Customer Eligibility & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Eligibility</label>
              <select
                value={customerEligibility}
                onChange={(e) => setCustomerEligibility(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers Only</option>
                <option value="new">First-Time Customers</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Applicable Collections */}
          {collections.length > 0 && (
            <div className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-100">
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Applicable Collections (Leave empty for All Store)
              </label>
              <div className="flex flex-wrap gap-2">
                {collections.map((col) => {
                  const isChecked = selectedCollections.includes(col.id);
                  return (
                    <button
                      type="button"
                      key={col.id}
                      onClick={() => toggleCollection(col.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {col.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              disabled={saving || !code.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
