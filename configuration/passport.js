var FacebookStrategy = require('passport-facebook').Strategy;
var fbUser = require('../model/fbuser');
var fbConfig = require('./fb.js');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        fbUser.findById(id, function (err, user) {
            done(err, user);
        });
    });
    
    console.log(fbConfig.appID);
    passport.use(new FacebookStrategy({
        clientID: fbConfig.appID,
        clientSecret: fbConfig.appSecret,
        callbackURL: fbConfig.callbackUrl
    }, function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        process.nextTick(function () {
            fbUser.findOne({
                'id': profile.id
            }, function (err, user) {
                if (err)
                    return done(err);
                if (user)
                    return done(null, user);
                else {
                    var newUser = new fbUser();
                    console.log(profile.email);
                    newUser.id = profile.id;
                    newUser.token = accessToken;
                    newUser.name = profile.displayName;
                    newUser.email = profile.email;
                    newUser.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};