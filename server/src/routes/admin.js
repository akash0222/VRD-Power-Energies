import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Enquiry from '../models/Enquiry.js';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';
const router=Router();
const loginLimit=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many sign-in attempts. Try again later.'}});
router.post('/login',loginLimit,async(req,res)=>{
 const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
 const password=typeof req.body?.password==='string'?req.body.password:'';
 const expected=env.adminEmail.toLowerCase();
 if(!expected||!env.adminPassword||!env.jwtSecret)return res.status(503).json({message:'Admin authentication is not configured on the server.'});
 const passwordMatch=await bcrypt.compare(password,await bcrypt.hash(env.adminPassword,10));
 if(email!==expected||!passwordMatch)return res.status(401).json({message:'Invalid email or password.'});
 const token=jwt.sign({role:'admin',email},env.jwtSecret,{expiresIn:'8h'});
 res.cookie('vrd_admin',token,{httpOnly:true,secure:env.cookieSecure,sameSite:'lax',maxAge:8*60*60*1000,path:'/'});
 res.json({message:'Signed in.'});
});
router.post('/logout',(req,res)=>{res.clearCookie('vrd_admin',{httpOnly:true,secure:env.cookieSecure,sameSite:'lax',path:'/'});res.json({message:'Signed out.'});});
router.get('/enquiries',requireAdmin,async(req,res,next)=>{try{const enquiries=await Enquiry.find().sort({createdAt:-1}).limit(500).lean();res.json({enquiries});}catch(e){next(e);}});
router.patch('/enquiries/:id',requireAdmin,async(req,res,next)=>{
 try{const status=req.body?.status;if(!['new','in_progress','resolved'].includes(status))return res.status(400).json({message:'Invalid enquiry status.'});
 const enquiry=await Enquiry.findByIdAndUpdate(req.params.id,{status},{new:true,runValidators:true});if(!enquiry)return res.status(404).json({message:'Enquiry not found.'});res.json({enquiry});}catch(e){next(e);}
});
export default router;
