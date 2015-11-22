var FacebookStrategy = require('passport-facebook').Strategy;
var fbUser = require('../model/fbuser');
var fbConfig = require('./fb.js');
var auth = require('../model/authentications');
var mongoose = require('mongoose');

module.exports = function (passport) {

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
        auth_type: fbConfig.type,
        passReqToCallback: true
    }, function (req, accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
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

                    auth.create(newAuth, function (err, user) {
                        if (err) {
                            res.send("There was a problem adding this user into the Auth relation");
                        } else {
                            var newFBUser = new fbUser();
                            newFBUser.fbID = profile.id;
                            newFBUser.token = accessToken;
                            newFBUser.name = profile.displayName;
                            // newFBUser.avatarURL = profile.photos[0].value;
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
                        }
                    });
                }
            });
        });
    }));
};