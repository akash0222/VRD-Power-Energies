import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
export async function sendCustomerEmail({ to, subject, message }) {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword) {
    const error = new Error('Email is not configured. Add SMTP settings to the API server.');
    error.status = 503;
    throw error;
  }
  const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpSecure, auth: { user: env.smtpUser, pass: env.smtpPassword } });
  await transporter.sendMail({ from: env.smtpUser, to, subject, text: message });
}

export async function notifyEnquiry(enquiry){
  if(!env.smtpHost||!env.smtpUser||!env.smtpPassword||!env.notificationEmail)return;
  const transporter=nodemailer.createTransport({host:env.smtpHost,port:env.smtpPort,secure:env.smtpSecure,auth:{user:env.smtpUser,pass:env.smtpPassword}});
  await transporter.sendMail({from:env.smtpUser,to:env.notificationEmail,subject:`New VRD website enquiry: ${enquiry.category}`,text:`Name: ${enquiry.name}\nPhone: ${enquiry.phone}\nEmail: ${enquiry.email||'Not supplied'}\nCompany: ${enquiry.company||'Not supplied'}\nCategory: ${enquiry.category}\nQuantity: ${enquiry.quantity||'Not supplied'}\nMessage:\n${enquiry.message}`});
}
