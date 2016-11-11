

const mongoose = require('mongoose');
const schema = mongoose.Schema;

const admin = new schema({
  email: String,
  password: String,
  securityQuestion: String,
  securityAnswer: String
});

const Admin = mongoose.model('Admin', admin);

module.exports = Admin;
