import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendCustomerEmail } from '../services/notify.js';

const router = Router();
const configuredPasswordHash = env.adminPassword ? bcrypt.hash(env.adminPassword, 10) : null;
const cookieSameSite = env.cookieSecure ? 'none' : 'lax';
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Too many sign-in attempts. Try again later.' } });

router.post('/login', loginLimit, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const expected = env.adminEmail.toLowerCase();
  if (!expected || !env.adminPassword || !env.jwtSecret) return res.status(503).json({ message: 'Admin authentication is not configured on the server.' });
  const passwordMatch = configuredPasswordHash ? await bcrypt.compare(password, await configuredPasswordHash) : false;
  if (email !== expected || !passwordMatch) return res.status(401).json({ message: 'Invalid email or password.' });
  const token = jwt.sign({ role: 'admin', email }, env.jwtSecret, { expiresIn: '8h' });
  res.cookie('vrd_admin', token, { httpOnly: true, secure: env.cookieSecure, sameSite: cookieSameSite, maxAge: 8 * 60 * 60 * 1000, path: '/' });
  res.json({ message: 'Signed in.' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('vrd_admin', { httpOnly: true, secure: env.cookieSecure, sameSite: cookieSameSite, path: '/' });
  res.json({ message: 'Signed out.' });
});

router.get('/enquiries', requireAdmin, async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(500).lean();
    res.json({ enquiries });
  } catch (error) { next(error); }
});

router.patch('/enquiries/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid enquiry ID.' });
    const updates = {};
    const { status, followUpStatus, nextFollowUpAt } = req.body || {};
    if (status !== undefined) {
      if (!['new', 'in_progress', 'resolved'].includes(status)) return res.status(400).json({ message: 'Invalid enquiry status.' });
      updates.status = status;
    }
    if (followUpStatus !== undefined) {
      if (!['pending', 'contacted', 'follow_up_required', 'completed'].includes(followUpStatus)) return res.status(400).json({ message: 'Invalid follow-up status.' });
      updates.followUpStatus = followUpStatus;
    }
    if (nextFollowUpAt !== undefined) {
      if (nextFollowUpAt === null || nextFollowUpAt === '') updates.nextFollowUpAt = null;
      else {
        const date = new Date(nextFollowUpAt);
        if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Enter a valid follow-up date and time.' });
        updates.nextFollowUpAt = date;
      }
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid enquiry updates were supplied.' });
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.json({ enquiry });
  } catch (error) { next(error); }
});

router.post('/enquiries/:id/notes', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid enquiry ID.' });
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 2000) return res.status(400).json({ message: 'Note must contain 1 to 2,000 characters.' });
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { $each: [{ text, createdBy: req.admin.email }], $slice: -100 } },
        $set: { ...(req.body?.markContacted === true ? { followUpStatus: 'contacted' } : {}) } },
      { new: true, runValidators: true }
    );
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.status(201).json({ enquiry });
  } catch (error) { next(error); }
});


router.post('/enquiries/:id/interactions', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid enquiry ID.' });
    const { channel, outcome = 'opened', message = '', subject = '' } = req.body || {};
    if (!['whatsapp', 'email'].includes(channel) || !['opened', 'sent', 'received', 'failed'].includes(outcome)) {
      return res.status(400).json({ message: 'Invalid communication details.' });
    }
    if (typeof message !== 'string' || message.length > 5000 || typeof subject !== 'string' || subject.length > 180) {
      return res.status(400).json({ message: 'Communication details are too long.' });
    }
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $push: { interactions: { $each: [{ channel, outcome, message: message.trim(), subject: subject.trim(), createdBy: req.admin.email }], $slice: -200 } } },
      { new: true, runValidators: true }
    );
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    res.status(201).json({ enquiry });
  } catch (error) { next(error); }
});

router.post('/enquiries/:id/email', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid enquiry ID.' });
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!subject || subject.length > 180 || !message || message.length > 5000) {
      return res.status(400).json({ message: 'Subject and message are required (maximum 180 and 5,000 characters).' });
    }
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });
    if (!enquiry.email) return res.status(400).json({ message: 'This enquiry does not have a customer email address.' });
    await sendCustomerEmail({ to: enquiry.email, subject, message });
    enquiry.interactions.push({ channel: 'email', outcome: 'sent', subject, message, createdBy: req.admin.email });
    if (enquiry.interactions.length > 200) enquiry.interactions = enquiry.interactions.slice(-200);
    await enquiry.save();
    res.status(201).json({ enquiry, message: 'Email sent successfully.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
});

export default router;
