var mongoose = require('mongoose'); 

var restaurantSchema = new mongoose.Schema({ 
  name: String,
  location: String,
  cuisine: String,
  avatar: {type: mongoose.Schema.Types.ObjectId, ref: 'Avatar'},
  auth: {type: mongoose.Schema.Types.ObjectId, required: true,  ref: 'Auth'}

  // TODO: what type is menu? pdf?
  // menu: SOMETHING, 

});

module.exports = mongoose.model('Restaurant', restaurantSchema);
