import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 5000);
const production = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
const jwtSecret = process.env.JWT_SECRET || '';
const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public'), { index: false, maxAge: production ? '1h' : 0 }));

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  company: { type: String, trim: true, maxlength: 150, default: '' },
  interest: { type: String, required: true, enum: ['EV battery packs','Energy storage batteries','Custom battery packs','OEM / bulk supply','Retail purchase','Distribution partnership','Other'] },
  quantity: { type: String, trim: true, maxlength: 100, default: '' },
  timeline: { type: String, trim: true, maxlength: 100, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['New','Contacted','Quoted','Closed'], default: 'New' }
}, { timestamps: true, versionKey: false });
const Enquiry = mongoose.model('Enquiry', enquirySchema);

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many enquiries from this network. Please try again later or contact us on WhatsApp.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Try again later.' } });

function validateText(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max; }
function validEmail(value) { return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function issueToken() {
  return jwt.sign({ sub: adminEmail, role: 'admin' }, jwtSecret, { expiresIn: '8h', issuer: 'vrd-power-energies' });
}
function requireAdmin(req, res, next) {
  const token = req.cookies.vrd_admin;
  if (!token) return res.status(401).json({ error: 'Please sign in to access the admin dashboard.' });
  try {
    const payload = jwt.verify(token, jwtSecret, { issuer: 'vrd-power-energies' });
    if (payload.role !== 'admin' || payload.sub !== adminEmail) throw new Error('Invalid token');
    req.admin = payload; next();
  } catch { res.clearCookie('vrd_admin', cookieOptions()); return res.status(401).json({ error: 'Session expired. Please sign in again.' }); }
}
function cookieOptions() {
  return { httpOnly: true, secure: production, sameSite: production ? 'none' : 'lax', maxAge: 8 * 60 * 60 * 1000, path: '/' };
}
async function sendEnquiryEmail(doc) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL, FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !NOTIFY_EMAIL || !FROM_EMAIL) return false;
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transporter.sendMail({
    from: FROM_EMAIL, to: NOTIFY_EMAIL,
    replyTo: doc.email,
    subject: `New website enquiry: ${doc.interest}`,
    text: `A new enquiry was submitted to VRD Power Energies.\n\nName: ${doc.name}\nEmail: ${doc.email}\nCompany: ${doc.company || 'Not provided'}\nInterest: ${doc.interest}\nQuantity: ${doc.quantity || 'Not provided'}\nTimeline: ${doc.timeline || 'Not provided'}\nStatus: ${doc.status}\n\nRequirements:\n${doc.message}\n\nSubmitted: ${doc.createdAt.toISOString()}`
  });
  return true;
}

app.get('/api/health', (_req,res)=>res.json({ status: 'ok', service: 'vrd-power-energies-api' }));

app.post('/api/enquiries', publicLimiter, async (req,res,next) => {
  try {
    const { name, email, company='', interest, quantity='', timeline='', message } = req.body || {};
    if (!validateText(name,100) || !validEmail(email) || !validateText(interest,80) || !validateText(message,5000)) {
      return res.status(400).json({ error: 'Please provide a valid name, email, product interest and message.' });
    }
    const allowed = ['EV battery packs','Energy storage batteries','Custom battery packs','OEM / bulk supply','Retail purchase','Distribution partnership','Other'];
    if (!allowed.includes(interest)) return res.status(400).json({ error: 'Please choose a valid product interest.' });
    if (typeof company !== 'string' || company.length > 150 || typeof quantity !== 'string' || quantity.length > 100 || typeof timeline !== 'string' || timeline.length > 100) {
      return res.status(400).json({ error: 'One or more fields are too long.' });
    }
    const doc = await Enquiry.create({ name:name.trim(), email:email.trim().toLowerCase(), company:company.trim(), interest, quantity:quantity.trim(), timeline:timeline.trim(), message:message.trim() });
    let emailSent = false;
    try { emailSent = await sendEnquiryEmail(doc); }
    catch (mailError) { console.error('Enquiry email delivery failed:', mailError.message); }
    res.status(201).json({ ok:true, id:doc.id, emailNotification: emailSent ? 'sent' : 'not_configured' });
  } catch(err) { next(err); }
});

app.post('/api/admin/login', loginLimiter, async (req,res) => {
  if (!adminEmail || !adminPasswordHash || jwtSecret.length < 32) return res.status(503).json({ error: 'Admin login is not configured on the server yet.' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== adminEmail || !(await bcrypt.compare(password, adminPasswordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.cookie('vrd_admin', issueToken(), cookieOptions()).json({ ok:true });
});
app.get('/api/admin/me', requireAdmin, (_req,res)=>res.json({ authenticated:true }));
app.post('/api/admin/logout', (_req,res)=>res.clearCookie('vrd_admin', cookieOptions()).json({ ok:true }));
app.get('/api/admin/enquiries', requireAdmin, async (req,res,next) => {
  try {
    const docs = await Enquiry.find().sort({createdAt:-1}).limit(500).lean();
    res.json({ enquiries:docs.map(d=>({id:String(d._id),name:d.name,email:d.email,company:d.company,interest:d.interest,quantity:d.quantity,timeline:d.timeline,message:d.message,status:d.status,createdAt:d.createdAt})) });
  } catch(err) { next(err); }
});
app.patch('/api/admin/enquiries/:id', requireAdmin, async (req,res,next) => {
  try {
    const status = req.body?.status;
    if (!['New','Contacted','Quoted','Closed'].includes(status)) return res.status(400).json({error:'Invalid status.'});
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({error:'Invalid enquiry id.'});
    const doc = await Enquiry.findByIdAndUpdate(req.params.id,{status},{new:true,runValidators:true});
    if (!doc) return res.status(404).json({error:'Enquiry not found.'});
    res.json({ok:true,status:doc.status});
  } catch(err) { next(err); }
});
app.get('/admin', (_req,res)=>res.sendFile(path.join(__dirname,'../public/admin.html')));

app.use((err, _req, res, _next) => {
  if (err.message === 'Origin not allowed by CORS') return res.status(403).json({error:'Origin not allowed.'});
  console.error('API error:', err.message);
  res.status(500).json({error:'An unexpected server error occurred.'});
});

async function start() {
  if (jwtSecret.length < 32) console.warn('WARNING: Set JWT_SECRET to a random secret of at least 32 characters before production.');
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is required.'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  app.listen(port, '0.0.0.0', ()=>console.log(`VRD API listening on ${port}`));
}
start().catch(err=>{console.error('Startup failed:',err.message);process.exit(1);});
