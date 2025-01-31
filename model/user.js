const mongoose = require('mongoose');
<<<<<<< Updated upstream
=======
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  country: {
    type: String,
    default: 'Pakistan'
  },
});
>>>>>>> Stashed changes

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
