import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { dispatchRecruiterEmail } from './api/contact';
import { validateContactPayload } from './src/world/worldLogic';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      emailRelayConfigured: Boolean(process.env.RESEND_API_KEY),
    });
  });

  app.post('/api/contact', async (req, res) => {
    const body = req.body || {};
    const payload = {
      name: String(body.name ?? '').trim(),
      email: String(body.email ?? '').trim(),
      organization: String(body.organization ?? '').trim(),
      roleType: String(body.roleType ?? 'Engineering Role').trim(),
      message: String(body.message ?? '').trim(),
    };

    const validation = validateContactPayload(payload);
    if (!validation.valid) {
      res.status(400).json({ error: 'Validation failed', errors: validation.errors });
      return;
    }

    try {
      const result = await dispatchRecruiterEmail(payload);
      res.json({
        ok: true,
        id: result.id,
        deliveredVia: result.deliveredVia,
        recipient: 'aashishmahato02@gmail.com',
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Email notification failed',
      });
    }
  });

  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
