import { createServer } from './app';
const app = await createServer({
  logger: true,
  trustProxy: process.env.TRUST_PROXY === 'true',
});
await app.listen({
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 8787),
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
