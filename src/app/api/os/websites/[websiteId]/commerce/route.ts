import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import {
  Product,
  Collection,
  Order,
  Customer,
  Discount,
  ActivityEvent,
  CommerceStats
} from '@/app/dashboard/website-studio/[websiteId]/commerce-types';

// In-memory fallback cache per websiteId to guarantee instant reactive persistence
const memoryCache: Record<
  string,
  {
    products: Product[];
    collections: Collection[];
    orders: Order[];
    customers: Customer[];
    discounts: Discount[];
    activities: ActivityEvent[];
  }
> = {};

function getInitialSeedData(websiteId: string) {
  const colSummerId = `col_summer_${websiteId.slice(-4)}`;
  const colBestSellersId = `col_bestsellers_${websiteId.slice(-4)}`;
  const colNewArrivalsId = `col_newarrivals_${websiteId.slice(-4)}`;

  const prod1Id = `prod_nike_${websiteId.slice(-4)}`;
  const prod2Id = `prod_hoodie_${websiteId.slice(-4)}`;
  const prod3Id = `prod_backpack_${websiteId.slice(-4)}`;
  const prod4Id = `prod_headphones_${websiteId.slice(-4)}`;

  const cust1Id = `cust_johndoe_${websiteId.slice(-4)}`;
  const cust2Id = `cust_janesmith_${websiteId.slice(-4)}`;

  const products: Product[] = [
    {
      id: prod1Id,
      websiteId,
      name: 'Nike Air Max 90 Pulse',
      description: 'Iconic street style with maximum visible Air cushioning and premium leather overlays.',
      price: 130.0,
      compareAtPrice: 160.0,
      sku: 'NK-AM90-BLK',
      stock: 45,
      status: 'active',
      category: 'Footwear',
      collections: [colNewArrivalsId, colBestSellersId],
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      variants: [
        { name: 'Size', options: ['US 8', 'US 9', 'US 10', 'US 11'] },
        { name: 'Color', options: ['Black/Crimson', 'Pure White'] }
      ],
      tags: ['footwear', 'sneakers', 'lifestyle', 'trending'],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: prod2Id,
      websiteId,
      name: 'Urban Heavyweight Hoodie',
      description: 'Ultra-soft 450gsm combed organic cotton with relaxed drop-shoulder silhouette.',
      price: 85.0,
      compareAtPrice: 100.0,
      sku: 'AP-HD-URB',
      stock: 28,
      status: 'active',
      category: 'Apparel',
      collections: [colSummerId, colBestSellersId],
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
      variants: [
        { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
        { name: 'Color', options: ['Washed Black', 'Sand Khaki', 'Heather Grey'] }
      ],
      tags: ['streetwear', 'hoodie', 'apparel', 'bestseller'],
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: prod3Id,
      websiteId,
      name: 'Minimalist Weatherproof Backpack',
      description: 'Commuter backpack crafted from recycled ballistic nylon with padded 16-inch laptop pocket.',
      price: 110.0,
      compareAtPrice: 135.0,
      sku: 'AC-BP-MIN',
      stock: 12,
      status: 'active',
      category: 'Accessories',
      collections: [colNewArrivalsId],
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
      variants: [
        { name: 'Color', options: ['Matte Black', 'Olive Drab'] }
      ],
      tags: ['accessories', 'bags', 'minimal', 'travel'],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: prod4Id,
      websiteId,
      name: 'Apex Studio Wireless Headphones',
      description: 'Audiophile-grade 40mm beryllium drivers, active hybrid noise cancellation, and 40h battery life.',
      price: 249.0,
      compareAtPrice: 299.0,
      sku: 'EL-HP-APX',
      stock: 8,
      status: 'active',
      category: 'Electronics',
      collections: [colBestSellersId],
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
      variants: [
        { name: 'Finish', options: ['Space Gray', 'Silver Metallic'] }
      ],
      tags: ['audio', 'wireless', 'premium', 'tech'],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
    }
  ];

  const collections: Collection[] = [
    {
      id: colSummerId,
      websiteId,
      title: 'Summer Collection',
      slug: 'summer-collection',
      description: 'Breezy essentials, light knits, and warm weather gear for everyday living.',
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
      productIds: [prod2Id],
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: colBestSellersId,
      websiteId,
      title: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Our most sought-after signature pieces voted by thousands of customers.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
      productIds: [prod1Id, prod2Id, prod4Id],
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: colNewArrivalsId,
      websiteId,
      title: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Fresh design drops and the latest arrivals straight from our design studio.',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=800',
      productIds: [prod1Id, prod3Id],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ];

  const customers: Customer[] = [
    {
      id: cust1Id,
      websiteId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      ordersCount: 3,
      totalSpent: 425.0,
      lastOrderId: '#1001',
      lastOrderDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'vip',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: cust2Id,
      websiteId,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      address: '120 Broadway Ave, Apt 4B, New York, NY 10005',
      ordersCount: 1,
      totalSpent: 130.0,
      lastOrderId: '#1002',
      lastOrderDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ];

  const orders: Order[] = [
    {
      id: `ord_1001_${websiteId.slice(-4)}`,
      orderNumber: '#1001',
      websiteId,
      customerId: cust1Id,
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+1 (555) 234-5678',
      shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
      items: [
        {
          productId: prod1Id,
          name: 'Nike Air Max 90 Pulse',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
          quantity: 1,
          price: 130.0,
          subtotal: 130.0,
          variant: 'US 10 / Black/Crimson'
        },
        {
          productId: prod2Id,
          name: 'Urban Heavyweight Hoodie',
          image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
          quantity: 1,
          price: 85.0,
          subtotal: 85.0,
          variant: 'L / Washed Black'
        }
      ],
      subtotal: 215.0,
      discount: 21.5,
      discountCode: 'WELCOME10',
      shipping: 10.0,
      tax: 16.28,
      total: 219.78,
      paymentStatus: 'paid',
      status: 'shipped',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: `ord_1002_${websiteId.slice(-4)}`,
      orderNumber: '#1002',
      websiteId,
      customerId: cust2Id,
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      customerPhone: '+1 (555) 987-6543',
      shippingAddress: '120 Broadway Ave, Apt 4B, New York, NY 10005',
      items: [
        {
          productId: prod1Id,
          name: 'Nike Air Max 90 Pulse',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
          quantity: 1,
          price: 130.0,
          subtotal: 130.0,
          variant: 'US 8 / Pure White'
        }
      ],
      subtotal: 130.0,
      discount: 0,
      shipping: 12.0,
      tax: 11.36,
      total: 153.36,
      paymentStatus: 'paid',
      status: 'processing',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: `ord_1003_${websiteId.slice(-4)}`,
      orderNumber: '#1003',
      websiteId,
      customerId: cust1Id,
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+1 (555) 234-5678',
      shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
      items: [
        {
          productId: prod3Id,
          name: 'Minimalist Weatherproof Backpack',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
          quantity: 1,
          price: 110.0,
          subtotal: 110.0,
          variant: 'Matte Black'
        }
      ],
      subtotal: 110.0,
      discount: 22.0,
      discountCode: 'SUMMER20',
      shipping: 0,
      tax: 7.04,
      total: 95.04,
      paymentStatus: 'paid',
      status: 'delivered',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ];

  const discounts: Discount[] = [
    {
      id: `disc_summer_${websiteId.slice(-4)}`,
      websiteId,
      code: 'SUMMER20',
      type: 'percentage',
      value: 20,
      minOrderValue: 50.0,
      maxDiscountAmount: 100.0,
      usageLimit: 500,
      usageCount: 42,
      startDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      applicableCollections: [colSummerId],
      customerEligibility: 'all',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: `disc_welcome_${websiteId.slice(-4)}`,
      websiteId,
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderValue: 20.0,
      usageLimit: 1000,
      usageCount: 118,
      startDate: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0],
      customerEligibility: 'new',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: `disc_freeship_${websiteId.slice(-4)}`,
      websiteId,
      code: 'FREESHIP',
      type: 'free_shipping',
      value: 0,
      minOrderValue: 75.0,
      usageLimit: 200,
      usageCount: 31,
      startDate: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      customerEligibility: 'all',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  const activities: ActivityEvent[] = [
    {
      id: `act_${uuidv4()}`,
      websiteId,
      type: 'order_received',
      title: 'Order #1001 Received',
      description: 'John Doe placed order #1001 for $219.78',
      entityId: `ord_1001_${websiteId.slice(-4)}`,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: `act_${uuidv4()}`,
      websiteId,
      type: 'product_updated',
      title: 'Product Updated',
      description: 'Nike Air Max 90 Pulse stock updated to 45',
      entityId: prod1Id,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: `act_${uuidv4()}`,
      websiteId,
      type: 'order_status_changed',
      title: 'Order Status Changed',
      description: 'Order #1002 marked as processing',
      entityId: `ord_1002_${websiteId.slice(-4)}`,
      createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString()
    },
    {
      id: `act_${uuidv4()}`,
      websiteId,
      type: 'discount_activated',
      title: 'Discount Code Active',
      description: 'SUMMER20 (20% OFF) activated for Summer Collection',
      entityId: `disc_summer_${websiteId.slice(-4)}`,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: `act_${uuidv4()}`,
      websiteId,
      type: 'collection_created',
      title: 'Collection Created',
      description: "Collection 'Summer Collection' created with 1 product",
      entityId: colSummerId,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
    }
  ];

  return { products, collections, orders, customers, discounts, activities };
}

function getOrInitMemory(websiteId: string) {
  if (!memoryCache[websiteId]) {
    memoryCache[websiteId] = getInitialSeedData(websiteId);
  }
  return memoryCache[websiteId];
}

export async function GET(req: Request, context: { params: Promise<{ websiteId: string }> }) {
  try {
    const { websiteId } = await context.params;
    if (!websiteId) {
      return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
    }

    const data = getOrInitMemory(websiteId);

    // Compute live commerce statistics
    const totalSales = data.orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
    const activeDiscounts = data.discounts.filter((d) => d.isActive).length;

    const stats: CommerceStats = {
      totalVisitors: 1248,
      livePages: 5,
      cmsRecords: data.products.length + data.collections.length,
      totalProducts: data.products.length,
      totalOrders: data.orders.length,
      totalCustomers: data.customers.length,
      totalSales: Math.round(totalSales * 100) / 100,
      activeDiscounts
    };

    return NextResponse.json({
      success: true,
      products: data.products,
      collections: data.collections,
      orders: data.orders,
      customers: data.customers,
      discounts: data.discounts,
      activities: data.activities,
      stats
    });
  } catch (error: any) {
    console.error('Commerce GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ websiteId: string }> }) {
  try {
    const { websiteId } = await context.params;
    if (!websiteId) {
      return NextResponse.json({ error: 'Missing websiteId' }, { status: 400 });
    }

    const body = await req.json();
    const { action, payload } = body;
    const store = getOrInitMemory(websiteId);

    switch (action) {
      // ==========================================
      // PRODUCTS
      // ==========================================
      case 'create_product': {
        const newProduct: Product = {
          id: `prod_${uuidv4()}`,
          websiteId,
          name: payload.name || 'Untitled Product',
          description: payload.description || '',
          price: Number(payload.price) || 0,
          compareAtPrice: payload.compareAtPrice ? Number(payload.compareAtPrice) : undefined,
          sku: payload.sku || `SKU-${Date.now().toString().slice(-6)}`,
          stock: Number(payload.stock) || 0,
          status: payload.status || 'active',
          category: payload.category || 'General',
          collections: Array.isArray(payload.collections) ? payload.collections : [],
          image: payload.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
          variants: payload.variants || [],
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.products.unshift(newProduct);

        // Synchronize with collections: add product ID to selected collections
        newProduct.collections.forEach((colId) => {
          const col = store.collections.find((c) => c.id === colId);
          if (col && !col.productIds.includes(newProduct.id)) {
            col.productIds.push(newProduct.id);
            col.updatedAt = new Date().toISOString();
          }
        });

        // Log Activity
        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'product_created',
          title: 'Product Created',
          description: `Added product '${newProduct.name}' ($${newProduct.price.toFixed(2)})`,
          entityId: newProduct.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, product: newProduct });
      }

      case 'update_product': {
        const prodIndex = store.products.findIndex((p) => p.id === payload.id);
        if (prodIndex === -1) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const oldProduct = store.products[prodIndex];
        const oldCollections = oldProduct.collections || [];
        const newCollections = Array.isArray(payload.collections) ? payload.collections : oldCollections;

        const updatedProduct: Product = {
          ...oldProduct,
          ...payload,
          price: Number(payload.price ?? oldProduct.price),
          compareAtPrice: payload.compareAtPrice !== undefined ? Number(payload.compareAtPrice) : oldProduct.compareAtPrice,
          stock: Number(payload.stock ?? oldProduct.stock),
          collections: newCollections,
          updatedAt: new Date().toISOString()
        };

        store.products[prodIndex] = updatedProduct;

        // Synchronize collections
        // 1. Remove from collections no longer selected
        oldCollections.forEach((oldColId) => {
          if (!newCollections.includes(oldColId)) {
            const col = store.collections.find((c) => c.id === oldColId);
            if (col) {
              col.productIds = col.productIds.filter((pId) => pId !== updatedProduct.id);
              col.updatedAt = new Date().toISOString();
            }
          }
        });

        // 2. Add to newly selected collections
        newCollections.forEach((newColId) => {
          const col = store.collections.find((c) => c.id === newColId);
          if (col && !col.productIds.includes(updatedProduct.id)) {
            col.productIds.push(updatedProduct.id);
            col.updatedAt = new Date().toISOString();
          }
        });

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'product_updated',
          title: 'Product Updated',
          description: `Updated '${updatedProduct.name}'`,
          entityId: updatedProduct.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, product: updatedProduct });
      }

      case 'delete_product': {
        const prodId = payload.id;
        const prod = store.products.find((p) => p.id === prodId);
        store.products = store.products.filter((p) => p.id !== prodId);

        // Remove from all collections
        store.collections.forEach((col) => {
          if (col.productIds.includes(prodId)) {
            col.productIds = col.productIds.filter((id) => id !== prodId);
            col.updatedAt = new Date().toISOString();
          }
        });

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'product_deleted',
          title: 'Product Deleted',
          description: `Removed product '${prod?.name || prodId}'`,
          entityId: prodId,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, deletedId: prodId });
      }

      // ==========================================
      // COLLECTIONS
      // ==========================================
      case 'create_collection': {
        const colId = `col_${uuidv4()}`;
        const productIds: string[] = Array.isArray(payload.productIds) ? payload.productIds : [];

        const newCollection: Collection = {
          id: colId,
          websiteId,
          title: payload.title || 'Untitled Collection',
          slug: (payload.title || 'collection').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: payload.description || '',
          image: payload.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
          productIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.collections.unshift(newCollection);

        // Synchronize selected products
        productIds.forEach((pId) => {
          const prod = store.products.find((p) => p.id === pId);
          if (prod && !prod.collections.includes(colId)) {
            prod.collections.push(colId);
            prod.updatedAt = new Date().toISOString();
          }
        });

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'collection_created',
          title: 'Collection Created',
          description: `Created collection '${newCollection.title}' with ${productIds.length} products`,
          entityId: newCollection.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, collection: newCollection });
      }

      case 'update_collection': {
        const colIndex = store.collections.findIndex((c) => c.id === payload.id);
        if (colIndex === -1) {
          return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        const oldCol = store.collections[colIndex];
        const oldProductIds = oldCol.productIds || [];
        const newProductIds: string[] = Array.isArray(payload.productIds) ? payload.productIds : oldProductIds;

        const updatedCol: Collection = {
          ...oldCol,
          ...payload,
          slug: payload.title ? payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : oldCol.slug,
          productIds: newProductIds,
          updatedAt: new Date().toISOString()
        };

        store.collections[colIndex] = updatedCol;

        // Synchronize products
        // Removed products
        oldProductIds.forEach((pId) => {
          if (!newProductIds.includes(pId)) {
            const prod = store.products.find((p) => p.id === pId);
            if (prod) {
              prod.collections = prod.collections.filter((cId) => cId !== updatedCol.id);
              prod.updatedAt = new Date().toISOString();
            }
          }
        });

        // Newly added products
        newProductIds.forEach((pId) => {
          const prod = store.products.find((p) => p.id === pId);
          if (prod && !prod.collections.includes(updatedCol.id)) {
            prod.collections.push(updatedCol.id);
            prod.updatedAt = new Date().toISOString();
          }
        });

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'collection_updated',
          title: 'Collection Updated',
          description: `Updated collection '${updatedCol.title}'`,
          entityId: updatedCol.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, collection: updatedCol });
      }

      case 'delete_collection': {
        const colId = payload.id;
        const col = store.collections.find((c) => c.id === colId);
        store.collections = store.collections.filter((c) => c.id !== colId);

        // Remove collection reference from all products
        store.products.forEach((prod) => {
          if (prod.collections.includes(colId)) {
            prod.collections = prod.collections.filter((cId) => cId !== colId);
            prod.updatedAt = new Date().toISOString();
          }
        });

        return NextResponse.json({ success: true, deletedId: colId });
      }

      // ==========================================
      // ORDERS
      // ==========================================
      case 'create_order': {
        const nextOrderNum = `#${1001 + store.orders.length}`;
        const newOrder: Order = {
          id: `ord_${uuidv4()}`,
          orderNumber: nextOrderNum,
          websiteId,
          customerId: payload.customerId || 'cust_guest',
          customerName: payload.customerName || 'Walk-in Customer',
          customerEmail: payload.customerEmail || 'customer@example.com',
          customerPhone: payload.customerPhone || '+1 (555) 000-0000',
          shippingAddress: payload.shippingAddress || '123 Main Street',
          items: Array.isArray(payload.items) ? payload.items : [],
          subtotal: Number(payload.subtotal) || 0,
          discount: Number(payload.discount) || 0,
          discountCode: payload.discountCode || undefined,
          shipping: Number(payload.shipping) || 0,
          tax: Number(payload.tax) || 0,
          total: Number(payload.total) || 0,
          paymentStatus: payload.paymentStatus || 'paid',
          status: payload.status || 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.orders.unshift(newOrder);

        // Update customer order stats
        const customer = store.customers.find((c) => c.id === newOrder.customerId || c.email === newOrder.customerEmail);
        if (customer) {
          customer.ordersCount = (customer.ordersCount || 0) + 1;
          customer.totalSpent = (customer.totalSpent || 0) + newOrder.total;
          customer.lastOrderId = newOrder.orderNumber;
          customer.lastOrderDate = newOrder.createdAt;
          customer.updatedAt = new Date().toISOString();
        }

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'order_received',
          title: `New Order ${newOrder.orderNumber}`,
          description: `${newOrder.customerName} placed order for $${newOrder.total.toFixed(2)}`,
          entityId: newOrder.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, order: newOrder });
      }

      case 'update_order_status': {
        const order = store.orders.find((o) => o.id === payload.id);
        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (payload.status) order.status = payload.status;
        if (payload.paymentStatus) order.paymentStatus = payload.paymentStatus;
        order.updatedAt = new Date().toISOString();

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'order_status_changed',
          title: `Order ${order.orderNumber} Status Updated`,
          description: `Status changed to ${order.status.toUpperCase()} (${order.paymentStatus})`,
          entityId: order.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, order });
      }

      case 'delete_order': {
        const orderId = payload.id;
        store.orders = store.orders.filter((o) => o.id !== orderId);
        return NextResponse.json({ success: true, deletedId: orderId });
      }

      // ==========================================
      // CUSTOMERS
      // ==========================================
      case 'create_customer': {
        const newCustomer: Customer = {
          id: `cust_${uuidv4()}`,
          websiteId,
          name: payload.name || 'New Customer',
          email: payload.email || '',
          phone: payload.phone || '',
          address: payload.address || '',
          ordersCount: 0,
          totalSpent: 0,
          status: payload.status || 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.customers.unshift(newCustomer);

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'customer_registered',
          title: 'Customer Added',
          description: `Registered new customer '${newCustomer.name}' (${newCustomer.email})`,
          entityId: newCustomer.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, customer: newCustomer });
      }

      case 'update_customer': {
        const custIndex = store.customers.findIndex((c) => c.id === payload.id);
        if (custIndex === -1) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        const oldCust = store.customers[custIndex];
        const updatedCust: Customer = {
          ...oldCust,
          ...payload,
          updatedAt: new Date().toISOString()
        };

        store.customers[custIndex] = updatedCust;

        return NextResponse.json({ success: true, customer: updatedCust });
      }

      case 'delete_customer': {
        const custId = payload.id;
        store.customers = store.customers.filter((c) => c.id !== custId);
        return NextResponse.json({ success: true, deletedId: custId });
      }

      // ==========================================
      // DISCOUNTS
      // ==========================================
      case 'create_discount': {
        const newDiscount: Discount = {
          id: `disc_${uuidv4()}`,
          websiteId,
          code: (payload.code || 'SALE10').toUpperCase().trim(),
          type: payload.type || 'percentage',
          value: Number(payload.value) || 0,
          minOrderValue: payload.minOrderValue ? Number(payload.minOrderValue) : undefined,
          maxDiscountAmount: payload.maxDiscountAmount ? Number(payload.maxDiscountAmount) : undefined,
          usageLimit: payload.usageLimit ? Number(payload.usageLimit) : undefined,
          usageCount: 0,
          startDate: payload.startDate || new Date().toISOString().split('T')[0],
          endDate: payload.endDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
          applicableProducts: payload.applicableProducts || [],
          applicableCollections: payload.applicableCollections || [],
          customerEligibility: payload.customerEligibility || 'all',
          isActive: payload.isActive !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.discounts.unshift(newDiscount);

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: 'discount_created',
          title: 'Discount Code Created',
          description: `Created code '${newDiscount.code}' (${newDiscount.type === 'percentage' ? `${newDiscount.value}%` : `$${newDiscount.value}`} OFF)`,
          entityId: newDiscount.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, discount: newDiscount });
      }

      case 'update_discount': {
        const discIndex = store.discounts.findIndex((d) => d.id === payload.id);
        if (discIndex === -1) {
          return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        }

        const oldDisc = store.discounts[discIndex];
        const updatedDisc: Discount = {
          ...oldDisc,
          ...payload,
          code: payload.code ? payload.code.toUpperCase().trim() : oldDisc.code,
          value: Number(payload.value ?? oldDisc.value),
          updatedAt: new Date().toISOString()
        };

        store.discounts[discIndex] = updatedDisc;

        return NextResponse.json({ success: true, discount: updatedDisc });
      }

      case 'toggle_discount': {
        const discount = store.discounts.find((d) => d.id === payload.id);
        if (!discount) {
          return NextResponse.json({ error: 'Discount not found' }, { status: 404 });
        }

        discount.isActive = !discount.isActive;
        discount.updatedAt = new Date().toISOString();

        store.activities.unshift({
          id: `act_${uuidv4()}`,
          websiteId,
          type: discount.isActive ? 'discount_activated' : 'discount_disabled',
          title: `Discount ${discount.isActive ? 'Activated' : 'Disabled'}`,
          description: `Discount '${discount.code}' is now ${discount.isActive ? 'active' : 'inactive'}`,
          entityId: discount.id,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, discount });
      }

      case 'delete_discount': {
        const discId = payload.id;
        store.discounts = store.discounts.filter((d) => d.id !== discId);
        return NextResponse.json({ success: true, deletedId: discId });
      }

      case 'reset_seed_data': {
        memoryCache[websiteId] = getInitialSeedData(websiteId);
        return NextResponse.json({ success: true, message: 'Reset to seed data' });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Commerce POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
