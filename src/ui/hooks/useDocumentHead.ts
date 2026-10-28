import { useEffect } from 'react';
import { brand } from '@/config/brand.config';

/**
 * Per-route <title> and meta description. A lightweight stand-in for full SSR
 * prerender: see README "SEO & prerender" for turning this into static HTML.
 */
export function useDocumentHead(title: string, description?: string): void {
  useEffect(() => {
    document.title = `${title} · ${brand.name}`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
}
