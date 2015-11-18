var mongoose = require('mongoose'); 

var messageSchema = new mongoose.Schema({ 
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  fromId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  time: {type : Date, default: Date.now}, 
  message: String
});

module.exports = mongoose.model('Message', messageSchema);
