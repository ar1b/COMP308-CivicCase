const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String
  }

  type Issue {
    id: ID!
    title: String!
    description: String!
    category: String
    status: String!
    location: String
    imageUrl: String
    urgent: Boolean
    reportedBy: User
    assignedTo: User
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

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
    me: User
    getIssues(status: String): [Issue!]!
    getIssue(id: ID!): Issue
    getAnalytics: Analytics!
    chatWithAI(message: String!): String!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!, role: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    submitIssue(title: String!, description: String!, location: String, imageUrl: String): Issue!
    updateIssueStatus(id: ID!, status: String!, assignedTo: ID): Issue!
    deleteIssue(id: ID!): Boolean!
  }
`;