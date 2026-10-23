import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function requireAdmin(req,res,next){
  const token=req.cookies?.vrd_admin;
  if(!token)return res.status(401).json({message:'Please sign in to continue.'});
  try{const payload=jwt.verify(token,env.jwtSecret);if(payload.role!=='admin')throw new Error('Invalid role');req.admin={email:payload.email};next();}
  catch{return res.status(401).json({message:'Your session has expired. Please sign in again.'});}
}
