// Modules
var http = require('http');
var assert = require('assert');
var request = require('request');
var should = require('should');
var expect = require('chai').expect;
var mongoose = require('mongoose');

// Registered all of the model.
var db = require('../model/db');
var user = require('../model/users');
var picture = require('../model/avatars');
var authentication = require('../model/authentications');
var restaurant = require('../model/restaurants')
var reviews = require('../model/reviews');
var messages = require('../model/messages');
var fbUsers = require('../model/fbuser');

// CONSTANT
var ACCOUNT_TYPE = ['FACEBOOK USER', 'REGULAR USER', 'ADMIN USER', 'RESTAURANT USER'];
var CUISINE = ['Japanese', 'Thai', 'Chinese', 'Korean', 'Italian', 'French', 'VietNamese', 'Indian', 'FastFood', 'Others'];

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
    describe('Login Page', function () {
        it('Should get index page', function (done) {
            request(url, function (err, response, body) {
                expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        it('Should redirect to login page when request ' + url + '/abc', function (done) {
            request(url + '/abc', function (err, response, body) {
                // The page which the user gets redirected to. 
                expect(response.request.uri.href).to.equal(url + '/');
                expect(response.body).to.contain('<title>Brownbag</title>');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    // Retrieve the sign up page.
    describe('Sign up page', function (done) {
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

    describe('Registering a new user', function () {

        // DropAllSchema before each test.
        beforeEach(function () {
            dropAllSchema();
        });

        // Logout after each test.
        afterEach(function () {
            request2
                .get('/logout')
                .end(function (err, response) {})
        });

        it('Should return error message when register with invalid input', function (done) {
            request2
                .post('/users')
                .field('email', 'chickenemail')
                .end(function (err, response) {
                    expect(response.statusCode).to.equal(400);
                    expect(response.text).to.contain('Invalid Email Address');
                    expect(response.text).to.contain('Password length should be between 5 and 12 character');
                    expect(response.text).to.contain('One of the cuisine must be selected');
                    done();
                });
        });

        it('Should create an admin user - the first user in the User table.', function (done) {
            // dropAllSchema();
            request2
                .post('/users')
                .field('user', 'user')
                .field('email', 'admin@mail.utoronto.ca')
                .field('name', 'aaaaa')
                .field('age', '12')
                .field('password', 'aaaaa')
                .field('confirmPassword', 'aaaaa')
                .field('Japanese', 'Japan')
                .end(function (err, response) {
                    // redirect to user/admin page
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to users/admin');
                    mongoose.model('Auth').findOne({
                        email: 'admin@mail.utoronto.ca'
                    }, function (err, user) {
                        // admin account
                        expect(user.accountType).equal(ACCOUNT_TYPE[2]);
                        done();
                    });
                });
        });


        it('Should create a regular user - the second user in the User table', function (done) {
            // dropAllSchema();
            createUser({
                    type: 'user',
                    email: 'smart@mail.utoronto.ca',
                    name: 'startminh',
                    age: '20',
                    password: 'aaaaa',
                    confirmPassword: 'aaaaa'
                },
                function (err, response) {
                    // The first user is expected to be an admin and redirect to users/admin.
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to users/admin');
                    createUser({
                        type: 'user',
                        email: 'random@mail.utoronto.ca',
                        name: 'randomName',
                        age: '40',
                        password: 'thongminh',
                        confirmPassword: 'thongminh'
                            // The second user is expected to be redirected to users/main
                    }, function (err, response) {
                        expect(response.statusCode).to.equal(302);
                        expect(response.text).to.include('Redirecting to users/main');
                        // console.log(response.text);
                        mongoose.model('Auth').findOne({
                            email: 'random@mail.utoronto.ca'
                        }, function (err, user) {
                            // Regular account
                            expect(user.accountType).equal(ACCOUNT_TYPE[1]);
                            done();
                        });
                    });
                }
            );
        });


        it('Should create a new restaurant', function (done) {
            // dropAllSchema();
            createRest({
                type: 'owner',
                email: 'restaurant@mail.utoronto.ca',
                restName: 'restname',
                password: 'quahay',
                confirmPassword: 'quahay',
                location: 'khongb'
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to users/main');
                mongoose.model('Auth').findOne({
                    email: 'restaurant@mail.utoronto.ca'
                }, function (err, user) {
                    // restaurant account.
                    expect(user.accountType).equal(ACCOUNT_TYPE[3]);
                    done();
                });
            });
        });
    });


    describe('Logout/ Login', function () {
        it('Should log out', function (done) {
            dropAllSchema();
            createRest({
                type: 'owner',
                email: 'restaurant@mail.utoronto.ca',
                restName: 'restname',
                password: 'quahay',
                confirmPassword: 'quahay',
                location: 'khongb'
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to users/main');
                mongoose.model('Auth').findOne({
                    email: 'restaurant@mail.utoronto.ca'
                }, function (err, user) {
                    // restaurant account.
                    expect(user.accountType).equal(ACCOUNT_TYPE[3]);
                    request2
                        .get('/logout')
                        .end(function (err, response) {
                            expect(response.statusCode).to.equal(302);
                            expect(response.text).to.include('Redirecting to /');
                            done();
                        });
                });
            });
        });
    });

});


// Drop all schema 
function dropAllSchema() {
    mongoose.model('Auth').remove({}, function (err) {});
    mongoose.model('User').remove({}, function (err) {});
    mongoose.model('Restaurant').remove({}, function (err) {});
    mongoose.model('FBUser').remove({}, function (err) {});
    mongoose.model('Avatar').remove({}, function (err) {});
    mongoose.model('Review').remove({}, function (err) {});
    mongoose.model('Message').remove({}, function (err) {});
}


// Creating a user for testing.
function createUser(user, callback) {
    request2
        .post('/users')
        .field('user', user.type)
        .field('email', user.email)
        .field('name', user.name)
        .field('age', user.age)
        .field('password', user.password)
        .field('confirmPassword', user.confirmPassword)
        .field('Japanese', 'Japan')
        .end(function (err, response) {
            if (err) {
                console.log(err);
                callback(err);
            }
            callback(err, response);
        });
}


// Creating a restaurant.
function createRest(rest, callback) {
    request2
        .post('/users')
        .field('user', rest.type)
        .field('email', rest.email)
        .field('password', rest.password)
        .field('confirmPassword', rest.confirmPassword)
        .field('location', rest.location)
        .field('restName', rest.restName)
        .field('Japanese', 'Japan')
        .end(function (err, response) {
            if (err) {
                console.log(err);
                callback(err);
            }
            callback(err, response);
        });
}