'use client';

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Discount, DiscountType, Collection, Product } from '../commerce-types';
import DiscountFormModal from './DiscountFormModal';

interface DiscountsManagerProps {
  discounts: Discount[];
  collections: Collection[];
  products: Product[];
  onSaveDiscount: (discountData: Partial<Discount>) => Promise<void>;
  onToggleDiscount: (discountId: string) => Promise<void>;
  onDeleteDiscount: (discountId: string) => Promise<void>;
}

export default function DiscountsManager({
  discounts,
  collections,
  products,
  onSaveDiscount,
  onToggleDiscount,
  onDeleteDiscount
}: DiscountsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | DiscountType>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered Discounts
  const filteredDiscounts = useMemo(() => {
    return discounts
      .filter((d) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!d.code.toLowerCase().includes(q)) return false;
        }

        if (statusFilter === 'active' && !d.isActive) return false;
        if (statusFilter === 'inactive' && d.isActive) return false;

        if (typeFilter !== 'all' && d.type !== typeFilter) return false;

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [discounts, searchQuery, statusFilter, typeFilter]);

  const handleCreate = () => {
    setSelectedDiscount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (d: Discount) => {
    setSelectedDiscount(d);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteDiscount(id);
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeBadge = (type: DiscountType, value: number) => {
    switch (type) {
      case 'percentage':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            <Percent className="w-3 h-3" /> {value}% OFF
          </span>
        );
      case 'fixed_amount':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            <DollarSign className="w-3 h-3" /> ${value.toFixed(2)} OFF
          </span>
        );
      case 'free_shipping':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            <Truck className="w-3 h-3" /> Free Shipping
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-indigo-600" /> Discounts
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create promotional coupon codes, percentage reductions, fixed price cuts, and free delivery thresholds.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Discount
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by discount code (e.g. SUMMER20)..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white uppercase font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Discount Types</option>
              <option value="percentage">Percentage Discount</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredDiscounts.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No discounts found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'No promotional codes created yet.'}
            </p>
            {discounts.length === 0 && (
              <button
                onClick={handleCreate}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Create Coupon Code
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Requirements</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredDiscounts.map((disc) => (
                  <tr key={disc.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                          {disc.code}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4">{getTypeBadge(disc.type, disc.value)}</td>

                    {/* Requirements */}
                    <td className="py-3.5 px-4 text-gray-600">
                      {disc.minOrderValue ? (
                        <span>Min. spend: ${disc.minOrderValue.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">No minimum</span>
                      )}
                    </td>

                    {/* Usage */}
                    <td className="py-3.5 px-4 text-gray-700 font-medium">
                      {disc.usageCount} {disc.usageLimit ? `/ ${disc.usageLimit}` : 'uses'}
                    </td>

                    {/* Validity Dates */}
                    <td className="py-3.5 px-4 text-gray-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {disc.startDate} → {disc.endDate}
                      </span>
                    </td>

                    {/* Toggle Active Switch */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleDiscount(disc.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                          disc.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${disc.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {disc.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(disc)}
                          className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Edit Discount"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(disc.id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Discount"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Discount Form Modal */}
      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDiscount(null);
        }}
        onSave={onSaveDiscount}
        discount={selectedDiscount}
        collections={collections}
        products={products}
      />

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Delete Discount?</h3>
            <p className="text-xs text-gray-500 mt-1">
              Are you sure you want to delete this promotional coupon code? Customers will no longer be able to apply it at checkout.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
