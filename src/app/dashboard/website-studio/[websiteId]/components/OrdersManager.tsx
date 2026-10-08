'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Package,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, Product } from '../commerce-types';
import OrderDetailsModal from './OrderDetailsModal';

interface OrdersManagerProps {
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus: PaymentStatus) => Promise<void>;
  onCreateOrder: (orderPayload: any) => Promise<void>;
}

export default function OrdersManager({
  orders,
  products,
  onUpdateOrderStatus,
  onCreateOrder
}: OrdersManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'total_desc' | 'total_asc'>('newest');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = o.orderNumber.toLowerCase().includes(q);
          const matchCust = o.customerName.toLowerCase().includes(q);
          const matchEmail = o.customerEmail.toLowerCase().includes(q);
          if (!matchNum && !matchCust && !matchEmail) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;

        // Payment filter
        if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'total_desc') return b.total - a.total;
        if (sortBy === 'total_asc') return a.total - b.total;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, searchQuery, statusFilter, paymentFilter, sortBy]);

  const handleOpenDetails = (ord: Order) => {
    setSelectedOrder(ord);
    setIsDetailsOpen(true);
  };

  const handleCreateQuickTestOrder = async () => {
    setCreatingTestOrder(true);
    try {
      const sampleProd = products[0] || {
        id: 'prod_test',
        name: 'Standard Catalog Item',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200',
        price: 99.0
      };

      await onCreateOrder({
        customerName: 'Alex Morgan',
        customerEmail: 'alex.morgan@test.com',
        customerPhone: '+1 (555) 345-6789',
        shippingAddress: '450 California St, San Francisco, CA 94104',
        items: [
          {
            productId: sampleProd.id,
            name: sampleProd.name,
            image: sampleProd.image,
            quantity: 1,
            price: sampleProd.price,
            subtotal: sampleProd.price
          }
        ],
        subtotal: sampleProd.price,
        discount: 0,
        shipping: 10.0,
        tax: 8.72,
        total: sampleProd.price + 10.0 + 8.72,
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingTestOrder(false);
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
    <div className="w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-600" /> Orders
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track customer purchases, fulfillment progress, payment receipts, and delivery stages.
          </p>
        </div>

        <button
          onClick={handleCreateQuickTestOrder}
          disabled={creatingTestOrder}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> {creatingTestOrder ? 'Creating Order...' : 'Create Test Order'}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer name, email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="newest">Sort: Newest</option>
              <option value="total_desc">Total: High to Low</option>
              <option value="total_asc">Total: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No orders found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'No orders have been placed yet.'}
            </p>
            {orders.length === 0 && (
              <button
                onClick={handleCreateQuickTestOrder}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => handleOpenDetails(ord)}
                    className="hover:bg-gray-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Order Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-indigo-600 group-hover:text-indigo-800">
                        {ord.orderNumber}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(ord.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-gray-900 block">{ord.customerName}</span>
                        <span className="text-[10px] text-gray-400 block truncate max-w-[160px]">
                          {ord.customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Items Count */}
                    <td className="py-3.5 px-4 text-gray-600">
                      {ord.items.reduce((s, i) => s + i.quantity, 0)} {ord.items.length === 1 ? 'item' : 'items'}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPaymentBadge(ord.paymentStatus)}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>

                    {/* Order Fulfillment Status */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-gray-900">${ord.total.toFixed(2)}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 inline-flex items-center gap-1">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={onUpdateOrderStatus}
      />
    </div>
  );
}
