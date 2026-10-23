import mongoose from 'mongoose';
const enquirySchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,minlength:2,maxlength:100},
  phone:{type:String,required:true,trim:true,maxlength:25},
  email:{type:String,trim:true,lowercase:true,maxlength:254,default:''},
  company:{type:String,trim:true,maxlength:120,default:''},
  category:{type:String,required:true,enum:['EV Batteries','Energy Storage Batteries','Bulk / B2B Enquiry','Other']},
  quantity:{type:String,trim:true,maxlength:80,default:''},
  message:{type:String,required:true,trim:true,minlength:10,maxlength:3000},
  status:{type:String,enum:['new','in_progress','resolved'],default:'new',index:true},
  source:{type:String,default:'website'}
},{timestamps:true,versionKey:false});
export default mongoose.model('Enquiry',enquirySchema);
