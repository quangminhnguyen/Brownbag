var mongoose = require('mongoose'); 

var reviewSchema = new mongoose.Schema({ 
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  restaurantId: {type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant'},
  rating: {type: String, required: true},
  comment: String
});

module.exports = mongoose.model('Review', reviewSchema);
