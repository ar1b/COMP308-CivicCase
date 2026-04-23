const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { categorizeIssue } = require('../services/aiService');

module.exports = {
  Query: {
    getIssues: async (_, { status }) => {
      const filter = status ? { status } : {};
      return await Issue.find(filter)
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email')
        .sort({ createdAt: -1 });
    },
    getMyIssues: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Issue.find({ reportedBy: user.id })
        .populate('reportedBy', 'username email')
        .sort({ createdAt: -1 });
    },
    getIssue: async (_, { id }) => {
      return await Issue.findById(id)
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email');
    },
    getMyNotifications: async (_, __, { user }) => {
      if (!user) return [];
      return await Notification.find({ userId: user.id }).sort({ createdAt: -1 }).limit(25);
    },
    getUnreadCount: async (_, __, { user }) => {
      if (!user) return 0;
      return await Notification.countDocuments({ userId: user.id, read: false });
    },
  },

  Mutation: {
    submitIssue: async (_, { title, description, location, imageUrl }, { user }) => {
      if (!user) throw new Error('You must be logged in to submit an issue');
      const category = await categorizeIssue(title, description);
      const isUrgent = category === 'Safety Hazard' || category === 'Flooding';
      const issue = await Issue.create({
        title, description, location, imageUrl,
        category, reportedBy: user.id, urgent: isUrgent,
      });
      if (isUrgent) {
        const staffUsers = await User.find({ role: 'staff' }).lean();
        await Promise.all(staffUsers.map(staff =>
          Notification.create({
            userId: staff._id,
            message: `⚠️ URGENT: New ${category} reported — "${title}"${location ? ` at ${location}` : ''}`,
            type: 'urgent_alert',
            issueId: issue._id,
          })
        ));
      }
      return issue;
    },

    updateIssueStatus: async (_, { id, status, assignedTo }, { user }) => {
      if (!user || user.role !== 'staff') throw new Error('Only staff can update issues');
      const update = { status };
      if (assignedTo) update.assignedTo = assignedTo;
      const updated = await Issue.findByIdAndUpdate(id, update, { new: true })
        .populate('reportedBy', 'username email')
        .populate('assignedTo', 'username email');
      if (updated?.reportedBy?._id) {
        await Notification.create({
          userId: updated.reportedBy._id,
          message: `Your issue "${updated.title}" status changed to ${status.replace('_', ' ')}.`,
          type: 'status_update',
          issueId: id,
        });
      }
      return updated;
    },

    deleteIssue: async (_, { id }, { user }) => {
      if (!user || user.role !== 'staff') throw new Error('Only staff can delete issues');
      await Issue.findByIdAndDelete(id);
      await Notification.deleteMany({ issueId: id });
      return true;
    },

    markNotificationRead: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await Notification.findOneAndUpdate({ _id: id, userId: user.id }, { read: true });
      return true;
    },

    markAllNotificationsRead: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await Notification.updateMany({ userId: user.id, read: false }, { read: true });
      return true;
    },
  },
};
