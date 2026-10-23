import dotenv from 'dotenv';
dotenv.config();
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  origins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',').map(x=>x.trim()).filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  notificationEmail: process.env.NOTIFICATION_EMAIL || ''
};
