import express from 'express';
import { initDatabase } from '../server/db';
import { authenticateUser } from '../server/auth';
import { authRouter } from '../server/routes/auth';
import { casesRouter } from '../server/routes/cases';
import { sightingsRouter } from '../server/routes/sightings';
import { imageRouter } from '../server/routes/image';
import { adminRouter } from '../server/routes/admin';
import { notificationsRouter } from '../server/routes/notifications';

// Vercel Node.js Function entry point. The static Vite build is served by Vercel;
// this function handles only /api/* requests.
initDatabase();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// The Vercel rewrite passes the original API path in __path so Express routers
// still receive /api/auth, /api/cases, etc. rather than /api/index.
app.use((req, _res, next) => {
  const originalPath = req.query.__path;
  if (typeof originalPath === 'string' && originalPath.startsWith('/api/')) {
    req.url = originalPath;
  }
  next();
});

app.use(authenticateUser);

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/sightings', sightingsRouter);
app.use('/api/image', imageRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    app: 'FaceTrace AI',
    timestamp: new Date().toISOString(),
    privacy_notice: 'Informational community registry. No automated 1:N facial recognition.',
  });
});

export default app;
