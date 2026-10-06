import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return new Response(
    JSON.stringify({
      id: `${base}/`,
      name: 'atlas',
      short_name: 'atlas',
      description: 'Everything from class, without digging for it.',
      start_url: `${base}/`,
      scope: `${base}/`,
      display: 'standalone',
      background_color: '#f7f6f3',
      theme_color: '#4947ce',
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
