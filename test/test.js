var http = require('http');
var assert = require('assert');
var request = require('request');
//var request2 = require('supertest')
//var should = require('should');
var expect  = require("chai").expect;


// testing the server.
//var server = require('../server.js');

var PORT = 3000;
var url = 'http://127.0.0.1:' + PORT;

describe('HTTP Server Test', function () {
//    before(function() {
//        server.listen(PORT);
//    });
//    
//    after(function() {
//        server.close();
//    });
    
    describe('Test Login Page', function(){
//        it('Should returning status 200', function(){
//            http.get(url, function(response){
//                assert.equal(response, 300);
//                var body = '';
//                response.on('data', function(d){
//                    body += d;
//                });
//                
//                response.on('end', function(){
//                    assert.equal(body, 'haha');
//                    done();
//                });
//            });
//        });
//        it('Should returning status 404', function(done) {
//            request2(url)
//                .post('/')
//                .expect(2002)
//                done();
//        });
        // Testing 
        it('Should get index page', function(done) {
            request(url, function(err, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        it('Should redirect to login page', function(done) {
            request(url + '/abc', function(err, response, body) {
                console.log(response);
                /* The page which the user gets redirected to. */
                expect(response.request.uri.href).to.equal(url + '/');
                expect(response.body).to.contain('<title>Brownbag</title>');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
    
    // Retrieving static files test.
    describe('Should receive static file', function () {
        it('Should receive style.css', function (done) {
            request(url + '/stylesheets/style.css', function (err, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Should receive bootstrap-social.css', function (done) {
            request(url + '/stylesheets/bootstrap-social.css', function (err, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Received logo', function (done) {
            request(url + '/images/cool-logo.png', function (err, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Received script', function (done) {
            request(url + '/javascript/myscript.js', function (err, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});



