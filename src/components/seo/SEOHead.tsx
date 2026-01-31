import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://uptoza.com/og-image.png',
  type = 'website',
  noIndex = false,
  jsonLd,
}: SEOHeadProps) => {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to set or create link tag
    const setLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    setMeta('description', description);
    if (noIndex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow');
    }

    // Canonical URL
    if (canonicalUrl) {
      setLink('canonical', canonicalUrl);
    }

    // Open Graph tags
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type, true);
    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true);
    }
    if (ogImage) {
      setMeta('og:image', ogImage, true);
    }
    setMeta('og:site_name', 'Uptoza', true);

    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (ogImage) {
      setMeta('twitter:image', ogImage);
    }
    setMeta('twitter:site', '@Uptoza');

    // JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    // Cleanup function
    return () => {
      // Keep meta tags on unmount for SPA navigation
    };
  }, [title, description, canonicalUrl, ogImage, type, noIndex, jsonLd]);

  return null;
};

export default SEOHead;
