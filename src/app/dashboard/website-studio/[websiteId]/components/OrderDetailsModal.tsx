'use client';

import React, { useState } from 'react';
import { X, Package, CheckCircle2, Clock, Truck, AlertCircle, RefreshCw, DollarSign, Calendar, MapPin, User, Mail, Phone } from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../commerce-types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (orderId: string, status: OrderStatus, paymentStatus: PaymentStatus) => Promise<void>;
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus
}: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [updating, setUpdating] = useState(false);
  const [updateSaved, setUpdateSaved] = useState(false);

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, status, paymentStatus);
      setUpdateSaved(true);
      setTimeout(() => setUpdateSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (st: OrderStatus) => {
    switch (st) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'refunded':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentBadge = (pst: PaymentStatus) => {
    switch (pst) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'refunded':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">
                  Order {order.orderNumber}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPaymentBadge(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Status Controls Bar */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveStatus}
              disabled={updating || (status === order.status && paymentStatus === order.paymentStatus)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {updateSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Updated!
                </>
              ) : (
                <>
                  <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} /> Update Status
                </>
              )}
            </button>
          </div>

          {/* Customer Information Section */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Customer Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Customer Name</span>
                <span className="font-bold text-gray-900">{order.customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Email</span>
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" /> {order.customerEmail}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> {order.customerPhone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Shipping Address</span>
                <span className="font-semibold text-gray-700 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /> {order.shippingAddress || 'Standard Shipping'}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Ordered Products ({order.items.length})
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200'}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-gray-400 font-medium">Variant: {item.variant}</p>
                      )}
                      <p className="text-[11px] text-gray-500">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-gray-900">
                      ${(item.subtotal || item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Financial Summary */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Financial Summary
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Discount {order.discountCode ? `(${order.discountCode})` : ''}
                  </span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping > 0 ? `$${order.shipping.toFixed(2)}` : 'Free Shipping'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-indigo-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
