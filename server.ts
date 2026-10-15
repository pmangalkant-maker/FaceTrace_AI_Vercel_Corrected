import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import { authenticateUser } from './server/auth';
import { authRouter } from './server/routes/auth';
import { casesRouter } from './server/routes/cases';
import { sightingsRouter } from './server/routes/sightings';
import { imageRouter } from './server/routes/image';
import { adminRouter } from './server/routes/admin';
import { notificationsRouter } from './server/routes/notifications';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  initDatabase();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static directory for uploaded files
  const uploadsDir = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Global auth context extraction middleware
  app.use(authenticateUser);

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/cases', casesRouter);
  app.use('/api/sightings', sightingsRouter);
  app.use('/api/image', imageRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'FaceTrace AI',
      timestamp: new Date().toISOString(),
      privacy_notice: 'Informational community registry. No automated 1:N facial recognition.',
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FaceTrace AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
