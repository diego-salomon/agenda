import type { BrandPalette } from '@/config/types';

/**
 * Inject the brand's hues as CSS variables, overriding the fallbacks in
 * index.css. Light values apply by default; dark values apply under OS dark
 * mode (unless the user forced light) and under an explicit [data-theme="dark"].
 */
export function applyBrandPalette(palette: BrandPalette): void {
  const existing = document.getElementById('brand-palette');
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = 'brand-palette';
  const { light, dark } = palette;
  style.textContent = `
:root{--brand:${light.brand};--brand-contrast:${light.brandContrast};--accent:${light.accent};}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--brand:${dark.brand};--brand-contrast:${dark.brandContrast};--accent:${dark.accent};}}
:root[data-theme="dark"]{--brand:${dark.brand};--brand-contrast:${dark.brandContrast};--accent:${dark.accent};}
`.trim();
  document.head.appendChild(style);
}
