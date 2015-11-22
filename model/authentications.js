var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var authSchema = new mongoose.Schema({
  email: {type: String, required: true, index: {unique: true}},
  password: {type: String}
});


authSchema.methods.comparePassword = function(candidatePassword, cb) {
  console.log('comparing: ' + candidatePassword + '-' + this.password);
  // Use a hashed comparison.
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        cb(err);
      }
      cb(null, isMatch);
  });
};

module.exports = mongoose.model('Auth', authSchema);
