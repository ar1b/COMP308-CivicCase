require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

async function startServer() {
  const app = express();
  
  // CRITICAL FIX: Ensure Mongoose is connecting!
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Analytics Service connected to MongoDB');

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Your auth middleware context logic
    }
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen(4003, () => {
    console.log(`Analytics Service running at http://localhost:4003${server.graphqlPath}`);
  });
}

startServer();