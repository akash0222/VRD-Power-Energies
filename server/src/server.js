import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import enquiryRoutes from './routes/enquiries.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (env.origins.includes(origin)) return cb(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    return cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '25kb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'vrd-power-energies-api' }));
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({ message: 'Origin not allowed.' });
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});
async function start() {
  if (env.nodeEnv === 'production' && (!env.mongoUri || env.jwtSecret.length < 32 || !env.adminEmail || !env.adminPassword)) {
    throw new Error('Production configuration missing: MONGODB_URI, JWT_SECRET (32+ chars), ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }
  if (!env.mongoUri) throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env and configure it.');
  await mongoose.connect(env.mongoUri);
  app.listen(env.port, '0.0.0.0', () => console.log(`VRD Power Energies API listening on port ${env.port}`));
}
start().catch(err => { console.error(err.message); process.exit(1); });
