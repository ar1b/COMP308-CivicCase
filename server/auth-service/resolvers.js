const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await User.findById(user.id);
    },
  },
  Mutation: {
    register: async (_, { username, email, password, role }) => {
      const existing = await User.findOne({ email });
      if (existing) throw new Error('Email already registered');
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed, role: role || 'resident' });
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('No account found with that email');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error('Incorrect password');
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },
  },
};
