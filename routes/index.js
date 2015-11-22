var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var session = require('express-session');
var app = express();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'FoodsNet' });
});

router.route('/login')
//    .get(function(req, res, next) {
//      res.render('login');
//    })

    .post(function (req, res) {

      var emailAdr = req.body.email;
      var pass = req.body.password;

      var user = mongoose.model('User');
      // Find the user requested.
      user.findOne ({ 'email': emailAdr }, function (err, user) {
        if (err) {
            
          // Add message for the user to see on the next page view.
          req.session.alert = "Invalid Username or Password";
          req.session.save(function(err){});
          res.redirect('back');
          return handleError(err);
        } 

        if (user) {
          console.log('user password hash is: ' + user.password);
          // Check the password.
          user.comparePassword(pass, function(err, isMatch) {
              if (err) throw err;
              
              // login successful 
              if (isMatch) {
                req.session.userId = user._id;
                req.session.save(function(err){});
                res.redirect("/users");
              }
              else {
                // Add message for the user to see on the next page view.
                req.session.alert = "Invalid Username or Password";
                req.session.save(function(err){});
                res.redirect('back');
              }
          });

        } else {
          // Add message for the user to see on the next page view.
          req.session.alert = "Invalid Username or Password";
          req.session.save(function(err){});
          res.redirect('back');
        }
      });
    });


router.get('/signup', function(req, res, next) {
    console.log("SIGN UP");
    res.render('signup');
});

router.get('/logout', function(req, res, next) {
  // Clear the user's session.
  req.session.destroy(function(err) {});
  res.render("/")
});


module.exports = router;