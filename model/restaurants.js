var mongoose = require('mongoose'); 

var restaurantSchema = new mongoose.Schema({ 
  name: String,
  location: String,
  cuisine: [String],
  avatar: {type: mongoose.Schema.Types.ObjectId, ref: 'Avatar'},
  auth: {type: mongoose.Schema.Types.ObjectId, required: true,  ref: 'Auth'},
  rating: {type: Number, min: 0, max: 5}
  // TODO: what type is menu? pdf?
  // menu: SOMETHING, 
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
