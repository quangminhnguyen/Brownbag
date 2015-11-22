var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var bodyParser = require('body-parser'); //parses information from POST
var methodOverride = require('method-override'); //used to manipulate POST
var formidable = require('formidable');
var qt = require('quickthumb');
var fs = require('fs');
var path = require('path');
var Schema = mongoose.Schema;
var session = require('express-session');
var bcrypt = require('bcrypt');


var ROLE_USER = 0;
var ROLE_ADMIN = 1;
var CUISINE = ['Japanese', 'Thai', 'Chinese', 'Korean', 'Italian', 'French', 'VietNamese', 'Indian', 'FastFood'];

express().use(qt.static(__dirname + '/'));
router.use(bodyParser.urlencoded({
    extended: true
}));

router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}));

// "/users"
router.route('/')
    // get all users
    .get(function (req, res, next) {
        mongoose.model('User').find({}, function (err, users) {
            if (err) {
                return console.error(err);
            } else {
                // Render the response.
                res.format({
                    html: function () {
                        res.render('users/index', {
                            title: 'Welcome, ',
                            "users": users
                        });
                    }
                });
            }
        });
    })
    // POST a new User
    // Redirect the browser.
    .post(function (req, res) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var email = fields.email;

            // Checking for duplicated email. 
            mongoose.model('Auth').count({
                email: email
            }, function (err, count) {
                if (count == 0) {
                    var doesExist = mongoose.model('Auth');

                    // Counting # of user 
                    var users = doesExist.count("", function (err, c) {
                        var age = fields.age; // regular user only
                        var name = fields.name; // regular user only
                        var password = fields.password; 
                        var pic = files.profilePicture;
                        var role = ROLE_USER; // regular user by default
                        var cuisine = [];
                        var who = fields.user; // restaurant owner or basic user 
                        var restName = fields.restName; // Restaurant only
                        var location = fields.location; // Restaurant only
                        
                        for (var key in fields) {
                            if (CUISINE.indexOf(key) != -1) {
                                cuisine.push(key);
                            }
                        }
                        console.log('cuisine', cuisine);
                        // if first user, make that user admin
                        if (c < 1) {
                            role = ROLE_ADMIN;
                        }
                        if (!name) {
                            name = email;
                        }
                        
                        // Use default image if none is specified.
                        var fileToRead = pic.size > 0 ? pic.path : (path.join(__dirname, '../') + 'public/images/avatar.jpg');
                        fs.readFile(fileToRead, function (err, data) {
                            if (err) throw err;
                            var img = {
                                data: data,
                                contentType: pic.type
                            };

                            // Save binary image.
                            var profilePicture = mongoose.model('Avatar').create({
                                img: img
                            }, function (err, picture) {
                                if (err) {
                                    res.send("There was a problem adding the PROFILE PICTURE to the database.");
                                }

                                // Store hashed passwords.
                                hashPassword(password, function (err, hashedPassword) {

                                    // Create new user.
                                    mongoose.model('Auth').create({
                                        email: email,
                                        password: hashedPassword,
                                        // profilePicture: picture._id,
                                    }, function (err, user) {
                                        if (err) {
                                            res.send("There was a problem adding the user to the Auth relation.");
                                        } else {

                                            // Normal user
                                            if (who == 'user') {
                                                mongoose.model('User').create({
                                                    name: name,
                                                    age: age,
                                                    preferredCuisine: cuisine,
                                                    avatar: picture._id,
                                                    auth: user._id,
                                                    role: role
                                                });

                                            // User is a owner is a restaurant.
                                            } else if (who == 'owner') {
                                                mongoose.model('Restaurant').create({
                                                    name: restName,
                                                    location: location,
                                                    cuisine: cuisine,
                                                    avatar: picture._id,
                                                    auth: user._id
                                                });
                                            }
                                            
                                            // user has been created
                                            req.session.userId = user._id;
                                            req.session.save(function (err) {});
                                            req.session.alert = null;
                                            
                                            if (who = 'user') {
                                                res.redirect('users/main');
                                            } else if (who = 'owener') {
                                                res.redirect('users/main');
                                            }
                                            // res.redirect("/users/myprofile");
                                        }
                                    });
                                });
                            });
                        });
                    });
                /* Indicate that email has been used */
                } else {
                    // console.log("Warning this email has been used");
                    req.session.alert = "The email you typed in has been used";
                    // req.session.save(function(err){});
                    res.redirect('back');
                }
            });
        });
    });


function hashPassword(password, cb) {
    bcrypt.genSalt(10, function (err, salt) {
        if (err) cb(err);

        // hash the password using our new salt
        bcrypt.hash(password, salt, function (err, hash) {
            if (err) cb(err);
            cb(null, hash);
        });
    });
}

// "/users/main" Displaying list of restaurants in the main page of the user
router.get('/main', function(req, res) {
    console.log("alo");
    mongoose.model('Restaurant').find({}, function (err, restaurants){
        if (err) {
            console.log(err);
            return;
        }
        res.render('users/main', {restaurants: restaurants});
    });
});


//// Redirect the browser.
//router.get('/myprofile', function (req, res) {
//    var userId = req.session.userId;
//    res.redirect('/users/' + userId);
//});
//
//// route middleware to validate :id
//router.param('id', function (req, res, next, id) {
//    //find the ID in the Database
//    mongoose.model('User').findById(id, function (err, user) {
//        //if it isn't found, we are going to repond with 404
//        if (err) {
//            console.log(id + ' was not found');
//            res.status(404)
//            var err = new Error('Not Found');
//            err.status = 404;
//            // Render the response.
//            res.format({
//                html: function () {
//                    next(err);
//                }
//            });
//            //if it is found we continue on
//        } else {
//            // once validation is done save the new item in the req
//            req.id = id;
//            // go to the next thing
//            next();
//        }
//    });
//});
//
//// get an individual user to display it
//router.route('/:id')
//    .get(function (req, res) {
//        mongoose.model('User').findById(req.id, function (err, user) {
//            if (err) {
//                console.log('GET Error: There was a problem retrieving: ' + err);
//            } else {
//                // Look up the logged-in user's role.
//                getUserRole(req, function (err, role) {
//                    // See if the user is allowed to edit the target profile.
//                    var editable = canEdit(req.session.userId, role, user);
//                    var profilePic = mongoose.model('Avatar').findById(user.profilePicture, function (err, picture) {
//                        if (err) {
//                            console.log('GET Error: There was a problem retrieving: ' + err);
//                        }
//
//                        // Render the response.
//                        res.format({
//                            html: function () {
//                                res.render('users/show', {
//                                    "user": user,
//                                    "imgURL": "/pictures/" + picture._id,
//                                    "editable": editable,
//                                    "canPromote": canPromote(user, role)
//                                });
//                            }
//                        });
//                    });
//                });
//            }
//        });
//    });
//
//router.post('/:id/makeAdmin', function (req, res) {
//
//    mongoose.model('User').findById(req.id, function (err, user) {
//        // Look up the logged-in user's role.
//        getUserRole(req, function (err, role) {
//            if (role == ROLE_SUPER_ADMIN) {
//                // Update user object.
//                user.update({
//                    role: ROLE_ADMIN
//                }, function (err, userID) {
//                    if (err) {
//                        res.send("There was a problem updating the information to the database: " + err);
//                    } else {
//                        // Render the response.
//                        res.format({
//                            html: function () {
//                                // Redirect the browser.
//                                res.redirect("/users/" + user._id);
//                            }
//                        });
//                    }
//                });
//            }
//        });
//    });
//});
//
//// get the individual user by Mongo ID
//router.get('/:id/edit', function (req, res) {
//    mongoose.model('User').findById(req.id, function (err, user) {
//        if (err) {
//            console.log('GET Error: There was a problem retrieving: ' + err);
//        } else {
//
//            // Look up the logged-in user's role.
//            getUserRole(req, function (err, role) {
//                // See if the user is allowed to edit the target profile.
//                if (canEdit(req.session.userId, role, user)) {
//                    // Render the response.
//                    res.format({
//                        html: function () {
//                            res.render('users/edit', {
//                                title: 'User' + user._id,
//                                "user": user,
//                            });
//                        }
//                    });
//                } else {
//                    console.log("YOU DONT HAVE PERMISSION. GET OUT");
//                }
//            });
//        }
//    });
//});
//
//// put to update a user by ID
//router.put('/:id/edit', function (req, res) {
//    var name = req.body.name;
//    var description = req.body.description;
//
//    mongoose.model('User').findById(req.id, function (err, user) {
//        // Look up the logged-in user's role.
//        getUserRole(req, function (err, role) {
//            // See if the user is allowed to edit the target profile.
//            if (canEdit(req.session.userId, role, user)) {
//                // update user
//                // Update user object.
//                user.update({
//                    name: name,
//                    description: description
//                }, function (err, userID) {
//                    if (err) {
//                        res.send("There was a problem updating the information to the database: " + err);
//                    } else {
//                        // Render the response.
//                        res.format({
//                            html: function () {
//                                // Redirect the browser.
//                                res.redirect("/users/" + user._id);
//                            },
//                            json: function () {
//                                res.json(users);
//                            }
//                        });
//                    }
//                });
//            }
//        });
//    });
//});
//
//// put to update a user by ID
//router.post('/:id/updatePassword', function (req, res) {
//    var password = req.body.password;
//    var newPassword = req.body.newPassword;
//    var confirmPassword = req.body.confirmPassword;
//
//    mongoose.model('User').findById(req.id, function (err, user) {
//        // Look up the logged-in user's role.
//        getUserRole(req, function (err, role) {
//            // See if the user is allowed to edit the target profile.
//            if (canEdit(req.session.userId, role, user)) {
//                console.log('user password before updating: ' + user.password);
//                user.comparePassword(password, function (err, isMatch) {
//                    if (isMatch) {
//                        if (newPassword == confirmPassword) {
//                            hashPassword(newPassword, function (err, hashedPassword) {
//                                // Update user object.
//                                user.update({
//                                    password: hashedPassword
//                                }, function (err, userID) {
//                                    if (err) {
//                                        req.session.alert = "Unable to update password";
//                                        // Redirect the browser.
//                                        res.redirect('back');
//                                    } else {
//                                        console.log('password updated to ' + newPassword);
//                                        req.session.successAlert = "Password updated";
//                                        // Redirect the browser.
//                                        res.redirect('back');
//                                    }
//                                });
//                            });
//                        } else {
//                            req.session.alert = "Passwords don't match";
//                            // Redirect the browser.
//                            res.redirect('back');
//                        }
//                    } else {
//                        req.session.alert = 'Invalid password entered';
//                        // Redirect the browser.
//                        res.redirect('back');
//                    }
//                });
//            }
//        });
//    });
//});
//
//// delete a user by ID
//router.delete('/:id/delete', function (req, res) {
//    mongoose.model('User').findById(req.id, function (err, user) {
//        if (err) {
//            return console.error(err);
//        } else {
//            // Look up the logged-in user's role.
//            getUserRole(req, function (err, role) {
//                if (canDelete(req.session.userId, role, user)) {
//                    //remove it from Mongo
//                    user.remove(function (err, user) {
//                        if (err) {
//                            return console.error(err);
//                        } else {
//                            // returning success messages saying it was deleted
//                            console.log('DELETE removing ID: ' + user._id);
//                            // Render the response.
//                            res.format({
//                                html: function () {
//                                    if (req.session.userId == user._id) {
//                                        req.session.destroy(function (err) {});
//                                        res.redirect("/");
//                                    } else {
//                                        // Redirect the browser.
//                                        res.redirect("/users");
//                                    }
//                                },
//                                json: function () {
//                                    res.json({
//                                        message: 'deleted',
//                                        item: user
//                                    });
//                                }
//                            });
//                        }
//                    });
//                } else {
//                    res.status(401);
//                    res.send("Can't delete");
//                }
//            });
//        }
//    });
//});
//
//function canPromote(user, role) {
//    if (role == ROLE_SUPER_ADMIN && user.role == ROLE_USER) {
//        return true;
//    }
//    return false;
//}
//
//function getUserRole(req, cb) {
//    var userId = req.session.userId;
//
//    mongoose.model('User').findById(userId, function (err, user) {
//        if (err) {
//            cb(err);
//            console.error(err);
//        } else {
//            var role = user.role;
//            console.log("role is: " + role);
//            cb(null, role);
//        }
//
//    });
//}
//
//// See if the user is allowed to edit the target profile.
//function canEdit(signedInID, singedInRole, targetUser) {
//
//    if (singedInRole == ROLE_SUPER_ADMIN) {
//        return true;
//    }
//    if (singedInRole == ROLE_ADMIN && targetUser.role == ROLE_USER) {
//        return true;
//    }
//    if (signedInID == targetUser._id) {
//        return true;
//    }
//
//    return false;
//}
//
//// See if the user is allowed to delete the target profile.
//function canDelete(signedInID, singedInRole, targetUser) {
//    if (targetUser.role == ROLE_SUPER_ADMIN) {
//        return false;
//    }
//    // See if the user is allowed to edit the target profile.
//    return canEdit(signedInID, singedInRole, targetUser);
//}


module.exports = router;