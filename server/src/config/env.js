import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
function normalizeOrigin(value) {
  const raw = value.trim().replace(/\\/+$/, '');
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).origin;
  } catch {
    return '';
  }
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  // Accept host-only entries in Render while normalizing them to exact browser origins.
  origins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean),
  // Production cross-site session cookies must always be Secure.
  cookieSecure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  notificationEmail: process.env.NOTIFICATION_EMAIL || ''
};
