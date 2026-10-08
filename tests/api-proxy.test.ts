import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../deploy/api-proxy/worker';

const origin = 'https://api.atlas.jovanpahal.com';
afterEach(() => vi.unstubAllGlobals());

describe('production API hostname adapter', () => {
  it('keeps a fixed upstream, preserves CSRF/cookies and streams request data', async () => {
    const body = JSON.stringify({ example: 'synthetic request' });
    const upstream = vi.fn(async (request: Request, options: RequestInit) => {
      expect(request.url).toBe(
        'https://glucose-games-server.tail428a5c.ts.net:8443//evil.example/sync?cursor=4',
      );
      expect(request.method).toBe('POST');
      expect(await request.text()).toBe(body);
      expect(request.headers.get('cookie')).toBe('__Host-atlas=synthetic');
      expect(request.headers.get('origin')).toBe(
        'https://atlas.jovanpahal.com',
      );
      expect(request.headers.get('x-csrf-token')).toBe('synthetic-csrf');
      expect(request.headers.get('forwarded')).toBeNull();
      expect(request.headers.get('x-forwarded-for')).toBe('203.0.113.7');
      expect(request.headers.get('x-forwarded-host')).toBe(
        'api.atlas.jovanpahal.com',
      );
      expect(options.cache).toBe('no-store');
      expect(options.redirect).toBe('manual');
      expect(options.signal).toBeInstanceOf(AbortSignal);
      return new Response('ok', {
        headers: {
          'set-cookie':
            '__Host-atlas=synthetic; Path=/; HttpOnly; Secure; SameSite=Lax',
          'access-control-allow-origin': 'https://atlas.jovanpahal.com',
          'access-control-allow-credentials': 'true',
          'cache-control': 'public, max-age=3600',
        },
      });
    });
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(
      new Request(origin + '//evil.example/sync?cursor=4', {
        method: 'POST',
        body,
        headers: {
          cookie: '__Host-atlas=synthetic',
          origin: 'https://atlas.jovanpahal.com',
          'x-csrf-token': 'synthetic-csrf',
          forwarded: 'for=attacker',
          'x-forwarded-for': 'attacker',
          'x-forwarded-host': 'attacker.example',
          'cf-connecting-ip': '203.0.113.7',
        },
      }),
    );
    expect(await result.text()).toBe('ok');
    expect(result.headers.get('set-cookie')).toContain(
      'HttpOnly; Secure; SameSite=Lax',
    );
    expect(result.headers.get('cache-control')).toBe('no-store');
    expect(result.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('does not proxy unrelated hosts, insecure requests or unsupported methods', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    for (const url of [
      'https://other.example/health',
      'http://api.atlas.jovanpahal.com/health',
    ])
      expect((await worker.fetch(new Request(url))).status).toBe(404);
    expect(
      (await worker.fetch(new Request(origin, { method: 'PUT' }))).status,
    ).toBe(405);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('never follows upstream redirects with sensitive headers', async () => {
    const upstream = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://other.example' },
        }),
    );
    vi.stubGlobal('fetch', upstream);
    expect((await worker.fetch(new Request(origin + '/session'))).status).toBe(
      502,
    );
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('returns a generic uncached error without exposing upstream failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('private upstream detail');
      }),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await worker.fetch(new Request(origin + '/health'));
      expect(result.status).toBe(502);
      expect(result.headers.get('cache-control')).toBe('no-store');
      expect(await result.json()).toEqual({
        error: 'Service temporarily unavailable',
      });
      expect(log).toHaveBeenCalledWith('{"code":"atlas_upstream_unavailable"}');
    } finally {
      log.mockRestore();
    }
  });
});
