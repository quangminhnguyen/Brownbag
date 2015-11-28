var mongoose = require('mongoose'); 

var reviewSchema = new mongoose.Schema({ 
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'Auth'},
  restaurantId: {type: mongoose.Schema.Types.ObjectId, ref: 'Auth'},
  rating: {type: String, required: true},
  comment: String
});

module.exports = mongoose.model('Review', reviewSchema);
