require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const getUser = require('../middleware/auth');

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ user: getUser(req) }),
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ [Issue Service] MongoDB connected');
  app.listen(4002, () => console.log('📋 Issue Service running at http://localhost:4002/graphql'));
}

start().catch(console.error);
