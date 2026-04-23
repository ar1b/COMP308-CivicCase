const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, default: 'Uncategorized' },
  status:      { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  location:    { type: String },
  imageUrl:    { type: String },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  urgent:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);