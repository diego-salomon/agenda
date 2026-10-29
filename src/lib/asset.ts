/**
 * Resolve a public asset path (e.g. "/img/logo.svg") against the app's base
 * URL, so images keep working when the app is served from a subpath like
 * /agenda/ on GitHub Pages. At the root base this returns the path unchanged.
 */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
