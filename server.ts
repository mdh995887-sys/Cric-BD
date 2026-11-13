import express, { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal']);

function isAllowedStreamUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) return null;
    if (
      host.startsWith('169.254.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function rewriteM3u8Manifest(manifestText: string, baseUrl: string): string {
  const toProxyUrl = (target: string) => {
    try {
      const resolved = new URL(target.trim(), baseUrl).toString();
      return `/api/stream-proxy?url=${encodeURIComponent(resolved)}`;
    } catch {
      return target;
    }
  };

  return manifestText
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Rewrite URI="..." attributes inside HLS tags (#EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, etc.)
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/gi, (_match, uri) => {
          return `URI="${toProxyUrl(uri)}"`;
        });
      }

      return toProxyUrl(trimmed);
    })
    .join('\n');
}

async function readSavedChannels(): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(CHANNELS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSavedChannels(channels: unknown[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CHANNELS_FILE, JSON.stringify(channels, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Persistent Server Backup API for Admin Channels
  app.get('/api/channels', async (_req: Request, res: Response) => {
    const channels = await readSavedChannels();
    res.json({ channels });
  });

  app.post('/api/channels', async (req: Request, res: Response) => {
    const { channels } = req.body || {};
    if (!Array.isArray(channels)) {
      res.status(400).json({ error: 'Invalid channels array' });
      return;
    }
    await writeSavedChannels(channels);
    res.json({ ok: true, count: channels.length });
  });

  // HLS Stream Proxy (resolves HTTP Mixed Content & CORS issues in HTTPS browsers)
  app.options('/api/stream-proxy', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(204).end();
  });

  app.get('/api/stream-proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const targetUrl = isAllowedStreamUrl(rawUrl);

    if (!targetUrl) {
      res.status(400).json({ error: 'Invalid or disallowed stream URL' });
      return;
    }

    const controller = new AbortController();
    const isPlaylistHint = targetUrl.pathname.toLowerCase().includes('.m3u8');
    const timeoutMs = isPlaylistHint ? 8000 : 15000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const upstream = await fetch(targetUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          Accept: '*/*',
        },
      });

      clearTimeout(timer);

      if (!upstream.ok) {
        res.status(upstream.status).send(`Upstream error: ${upstream.status}`);
        return;
      }

      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      const finalUrl = upstream.url || targetUrl.toString();

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const looksLikeM3u8 =
        contentType.includes('mpegurl') ||
        contentType.includes('m3u') ||
        finalUrl.toLowerCase().includes('.m3u8') ||
        targetUrl.pathname.toLowerCase().includes('.m3u8');

      if (looksLikeM3u8) {
        const text = await upstream.text();
        if (!text.trimStart().startsWith('#EXTM3U')) {
          res.status(502).send('Upstream did not return a valid HLS playlist');
          return;
        }
        const rewritten = rewriteM3u8Manifest(text, finalUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.status(200).send(rewritten);
        return;
      }

      const buf = Buffer.from(await upstream.arrayBuffer());
      const outType =
        contentType ||
        (finalUrl.toLowerCase().includes('.ts') ? 'video/mp2t' : 'application/octet-stream');
      res.setHeader('Content-Type', outType);
      res.status(200).send(buf);
    } catch (err) {
      clearTimeout(timer);
      const message = err instanceof Error ? err.message : 'Proxy fetch failed';
      res.status(502).send(message);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CricBD server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
