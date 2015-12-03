var http = require('http');
var assert = require('assert');
var request = require('request');
var should = require('should');
var expect  = require('chai').expect;

//var express = require('express');
//var app = express();
var request2 = require('supertest')('http://127.0.0.1:3000');
//var request2 = require('superagent');

// testing the server.
//var server = require('../server.js');

var PORT = 3000;
var url = 'http://127.0.0.1:' + PORT;

// Testing our http server.
describe('HTTP Server Test', function () {

    
    // Retrieve login page.
    describe('Login Page', function(){
        it('Should get index page', function(done) {
            request(url, function(err, response, body) {
                expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        it('Should redirect to login page when request ' + url + '/abc', function(done) {
            request(url + '/abc', function(err, response, body) {
                // The page which the user gets redirected to. 
                expect(response.request.uri.href).to.equal(url + '/');
                expect(response.body).to.contain('<title>Brownbag</title>');
                expect(response.statusCode).to.equal(200);
                console.log(response.statusCode);
                done();
            });
        });
    });
    
    // Retrieve the sign up page.
    describe('Sign up page', function (done){
        it('Should get sign up page', function (done) {
            request(url + '/signup', function (err, response, body) {
                expect(response.request.uri.href).to.equal(url + '/signup');
                expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
    
    // Retrieve the static files.
    describe('Retrieving static files', function () {
        it('Should receive style.css', function (done) {
            request(url + '/stylesheets/style.css', function (err, response, body) {
                expect(response.headers['content-type']).to.equal('text/css; charset=UTF-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Should receive bootstrap-social.css', function (done) {
            request(url + '/stylesheets/bootstrap-social.css', function (err, response, body) {
                expect(response.headers['content-type']).to.equal('text/css; charset=UTF-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Should receive logo', function (done) {
            request(url + '/images/cool-logo.png', function (err, response, body) {
                expect(response.headers['content-type']).to.equal('image/png');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });

        it('Should receive script', function (done) {
            request(url + '/javascripts/myscript.js', function (err, response, body) {
                expect(response.headers['content-type']).to.equal('application/javascript');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
    
    
//    describe('Post a new user', function() {
//        it('Should have a new user', function(done) {
//            this.timeout(1000);
//            request({
//                headers: {'content-type' : 'multipart/form-data'},
//                url: url + '/users',
//                method: "POST",
//                form: {
//                    email: 'crazy@mail.utoronto.ca',
//                    password: 'aloooo'
//                }
//            }, function(err, response, body) {
//                if (err) {
//                    console.log(err);
//                }
//                console.log(response);
//                console.log(body);
//                expect(response.statusCode).to.equal(200);
//                done();
//            });
//        });
//    });
    
    describe('Registering a new user', function() {
        it('Should return error message when register with invalid input', function(done) {
            request2
                .post('/users')
                .field('email', 'chickenemail')
                .end(function(err, response){
                    expect(response.statusCode).to.equal(400);
                    expect(response.text).to.contain('Invalid Email Address');
                    expect(response.text).to.contain('Password length should be between 5 and 12 character');
                    expect(response.text).to.contain('One of the cuisine must be selected');
                    done();
                });
        });
        
        it('Should create a regular user.', function(done) {
            request2
                .post('/users')
                .field('user', 'user') 
                .field('email', 'aaaaa@mail.utoronto.ca')
                .field('name', 'aaaaa')
                .field('age', '12')
                .field('password', 'aaaaa')
                .field('confirmPassword', 'aaaaa')
                .field('Japanese', 'Japan')
                .end(function(err, response) {
                    // expect(response.text).to.equal('success');
                    // redirect to user main page
                    expect(response.statusCode).to.equal(302);
                    done();
                });
        });
    });
    
});



