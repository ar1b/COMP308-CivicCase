const { gql } = require('apollo-server-express');

module.exports = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
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

  type Notification {
    id: ID!
    message: String!
    type: String!
    issueId: ID
    read: Boolean!
    createdAt: String
  }

  type Query {
    getIssues(status: String): [Issue!]!
    getMyIssues: [Issue!]!
    getIssue(id: ID!): Issue
    getMyNotifications: [Notification!]!
    getUnreadCount: Int!
  }

  type Mutation {
    submitIssue(title: String!, description: String!, location: String, imageUrl: String): Issue!
    updateIssueStatus(id: ID!, status: String!, assignedTo: ID): Issue!
    deleteIssue(id: ID!): Boolean!
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Boolean!
  }
`;
