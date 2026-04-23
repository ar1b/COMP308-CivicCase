const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { categorizeIssue, chatWithAI } = require('../services/aiService');

module.exports = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await User.findById(user.id);
    },

    getIssues: async (_, { status }) => {
      const filter = status ? { status } : {};
      return await Issue.find(filter)
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email')
        .sort({ createdAt: -1 });
    },

    getIssue: async (_, { id }) => {
      return await Issue.findById(id)
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email');
    },

    getAnalytics: async () => {
      const issues = await Issue.find().lean();
      const catMap = {};
      issues.forEach(i => {
        catMap[i.category] = (catMap[i.category] || 0) + 1;
      });
      return {
        totalIssues: issues.length,
        openIssues: issues.filter(i => i.status === 'open').length,
        inProgressIssues: issues.filter(i => i.status === 'in_progress').length,
        resolvedIssues: issues.filter(i => i.status === 'resolved').length,
        categoryBreakdown: Object.entries(catMap).map(([category, count]) => ({ category, count })),
      };
    },

    chatWithAI: async (_, { message }) => {
      return await chatWithAI(message);
    },
  },

  Mutation: {
    register: async (_, { username, email, password, role }) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error('Email already registered');
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed, role: role || 'resident' });
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('No account found with that email');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Incorrect password');
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },

    submitIssue: async (_, { title, description, location, imageUrl }, { user }) => {
      if (!user) throw new Error('You must be logged in to submit an issue');
      const category = await categorizeIssue(title, description);
      return await Issue.create({
        title, description, location, imageUrl,
        category,
        reportedBy: user.id,
        urgent: category === 'Safety Hazard' || category === 'Flooding',
      });
    },

    updateIssueStatus: async (_, { id, status, assignedTo }, { user }) => {
      if (!user || user.role !== 'staff') throw new Error('Only staff can update issues');
      const update = { status };
      if (assignedTo) update.assignedTo = assignedTo;
      return await Issue.findByIdAndUpdate(id, update, { new: true })
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email');
    },

    deleteIssue: async (_, { id }, { user }) => {
      if (!user || user.role !== 'staff') throw new Error('Only staff can delete issues');
      await Issue.findByIdAndDelete(id);
      return true;
    },
  },
};