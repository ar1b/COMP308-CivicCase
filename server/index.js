require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const getUser = require('./middleware/auth');

async function startServer() {
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
  console.log('✅ MongoDB connected');

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running at http://localhost:${process.env.PORT}/graphql`);
  });
}

startServer().catch(console.error);