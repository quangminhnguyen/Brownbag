var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

// sends message to recipient
router.post('/sendMessage', function(req, res) {
  var sender = res.locals.currentUser.email; 
  var recipientEmail  = req.body.recipient; 
  var message = req.body.message; 
  
  var createCallback = function (err, message) {
    if (err) {
      console.log(err);
      res.send("There was a problem adding the MESSAGE to the database.");
    }
    res.redirect('back')
  };

  mongoose.model('Message').create({
    fromId: sender,
    toId: recipientEmail,
    message: message   
    }, createCallback); 
});

router.get('/conversation/:email', function(req, res) {
  var sender = res.locals.currentUser.email; 
  var recipientEmail  = req.params.email; 


  var messagesCallback = function (err, msgs) {
    if (err) {
      res.send("There was a problem retrieving messages");
    }
    console.log("messages received ", msgs);
    res.format({
      html: function(){
        res.render('messages/show', {
          title: 'Messages',
          messages : msgs,
          email: recipientEmail
        });
      }
    });
  };

  var messages  = mongoose.model('Message');

  messages.find({
      $or : [ {fromId: sender, toId: recipientEmail}, {fromId: recipientEmail, toId: sender} ]
    })
    .limit(10)
    .exec(messagesCallback);
});


module.exports = router;
