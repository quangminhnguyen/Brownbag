var mongoose = require('mongoose'); 

var userSchema = new mongoose.Schema({ 
  name: String,
  age: Number,
  preferredCuisine: [String],
  avatar: {type: mongoose.Schema.Types.ObjectId, ref: 'Avatar'},
  auth: {type: mongoose.Schema.Types.ObjectId, required: true,  ref: 'Auth'},
  // 0 - User, 1 - Admin
  role: {type: Number, required: true } 
});

module.exports = mongoose.model('User', userSchema);
