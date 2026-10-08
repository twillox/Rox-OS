export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductVariant {
  name: string; // e.g. "Size", "Color"
  options: string[]; // e.g. ["S", "M", "L", "XL"]
}

export interface Product {
  id: string;
  websiteId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  status: ProductStatus;
  category: string;
  collections: string[]; // Array of collection IDs
  image: string;
  variants: ProductVariant[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  websiteId: string;
  title: string;
  slug: string;
  description: string;
  image?: string;
  productIds: string[]; // Array of product IDs
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface OrderItem {
  productId?: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#1001"
  websiteId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'active' | 'vip' | 'inactive';

export interface Customer {
  id: string;
  websiteId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderId?: string;
  lastOrderDate?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Discount {
  id: string;
  websiteId: string;
  code: string; // e.g. "SUMMER20"
  type: DiscountType;
  value: number; // e.g. 20 for 20% or 15 for $15
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate: string;
  endDate: string;
  applicableProducts?: string[]; // IDs or empty for all
  applicableCollections?: string[]; // IDs or empty for all
  customerEligibility: 'all' | 'vip' | 'new';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  websiteId: string;
  type:
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'collection_created'
    | 'collection_updated'
    | 'order_received'
    | 'order_status_changed'
    | 'customer_registered'
    | 'discount_created'
    | 'discount_activated'
    | 'discount_disabled';
  title: string;
  description: string;
  entityId?: string;
  createdAt: string;
}

export interface CommerceStats {
  totalVisitors: number;
  livePages: number;
  cmsRecords: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  activeDiscounts: number;
}
