var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

/*
  send message
    create message
    save in table.

  get list of people/restaurants messaged
    iterate through messages table
    if from = me
      user = getuser(toId)
    else if to = me
      user = getuser(fromID)
    
    add to list if not already there. 


  get list of messages to person/restaurant
    iterate through messages table
    
    if (me = from || them == to)  || (me = to || them == from)
      add to list, could also add to or from field for nicer looking view
    
    sort by timestamp
    return list



  router.post('/sendMessage', function(req, res) {
    var sender = res.locals.currentUser; 
    var recipientId  = req.body.recipient;
    var message = req.body.message;

    var lookupCallback = function (err, user) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        // do something     
      }
    };

    var createCallback = function (err, message) {
      if (err) {
        res.send("There was a problem adding the MESSAGE to the database.");
      } else {
        mongoose.model('User').findById(req.id, lookupCallback);
      }
    };

    mongoose.model('Message').create({
      fromId: sender._id,
      toId: recipientId,
      message: message   
      }, createCallback); 
  }

*/

// sends message to recipient
router.post('/sendMessage', function(req, res) {
  var sender = res.locals.currentUser.email; 
  var recipientEmail  = req.body.recipient; // should be the email
  var message = req.body.message; 
  
  var createCallback = function (err, message) {
    if (err) {
      res.send("There was a problem adding the MESSAGE to the database.");
    }
  };

  mongoose.model('Message').create({
    fromId: sender,
    toId: recipientEmail,
    message: message   
    }, createCallback); 
});

router.get('/conversation/:id', function(req, res) {
  var sender = res.locals.currentUser.email; 
  var recipientEmail  = req.body.recipient; 

  var messagesCallback = function (err, msgs) {
    if (err) {
      res.send("There was a problem retrieving messages");
    }
    res.format({
      html: function(){
        res.render('messages/show', {
          title: 'Messages',
          "msgs" : msgs
        });
      }
    });
  };

  var messages  = mongoose.model('Message');

  messages.find({
      $or : [ {fromId: sender, toId: recipientEmail}, {fromId: recipientEmail, toId: sender} ]
    })
    .limit(10)
    .sort({ timestamp: -1 }) // -1 decsending order
    .select({ message: 1, timestamp: 1 })
    .exec(messagesCallback);
});


module.exports = router;
