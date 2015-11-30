var mongoose = require('mongoose'); 

var messageSchema = new mongoose.Schema({ 
  toId: {type: String, required: true},
  fromId: {type: String, required: true},
  timestamp: {type : Date, default: Date.now}, 
  message: String
});

module.exports = mongoose.model('Message', messageSchema);
