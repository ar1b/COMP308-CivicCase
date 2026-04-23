const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Categorize an issue using Gemini
async function categorizeIssue(title, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a municipal issue classifier. Given this issue title and description, respond with ONLY one of these categories (no extra text): Pothole, Streetlight, Flooding, Safety Hazard, Vandalism, Garbage, Other\n\nTitle: ${title}\nDescription: ${description}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('AI categorization error:', err.message);
    return 'Other';
  }
}

// Agentic chatbot using Gemini with context from database
async function chatWithAI(message) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Fetch real data to give AI context
    const issues = await Issue.find().limit(50).lean();
    const openCount = issues.filter(i => i.status === 'open').length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const inProgressCount = issues.filter(i => i.status === 'in_progress').length;

    const categoryMap = {};
    issues.forEach(i => {
      categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    });
    const categorySummary = Object.entries(categoryMap)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const recentIssues = issues.slice(0, 5)
      .map(i => `- "${i.title}" (${i.category}, ${i.status})`)
      .join('\n');

    const systemContext = `You are CivicBot, an AI assistant for a municipal issue tracking system called CivicCase.

Current database summary:
- Total issues: ${issues.length}
- Open: ${openCount}, In Progress: ${inProgressCount}, Resolved: ${resolvedCount}
- Categories: ${categorySummary}
- Recent issues:\n${recentIssues}

Answer resident and staff questions helpfully and concisely. If asked about specific issues, use the data above. Keep responses under 150 words.`;

    const result = await model.generateContent(`${systemContext}\n\nUser question: ${message}`);
    return result.response.text().trim();
  } catch (err) {
    console.error('Chatbot error:', err.message);
    return 'Sorry, the AI assistant is temporarily unavailable. Please try again shortly.';
  }
}

module.exports = { categorizeIssue, chatWithAI };