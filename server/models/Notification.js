const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:  { type: String, required: true },
  type:     { type: String, enum: ['status_update', 'urgent_alert', 'general'], default: 'general' },
  issueId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
