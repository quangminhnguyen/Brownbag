var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
  email: {type: String, required: true, index: { unique: true } },
  password: {type: String, required: true}, // not required because user may use fb login.
  name: String,
  description: String,
  profilePicture: {type: mongoose.Schema.Types.ObjectId, ref: 'Picture'},
  // 1 - Super admin, 2 - admin, 0 - user 
  role: {type: Number, required: true } 

});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  console.log('comparing: ' + candidatePassword + '-' + this.password);
  // Use a hashed comparison.
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        cb(err);
      }
      cb(null, isMatch);
  });
};

userSchema.path('description').validate(function (v) {
  return v.length < 500;
}, 'Description too large'); 


module.exports = mongoose.model('User', userSchema);
