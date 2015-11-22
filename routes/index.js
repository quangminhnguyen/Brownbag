var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var session = require('express-session');
var app = express();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'FoodsNet'
    });
});

// regular login - not facebook
router.route('/login')
    .post(function (req, res) {
        var emailAdr = req.body.email;
        var pass = req.body.password;

        // Find the user requested.
        mongoose.model('Auth').findOne({
            'email': emailAdr
        }, function (err, user) {
            if (err) {
                // Add message for the user to see on the next page view.
                req.session.alert = "Invalid Username or Password";
                req.session.save(function (err) {});
                res.redirect('back');
                return handleError(err);
            }
            
            // Found the user with that email
            if (user) {
                console.log('user password hash is: ' + user.password);
                
                // Check the password.
                user.comparePassword(pass, function (err, isMatch) {
                    if (err) throw err;
                    // login successful 
                    if (isMatch) {
                        req.session.userId = user._id;
                        req.session.save(function (err) {});
                        
                        mongoose.model('User').find({auth: user._id}, function(err, allRegUser) {
                            if(err) {
                                console.log(err);
                                return;
                            }
                            /* This is user is a regular user */
                            if(allRegUser.length == 1) {
                                if (allRegUser[0].role == 1) {
                                    res.redirect('/users/admin/index');
                                } else {
                                    res.redirect('/users/main');
                                }
                            /* This user is a restaurant */
                            } else {
                                mongoose.model('Restaurant')
                                res.redirect('/users/main');
                            }
                        });
                        
                    
                    // login fail
                    } else {
                        // Add message for the user to see on the next page view.
                        req.session.alert = "Invalid Username or Password";
                        req.session.save(function (err) {});
                        res.redirect('back');
                    }
                });
            } else {
                // Add message for the user to see on the next page view.
                req.session.alert = "Invalid Username or Password";
                req.session.save(function (err) {});
                res.redirect('back');
            }
        });
    });

router.get('/signup', function (req, res, next) {
    console.log("SIGN UP");
    res.render('signup');
});

router.get('/logout', function (req, res, next) {
    // Clear the user's session.
    req.session.destroy(function (err) {});
    res.redirect('/');
});


module.exports = router;