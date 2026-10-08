export type SectionType =
  | 'header'
  | 'navigation'
  | 'hero'
  | 'announcement-bar'
  | 'text'
  | 'image'
  | 'image-text'
  | 'product-detail'
  | 'product-grid'
  | 'collection-grid'
  | 'featured-products'
  | 'testimonials'
  | 'faq'
  | 'contact'
  | 'newsletter'
  | 'footer';

export interface SectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  image?: string;
  badge?: string;
  rating?: number;
  author?: string;
  role?: string;
  avatar?: string;
  question?: string;
  answer?: string;
  link?: string;
  buttonText?: string;
}

export interface SectionContent {
  // Text Content
  heading?: string;
  subheading?: string;
  body?: string;
  badge?: string;
  brandName?: string;
  logoUrl?: string;
  price?: string;
  originalPrice?: string;

  // Buttons & CTAs
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonRadius?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  secondaryButtonText?: string;
  secondaryButtonLink?: string;

  // Colors
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;

  // Typography
  fontFamily?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: string;

  // Spacing & Layout
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  columns?: 1 | 2 | 3 | 4;
  layout?: 'split-left' | 'split-right' | 'stacked' | 'grid';
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';

  // Media
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'background' | 'center';
  imageHeight?: string;
  overlayOpacity?: number;

  // Repeatable Items (Products, Testimonials, FAQ, Links, Collections)
  items?: SectionItem[];
  links?: Array<{ id: string; label: string; url: string }>;
}

export interface WebsiteSection {
  id: string;
  websiteId?: string;
  name: string;
  type: SectionType;
  orderIndex: number;
  content: SectionContent;
}

export interface WebsiteTheme {
  colors: {
    primary: string;
    secondary: string;
    background?: string;
    text?: string;
    accent?: string;
  };
  typography: {
    heading: string;
    body: string;
  };
}

export interface SectionCatalogItem {
  type: SectionType;
  name: string;
  category: 'Header & Nav' | 'Hero & Banner' | 'Products & Store' | 'Content & Media' | 'Social Proof & FAQ' | 'Conversion & Footer';
  description: string;
  icon: string;
}

export const SECTION_CATALOG: SectionCatalogItem[] = [
  {
    type: 'announcement-bar',
    name: 'Announcement Bar',
    category: 'Header & Nav',
    description: 'Top promotional banner with call to action',
    icon: 'Megaphone'
  },
  {
    type: 'header',
    name: 'Header',
    category: 'Header & Nav',
    description: 'Logo, navigation links, and store actions',
    icon: 'PanelTop'
  },
  {
    type: 'navigation',
    name: 'Navigation Bar',
    category: 'Header & Nav',
    description: 'Clean secondary navigation bar for categories',
    icon: 'Compass'
  },
  {
    type: 'hero',
    name: 'Hero Section',
    category: 'Hero & Banner',
    description: 'High-converting main headline banner with buttons and imagery',
    icon: 'Sparkles'
  },
  {
    type: 'image-text',
    name: 'Image + Text',
    category: 'Hero & Banner',
    description: 'Side-by-side story block pairing media with copy',
    icon: 'SplitSquareVertical'
  },
  {
    type: 'image',
    name: 'Image Banner',
    category: 'Hero & Banner',
    description: 'Full-width or framed responsive graphic showcase',
    icon: 'Image'
  },
  {
    type: 'product-grid',
    name: 'Product Grid',
    category: 'Products & Store',
    description: 'E-commerce showcase grid with cards, prices, and buy buttons',
    icon: 'ShoppingBag'
  },
  {
    type: 'featured-products',
    name: 'Featured Products',
    category: 'Products & Store',
    description: 'Highlighted product carousel with sales badges',
    icon: 'Star'
  },
  {
    type: 'product-detail',
    name: 'Product Highlight',
    category: 'Products & Store',
    description: 'Deep dive product card with gallery, specs, and instant checkout',
    icon: 'PackageCheck'
  },
  {
    type: 'collection-grid',
    name: 'Collection Grid',
    category: 'Products & Store',
    description: 'Category tiles to browse department collections',
    icon: 'Grid3X3'
  },
  {
    type: 'text',
    name: 'Rich Text Section',
    category: 'Content & Media',
    description: 'Brand mission, about story, or editorial paragraphs',
    icon: 'FileText'
  },
  {
    type: 'faq',
    name: 'FAQ Accordion',
    category: 'Social Proof & FAQ',
    description: 'Collapsible questions & answers for buyer assurance',
    icon: 'HelpCircle'
  },
  {
    type: 'testimonials',
    name: 'Testimonials',
    category: 'Social Proof & FAQ',
    description: 'Customer reviews, 5-star ratings, and social proof',
    icon: 'MessageSquareQuote'
  },
  {
    type: 'newsletter',
    name: 'Newsletter Signup',
    category: 'Conversion & Footer',
    description: 'Email capture banner offering discount or updates',
    icon: 'Mail'
  },
  {
    type: 'contact',
    name: 'Contact Section',
    category: 'Conversion & Footer',
    description: 'Get-in-touch form and business contact channels',
    icon: 'Send'
  },
  {
    type: 'footer',
    name: 'Footer',
    category: 'Conversion & Footer',
    description: 'Multi-column links, copyright notice, and social badges',
    icon: 'PanelBottom'
  }
];

export function createDefaultSectionContent(type: SectionType): SectionContent {
  switch (type) {
    case 'announcement-bar':
      return {
        heading: '✨ SPECIAL OFFER: Get 20% off your first order with code WELCOME20',
        buttonText: 'Shop Now',
        buttonLink: '#products',
        backgroundColor: '#4f46e5',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        buttonTextColor: '#4f46e5',
        textAlign: 'center',
        paddingY: 'sm'
      };

    case 'header':
      return {
        brandName: 'ROX STORE',
        logoUrl: '',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        buttonText: 'Cart (0)',
        buttonLink: '#cart',
        buttonColor: '#4f46e5',
        buttonTextColor: '#ffffff',
        buttonRadius: 'md',
        links: [
          { id: '1', label: 'Home', url: '#' },
          { id: '2', label: 'Catalog', url: '#products' },
          { id: '3', label: 'Collections', url: '#collections' },
          { id: '4', label: 'Reviews', url: '#testimonials' },
          { id: '5', label: 'FAQ', url: '#faq' }
        ]
      };

    case 'navigation':
      return {
        backgroundColor: '#f9fafb',
        textColor: '#374151',
        links: [
          { id: '1', label: 'All Products', url: '#products' },
          { id: '2', label: 'New Arrivals', url: '#products' },
          { id: '3', label: 'Best Sellers', url: '#products' },
          { id: '4', label: 'Sale %', url: '#products' }
        ],
        textAlign: 'center',
        paddingY: 'sm'
      };

    case 'hero':
      return {
        badge: 'NEW COLLECTION 2026',
        heading: 'Crafted For Modern Living',
        subheading: 'Discover premium designs and engineered essentials designed to elevate your everyday lifestyle.',
        buttonText: 'Explore Catalog',
        buttonLink: '#products',
        secondaryButtonText: 'Learn More',
        secondaryButtonLink: '#about',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        accentColor: '#818cf8',
        buttonColor: '#4f46e5',
        buttonTextColor: '#ffffff',
        buttonRadius: 'lg',
        textAlign: 'center',
        paddingY: 'xl',
        overlayOpacity: 50
      };

    case 'image-text':
      return {
        badge: 'OUR PHILOSOPHY',
        heading: 'Uncompromising Quality in Every Detail',
        body: 'Every item is meticulously engineered with sustainable materials and crafted by master artisans to deliver timeless luxury that lasts.',
        buttonText: 'Our Story',
        buttonLink: '#about',
        imageUrl: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&q=80&w=800',
        layout: 'split-right',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        buttonColor: '#111827',
        buttonTextColor: '#ffffff',
        buttonRadius: 'md',
        paddingY: 'lg'
      };

    case 'image':
      return {
        heading: 'The Art of Simplicity',
        subheading: 'Minimalism meets unmatched performance.',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
        backgroundColor: '#f9fafb',
        textColor: '#111827',
        imageHeight: '400px',
        paddingY: 'md',
        textAlign: 'center'
      };

    case 'product-grid':
      return {
        badge: 'CURATED SELECTION',
        heading: 'Trending Products',
        subheading: 'Handpicked favorites loved by thousands of happy customers.',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        columns: 4,
        paddingY: 'lg',
        items: [
          {
            id: 'p1',
            title: 'Aura Wireless Earbuds',
            subtitle: 'Audio Essentials',
            price: '$149.00',
            originalPrice: '$199.00',
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600',
            badge: 'Sale'
          },
          {
            id: 'p2',
            title: 'Chronos Minimalist Watch',
            subtitle: 'Accessories',
            price: '$289.00',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
            badge: 'Bestseller'
          },
          {
            id: 'p3',
            title: 'Nomad Leather Backpack',
            subtitle: 'Travel Gear',
            price: '$210.00',
            originalPrice: '$250.00',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
            badge: 'Save 15%'
          },
          {
            id: 'p4',
            title: 'Lumina Ceramic Table Lamp',
            subtitle: 'Home Living',
            price: '$95.00',
            image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600'
          }
        ]
      };

    case 'featured-products':
      return {
        badge: 'SPOTLIGHT',
        heading: 'Staff Picks of the Month',
        subheading: 'Exclusive limited edition releases available while supplies last.',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        columns: 3,
        paddingY: 'lg',
        items: [
          {
            id: 'fp1',
            title: 'Apex Mechanical Keyboard',
            price: '$180.00',
            originalPrice: '$220.00',
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
            badge: 'Limited Edition'
          },
          {
            id: 'fp2',
            title: 'Studio Hi-Fi Headphones',
            price: '$340.00',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
            badge: 'New'
          },
          {
            id: 'fp3',
            title: 'Ergonomic Standing Desk Mat',
            price: '$75.00',
            image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=600'
          }
        ]
      };

    case 'product-detail':
      return {
        badge: 'FLAGSHIP EDITION',
        heading: 'Apex Pro Soundstage Headphones',
        subheading: 'Lossless audio precision with custom dynamic drivers and active noise cancellation.',
        body: 'Immerse yourself in rich acoustic balance with up to 40 hours of battery life and handcrafted memory foam comfort cups.',
        price: '$399.00',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
        buttonText: 'Add to Cart — $399',
        buttonLink: '#checkout',
        buttonColor: '#4f46e5',
        buttonTextColor: '#ffffff',
        buttonRadius: 'xl',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        paddingY: 'xl'
      };

    case 'collection-grid':
      return {
        badge: 'CATEGORIES',
        heading: 'Explore Collections',
        subheading: 'Find exactly what suits your personal aesthetic.',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        columns: 3,
        paddingY: 'lg',
        items: [
          {
            id: 'c1',
            title: 'Electronics & Audio',
            description: '48 Products',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
            link: '#products'
          },
          {
            id: 'c2',
            title: 'Modern Apparel',
            description: '32 Products',
            image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=600',
            link: '#products'
          },
          {
            id: 'c3',
            title: 'Home & Living',
            description: '24 Products',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
            link: '#products'
          }
        ]
      };

    case 'text':
      return {
        badge: 'ABOUT US',
        heading: 'Design with Intent, Built with Passion',
        body: 'We believe good design isn’t just about what looks appealing—it’s about how seamlessly it integrates into your day. We obsess over the finest details so you never have to think twice.',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        textAlign: 'center',
        paddingY: 'lg',
        maxWidth: 'lg'
      };

    case 'testimonials':
      return {
        badge: 'CUSTOMER LOVE',
        heading: 'Loved by Over 50,000 Customers',
        subheading: 'See why discerning creators and professionals choose our products worldwide.',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        columns: 3,
        paddingY: 'lg',
        items: [
          {
            id: 't1',
            author: 'Sarah Jenkins',
            role: 'Product Designer at Stripe',
            rating: 5,
            description: '“The attention to detail is truly unmatched. Ordering was seamless, and the product quality blew past my highest expectations.”',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
          },
          {
            id: 't2',
            author: 'David Chen',
            role: 'Founder, Studio Monochrome',
            rating: 5,
            description: '“Simply the best purchase I have made this year. Beautiful aesthetics, ultra-durable materials, and world-class customer support.”',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
          },
          {
            id: 't3',
            author: 'Elena Rostova',
            role: 'Creative Director',
            rating: 5,
            description: '“Delivered faster than promised and packaged like high jewelry. Cannot recommend this brand highly enough!”',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
          }
        ]
      };

    case 'faq':
      return {
        badge: 'HELP CENTER',
        heading: 'Frequently Asked Questions',
        subheading: 'Everything you need to know about shipping, returns, and product care.',
        backgroundColor: '#f9fafb',
        textColor: '#111827',
        paddingY: 'lg',
        items: [
          {
            id: 'f1',
            question: 'What is your shipping timeframe and cost?',
            answer: 'We provide free standard shipping worldwide on all orders over $75. Domestic deliveries arrive within 2-4 business days.'
          },
          {
            id: 'f2',
            question: 'What is your return policy?',
            answer: 'We offer a 30-day money-back guarantee with complimentary return shipping labels. No questions asked.'
          },
          {
            id: 'f3',
            question: 'Are your products covered by warranty?',
            answer: 'Yes! Every purchase includes a comprehensive 2-year manufacturer warranty against craftsmanship defects.'
          },
          {
            id: 'f4',
            question: 'Can I track my order in real time?',
            answer: 'Immediately upon dispatch, you will receive an automated email and SMS notification containing full live tracking details.'
          }
        ]
      };

    case 'newsletter':
      return {
        badge: 'STAY IN THE LOOP',
        heading: 'Join the Rox Insider Club',
        subheading: 'Subscribe to receive private previews, curated styling guides, and 15% off your first checkout.',
        buttonText: 'Subscribe',
        buttonColor: '#4f46e5',
        buttonTextColor: '#ffffff',
        buttonRadius: 'lg',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        textAlign: 'center',
        paddingY: 'lg'
      };

    case 'contact':
      return {
        badge: 'GET IN TOUCH',
        heading: 'We’d Love to Hear From You',
        subheading: 'Have a question about an order, custom inquiry, or partnership? Our team responds within 2 hours.',
        body: 'support@roxten.app • +1 (800) 555-ROXTEN • San Francisco, CA',
        buttonText: 'Send Message',
        buttonColor: '#111827',
        buttonTextColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        paddingY: 'lg'
      };

    case 'footer':
      return {
        brandName: 'ROX STORE',
        subheading: 'Premium lifestyle essentials engineered with precision and delivered worldwide.',
        backgroundColor: '#0f172a',
        textColor: '#94a3b8',
        links: [
          { id: '1', label: 'Privacy Policy', url: '#' },
          { id: '2', label: 'Terms of Service', url: '#' },
          { id: '3', label: 'Shipping Info', url: '#' },
          { id: '4', label: 'Contact Us', url: '#' }
        ],
        body: '© 2026 ROX STORE. All rights reserved. Built with Rox-OS Website Studio.'
      };

    default:
      return {
        heading: 'New Section',
        subheading: 'Customize this section in the editor panel.',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        paddingY: 'md'
      };
  }
}
