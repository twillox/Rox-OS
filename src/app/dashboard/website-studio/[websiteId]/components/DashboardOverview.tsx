'use client';

import React from 'react';
import {
  Users,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Eye,
  FileText,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CommerceStats, ActivityEvent } from '../commerce-types';

interface DashboardOverviewProps {
  stats: CommerceStats;
  activities: ActivityEvent[];
  onNavigateTab: (tab: 'products' | 'collections' | 'orders' | 'customers' | 'discounts') => void;
}

export default function DashboardOverview({
  stats,
  activities,
  onNavigateTab
}: DashboardOverviewProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_received':
      case 'order_status_changed':
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />;
      case 'product_created':
      case 'product_updated':
      case 'product_deleted':
        return <Package className="w-3.5 h-3.5 text-emerald-600" />;
      case 'collection_created':
      case 'collection_updated':
        return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      case 'customer_registered':
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'discount_created':
      case 'discount_activated':
      case 'discount_disabled':
        return <Tag className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Commerce Overview Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Commerce Performance
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Store Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              ${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Calculated from completed orders
            </div>
          </div>

          {/* Total Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
              {stats.totalOrders}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-gray-400 group-hover:text-indigo-600 flex items-center gap-1">
              Click to view all orders <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

          {/* Total Products */}
          <div
            onClick={() => onNavigateTab('products')}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
              {stats.totalProducts}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-gray-400 group-hover:text-indigo-600 flex items-center gap-1">
              Click to manage catalog <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>

          {/* Total Customers */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
              {stats.totalCustomers}
            </div>
            <div className="mt-2 text-[11px] font-semibold text-gray-400 group-hover:text-indigo-600 flex items-center gap-1">
              Click to view directory <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Website & Content Statistics */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
          Store & CMS Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
              <Eye className="w-3.5 h-3.5" /> Total Visitors
            </div>
            <div className="text-xl font-black text-gray-900">{stats.totalVisitors}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
              <FileText className="w-3.5 h-3.5" /> Live Pages
            </div>
            <div className="text-xl font-black text-gray-900">{stats.livePages}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
              <Database className="w-3.5 h-3.5" /> CMS Records
            </div>
            <div className="text-xl font-black text-gray-900">{stats.cmsRecords}</div>
          </div>

          <div
            onClick={() => onNavigateTab('discounts')}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" /> Active Discounts
            </div>
            <div className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
              {stats.activeDiscounts}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Functional Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launchpad */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full p-3 bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold text-gray-800 hover:text-indigo-700 transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" /> Add New Product
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigateTab('collections')}
              className="w-full p-3 bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold text-gray-800 hover:text-indigo-700 transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" /> Curate Collections
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigateTab('discounts')}
              className="w-full p-3 bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold text-gray-800 hover:text-indigo-700 transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" /> Launch Promo Coupon
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              onClick={() => onNavigateTab('orders')}
              className="w-full p-3 bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold text-gray-800 hover:text-indigo-700 transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Review Customer Orders
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Functional Recent Activity Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Recent Activity
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {activities.length} Recorded Events
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-80 divide-y divide-gray-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No recent activity recorded yet.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-lg mt-0.5 shrink-0">
                      {getActivityIcon(act.type)}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">{act.title}</span>
                      <span className="text-gray-500 text-[11px] block mt-0.5">{act.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {getTimeAgo(act.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
