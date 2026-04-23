const { gql } = require('apollo-server-express');

module.exports = gql`
  type Analytics {
    totalIssues: Int!
    openIssues: Int!
    inProgressIssues: Int!
    resolvedIssues: Int!
    categoryBreakdown: [CategoryCount!]!
  }

  type CategoryCount {
    category: String!
    count: Int!
  }

  type Query {
    getAnalytics: Analytics!
    getAITrendAnalysis: String!
    chatWithAI(message: String!): String!
  }
`;
