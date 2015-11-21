var mongoose = require('mongoose');
var fbSchema = new mongoose.Schema({
  name: String,
  email: {type: String},
  id: {type: String, required: true},
  token: {type: String, required: true},
  age: Number,
  token: String,
  preferredCuisine: [String],
  avatar: {type: mongoose.Schema.Types.ObjectId, ref: 'Avatar'},
  // 0 - User, 1 - Admin
  role: {type: Number} 
});

module.exports = mongoose.model('FBUser', fbSchema);

