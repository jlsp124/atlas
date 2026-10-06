import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return new Response(
    JSON.stringify({
      id: `${base}/`,
      name: 'atlas',
      short_name: 'atlas',
      description:
        'Your courses, connected. Lessons, practice and local progress.',
      start_url: `${base}/`,
      scope: `${base}/`,
      display: 'standalone',
      background_color: '#f8f9f6',
      theme_color: '#245d45',
      icons: [
        {
          src: `${base}/icons/icon-192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${base}/icons/icon-512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
};
