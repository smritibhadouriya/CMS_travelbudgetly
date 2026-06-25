/** @type {import('next').NextConfig} */

// CORS for the PUBLIC website (separate origin) calling public API endpoints
// from the browser (comment submit, newsletter subscribe). Set
// PUBLIC_SITE_ORIGIN in production; dev falls back to the local public app.
// NOTE: no `Access-Control-Allow-Credentials` — these endpoints are anonymous,
// and omitting it keeps the auth-protected admin routes safe cross-origin.
const PUBLIC_SITE_ORIGIN = process.env.PUBLIC_SITE_ORIGIN || 'http://localhost:3001';
const CORS_HEADERS = [
  { key: 'Access-Control-Allow-Origin', value: PUBLIC_SITE_ORIGIN },
  { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
];

const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      { source: '/api/comments/blog/:path*', headers: CORS_HEADERS },
      { source: '/api/newsletter/subscribe', headers: CORS_HEADERS },
      { source: '/api/newsletter/unsubscribe', headers: CORS_HEADERS },
    ];
  },
};

export default nextConfig;
