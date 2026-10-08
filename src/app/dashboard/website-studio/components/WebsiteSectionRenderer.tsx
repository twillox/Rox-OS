'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Star, 
  ArrowRight, 
  ChevronDown, 
  Mail, 
  Send, 
  Check, 
  Menu, 
  Search, 
  Heart, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { WebsiteSection, WebsiteTheme } from '../types';

interface WebsiteSectionRendererProps {
  section: WebsiteSection;
  isSelected?: boolean;
  onSelect?: () => void;
  viewMode?: 'desktop' | 'tablet' | 'mobile';
  theme?: WebsiteTheme;
}

export default function WebsiteSectionRenderer({
  section,
  isSelected = false,
  onSelect,
  viewMode = 'desktop',
  theme
}: WebsiteSectionRendererProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { content, type } = section;

  // Font styling fallback to theme if not defined on section
  const fontFamily = content.fontFamily || theme?.typography?.body || 'inherit';
  const headingFont = content.fontFamily || theme?.typography?.heading || 'inherit';

  // Responsive padding classes
  const getPaddingClass = () => {
    switch (content.paddingY) {
      case 'none': return 'py-0';
      case 'sm': return 'py-4 md:py-6';
      case 'md': return 'py-8 md:py-12';
      case 'lg': return 'py-12 md:py-20';
      case 'xl': return 'py-16 md:py-28';
      default: return 'py-10 md:py-16';
    }
  };

  // Section base wrapper style
  const sectionStyle: React.CSSProperties = {
    backgroundColor: content.backgroundColor || '#ffffff',
    color: content.textColor || '#111827',
    fontFamily: fontFamily
  };

  const getButtonClass = () => {
    switch (content.buttonSize) {
      case 'sm': return 'px-3.5 py-1.5 text-xs';
      case 'lg': return 'px-8 py-3.5 text-base font-bold';
      default: return 'px-5 py-2.5 text-sm font-semibold';
    }
  };

  const getHeadingSizeClass = () => {
    switch (content.fontSize) {
      case 'sm': return 'text-xl md:text-2xl';
      case 'base': return 'text-2xl md:text-3xl';
      case 'lg': return 'text-3xl md:text-4xl';
      case 'xl': return 'text-3xl md:text-5xl';
      case '2xl': return 'text-4xl md:text-6xl';
      case '3xl': return 'text-5xl md:text-7xl';
      case '4xl': return 'text-6xl md:text-8xl';
      default: return 'text-3xl md:text-5xl lg:text-6xl';
    }
  };

  const getFontWeightStyle = (): React.CSSProperties['fontWeight'] => {
    switch (content.fontWeight) {
      case 'normal': return 400;
      case 'medium': return 500;
      case 'semibold': return 600;
      case 'bold': return 700;
      case 'extrabold': return 800;
      default: return undefined;
    }
  };

  const getTextAlignClass = () => {
    switch (content.textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: content.buttonColor || theme?.colors?.primary || '#4f46e5',
    color: content.buttonTextColor || '#ffffff',
    borderRadius: content.buttonRadius === 'full' ? '9999px' : content.buttonRadius === 'xl' ? '1rem' : content.buttonRadius === 'lg' ? '0.5rem' : content.buttonRadius === 'md' ? '0.375rem' : content.buttonRadius === 'none' ? '0px' : '0.5rem'
  };

  const renderContent = () => {
    switch (type) {
      case 'announcement-bar':
        return (
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs md:text-sm font-medium">
            <div className="flex-1 text-center truncate">
              {content.heading}
            </div>
            {content.buttonText && (
              <a 
                href={content.buttonLink || '#'} 
                className="ml-4 px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-opacity hover:opacity-90 shadow-sm"
                style={primaryBtnStyle}
              >
                {content.buttonText}
              </a>
            )}
          </div>
        );

      case 'header':
        return (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: headingFont }}>
                {content.brandName || 'STORE'}
              </span>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium opacity-80">
                {(content.links || []).map((link) => (
                  <span key={link.id} className="hover:opacity-100 transition-opacity cursor-pointer">
                    {link.label}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg opacity-70 hover:opacity-100 transition-opacity">
                <Search className="w-4 h-4" />
              </button>
              {content.buttonText && (
                <button 
                  className="px-4 py-2 text-xs md:text-sm font-semibold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
                  style={primaryBtnStyle}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {content.buttonText}
                </button>
              )}
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="max-w-7xl mx-auto px-4 py-2 border-y border-black/5 flex items-center justify-center gap-6 overflow-x-auto text-xs md:text-sm font-semibold">
            {(content.links || []).map((link) => (
              <span key={link.id} className="whitespace-nowrap px-2 py-1 hover:opacity-75 cursor-pointer">
                {link.label}
              </span>
            ))}
          </div>
        );

      case 'hero':
        return (
          <div className="relative overflow-hidden">
            {content.imageUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url('${content.imageUrl}')`,
                  opacity: (100 - (content.overlayOpacity ?? 40)) / 100
                }}
              />
            )}
            <div className={`relative max-w-5xl mx-auto px-6 md:px-12 flex flex-col ${
              content.textAlign === 'left' ? 'items-start text-left' : content.textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'
            }`}>
              {content.badge && (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 bg-white/10 backdrop-blur-md border border-white/20"
                  style={{ color: content.accentColor || '#818cf8' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {content.badge}
                </span>
              )}
              <h1 
                className={`${getHeadingSizeClass()} tracking-tight leading-tight mb-4`}
                style={{ fontFamily: headingFont, fontWeight: getFontWeightStyle() }}
              >
                {content.heading}
              </h1>
              {content.subheading && (
                <p className="text-base md:text-lg max-w-2xl opacity-90 mb-8 leading-relaxed">
                  {content.subheading}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                {content.buttonText && (
                  <button 
                    className={`${getButtonClass()} flex items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
                    style={primaryBtnStyle}
                  >
                    {content.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {content.secondaryButtonText && (
                  <button className={`${getButtonClass()} rounded-lg border border-white/30 hover:bg-white/10 transition-colors backdrop-blur-sm`}>
                    {content.secondaryButtonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'image-text':
        return (
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${content.layout === 'split-left' ? 'md:grid-flow-col-dense' : ''}`}>
              <div className={content.layout === 'split-left' ? 'md:col-start-2' : ''}>
                {content.badge && (
                  <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">
                    {content.badge}
                  </div>
                )}
                <h2 
                  className={`${getHeadingSizeClass()} tracking-tight mb-4 leading-tight`}
                  style={{ fontFamily: headingFont, fontWeight: getFontWeightStyle() }}
                >
                  {content.heading}
                </h2>
                {content.body && (
                  <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
                    {content.body}
                  </p>
                )}
                {content.buttonText && (
                  <button 
                    className={`${getButtonClass()} shadow-md`}
                    style={primaryBtnStyle}
                  >
                    {content.buttonText}
                  </button>
                )}
              </div>
              <div className={`overflow-hidden rounded-2xl shadow-xl ${content.layout === 'split-left' ? 'md:col-start-1' : ''}`}>
                <img 
                  src={content.imageUrl || 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&q=80&w=800'} 
                  alt={content.heading || 'Banner'} 
                  className="w-full h-72 md:h-96 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {content.heading && (
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: headingFont }}>
                  {content.heading}
                </h2>
                {content.subheading && <p className="text-sm opacity-75 mt-1">{content.subheading}</p>}
              </div>
            )}
            <div className="overflow-hidden rounded-2xl shadow-lg border border-black/5">
              <img 
                src={content.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'} 
                alt="Banner" 
                style={{ height: content.imageHeight || '400px' }}
                className="w-full object-cover"
              />
            </div>
          </div>
        );

      case 'product-grid':
      case 'featured-products':
        return (
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                {content.badge && (
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    {content.badge}
                  </span>
                )}
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: headingFont }}>
                  {content.heading}
                </h2>
                {content.subheading && (
                  <p className="text-sm md:text-base opacity-75 mt-1">{content.subheading}</p>
                )}
              </div>
              <button className="text-xs md:text-sm font-bold flex items-center gap-1 hover:underline self-start md:self-auto">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className={`grid gap-6 ${
              viewMode === 'mobile' 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : content.columns === 2 
                  ? 'grid-cols-2' 
                  : content.columns === 3 
                    ? 'grid-cols-1 md:grid-cols-3' 
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {(content.items || []).map((item) => (
                <div 
                  key={item.id} 
                  className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title || 'Product'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                    {item.badge && (
                      <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {item.badge}
                      </span>
                    )}
                    <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-sm transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {item.subtitle && (
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {item.subtitle}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-gray-900">{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                      )}
                    </div>
                    <button 
                      className="p-2 rounded-lg text-white transition-transform active:scale-90"
                      style={{ backgroundColor: content.buttonColor || '#111827' }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'product-detail':
        return (
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-gray-50 border border-gray-100">
                <img 
                  src={content.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'} 
                  alt="Product"
                  className="w-full h-80 md:h-[450px] object-cover" 
                />
              </div>
              <div>
                {content.badge && (
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 block">
                    {content.badge}
                  </span>
                )}
                <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2" style={{ fontFamily: headingFont }}>
                  {content.heading}
                </h2>
                {content.subheading && (
                  <p className="text-sm font-medium text-gray-500 mb-4">{content.subheading}</p>
                )}
                {content.price && (
                  <div className="text-2xl font-black text-gray-900 mb-4">
                    {content.price}
                  </div>
                )}
                {content.body && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {content.body}
                  </p>
                )}
                <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-emerald-500" /> Free Worldwide Shipping</div>
                  <div className="flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-emerald-500" /> 30-Day Free Returns</div>
                </div>
                {content.buttonText && (
                  <button 
                    className="w-full py-4 text-sm font-bold shadow-xl transition-all"
                    style={primaryBtnStyle}
                  >
                    {content.buttonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'collection-grid':
        return (
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-10">
              {content.badge && (
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                  {content.badge}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: headingFont }}>
                {content.heading}
              </h2>
              {content.subheading && (
                <p className="text-sm md:text-base opacity-75 mt-1 max-w-xl mx-auto">{content.subheading}</p>
              )}
            </div>
            <div className={`grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {(content.items || []).map((col) => (
                <div 
                  key={col.id} 
                  className="group relative h-80 rounded-2xl overflow-hidden shadow-md cursor-pointer"
                >
                  <img 
                    src={col.image} 
                    alt={col.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-xs uppercase tracking-widest font-semibold text-gray-300">
                      {col.description}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight mb-2">
                      {col.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-white transition-colors">
                      Shop Collection <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="max-w-4xl mx-auto px-6 text-center">
            {content.badge && (
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
                {content.badge}
              </span>
            )}
            <h2 
              className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4"
              style={{ fontFamily: headingFont }}
            >
              {content.heading}
            </h2>
            {content.body && (
              <p className="text-base md:text-lg opacity-80 leading-relaxed font-normal">
                {content.body}
              </p>
            )}
          </div>
        );

      case 'testimonials':
        return (
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-12">
              {content.badge && (
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                  {content.badge}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: headingFont }}>
                {content.heading}
              </h2>
              {content.subheading && (
                <p className="text-sm md:text-base opacity-75 mt-1">{content.subheading}</p>
              )}
            </div>

            <div className={`grid gap-6 ${viewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {(content.items || []).map((item) => (
                <div 
                  key={item.id} 
                  className="bg-gray-50/80 rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-4">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm md:text-base text-gray-700 italic leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200/60">
                    {item.avatar && (
                      <img 
                        src={item.avatar} 
                        alt={item.author || 'Avatar'} 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow" 
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.author}</h4>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              {content.badge && (
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                  {content.badge}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: headingFont }}>
                {content.heading}
              </h2>
              {content.subheading && (
                <p className="text-sm md:text-base opacity-75 mt-1">{content.subheading}</p>
              )}
            </div>

            <div className="space-y-3">
              {(content.items || []).map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={faq.id} 
                    className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFaqIndex(isOpen ? null : index);
                      }}
                      className="w-full px-6 py-4 text-left flex items-center justify-between text-sm md:text-base font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="max-w-4xl mx-auto px-6 py-4 text-center">
            {content.badge && (
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">
                {content.badge}
              </span>
            )}
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3" style={{ fontFamily: headingFont }}>
              {content.heading}
            </h2>
            {content.subheading && (
              <p className="text-sm md:text-base opacity-80 max-w-xl mx-auto mb-8">
                {content.subheading}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className="px-6 py-3 text-sm font-bold shadow-lg transition-transform active:scale-95 shrink-0"
                style={primaryBtnStyle}
              >
                {content.buttonText || 'Subscribe'}
              </button>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div>
                {content.badge && (
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                    {content.badge}
                  </span>
                )}
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: headingFont }}>
                  {content.heading}
                </h2>
                {content.subheading && (
                  <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed">
                    {content.subheading}
                  </p>
                )}
                {content.body && (
                  <div className="p-4 bg-gray-50 rounded-xl text-xs font-mono text-gray-600 border border-gray-200">
                    {content.body}
                  </div>
                )}
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <textarea 
                  rows={3} 
                  placeholder="How can we help?" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button 
                  className="w-full py-3 text-sm font-bold shadow-md"
                  style={primaryBtnStyle}
                >
                  {content.buttonText || 'Send Inquiry'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-white/10 text-center md:text-left">
              <div>
                <span className="text-xl font-black tracking-tight" style={{ fontFamily: headingFont, color: '#ffffff' }}>
                  {content.brandName || 'STORE'}
                </span>
                {content.subheading && (
                  <p className="text-xs opacity-75 mt-1 max-w-sm">{content.subheading}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-6 text-xs font-medium opacity-80">
                {(content.links || []).map((link) => (
                  <span key={link.id} className="hover:opacity-100 cursor-pointer">
                    {link.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-6 text-center text-xs opacity-60">
              {content.body || '© 2026 Store. All rights reserved.'}
            </div>
          </div>
        );

      default:
        return (
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-xl font-bold">{content.heading || section.name}</h3>
            <p className="text-sm opacity-75 mt-1">{content.subheading || 'Section content'}</p>
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      style={sectionStyle}
      className={`group relative transition-all duration-150 cursor-pointer ${getPaddingClass()} ${
        isSelected 
          ? 'ring-2 ring-indigo-600 ring-offset-2 z-10 shadow-md' 
          : 'hover:outline hover:outline-1 hover:outline-indigo-400'
      }`}
    >
      {/* Editor overlay badge */}
      <div className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-bold shadow-md uppercase tracking-wider transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <span>{section.name}</span>
      </div>

      {/* Rendered HTML */}
      {renderContent()}
    </div>
  );
}
