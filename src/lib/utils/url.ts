/**
 * Dynamic Base URL Resolver for Roxten OS.
 * Automatically resolves the correct application base URL across:
 * 1. Production deployed environments (e.g. https://rox-os.vercel.app)
 * 2. Vercel preview & production deployments (x-forwarded-host / VERCEL_URL)
 * 3. Local development (localhost:3000)
 */

export function getBaseUrl(req?: Request): string {
  // 1. Primary source of truth: Active incoming HTTP request headers
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host && !host.includes('localhost')) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      return `${proto}://${host}`;
    }
  }

  // 2. Browser window context if executed client-side
  if (typeof window !== 'undefined' && window.location.origin) {
    if (!window.location.origin.includes('localhost')) {
      return window.location.origin;
    }
  }

  // 3. Explicit production APP_URL (if configured and not pointing to localhost)
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // 4. Vercel System Environment Variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 5. Explicitly specified NEXT_PUBLIC_APP_URL (including localhost for local development)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  // 6. Request fallback for local dev
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}
