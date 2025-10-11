import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: any;
}

export const SEOHead = ({
  title = 'DeSynth - Decentralized Synthetic Biology Protocol',
  description = 'Connect, build, and scale with the leading decentralized synthetic biology protocol. Access verified facilities, secure transactions, and transparent auditing.',
  keywords = 'synthetic biology, biotechnology, decentralized, blockchain, laboratory, CDMO, manufacturing, auditing, quality control',
  image = '/og-image.jpg',
  url,
  type = 'website',
  structuredData
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Create or update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };
    
    // Basic SEO tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'DeSynth', true);
    
    if (image) {
      updateMetaTag('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
      updateMetaTag('og:image:alt', title, true);
    }
    
    if (url) {
      updateMetaTag('og:url', url, true);
    }
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    
    if (image) {
      updateMetaTag('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);
    }
    
    // Add structured data if provided
    if (structuredData) {
      let structuredDataElement = document.querySelector('#structured-data') as HTMLScriptElement;
      
      if (!structuredDataElement) {
        structuredDataElement = document.createElement('script');
        structuredDataElement.id = 'structured-data';
        structuredDataElement.type = 'application/ld+json';
        document.head.appendChild(structuredDataElement);
      }
      
      structuredDataElement.textContent = JSON.stringify({
        "@context": "https://schema.org",
        ...structuredData
      });
    }
    
    // Add canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url || window.location.href;
    
  }, [title, description, keywords, image, url, type, structuredData]);
  
  return null; // This component doesn't render anything
};

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: 'DeSynth - Decentralized Synthetic Biology Protocol',
    description: 'Connect, build, and scale with the leading decentralized synthetic biology protocol. Access verified facilities, secure transactions, and transparent auditing.',
    structuredData: {
      "@type": "WebSite",
      "name": "DeSynth",
      "description": "Decentralized Synthetic Biology Protocol",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/browse?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  },
  browse: {
    title: 'Browse Laboratory Facilities - DeSynth',
    description: 'Discover and book verified synthetic biology facilities worldwide. Access CDMO, sequencing, cloud labs, and manufacturing facilities.',
    keywords: 'laboratory booking, CDMO facilities, synthetic biology labs, manufacturing, sequencing'
  },
  book: {
    title: 'Book Laboratory Facilities - DeSynth',
    description: 'Secure booking for synthetic biology facilities with transparent pricing and blockchain-based escrow protection.',
    keywords: 'laboratory booking, secure payments, escrow, synthetic biology'
  },
  dashboard: {
    title: 'Dashboard - DeSynth',
    description: 'Manage your bookings, facilities, and transactions on the DeSynth platform.',
    keywords: 'dashboard, booking management, facility management'
  }
};