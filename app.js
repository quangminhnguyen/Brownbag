// Importing modules 
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');

// Register the models */
var db = require('./model/db');
var user = require('./model/users');
var picture = require('./model/avatars');
var authentication = require('./model/authentications');
var restaurant = require('./model/restaurants')
var reviews = require('./model/reviews');
var messages = require('./model/messages');

/* Running some configurations for the passport. */
require('./configuration/passport')(passport);

// Define some routes 
var routes = require('./routes/index');
var users = require('./routes/users');
var pictures = require('./routes/avatars');

var app = express();

app.use(session({
  secret: 'thisismysecret',
  resave: false,
  saveUninitialized: true
}));

/* Intialize Passport */
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/',
    successRedirect: '/users/main'
}));

// Set current user as signed in User
app.use(function(req, res, next) {
  console.log("1");
  console.log("req.session.userId: " + req.session.userId);
  // Find in relation Auth for the userID, req.session.userId is the id of the user 
  // that is online
  mongoose.model('Auth').findById(req.session.userId, function (err, user) {
    if (err) {
        console.log(err);
        return;
    }
    res.locals.currentUser = user;
    
    // check if alert message is set. 
    if (req.session.alert) {
      res.locals.alert = req.session.alert;
      req.session.alert = null;
    }
    
    // check if successAlert message is set. 
    if (req.session.successAlert) {
      res.locals.successAlert = req.session.successAlert;
      req.session.successAlert = null;
    }
    next();
  });
});


//app.use('/avatars', avatars);
app.use('/', routes);


// redirects not signed in users to log in page
app.use(function(req, res, next) {
  console.log("2");
  var isCreatingUser = req.url == '/users' && req.method == 'POST';
  var isNotSignedIn = !req.session.userId;
  if (isNotSignedIn && !isCreatingUser) {
    res.redirect("/");
  }
  else {
    next();
  }
});


app.use('/users', users);
//app.use('/messages', messages);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
