import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Enquiry from '../models/Enquiry.js';
import { notifyEnquiry } from '../services/notify.js';
const router=Router();
const submissionLimit=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many enquiries from this connection. Please try again later.'}});
const clean=(v,max=3000)=>typeof v==='string'?v.trim().slice(0,max):'';
router.post('/',submissionLimit,async(req,res,next)=>{
 try{
  const body=req.body||{};
  const enquiry={
   name:clean(body.name,100),phone:clean(body.phone,25),email:clean(body.email,254).toLowerCase(),
   company:clean(body.company,120),category:clean(body.category,80),quantity:clean(body.quantity,80),message:clean(body.message,3000)
  };
  if(enquiry.name.length<2||enquiry.phone.length<7||enquiry.message.length<10||!enquiry.category)
   return res.status(400).json({message:'Please check your name, phone number, category and message.'});
  if(enquiry.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email))return res.status(400).json({message:'Please enter a valid email address.'});
  if(!['EV Batteries','Energy Storage Batteries','Bulk / B2B Enquiry','Other'].includes(enquiry.category))return res.status(400).json({message:'Please select a valid requirement category.'});
  const saved=await Enquiry.create(enquiry);
  try{await notifyEnquiry(saved);}catch(err){console.error('Optional email notification failed:',err.message);}
  res.status(201).json({message:'Thank you. Your enquiry has been received.',id:saved._id});
 }catch(err){next(err);}
});
export default router;
