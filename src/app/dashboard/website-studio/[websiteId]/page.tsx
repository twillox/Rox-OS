'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Layout,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Tag,
  ExternalLink,
  Monitor,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import {
  Product,
  Collection,
  Order,
  Customer,
  Discount,
  ActivityEvent,
  CommerceStats,
  OrderStatus,
  PaymentStatus
} from './commerce-types';

import DashboardOverview from './components/DashboardOverview';
import ProductsManager from './components/ProductsManager';
import CollectionsManager from './components/CollectionsManager';
import OrdersManager from './components/OrdersManager';
import CustomersManager from './components/CustomersManager';
import DiscountsManager from './components/DiscountsManager';

type ActiveNavSection = 'dashboard' | 'products' | 'collections' | 'orders' | 'customers' | 'discounts';

export default function WebsiteDashboard() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;

  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveNavSection>('dashboard');
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(true);

  // Commerce Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<CommerceStats>({
    totalVisitors: 0,
    livePages: 0,
    cmsRecords: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSales: 0,
    activeDiscounts: 0
  });

  const [commerceLoading, setCommerceLoading] = useState(true);

  // 1. Fetch Website Details
  useEffect(() => {
    const fetchWebsite = async () => {
      try {
        const res = await fetch(`/api/os/websites/editor?websiteId=${websiteId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.website) {
            setWebsite(data.website);
            setLoading(false);
            return;
          }
        }
        const db = getFirestore(app);
        const docRef = doc(db, 'websites', websiteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWebsite({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      } catch (e) {
        console.error('Fetch website error:', e);
        setLoading(false);
      }
    };
    fetchWebsite();
  }, [websiteId]);

  // 2. Fetch Commerce Data
  const fetchCommerceData = useCallback(async () => {
    try {
      setCommerceLoading(true);
      const res = await fetch(`/api/os/websites/${websiteId}/commerce`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCollections(data.collections || []);
        setOrders(data.orders || []);
        setCustomers(data.customers || []);
        setDiscounts(data.discounts || []);
        setActivities(data.activities || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Fetch commerce error:', e);
    } finally {
      setCommerceLoading(false);
    }
  }, [websiteId]);

  useEffect(() => {
    if (websiteId) {
      fetchCommerceData();
    }
  }, [websiteId, fetchCommerceData]);

  // Generic API Mutation Dispatcher
  const dispatchCommerceAction = async (action: string, payload: any) => {
    try {
      const res = await fetch(`/api/os/websites/${websiteId}/commerce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        await fetchCommerceData();
      } else {
        const err = await res.json();
        console.error('Action failed:', err);
      }
    } catch (e) {
      console.error('Dispatch error:', e);
    }
  };

  // Product Actions
  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (productData.id) {
      await dispatchCommerceAction('update_product', productData);
    } else {
      await dispatchCommerceAction('create_product', productData);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await dispatchCommerceAction('delete_product', { id: productId });
  };

  // Collection Actions
  const handleSaveCollection = async (collectionData: Partial<Collection>) => {
    if (collectionData.id) {
      await dispatchCommerceAction('update_collection', collectionData);
    } else {
      await dispatchCommerceAction('create_collection', collectionData);
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await dispatchCommerceAction('delete_collection', { id: collectionId });
  };

  // Order Actions
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus
  ) => {
    await dispatchCommerceAction('update_order_status', { id: orderId, status, paymentStatus });
  };

  const handleCreateOrder = async (orderPayload: any) => {
    await dispatchCommerceAction('create_order', orderPayload);
  };

  // Customer Actions
  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    if (customerData.id) {
      await dispatchCommerceAction('update_customer', customerData);
    } else {
      await dispatchCommerceAction('create_customer', customerData);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    await dispatchCommerceAction('delete_customer', { id: customerId });
  };

  // Discount Actions
  const handleSaveDiscount = async (discountData: Partial<Discount>) => {
    if (discountData.id) {
      await dispatchCommerceAction('update_discount', discountData);
    } else {
      await dispatchCommerceAction('create_discount', discountData);
    }
  };

  const handleToggleDiscount = async (discountId: string) => {
    await dispatchCommerceAction('toggle_discount', { id: discountId });
  };

  const handleDeleteDiscount = async (discountId: string) => {
    await dispatchCommerceAction('delete_discount', { id: discountId });
  };

  // Direct Navigation to Order from Customer Modal
  const handleOpenOrderFromCustomer = (order: Order) => {
    setActiveTab('orders');
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-gray-600">Loading Dashboard...</span>
      </div>
    );
  }

  if (!website) {
    return <div className="p-8 flex items-center justify-center h-full text-red-500 font-bold">Website not found.</div>;
  }

  return (
    <div className="flex h-full bg-[#FAFAFA] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0 shadow-xs z-20">
        {/* Header / Project Branding */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3.5">
          <button
            onClick={() => router.push('/dashboard/website-studio')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            title="Back to Website Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-gray-900 truncate tracking-tight">{website.name}</h1>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {website.status || 'Active'}
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          {/* OVERVIEW GROUP */}
          <div>
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Overview
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <Layout className="w-4 h-4 text-indigo-600" /> Dashboard
            </button>
          </div>

          {/* COMMERCE GROUP */}
          <div>
            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Commerce
            </div>

            {/* Products (Expandable Sub-Tree) */}
            <div>
              <button
                onClick={() => {
                  setIsProductsMenuOpen(!isProductsMenuOpen);
                  if (activeTab !== 'products' && activeTab !== 'collections') {
                    setActiveTab('products');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'products' || activeTab === 'collections'
                    ? 'bg-indigo-50/60 text-indigo-900 font-black'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Products</span>
                </div>
                {isProductsMenuOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>

              {/* Sub-Items: All Products & Collections */}
              {isProductsMenuOpen && (
                <div className="pl-6 pr-1 mt-1 space-y-1 border-l-2 border-indigo-100 ml-4">
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'products'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" /> All Products
                  </button>

                  <button
                    onClick={() => setActiveTab('collections')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'collections'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Collections
                  </button>
                </div>
              )}
            </div>

            {/* Orders */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 mt-1 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'orders'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Orders</span>
              </div>
              {orders.length > 0 && (
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>

            {/* Customers */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 mt-1 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'customers'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Customers</span>
              </div>
              {customers.length > 0 && (
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full">
                  {customers.length}
                </span>
              )}
            </button>

            {/* Discounts */}
            <button
              onClick={() => setActiveTab('discounts')}
              className={`w-full flex items-center justify-between px-3 py-2.5 mt-1 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'discounts'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Discounts</span>
              </div>
              {discounts.filter((d) => d.isActive).length > 0 && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                  {discounts.filter((d) => d.isActive).length} active
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Website Studio Link in Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => router.push(`/dashboard/website-studio/${website.id}/editor`)}
            className="w-full py-2.5 px-3 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 border border-gray-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-600" /> Launch Website Studio
          </button>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-16 border-b border-gray-200 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black text-gray-900 tracking-tight capitalize">
              {activeTab === 'products'
                ? 'Products Catalog'
                : activeTab === 'collections'
                ? 'Product Collections'
                : activeTab === 'orders'
                ? 'Customer Orders'
                : activeTab === 'customers'
                ? 'Customers Directory'
                : activeTab === 'discounts'
                ? 'Promotional Discounts'
                : 'Project Overview'}
            </h2>
            {commerceLoading && (
              <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/website-studio/${website.id}/preview`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Live Store
            </button>
            <button
              onClick={() => router.push(`/dashboard/website-studio/${website.id}/editor`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-white shadow-xs shadow-indigo-200 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5" /> Edit Website
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                stats={stats}
                activities={activities}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'products' || tab === 'collections') {
                    setIsProductsMenuOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'products' && (
              <ProductsManager
                products={products}
                collections={collections}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'collections' && (
              <CollectionsManager
                collections={collections}
                products={products}
                onSaveCollection={handleSaveCollection}
                onDeleteCollection={handleDeleteCollection}
                onSaveProduct={handleSaveProduct}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersManager
                orders={orders}
                products={products}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onCreateOrder={handleCreateOrder}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersManager
                customers={customers}
                orders={orders}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onOpenOrder={handleOpenOrderFromCustomer}
              />
            )}

            {activeTab === 'discounts' && (
              <DiscountsManager
                discounts={discounts}
                collections={collections}
                products={products}
                onSaveDiscount={handleSaveDiscount}
                onToggleDiscount={handleToggleDiscount}
                onDeleteDiscount={handleDeleteDiscount}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
