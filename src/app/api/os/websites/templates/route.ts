import { NextResponse } from 'next/server';

const TEMPLATES = [
  {
    id: 'modern-ecommerce',
    name: 'Modern E-Commerce Store',
    type: 'ecommerce',
    category: 'E-Commerce',
    description: 'A sleek, conversion-optimized storefront designed for modern direct-to-consumer lifestyle brands.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Catalog', 'Collections', 'Cart', 'Checkout'],
    dashboard: ['products', 'orders', 'customers', 'discounts'],
    editableSections: ['announcement-bar', 'header', 'hero', 'product-grid', 'collection-grid', 'testimonials', 'newsletter', 'footer'],
    features: ['Stripe Integration', 'Cart Abandonment', 'Inventory Tracking', 'Customer Reviews', 'Analytics'],
    aiFeatures: ['AI Product Descriptions', 'AI Upsell Recommender', 'AI Review Insights']
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    type: 'portfolio',
    category: 'Portfolio',
    description: 'An elegant, typography-driven portfolio template for designers, architects, photographers, and studios.',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Projects', 'Case Studies', 'About', 'Contact'],
    dashboard: ['projects', 'inquiries', 'clients'],
    editableSections: ['header', 'hero', 'image-text', 'product-grid', 'testimonials', 'contact', 'footer'],
    features: ['Case Study Layouts', 'Interactive Media Lightbox', 'Client Showcase', 'Inquiry Form'],
    aiFeatures: ['AI Case Study Generator', 'AI Project Summaries', 'AI SEO Copywriter']
  },
  {
    id: 'bistro-restaurant',
    name: 'Artisan Bistro & Bar',
    type: 'restaurant',
    category: 'Restaurant',
    description: 'An appetizing, warm template for dining establishments, bistros, and cafes with table reservation systems.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Menu', 'Reservations', 'Private Dining', 'Contact'],
    dashboard: ['menu', 'reservations', 'reviews'],
    editableSections: ['announcement-bar', 'header', 'hero', 'collection-grid', 'testimonials', 'contact', 'footer'],
    features: ['Online Table Reservations', 'Interactive Menu Cards', 'Google Maps Embed', 'Special Event Bookings'],
    aiFeatures: ['AI Menu Descriptions', 'AI Review Auto-Replies', 'AI Social Posts']
  },
  {
    id: 'saas-landing',
    name: 'Apex SaaS Platform',
    type: 'saas',
    category: 'SaaS',
    description: 'High-growth B2B & software startup template engineered for maximum demo requests and trial signups.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Features', 'Pricing', 'Documentation', 'Blog'],
    dashboard: ['trials', 'analytics', 'leads'],
    editableSections: ['announcement-bar', 'header', 'hero', 'image-text', 'faq', 'testimonials', 'newsletter', 'footer'],
    features: ['Pricing Matrix', 'Feature Comparison', 'Interactive Demos', 'Lead Magnet Forms'],
    aiFeatures: ['AI Value Prop Generator', 'AI Competitor Comparison Copy', 'AI Documentation Search']
  },
  {
    id: 'personal-brand',
    name: 'Personal Brand & Executive',
    type: 'personal-brand',
    category: 'Personal Brand',
    description: 'Build authority, book speaking engagements, and grow your newsletter audience with a personal brand site.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Speaking', 'Books', 'Podcast', 'Contact'],
    dashboard: ['speaking', 'subscribers', 'press'],
    editableSections: ['header', 'hero', 'image-text', 'testimonials', 'newsletter', 'contact', 'footer'],
    features: ['Keynote Booking Form', 'Media Kit Downloads', 'Podcast Player Embed', 'Social Media Hub'],
    aiFeatures: ['AI Bio Generator', 'AI Speech Outline Assistant', 'AI Newsletter Drafts']
  },
  {
    id: 'editorial-blog',
    name: 'Editorial Magazine & Blog',
    type: 'blog',
    category: 'Blog',
    description: 'A clean, reading-optimized publication template for journalists, niche publications, and content creators.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Articles', 'Authors', 'Subscribe', 'About'],
    dashboard: ['posts', 'authors', 'subscribers', 'comments'],
    editableSections: ['header', 'navigation', 'hero', 'product-grid', 'newsletter', 'footer'],
    features: ['Category Tags', 'Estimated Read Times', 'Newsletter Paywall', 'Social Share Integration'],
    aiFeatures: ['AI Article Outliner', 'AI SEO Meta Generator', 'AI Headline A/B Testing']
  },
  {
    id: 'direct-landing-page',
    name: 'Direct Response Landing Page',
    type: 'landing-page',
    category: 'Landing Page',
    description: 'A focused, distraction-free single page layout designed for paid ad traffic, product drops, and flash launches.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    pages: ['Home'],
    dashboard: ['conversions', 'analytics', 'leads'],
    editableSections: ['announcement-bar', 'hero', 'product-detail', 'image-text', 'testimonials', 'faq', 'newsletter', 'footer'],
    features: ['High-Contrast CTAs', 'Sticky Checkout Trigger', 'Urgency Badges', 'Money-Back Guarantee Seals'],
    aiFeatures: ['AI Copywriting Angle Generator', 'AI Objection Buster', 'AI Micro-copy Enhancer']
  }
];

export async function GET() {
  return NextResponse.json(TEMPLATES);
}
