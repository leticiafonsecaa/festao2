import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import guestRoutes from './routes/guests.js';
import giftRoutes from './routes/gifts.js';
import vendorRoutes from './routes/vendors.js';
import publicRoutes from './routes/public.js';
import { ApiError } from './lib/http.js';

const app = express();

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/guests', guestRoutes);
app.use('/api/events/:eventId/gifts', giftRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/public', publicRoutes);

// 404 para qualquer rota nao encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.originalUrl}` });
});

// Tratamento central de erros
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  // Erros conhecidos do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Esse registro ja existe' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro nao encontrado' });
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API do Festão rodando em http://localhost:${port}`);
});
