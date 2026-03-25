
import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  requestType: { type: String, required: true },
  details: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
});

export const Request = mongoose.models.Request || mongoose.model('Request', RequestSchema);
