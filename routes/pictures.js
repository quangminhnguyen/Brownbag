var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection
var fs = require('fs');


router.get('/:id', function(req, res) {

    mongoose.model('Picture').findById(req.params.id, function (err, picture) {
        if (err) {
            console.log('GET Error: There was a problem retrieving PICTURE: ' + err);
        } else {

          res.writeHead(200, {'Content-Type': picture.img.contentType});
          res.write(picture.img.data);
          res.end();

        }
    });
});

module.exports = router;