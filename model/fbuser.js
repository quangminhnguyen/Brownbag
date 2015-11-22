var mongoose = require('mongoose');
var fbSchema = new mongoose.Schema({
  name: String,
  email: {type: String},
  fbID: {type: String, required: true},
  token: {type: String, required: true},
  auth: {type: mongoose.Schema.Types.ObjectId, required: true,  ref: 'Auth'},
  age: Number,
  preferredCuisine: [String],
  avatar: {type: mongoose.Schema.Types.ObjectId, ref: 'Avatar'},
  // 0 - User, 1 - Admin
  role: {type: Number} 
});

module.exports = mongoose.model('FBUser', fbSchema);