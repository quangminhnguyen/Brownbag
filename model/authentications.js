var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var authSchema = new mongoose.Schema({
  email: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true}
});

module.exports = mongoose.model('Auth', authSchema);
