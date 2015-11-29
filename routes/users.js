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

// CONSTANT
var ROLE_USER = 0;
var ROLE_ADMIN = 1;
var CUISINE = ['Japanese', 'Thai', 'Chinese', 'Korean', 'Italian', 'French', 'VietNamese', 'Indian', 'FastFood', 'Others'];
var ACCOUNT_TYPE = ['FACEBOOK USER', 'REGULAR USER', 'ADMIN USER', 'RESTAURANT USER'];
var MAIL_VALID_REX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;

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
    // Redirect user to their main page when clicking at the logo.
    .get(function (req, res, next) {
        mongoose.model('Restaurant').find({}, function (err, users) {
            if (err) {
                return console.error(err);
            } else {
                getAccountType(req.session.userId, function (err, accountType) {
                    if (accountType == ACCOUNT_TYPE[2]) {
                        res.redirect('users/admin');
                    } else {
                        res.redirect('users/main')
                    }
                });
            }
        });
    })
    // POST a new User
    // Redirect the browser.
    .post(function (req, res, next) {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var email = fields.email;
            // Checking for duplicated email. 
            mongoose.model('Auth').count({
                email: email
            }, function (err, count) {
                if (count == 0) {
                    // Only the first user in the User relation can be an admin
                    // Fb user or restaurant user cannot be an admin!
                    var doesExist = mongoose.model('User');

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
                        var accountType = null;
                        var errorMess = '';


                        for (var key in fields) {
                            if (CUISINE.indexOf(key) != -1) {
                                cuisine.push(key);
                            }
                        }

                        // SERVER SIDE INPUT CHECK
                        // validiate input mail format
                        if (MAIL_VALID_REX.test(email) == false) {
                            errorMess += "Invalid Email Address.<br>";
                        }

                        if (!password || password.length < 5 || password.length > 12) {
                            errorMess += "Password length should be between 5 and 12 character. <br>";
                        }

                        if (cuisine.length == 0) {
                            errorMess += 'One of the cuisine must be selected. <br>';
                        }

                        // if first user, make that user admin
                        if (c < 1) {
                            role = ROLE_ADMIN;
                        }
                        
                        // validation for user.
                        if (who == "user") {

                            if (!age || isNaN(age)) {
                                errorMess += "Age must be a number and cannot be blank. <br>";
                            }

                            if (!name || name.length < 5 || name.length > 25) {
                                errorMess += "Name should be between 5 and 25 character in length. <br>";
                            }

                            if (role == ROLE_ADMIN) {
                                accountType = ACCOUNT_TYPE[2];
                            } else if (role == ROLE_USER) {
                                accountType = ACCOUNT_TYPE[1];
                            }
                        
                        // validation for restaurant
                        } else if (who == "owner") {
                            if (!restName || restName.length < 5 || restName.length > 25) {
                                errorMess += 'The restaurant name should be between 5 and 25 characters in length. <br>';
                            }

                            if (!location) {
                                errorMess += 'The location should not be empty. <br>';
                            }

                            if (location.length > 30) {
                                errorMess += 'The location should not be longer than 30 chars. <br>';
                            }
                            accountType = ACCOUNT_TYPE[3];
                        }
                        // if the errorMess is not empty
                        if (errorMess != '') {
                            res.send(errorMess);
                            return;
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
                                        accountType: accountType
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
                                                }, function (err, doc) {
                                                    if (err) {
                                                        res.send("There was a problem adding the user to the User relation.");
                                                    }
                                                    // user has been created
                                                    req.session.userId = user._id;
                                                    req.session.save(function (err) {});
                                                    req.session.alert = null;
                                                    if (role == ROLE_ADMIN) {
                                                        res.redirect('users/admin')
                                                    } else {
                                                        res.redirect('users/main')
                                                    }
                                                });

                                                // User is a owner of a restaurant.
                                            } else if (who == 'owner') {
                                                mongoose.model('Restaurant').create({
                                                    name: restName,
                                                    location: location,
                                                    cuisine: cuisine,
                                                    avatar: picture._id,
                                                    auth: user._id
                                                }, function (err, doc) {
                                                    if (err) {
                                                        res.send("There was a problem adding the user to the Restaurant relation");
                                                    }
                                                    // user has been created
                                                    req.session.userId = user._id;
                                                    req.session.save(function (err) {});
                                                    req.session.alert = null;
                                                    res.redirect('users/main');
                                                });
                                            }
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
                    req.session.save(function (err) {});
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
// 4 cases, i did case 1 as an example
router.get('/main', function (req, res) {
    // Case 1: No query at all, just display all of the restaurant.
    if(!req.query.search && !req.query.rating && !req.query.cuisine) {
        mongoose.model('Restaurant').find({}, function (err, restaurants) {
            if (err) {
                console.log(err);
                return;
            }
            res.render('users/main', {
                restaurants: restaurants
            });
        });

    // Case 2: has "search" as the query (i.e. /main?search=something)
    // the user type something into the search box in the main page ... it can
    // be a cuisine, "part" of a restaurant name because they cannot remember
    // its full name, or location ... the search string can be anything.
    // Your task is to search through the Restaurant like i did in case 1, and list
    // all "related" restaurants.
    } else if (req.query.search) {
    
    // Case 3: has "cuisine" as the query  (i.e. /main?cuisine=somecuisine)
    // the user select a cuisine by selecting a checkbox in the front page
    // your job is to again search through the restaurants in the db, and 
    // gets the list of restaurants that has that cuisine.
    } else if (req.query.cuisine) {
    
    
    // Case 4: has "rating" as the query (i.e. /main?rating=anumberfrom1to5)
    // similar to case3, this time the user want to filter all of the restaurant 
    // that has average rating higher than or equal to a number from 1 to 5.
    } else if (req.query.rating) {
        
    }
    
    // Assume won't have search, cuisine, rating all at the same time.
});


// "/users/admin" 
router.get('/admin', function (req, res) {
    mongoose.model('Restaurant').find({}, function (err, allRestaurants) {
        if (err) {
            console.log(err);
            return;
        }
        mongoose.model('User').find({}, function (err, allRegUsers) {
            if (err) {
                console.log(err);
                return;
            }
            mongoose.model('FBUser').find({}, function (err, allFBUsers) {
                if (err) {
                    console.log(err);
                    return;
                }
                var allUsers = allRestaurants.concat(allRegUsers, allFBUsers);
                // console.log('allUsers: ' + allUsers);
                mongoose.model('Auth').find({}, function (err, auth) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    for (var i = 0; i < auth.length; i++) {
                        for (var k = 0; k < allUsers.length; k++) {
                            if (auth[i]._id.equals(allUsers[k].auth)) {
                                allUsers[k]['accountType'] = auth[i].accountType;
                                console.log('account type: ' + allUsers[k]['accountType']);
                            }
                        }
                    }
                    res.render('users/admin', {
                        users: allUsers
                    });
                });
            });
        });
    });
});




// Redirect the browser.
router.get('/myprofile', function (req, res) {
    var userId = req.session.userId;
    res.redirect('/users/' + userId);
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //find the ID in the Database
    mongoose.model('Auth').findById(id, function (err, user) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            // Render the response.
            res.format({
                html: function () {
                    next(err);
                }
            });
            //if it is found we continue on
        } else {
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});



// "/users/:id"  
router.route('/:id')
    // Display user profile by their id in Auth relation
    .get(function (req, res) {
        mongoose.model('Auth').findById(req.id, function (err, user) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                // Look up the account type of the target user and decide which page to render.
                getAccountType(req.id, function (err, accountType) {

                    // If this is a restaurant
                    if (accountType == ACCOUNT_TYPE[3]) {

                        // Find that restaurant in restaurant table.
                        mongoose.model('Restaurant').findOne({
                            auth: user._id
                        }, function (err, restaurant) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                        
                            getAccountType(req.session.userId, function (err, requestAccountType) {
                            
                            /* TODO: Search through the reviews table to get all reviews object of this restaurant
                            and send list of these objects to the front end. */
                                res.render('users/restaurant-profile', {
                                    restaurant: restaurant,
                                    email: user.email,
                                    canEdit: canEdit(req.session.userId, requestAccountType, req.id),
                                    comments: [] // insert the review object here
                                });
                            });
                        });
                    
                    // If this is a regular user, admin or facebook user.
                    } else {
                        mongoose.model('FBUser').findOne({
                            auth: user._id
                        }, function (err, fbUser) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            mongoose.model('User').findOne({
                                auth: user._id
                            }, function (err, normalUser) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }

                                var displayUser;
                                if (fbUser == null && normalUser != null) {
                                    displayUser = normalUser;
                                } else if (fbUser != null && normalUser == null) {
                                    displayUser = fbUser;
                                } else {
                                    console.log(err);
                                    return;
                                }

                                getAccountType(req.session.userId, function (err, requestAccountType) {
                                    res.render('users/user-profile', {
                                        user: displayUser,
                                        accountType: accountType,
                                        email: user.email,
                                        canEdit: canEdit(req.session.userId, requestAccountType, req.id)
                                    });
                                });
                            });
                        });
                    }
                });
            }
        });
    });

router.get('/:id/conversations'), function (req, res) {

  // get all messages with currentUser 
  // compile list of unique user ids along with names?
  // return list

}



// get AccountType of user with Auth._id.
function getAccountType(id, callback) {
    mongoose.model('Auth').findById(id, function (err, user) {
        if (err) {
            console.error(err);
            callback(err);
        } else {
            var accountType = user.accountType;
            callback(null, accountType);
        }
    });
}


function canEdit(signedInID, signedInAccountType, targetUserID) {
    // if the signed in user is also the target user
    if (signedInID == targetUserID) {
        return true;
    }
    // if the request user is an admin.
    if (signedInAccountType == ACCOUNT_TYPE[2]) {
        return true;
    }
    return false;
}



router.route('/:id/edit')
    // get the edit page
    .get(function (req, res) {
        mongoose.model('Auth').findById(req.id, function (err, user) {
            if (err) {
                console.log('GET Error: There was a problem retriveving: ' + err);
                return;
            }

            // get account type of the request user
            getAccountType(req.session.userId, function (err, requestAccountType) {

                // Check if the logged in user can edit the user req.id
                if (canEdit(req.session.userId, requestAccountType, req.id)) {
                    // if the target is a restaurant.
                    if (user.accountType == ACCOUNT_TYPE[3]) {
                        mongoose.model('Restaurant').findOne({
                            auth: user._id
                        }, function (err, restaurant) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            res.render('users/restaurant-edit', {
                                restaurant: restaurant
                            });
                        });

                        // if the target is not a restaurant 
                    } else {
                        mongoose.model('User').findOne({
                            auth: user._id
                        }, function (err, normalUser) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            mongoose.model('FBUser').findOne({
                                auth: user._id
                            }, function (err, fbUser) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }

                                var displayUser;
                                if (fbUser == null && normalUser != null) {
                                    displayUser = normalUser;
                                } else if (fbUser != null && normalUser == null) {
                                    displayUser = fbuser;
                                } else {
                                    console.log(err);
                                    return;
                                }

                                res.render('users/user-edit', {
                                    user: displayUser
                                });
                            });
                        });
                    }
                } else {
                    res.send('You dont have permission to edit this person profile!');
                }
            });
        });
    });



// post a new review for restaurant with req.id to the realation reviews
// Inside req there are following attributes:
// req.body.rating: the rating
// req.body.comment: the comment string
// After finish createing a new comment in reviews, update the average rating in Restaurant
// Finally, redirect res to /users/:id --> You won't be able to see the comment yet, i did 
// not implement that part yet --> You can implement it inline 394 but you have to change the
// for loop in restaurant-profile.jade
router.post('/:id/comment', function(req, res){
    
});

 

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

module.exports = router;