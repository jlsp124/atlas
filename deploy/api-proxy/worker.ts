// TLS and hostname adapter only. Authentication, CSRF, sync and SQLite stay on
// the existing loopback API, reached through its authenticated HTTPS Funnel.
const hostname = 'api.atlas.jovanpahal.com';
const upstreamOrigin = 'https://glucose-games-server.tail428a5c.ts.net:8443';

function unavailable() {
  return Response.json(
    { error: 'Service temporarily unavailable' },
    { status: 502, headers: { 'Cache-Control': 'no-store' } },
  );
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname !== hostname || url.protocol !== 'https:')
      return new Response(null, { status: 404 });
    if (
      !['GET', 'HEAD', 'OPTIONS', 'POST', 'PATCH', 'DELETE'].includes(
        request.method,
      )
    )
      return new Response(null, {
        status: 405,
        headers: { Allow: 'GET, HEAD, OPTIONS, POST, PATCH, DELETE' },
      });

    // Assign the fixed origin separately: a path beginning // must never select
    // another host. Stream the request instead of reading private bodies.
    const upstream = new URL(upstreamOrigin);
    upstream.pathname = url.pathname;
    upstream.search = url.search;
    const outbound = new Request(upstream, request);
    for (const header of [
      'host',
      'forwarded',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-real-ip',
    ])
      outbound.headers.delete(header);
    // Cloudflare sets this header at the edge. Never trust client-supplied
    // forwarding chains. The API remains accessible only through trusted proxies.
    const clientIp = request.headers.get('cf-connecting-ip');
    if (clientIp) outbound.headers.set('x-forwarded-for', clientIp);
    outbound.headers.set('x-forwarded-proto', 'https');
    outbound.headers.set('x-forwarded-host', hostname);

    try {
      const response = await fetch(outbound, {
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      // The API has no redirects. Fail closed rather than send cookies or
      // authorization headers to a destination selected by an upstream redirect.
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        return unavailable();
      }
      const result = new Response(response.body, response);
      result.headers.set('Cache-Control', 'no-store');
      return result;
    } catch {
      // Do not log URLs, query strings, cookies, credentials or response bodies.
      console.error(JSON.stringify({ code: 'atlas_upstream_unavailable' }));
      return unavailable();
    }
  },
};
