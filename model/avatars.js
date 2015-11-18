var mongoose = require('mongoose');

var avatarSchema = new mongoose.Schema({
  img: {data: Buffer, contentType: String}
});

module.exports = mongoose.model('Avatar', avatarSchema);
