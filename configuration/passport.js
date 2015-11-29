var FacebookStrategy = require('passport-facebook').Strategy;
var fbUser = require('../model/fbuser');
var fbConfig = require('./fb.js');
var auth = require('../model/authentications');
var mongoose = require('mongoose');
var path = require('path');
var ACCOUNT_TYPE = ['FACEBOOK USER', 'REGULAR USER', 'ADMIN USER', 'RESTAURANT USER'];
var fs = require('fs');module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        auth.findById(id, function (err, user) {
            done(err, user);
        });
    });

    console.log(fbConfig.appID);
    passport.use(new FacebookStrategy({
        clientID: fbConfig.appID,
        clientSecret: fbConfig.appSecret,
        callbackURL: fbConfig.callbackUrl,
        profileFields: fbConfig.profileFields,
        authType: fbConfig.authType,
        passReqToCallback: true
    }, function (req, accessToken, refreshToken, profile, done) {
        console.log(profile);
        process.nextTick(function () {
            if (profile.emails) {
                auth.findOne({
                    'email': profile.emails[0].value
                }, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        req.session.userId = user._id;
                        req.session.save(function (err) {
                            if (err) console.log(err)
                        });
                        req.session.alert = null;
                        return done(null, user);
                    } else {
                        var newAuth = new auth();
                        newAuth.email = profile.emails[0].value;
                        newAuth.accountType = ACCOUNT_TYPE[0];
                        auth.create(newAuth, function (err, user) {
                            if (err) {
                                res.send("There was a problem adding this user into the Auth relation");
                            } else {
                                console.log(__dirname);
                                var fileToRead = path.join(__dirname, '../') + '/public/images/avatar.jpg';
                                fs.readFile(fileToRead, function (err, data) {
                                    if (err) throw err;
                                    var img = {
                                        data: data,
                                        contentType: 'image/jpg'
                                    }
                                    mongoose.model('Avatar').create({
                                        img: img
                                    }, function (err, picture) {
                                        if (err) {
                                            res.send("There was a problem adding this user avatar to the Avatar relation.")
                                        }
                                        var newFBUser = new fbUser();
                                        newFBUser.fbID = profile.id;
                                        newFBUser.token = accessToken;
                                        newFBUser.name = profile.displayName;
                                        newFBUser.avatar = picture._id;
                                        newFBUser.auth = user._id;
                                        fbUser.create(newFBUser, function (err, fbuser) {
                                            if (err) {
                                                res.send("There was a problem adding this user into the fbUser relation")
                                            }
                                            console.log("user_.id", user._id);
                                            req.session.userId = user._id;
                                            req.session.save(function (err) {
                                                if (err) console.log(err)
                                            });
                                            req.session.alert = null;
                                            return done(null, user);
                                        });
                                    });
                                });
                            }
                        });
                    }
                });
            } else {
                req.session.alert = "There is no valid email associated with this Facebook account please sign up as a regular user.";
                req.session.save(function (err) {});
                return done();
            }
        });
    }));
};