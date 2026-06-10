/**
 * ローカル開発用 API サーバー
 *
 * 使い方: npx tsx scripts/dev-api.ts
 *
 * Vite の /api/* プロキシ先（port 4000）として動作する。
 * Vercel Serverless Function と同じハンドラを呼び出すため、
 * 本番と同じコードパスで動作確認できる。
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { parse as parseUrl } from 'node:url';
import handler from '../api/deck-import.js'; // tsx が .js → .ts に解決する

const PORT = 4000;

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // OPTIONS プリフライト対応
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  const { query } = parseUrl(req.url ?? '', true);

  // ハンドラが期待する最小限のリクエストオブジェクトを組み立てる
  const fakeReq = {
    query: query as Record<string, string | string[]>,
    method: req.method,
  };

  try {
    await handler(fakeReq, res as any);
  } catch (err) {
    console.error('[dev-api] unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}).listen(PORT, () => {
  console.log(`\n✓ Dev API server: http://localhost:${PORT}`);
  console.log(`  Test: http://localhost:${PORT}/api/deck-import?code=XXXXXX\n`);
});
