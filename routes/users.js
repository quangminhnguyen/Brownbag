// Modules
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

// App setting
express().use(qt.static(__dirname + '/'));
router.use(bodyParser.urlencoded({
    extended: true
}));

// Overide POST method by another method if request.
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
                        res.redirect('users/main');
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

                        // Server side input validation for user who don't use the interface!
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

                            if (!location || location.length < 5 || location.length > 30) {
                                errorMess += 'The restaurant address should be between 5 and 30 characters <br>';
                            }
                            accountType = ACCOUNT_TYPE[3];
                        }
                        
                        // if the errorMess is not empty
                        if (errorMess != '') {
                            res.status(400).send(errorMess);
                            return;
                        }

                        // Use default image if none is specified.
                        var fileToRead;
                        if (pic) {
                            if (who == 'user') {
                                fileToRead = pic.size > 0 ? pic.path : (path.join(__dirname, '../') + 'public/images/avatar.jpg');
                            } else if (who = 'owner') {
                                fileToRead = pic.size > 0 ? pic.path : (path.join(__dirname, '../') + 'public/images/restaurant.png');
                            }
                        } else {
                            if (who == 'user') {
                                fileToRead = path.join(__dirname, '../') + 'public/images/avatar.jpg';
                            } else if (who = 'owner') {
                                fileToRead = path.join(__dirname, '../') + 'public/images/restaurant.png';
                            }
                            
                        }
                        
                        fs.readFile(fileToRead, function (err, data) {
                            if (err) throw err;
                            var img = {
                                data: data,
                                contentType: 'String'
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

                                    var myname = "";
                                    if (name != "") {
                                        myname = name
                                    } 
                                    if (restName != "") {
                                        myname = restName
                                    }
                                    // Create new user.
                                    mongoose.model('Auth').create({
                                        email: email,
                                        password: hashedPassword,
                                        name: myname,
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
                                                        res.redirect('/users/admin')
                                                    } else {
                                                        res.redirect('/users/main')
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
                                                    res.redirect('/users/main');
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

// Hashing the password.
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
router.get('/main', function (req, res) {
    // This will be changed to recommended
    if (!req.query.search && !req.query.rating && !req.query.cuisine) {
        mongoose.model('Restaurant').find({}, function (err, restaurants) {
            if (err) {
                console.log(err);
                return;
            }
            res.render('users/main', {
                restaurants: restaurants
            });
        });

        // Case 2
    } else if (req.query.cuisine && !req.query.rating) {

        mongoose.model('Restaurant').find({
            cuisine: {
                "$in": [req.query.cuisine]
            }
        }, function (err, restaurants) {
            if (err) {
                console.log(err);
                return;
            }
            res.render('users/main', {
                restaurants: restaurants
            });
        });

    }

    //Case 3
    else if (req.query.cuisine && req.query.rating) {
        console.log('Searching for:' + req.query.cuisine + ' and:' + parseFloat(req.query.rating));
        mongoose.model('Restaurant').find({
            'cuisine': req.query.cuisine,
            'rating': {
                $gte: parseFloat(req.query.rating)
            }
        }, function (err, restaurants) {
            if (err) {
                console.log(err);
                return;
            }
            res.render('users/main', {
                restaurants: restaurants
            });

        });

    }

    //Case 4
    else if (!req.query.cuisine && req.query.rating) {
        console.log('Searching for:' + parseFloat(req.query.rating));
        mongoose.model('Restaurant').find({
            'rating': {
                $gte: parseFloat(req.query.rating)
            }
        }, function (err, restaurants) {
            if (err) {
                console.log(err);
                return;
            }
            res.render('users/main', {
                restaurants: restaurants
            });
        });
    }
});


// "/users/admin" Redirect user to the admin page, only if the user is an admin.
router.get('/admin', function (req, res) {
    // Access Control: don't allow users to access to the admin page.
    getAccountType(req.session.userId, function (err, accountType) {
        // If is not an admin 
        if (accountType != ACCOUNT_TYPE[2]) {
            console.log('accounttype: ' + ACCOUNT_TYPE[2]);
            res.redirect('back');
            return;
        }
        // Gets a specific list of users in the database 
        if (!req.query.userType) {
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
                                        // console.log('account type: ' + allUsers[k]['accountType']);
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
        } else if (req.query.userType == 'Customers') {
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
                    var allUsers = allRegUsers.concat(allFBUsers);
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
        } else if (req.query.userType == 'Restaurants') {
            mongoose.model('Restaurant').find({}, function (err, allUsers) {
                if (err) {
                    console.log(err);
                    return;
                }
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
        }
    });
});


// "/users/myprofile" - Redirect the browser to /users/:id where id is the user session.userId.
router.get('/myprofile', function (req, res) {
    var userId = req.session.userId;
    res.redirect('/users/' + userId);
});


// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //find the ID in the Database
    mongoose.model('Auth').findById(id, function (err, user) {
        //if it isn't found, we are going to repond with 404
        if (err || !user) {
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
        mongoose.model('Auth').findById(req.id, function (err, viewedUser) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                // Look up the account type of the target user and decide which page to render.
                getAccountType(req.id, function (err, accountType) {

                    var authCallback = function (err, allAuths) {

                        // If this is a restaurant
                        if (accountType == ACCOUNT_TYPE[3]) {

                            // Find that restaurant in restaurant table.
                            mongoose.model('Restaurant').findOne({
                                auth: viewedUser._id
                            }, function (err, restaurant) {

                                getAccountType(req.session.userId, function (err, requestAccountType) {

                                    var obj = [];
                                    var recommended = ["There is no restaurant with similar cuisine"];
                                        mongoose.model('Restaurant').where('name').ne(restaurant.name).find({cuisine : { "$in" : restaurant.cuisine}}, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            recommended = result;
                                        });
                                    //Find all reviews associated with this restaurant
                                    mongoose.model('Review').find({
                                        restaurantId: restaurant.auth
                                    }, function (err, reviews) {

                                        var counter = 0;
                                        var i;
                                        for(i = 0; i<reviews.length; i++){
                                            if(reviews[i].comment) {
                                                counter++;
                                            }
                                        }

                                        if (counter == 0){ //There is no comment in the database
                                            res.render('users/restaurant-profile', {
                                                restaurant: restaurant,
                                                email: viewedUser.email,
                                                canEdit: canEdit(req.session.userId, requestAccountType, req.id),
                                                canRate: canRate(requestAccountType),
                                                comments: [],
                                                auths: allAuths,
                                                recommended: recommended,
                                                canDelete: canDelete(req.session.userId, requestAccountType, req.id)
                                            });
                                        }

                                        for(i = 0; i<reviews.length; i++){ // For each review, collect associated username and rating
                                            if(reviews[i].comment) {
                                                item = {};
                                                item["comment"] = reviews[i].comment;
                                                item["rating"] = reviews[i].rating;
                                                finduser(reviews[i].userId,item, counter);
                                            }
                                        }

                                    });

                                    //Function which finds username from "User" and "FBUser" tables given user id
                                    function finduser(reviewerUserId, itemn, count) {
                                        mongoose.model('User').findOne({
                                            auth: reviewerUserId
                                        }, function (err, reviewerUser) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            if (reviewerUser) {
                                                itemn["name"] = reviewerUser.name;
                                                obj.push(itemn);

                                                if(count==obj.length){ //All the comments have been collected, so render the restaurant page
                                                    res.render('users/restaurant-profile', {
                                                        restaurant: restaurant,
                                                        email: viewedUser.email,
                                                        canEdit: canEdit(req.session.userId, requestAccountType, req.id),
                                                        canRate: canRate(requestAccountType),
                                                        comments: obj,
                                                        auths: allAuths,
                                                        recommended: recommended,
                                                        canDelete: canDelete(req.session.userId, requestAccountType, req.id)
                                                    });
                                                }
                                            }
                                            else { // If user is not found in the "User" table, it's probably in "FBUser" table

                                                mongoose.model('FBUser').findOne({
                                                    auth: reviewerUserId
                                                }, function (err, reviewerFbUser) {
                                                    if (reviewerFbUser) {
                                                        itemn["name"] = reviewerFbUser.name;
                                                        obj.push(itemn);

                                                        if(count==obj.length){ //All the comments have been collected, so render the restaurant page
                                                            res.render('users/restaurant-profile', {
                                                                restaurant: restaurant,
                                                                email: viewedUser.email,
                                                                canEdit: canEdit(req.session.userId, requestAccountType, req.id),
                                                                canRate: canRate(requestAccountType),
                                                                comments: obj,
                                                                auths: allAuths,
                                                                recommended: recommended,
                                                                canDelete: canDelete(req.session.userId, requestAccountType, req.id)
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });

                        // If this is a regular user, admin or facebook user.
                        } else {
                            mongoose.model('FBUser').findOne({
                                auth: viewedUser._id
                            }, function (err, fbUser) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                mongoose.model('User').findOne({
                                        auth: viewedUser._id
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
                                                email: viewedUser.email,
                                                canEdit: canEdit(req.session.userId, requestAccountType, req.id),
                                                auths: allAuths,
                                                canDelete: canDelete(req.session.userId, requestAccountType, req.id)
                                            });
                                        });
                                    });
                                });
                        }
                    };
                    var currentUserEmail = res.locals.currentUser.email;
                    var messagesCallback = function (err, msgs) {
                        var temp = {};
                        for (var msg in msgs) {
                            var message = msgs[msg];
                            if (message.fromId != currentUserEmail) {
                                temp[message.fromId] = true;

                            } else if (message.toId != currentUserEmail) {
                                temp[message.toId] = true;
                            }
                        }
                        var uniqueRecipientEmails = [];
                        for (var recipient in temp) {
                            uniqueRecipientEmails.push(recipient);
                        }

                        var auths = mongoose.model('Auth');
                        auths.find({
                                email: {$in: uniqueRecipientEmails}
                            })
                            .exec(authCallback);
                    };
                    var messages = mongoose.model('Message');
                    messages.find({
                            $or: [{fromId: currentUserEmail}, {toId: currentUserEmail}]
                        })
                        .exec(messagesCallback);
                });
            }
        });
    })
    // Deleting a user from the database, performed only by the admin!
    .delete(function (req, res) {
        getAccountType(req.session.userId, function (err, accountType) {
            // Only the admin can delete a user.
            if (accountType != ACCOUNT_TYPE[2]) {
                res.send("You don't have permission to delete this user.");
                return;
            }
            // Preventing admin from deleting its own account.
            if (accountType == ACCOUNT_TYPE[2] && req.session.userId == req.id) {
                res.send("An Admin account cannot be deleted.");
                return;
            }
            mongoose.model('Auth').findByIdAndRemove(req.id, function (err, deletedAuth) {
                if (err) {
                    console.log(err);
                    return;
                }
                // If the deleted user is a restaurant.
                if (deletedAuth.accountType == ACCOUNT_TYPE[3]) {
                    mongoose.model('Restaurant').findOneAndRemove({
                        auth: req.id
                    }, function (err, deletedRestaurant) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        
                        // Delete the user avatar.
                        mongoose.model('Avatar').findByIdAndRemove(deletedRestaurant.avatar, function (err, deletedAvatar) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            
                            // Delete user comment.
                            mongoose.model('Review').findOneAndRemove({userId: req.id}, function(){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.redirect('/users/admin');
                            });                            
                        });
                    });
                // If the deleted user is a fbuser.
                } else if (deletedAuth.accountType == ACCOUNT_TYPE[0]) {
                    mongoose.model('FBUser').findOneAndRemove({
                        auth: req.id
                    }, function (err, deletedFBUser) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        // Delete user avatar
                        mongoose.model('Avatar').findByIdAndRemove(deletedFBUser.avatar, function (err, deleteFBUser) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            // Delete user comment.
                            mongoose.model('Review').findOneAndRemove({userId: req.id}, function(){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.redirect('/users/admin');
                            });
                        });
                    });
                // If the deleted user is a regular user or admin.
                } else if ((deletedAuth.accountType == ACCOUNT_TYPE[1]) || (deletedAuth.accountType == ACCOUNT_TYPE[2])) {
                    mongoose.model('User').findOneAndRemove({
                        auth: req.id
                    }, function (err, deletedRegUser) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        // Delete user avatar
                        mongoose.model('Avatar').findByIdAndRemove(deletedRegUser.avatar, function (err, deletedRegUser) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            
                            // Delete user comment
                            mongoose.model('Review').findOneAndRemove({userId: req.id}, function(){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.redirect('/users/admin');
                            });
                        });
                    });
                }
            });
        });
    });


// Get AccountType of user with Auth._id.
function getAccountType(id, callback) {
    mongoose.model('Auth').findById(id, function (err, user) {
        if (err || !user) {
            console.error(err);
            callback(err);
        } else {
            var accountType = user.accountType;
            callback(null, accountType);
        }
    });
}

// Check if the logged in user is allowed to edit
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

// Check if the current user is allowed to make rating
function canRate(signedInAccountType) {
    // if the request user is a user or fb user or an admin.
    if (signedInAccountType == ACCOUNT_TYPE[0]||signedInAccountType == ACCOUNT_TYPE[1]||signedInAccountType == ACCOUNT_TYPE[2]) {
        return true;
    }
    return false;
}

// Check if the requester has the permission to delete the target user.
function canDelete(signedInId, signedInAccountType, targetUserID) {
    // If the request user is not an admin then they are not allowed
    if (signedInAccountType != ACCOUNT_TYPE[2]) {
        return false;
    }
    // An admin cannot delete their own account too.
    if (signedInId == targetUserID) {
        return false;
    }
    return true;
}



router.route('/:id/edit')
    // get the edit user or restaurant profile page
    .get(function (req, res) {
        // 
        mongoose.model('Auth').findById(req.id, function (err, user) {
            if (err) {
                console.log('GET Error: There was a problem retriveving: ' + err);
                return;
            }
            
            // Only the user can update their own password, execept for fb user who don't have password!
            var canUpdatePassword = (user.accountType != ACCOUNT_TYPE[0]) && (req.id == req.session.userId);
            console.log(req.id == req.session.userId)
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
                            
                            // Get a list of checked box for the cuisines.
                            var listOfCheckedBox = [];
                            for (var i = 0; i < CUISINE.length; i ++) {
                                if(restaurant.cuisine.indexOf(CUISINE[i]) != -1) {
                                    listOfCheckedBox.push(true);
                                } else {
                                    listOfCheckedBox.push(false);
                                }
                            }
                            console.log(listOfCheckedBox);
                            res.render('users/restaurant-edit', {
                                restaurant: restaurant,
                                displayEmail: user.email,
                                canUpdatePassword: canUpdatePassword,
                                cbl: listOfCheckedBox,
                                accountType: user.accountType
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
                                
                                // Check to see if the user is in fbUser table or in User table.
                                var displayUser;
                                if (fbUser == null && normalUser != null) {
                                    displayUser = normalUser;
                                } else if (fbUser != null && normalUser == null) {
                                    displayUser = fbUser;
                                } else {
                                    console.log(err);
                                    return;
                                }
                                
                                // Get a list of checked box for the cuisine.
                                var listOfCheckedBox = [];
                                for (var i = 0; i < CUISINE.length; i ++) {
                                    if(displayUser.preferredCuisine.indexOf(CUISINE[i]) != -1) {
                                        listOfCheckedBox.push(true);
                                    } else {
                                        listOfCheckedBox.push(false);
                                    }
                                }
                                res.render('users/user-edit', {
                                    user: displayUser,
                                    displayEmail: user.email,
                                    canUpdatePassword: canUpdatePassword,
                                    cbl: listOfCheckedBox,
                                    accountType: user.accountType
                                });
                            });
                        });
                    }
                } else {
                    res.send('You dont have permission to edit this person profile!');
                }
            });
        });
    })
// update the user profile, this is an AJAX CALL !
.put(function (req, res) {
    // Get the account type of the current user. 
    getAccountType(req.session.userId, function (err, requestAccountType) {
        // Only admin or the user itself can edit.
        if (canEdit(req.session.userId, requestAccountType, req.id)) {

            mongoose.model('Auth').findById(req.id, function (err, user) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (user == null) {
                    console.log("There is no such a user with id " + req.id + " in the database.");
                    res.send("fail");
                }
                // If the user is an admin or regular user, then update the User table.
                if (user.accountType == ACCOUNT_TYPE[1] || user.accountType == ACCOUNT_TYPE[2]) {
                    var newName = req.body.name;
                    var newAge = req.body.age;
                    var newFavCuisine = req.body['cuisine[]'];
                    var errorMess = '';

                    // Server side input validation for the users who don't use the interface.
                    if (!newName || newName.length < 5 || newName.length > 25) {
                        errorMess += "Name should be between 5 and 25 character in length. <br>";
                    }

                    if (!newFavCuisine || newFavCuisine.length == 0) {
                        errorMess += 'One of the cuisine must be selected. <br>';
                    }

                    if (!newAge || isNaN(newAge)) {
                        errorMess += "Age must be a number and cannot be blank. <br>";
                    }

                    if (errorMess != '') {
                        res.send(errorMess);
                    }

                    mongoose.model('User').findOneAndUpdate({
                        auth: user._id
                    }, {
                        name: newName,
                        age: newAge,
                        preferredCuisine: newFavCuisine
                    }, function (err, oldUser) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (oldUser) {
                            // Also update the name in Auth table
                            user.update({
                                name: newName
                            }, function(err, userId){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.send('success');
                            });
                        } else {
                            res.send('fail');
                        }
                    });
                    // If the user is a facebook user, then update FBUser table.
                } else if (user.accountType == ACCOUNT_TYPE[0]) {
                    var newName = req.body.name;
                    var newAge = req.body.age;
                    var newFavCuisine = req.body['cuisine[]'];
                    var errorMess = '';

                    // Server side input validation for the users who don't use the interface.
                    if (!newName || newName.length < 5 || newName.length > 25) {
                        errorMess += "Name should be between 5 and 25 character in length. <br>";
                    }

                    if (!newFavCuisine || newFavCuisine.length == 0) {
                        errorMess += 'One of the cuisine must be selected. <br>';
                    }

                    if (!newAge || isNaN(newAge)) {
                        errorMess += "Age must be a number and cannot be blank. <br>";
                    }

                    if (errorMess != '') {
                        res.send(errorMess);
                    }

                    // console.log(req.body);
                    mongoose.model('FBUser').findOneAndUpdate({
                        auth: user._id
                    }, {
                        name: newName,
                        age: newAge,
                        preferredCuisine: newFavCuisine
                    }, function (err, oldFbUser) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (oldFbUser) {
                            // Also update the name in Auth table
                            user.update({
                                name: newName
                            }, function(err, userId){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.send('success');
                            });
                        } else {
                            res.send("fail");
                        }
                    });
                // If the user is a restaurant user
                } else if (user.accountType == ACCOUNT_TYPE[3]) {
                    var newLocation = req.body.location;
                    var newName = req.body.name;
                    var newCuisine = req.body['cuisine[]'];
                    var errorMess = '';

                    // Server side input validation for the users who don't use the interface.
                    if (!newCuisine || newCuisine.length == 0) {
                        errorMess += 'One of the cuisine must be selected. <br>';
                    }

                    if (!newName || newName.length < 5 || newName.length > 25) {
                        errorMess += "Restaurant Name should be between 5 and 25 characters in length. <br>";
                    }

                    if (!newLocation || newLocation.length < 5 || newLocation.length > 30) {
                        errorMess += 'The restaurant address should be between 5 and 30 characters <br>';
                    }
                    
                    if (errorMess != '') {
                        res.send(errorMess);
                    }

                    // console.log('update new Cuisine: ' + req.body);
                    mongoose.model('Restaurant').findOneAndUpdate({
                        auth: user._id
                    }, {
                        name: newName,
                        location: newLocation,
                        cuisine: newCuisine
                    }, function (err, oldRestaurant) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        if (oldRestaurant) {
                            // Also update the name in Auth table.
                            user.update({
                                name: newName
                            }, function(err, userId){
                                if (err) {
                                    console.log(err);
                                    return;
                                }
                                res.send('success');
                            });
                        } else {
                            res.send("fail");
                        }
                    });
                }
            });
            // Hacker
        } else {
            res.send("You do not have permission to update this user account")
        }
    });
});


// Request handler for commenting
router.post('/:id/comment', function (req, res) {

    if (!req.body.rating) {
        req.body.rating = 0;
    }

    // Add rating and comment to database
    mongoose.model('Review').create({
        userId: req.session.userId,
        restaurantId: req.id,
        rating: req.body.rating,
        comment: req.body.comment
    }, function (err, doc) {
        if (err) {
            res.send("There was a problem adding the review to the Review relation.");
        }
        // comment and rating has been added
    });

    mongoose.model('Restaurant').find({}, function (err, restaurants) { // Find all the reaturants
        if (restaurants) {

            for (var i = 0; i < restaurants.length; i++) {
                findreview(restaurants[i].auth); // For each restaurant find the associated reviews so that average rating can be calculated
            }
        }
    });


    function findreview(restId) {

        mongoose.model('Review').find({
            restaurantId: restId
        }, function (err, reviews) {
            if (reviews) {

                var avgrating = 0;
                for (var j = 0; j < reviews.length; j++) {
                    avgrating += parseFloat(reviews[j].rating);
                }
                if (reviews.length)
                    avgrating /= reviews.length;
                avgrating = Math.round(avgrating * 100) / 100;
                update(restId, avgrating);

            }
        });
    }

    // Function that updates average rating of a restaurant given restaurant id
    function update(restId, rating) {
        mongoose.model('Restaurant').findOneAndUpdate({
            auth: restId
        }, {
            rating: rating
        }, function (err, dum) {});
    }

    res.redirect('back');

});



// /users/:id/avatar User update new avatar
router.post('/:id/avatar', function (req, res, next) {
    console.log('avatar1');
    var form = new formidable.IncomingForm();
    // Get the files in the form
    form.parse(req, function (err, fields, files) {
        if (err) {
            console.log(err);
            return;
        }
        var pic = files.profilePicture;
        console.log('avatar2', pic, fields);

        // Check if the file size is > 0
        if (pic.size > 0) {
            console.log('avatar3');

            // Read the file
            fs.readFile(pic.path, function (err, data) {
                console.log('avatar4');
                if (err) throw err;

                // Create image object
                var img = {
                    data: data,
                    contentType: pic.type
                };

                // Find the target user in Auth
                mongoose.model('Auth').findById(req.id, function (err, user) {
                    console.log('avatar5');
                    if (err) {
                        console.log('PUT Error, there was problem retrieving: ' + err);
                        return;
                    }

                    // check if the requester has permission to update the target user.
                    getAccountType(req.session.userId, function (err, requestAccountType) {
                        console.log('avatar6');

                        // If the requester has permission
                        if (canEdit(req.session.userId, requestAccountType, req.id)) {

                            mongoose.model('Avatar').create({
                                img: img
                            }, function (err, picture) {
                                console.log('avatar7');
                                // Restaurant user
                                if (user.accountType == ACCOUNT_TYPE[3]) {

                                    // If is a restaurant, then find and update the avatar for that user in Restaurant relation.
                                    mongoose.model('Restaurant').findOneAndUpdate({
                                        auth: user._id
                                    }, {
                                        avatar: picture._id
                                    }, function (err, restaurant) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        console.log('avatar8');
                                        console.log(restaurant.avatar);
                                        console.log(picture._id);

                                        // Find and remove the document
                                        mongoose.model('Avatar').findByIdAndRemove(restaurant.avatar, function (err, doc, result) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            console.log('avatar 9');
                                            console.log(doc.avatar);
                                            res.redirect('back');
                                        });
                                    });
                                    // Facebook or normal user
                                } else {
                                    //res.send("I know you are facebook or normal user");
                                    mongoose.model('User').findOneAndUpdate({
                                        auth: user._id
                                    }, {
                                        avatar: picture._id
                                    }, function (err, oldRegUser) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        mongoose.model('FBUser').findOneAndUpdate({
                                            auth: user._id
                                        }, {
                                            avatar: picture._id
                                        }, function (err, oldFbUser) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }
                                            var target;
                                            if (oldRegUser == null && oldFbUser != null) {
                                                target = oldFbUser;
                                            } else if (oldRegUser != null && oldFbUser == null) {
                                                target = oldRegUser;
                                            } else {
                                                console.log("NO TARGET FOUND!");
                                                return;
                                            }
                                            console.log(target);
                                            mongoose.model('Avatar').findByIdAndRemove(target.avatar, function (err, doc, result) {
                                                if (err) {
                                                    console.log(err);
                                                    return;
                                                }
                                                res.redirect('back');
                                            });
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            });
        } else {
            res.redirect('back');
        }
    });
});



// AJAX call to update the password.
router.put('/:id/password', function (req, res) {
    console.log('req.id: ' + req.id);
    console.log('req.session.urserId' + req.session.userId);
    var password = req.body.password;
    var newPassword = req.body.newPassword;
    var confirmPassword = req.body.confirmPassword;
    var errorMess = '';

    // Server side validation for users who don't use the user interface.
    // Cannot update someoneelse password
    if (req.id != req.session.userId) {
        errorMess += 'You cannot update someone else password.<br>';
    }

    // Check the password length.
    if (!newPassword || newPassword.length < 5 || newPassword > 12) {
        errorMess += "Password length should be between 5 and 12 characters.<br>";
    }

    // Check if the newPassword match with the confirmPassword.
    if (newPassword != confirmPassword) {
        errorMess += "Unmatched Confirm Password.<br>";
    }

    if (errorMess != "") {
        res.send(errorMess);
        return;
    }
    
    // Get account type of the requester, facebook user doesn't have the password to edit.
    getAccountType(req.session.userId, function (err, requestAccountType) {
        
        // If the requester is a facebook user acc, then they don't have the password to update.
        if (requestAccountType == ACCOUNT_TYPE[0]) {
            res.send('fail');
            return;
        }
        
        // Get the password of the target user and check if it match with 
        // the input password.
        mongoose.model('Auth').findById(req.id, function (err, user) {
            if (err) {
                console.log(err);
                return;
            }
            user.comparePassword(password, function (err, isMatch) {
                if (err) {
                    console.log(err);
                    return;
                }

                // Check if the old password match with what record in db.
                if (!isMatch) {
                    res.send("Invalid Old Password");
                    return;
                }

                // Hasing the password.
                hashPassword(newPassword, function (err, hashedPassword) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    // Update the password.
                    user.update({
                        password: hashedPassword
                    }, function (err, userID) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        res.send('success');
                    });
                });
            });
        });
    });
});


module.exports = router;