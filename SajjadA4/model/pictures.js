var mongoose = require('mongoose');

var pictureSchema = new mongoose.Schema({
  img: {data: Buffer, contentType: String}
});

module.exports = mongoose.model('Picture', pictureSchema);
