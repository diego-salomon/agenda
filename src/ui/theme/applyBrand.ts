import type { BrandPalette } from '@/config/types';

/**
 * Inject the brand's hues as CSS variables, overriding the fallbacks in
 * index.css.
 */
export function applyBrandPalette(palette: BrandPalette): void {
  const existing = document.getElementById('brand-palette');
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = 'brand-palette';
  const { brand, brandContrast, accent } = palette;
  style.textContent = `:root{--brand:${brand};--brand-contrast:${brandContrast};--accent:${accent};}`;
  document.head.appendChild(style);
}
