const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Issue = require('../models/Issue');

let agentInstance = null;

function buildTools() {
  const getIssuesSummary = tool(
    async () => {
      const issues = await Issue.find().lean();
      const open = issues.filter(i => i.status === 'open').length;
      const inProgress = issues.filter(i => i.status === 'in_progress').length;
      const resolved = issues.filter(i => i.status === 'resolved').length;
      const urgent = issues.filter(i => i.urgent && i.status !== 'resolved').length;
      return JSON.stringify({ total: issues.length, open, inProgress, resolved, urgentUnresolved: urgent });
    },
    {
      name: 'get_issues_summary',
      description: 'Get a count summary of all community issues by status and urgent count',
      schema: z.object({ run: z.boolean().optional().describe('Unused execution flag') }),
    }
  );

  const getIssuesByCategory = tool(
    async ({ category }) => {
      const filter = category ? { category: new RegExp(category, 'i') } : {};
      const issues = await Issue.find(filter).select('title category status urgent location').lean();
      if (issues.length === 0) return `No issues found${category ? ` for category "${category}"` : ''}.`;
      return JSON.stringify(issues.map(i => ({
        title: i.title, category: i.category, status: i.status,
        urgent: i.urgent, location: i.location || 'N/A',
      })));
    },
    {
      name: 'get_issues_by_category',
      description: 'Get issues filtered by category. Known categories: Pothole, Streetlight, Flooding, Safety Hazard, Vandalism, Garbage, Other. Pass empty string for all categories.',
      schema: z.object({ category: z.string().describe('Category name or empty string for all') }),
    }
  );

  const getUrgentIssues = tool(
    async () => {
      const issues = await Issue.find({ urgent: true, status: { $ne: 'resolved' } })
        .select('title category status location createdAt').lean();
      if (issues.length === 0) return 'No urgent unresolved issues at this time.';
      return JSON.stringify(issues.map(i => ({
        title: i.title, category: i.category, status: i.status, location: i.location || 'N/A',
      })));
    },
    {
      name: 'get_urgent_issues',
      description: 'Get all urgent unresolved issues needing immediate attention (Safety Hazards, Flooding, etc.)',
      schema: z.object({ run: z.boolean().optional().describe('Unused execution flag') }),
    }
  );

  const getCategoryBreakdown = tool(
    async () => {
      const issues = await Issue.find().lean();
      const breakdown = {};
      issues.forEach(i => { breakdown[i.category] = (breakdown[i.category] || 0) + 1; });
      const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
      return JSON.stringify(sorted.map(([category, count]) => ({ category, count })));
    },
    {
      name: 'get_category_breakdown',
      description: 'Get a breakdown of issues by category, sorted by frequency — useful for trend analysis',
      schema: z.object({ run: z.boolean().optional().describe('Unused execution flag') }),
    }
  );

  const getRecentIssues = tool(
    async ({ limit }) => {
      const n = Math.min(limit || 5, 10);
      const issues = await Issue.find()
        .sort({ createdAt: -1 }).limit(n)
        .select('title category status urgent createdAt').lean();
      return JSON.stringify(issues.map(i => ({
        title: i.title, category: i.category, status: i.status, urgent: i.urgent,
      })));
    },
    {
      name: 'get_recent_issues',
      description: 'Get the most recently reported issues',
      schema: z.object({ limit: z.number().optional().describe('Number of issues to return (max 10)') }),
    }
  );

  return [getIssuesSummary, getIssuesByCategory, getUrgentIssues, getCategoryBreakdown, getRecentIssues];
}

async function getAgent() {
  if (agentInstance) return agentInstance;

  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });

  const systemPrompt = `You are CivicBot, an AI assistant for CivicCase — a municipal issue tracking system for a Canadian city. You help residents and staff understand community issues, trends, and status updates.

Always use the available tools to fetch real data before answering. Be helpful, friendly, and concise. Keep responses under 200 words. If you don't know something, say so.

Specialized capabilities:
- Safety alerts: flag urgent/safety issues proactively
- Trend analysis: identify patterns in issue categories
- Status queries: answer questions about open, in-progress, and resolved issues`;

  agentInstance = createReactAgent({
    llm: model,
    tools: buildTools(),
    messageModifier: systemPrompt,
  });

  return agentInstance;
}

async function chatWithAgent(message) {
  try {
    const agent = await getAgent();
    const result = await agent.invoke({
      messages: [{ role: 'user', content: message }],
    });
    const last = result.messages[result.messages.length - 1];
    const content = last.content;
    return typeof content === 'string' ? content : (content[0]?.text ?? 'No response generated.');
  } catch (err) {
    console.error('LangGraph agent error:', err.message);
    return await fallbackChat(message);
  }
}

async function fallbackChat(message) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const issues = await Issue.find().limit(20).lean();
    const context = `Total issues: ${issues.length}. Recent: ${issues.slice(0, 3).map(i => i.title).join(', ')}.`;
    const result = await model.generateContent(
      `You are CivicBot for a Canadian municipality. Context: ${context}\n\nUser: ${message}\n\nAnswer concisely in under 150 words.`
    );
    return result.response.text().trim();
  } catch (e) {
    return 'Sorry, the AI assistant is temporarily unavailable. Please try again shortly.';
  }
}

module.exports = { chatWithAgent };