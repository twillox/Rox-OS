'use client';

import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar, Edit2, Check, ArrowRight } from 'lucide-react';
import { Customer, Order, CustomerStatus } from '../commerce-types';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  orders: Order[];
  onOpenOrder: (order: Order) => void;
  onUpdateCustomer: (data: Partial<Customer>) => Promise<void>;
}

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  customer,
  orders,
  onOpenOrder,
  onUpdateCustomer
}: CustomerDetailsModalProps) {
  if (!isOpen || !customer) return null;

  // Filter orders for this customer
  const customerOrders = orders.filter(
    (o) => o.customerId === customer.id || o.customerEmail.toLowerCase() === customer.email.toLowerCase()
  );

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);
  const [status, setStatus] = useState<CustomerStatus>(customer.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateCustomer({
        id: customer.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        status
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (st: CustomerStatus) => {
    switch (st) {
      case 'vip':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">{customer.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(customer.status)}`}>
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Customer since{' '}
                {new Date(customer.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Key Commerce Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/70">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-1">
                Total Spent
              </span>
              <span className="text-xl font-black text-indigo-900">
                ${customer.totalSpent.toFixed(2)}
              </span>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/70">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block mb-1">
                Total Orders
              </span>
              <span className="text-xl font-black text-emerald-900">
                {customerOrders.length || customer.ordersCount}
              </span>
            </div>
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/70">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block mb-1">
                Avg. Order
              </span>
              <span className="text-xl font-black text-purple-900">
                $
                {customerOrders.length > 0
                  ? (customer.totalSpent / customerOrders.length).toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </div>

          {/* Customer Contact & Address Info */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Contact Details
            </h4>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Email</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" /> {customer.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Phone</span>
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" /> {customer.phone || 'N/A'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400 block mb-0.5">Shipping Address</span>
                  <span className="font-semibold text-gray-800 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /> {customer.address || 'Standard Address'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Order History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Order History ({customerOrders.length})
              </h4>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                No orders placed yet by this customer.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => onOpenOrder(ord)}
                    className="p-3.5 flex items-center justify-between hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600 group-hover:text-indigo-800">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {ord.status}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {ord.paymentStatus}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(ord.createdAt).toLocaleDateString()} • {ord.items.length} items
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-gray-900">
                        ${ord.total.toFixed(2)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
