const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Categorize an issue using Gemini
async function categorizeIssue(title, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a municipal issue classifier. Given this issue title and description, respond with ONLY one of these categories (no extra text): Pothole, Streetlight, Flooding, Safety Hazard, Vandalism, Garbage, Other\n\nTitle: ${title}\nDescription: ${description}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('AI categorization error:', err.message);
    return 'Other';
  }
}

async function getAITrendAnalysis() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const issues = await Issue.find().lean();

    if (issues.length === 0) {
      return 'No issues have been reported yet. Trends will appear once residents start submitting reports.';
    }

    const categoryMap = {};
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentIssues = issues.filter(i => new Date(i.createdAt) > weekAgo);

    issues.forEach(i => { categoryMap[i.category] = (categoryMap[i.category] || 0) + 1; });
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    const urgentCount = issues.filter(i => i.urgent && i.status !== 'resolved').length;
    const resolutionRate = issues.length > 0
      ? Math.round((issues.filter(i => i.status === 'resolved').length / issues.length) * 100)
      : 0;

    const prompt = `You are an AI analyst for a Canadian municipal issue tracking system. Analyze this data and provide 3-4 actionable insights in plain text (no markdown headers, no bullet points with special chars, just short paragraphs):

Total issues: ${issues.length}
Open: ${issues.filter(i => i.status === 'open').length}
In Progress: ${issues.filter(i => i.status === 'in_progress').length}
Resolved: ${issues.filter(i => i.status === 'resolved').length}
Resolution rate: ${resolutionRate}%
Urgent unresolved: ${urgentCount}
New this week: ${recentIssues.length}
Category breakdown: ${Object.entries(categoryMap).map(([k, v]) => `${k}(${v})`).join(', ')}
Top category: ${topCategory ? topCategory[0] : 'N/A'}

Focus on: top problem areas, resolution performance, urgent issues needing attention, and week-over-week activity. Keep it under 200 words.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Trend analysis error:', err.message);
    return 'AI trend analysis is temporarily unavailable. Please try again shortly.';
  }
}

module.exports = { categorizeIssue, getAITrendAnalysis };