require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ [Analytics Service] MongoDB connected');
  app.listen(4003, () => console.log('📊 Analytics Service running at http://localhost:4003/graphql'));
}

start().catch(console.error);
