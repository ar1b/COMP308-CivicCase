const Issue = require('../models/Issue');
const { getAITrendAnalysis } = require('../services/aiService');
const { chatWithAgent } = require('../services/agentService');

module.exports = {
  Query: {
    getAnalytics: async () => {
      const issues = await Issue.find().lean();
      const catMap = {};
      issues.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
      return {
        totalIssues: issues.length,
        openIssues: issues.filter(i => i.status === 'open').length,
        inProgressIssues: issues.filter(i => i.status === 'in_progress').length,
        resolvedIssues: issues.filter(i => i.status === 'resolved').length,
        categoryBreakdown: Object.entries(catMap).map(([category, count]) => ({ category, count })),
      };
    },
    getAITrendAnalysis: async () => {
      return await getAITrendAnalysis();
    },
    chatWithAI: async (_, { message }) => {
      return await chatWithAgent(message);
    },
  },
};
