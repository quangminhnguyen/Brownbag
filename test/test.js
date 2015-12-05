// Modules
var http = require('http');
var request = require('request'); // Orginal request used in the first several test cases 
var should = require('should'); // for assertion purpose.
var expect = require('chai').expect;
var mongoose = require('mongoose');
var request2 = require('supertest')('http://127.0.0.1:3000'); // Supertest used in the remaining tests
var superRequest = require('super-request')('http://127.0.0.1:3000'); // Support redirection.


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


// testing the server.
//var server = require('../server.js');

var PORT = 3000;
var url = 'http://127.0.0.1:' + PORT;

// Testing our http server.
describe('Project Brownbag Test', function () {

    // Retrieve login page.
    describe('Login Page', function () {
        it('Should get index page', function (done) {
            this.timeout(4000);
            request(url, function (err, response, body) {
                expect(response.request.uri.href).to.equal(url + '/');
                expect(response.headers['content-type']).to.equal('text/html; charset=utf-8');
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
        it('Should redirect to login page when request ' + url + '/abc', function (done) {
            this.timeout(4000);
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
            this.timeout(4000);
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
                    expect(response.text).to.include('Redirecting to /users/admin');
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
                    expect(response.text).to.include('Redirecting to /users/admin');
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
                        expect(response.text).to.include('Redirecting to /users/main');
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
                location: 'khongb',
                cuisine: CUISINE[0]
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to /users/main');
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


    describe('Logout / Login', function () {
        // Logout after each test.
        afterEach(function () {
            request2
                .get('/logout')
                .end(function (err, response) {})
        });

        it('Should log out', function (done) {
            dropAllSchema();
            createRest({
                type: 'owner',
                email: 'restaurant@mail.utoronto.ca',
                restName: 'restname',
                password: 'quahay',
                confirmPassword: 'quahay',
                location: 'khongb',
                cuisine: CUISINE[2]
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to /users/main');
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


        it('Should be able to login again and redirect to users/main', function (done) {
            request2
                .post('/login')
                .send({
                    email: 'restaurant@mail.utoronto.ca',
                    password: 'quahay'
                })
                .end(function (err, response) {
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to /users/main');
                    done();
                });
        });


        it('Should be direct to users/admin, if the logged in user is an admin', function (done) {
            // create an admin user
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
                    expect(response.text).to.include('Redirecting to /users/admin');
                    // Log out
                    request2
                        .get('/logout')
                        .end(function (err, response) {
                            expect(response.statusCode).to.equal(302);
                            expect(response.text).to.include('Redirecting to /');
                            // Login again
                            request2
                                .post('/login')
                                .send({
                                    email: 'smart@mail.utoronto.ca',
                                    password: 'aaaaa'
                                })
                                .end(function (err, response) {
                                    expect(response.statusCode).to.equal(302);
                                    expect(response.text).to.include('Redirecting to /users/admin');
                                    done();
                                });
                        });
                });
        });
    });


    describe('Searching & Filtering in /users/admin', function () {
        var agent = require('supertest').agent(url); // Superagent

        after(function () {
            agent
                .get('/logout')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                    }
                    return;
                });
        });

        before(function () {
            dropAllSchema();
        });

        it('Should insert an admin user to the database and redirect to /users/admin', function (done) {
            agent
                .post('/users')
                .field('user', 'user')
                .field('email', 'admin@mail.utoronto.ca')
                .field('name', 'IamAdmin')
                .field('age', '20')
                .field('password', 'aaaaa')
                .field('confirmPassword', 'aaaaa')
                .field('Japanese', 'Japan')
                .field('Korean', 'Korea')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to /users/admin');
                    done();
                });
        });

        it('Should not be able to find the user if select to display only restaurant.', function (done) {
            agent
                .get('/users/admin')
                .query('userType=Restaurants')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    expect(response.statusCode).to.equal(200);
                    expect(response.text).not.to.contain('IamAdmin');
                    done();
                });
        });

        it('Should be able to see the user again if select to display all.', function (done) {
            agent
                .get('/users/admin')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    expect(response.statusCode).to.equal(200);
                    expect(response.text).to.contain('IamAdmin');
                    done();
                });
        });

        it('Should also be able to see the user if select to display ', function (done) {
            agent
                .get('/users/admin')
                .query('userType=Customers')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                    }
                    expect(response.statusCode).to.equal(200);
                    expect(response.text).to.contain('IamAdmin');
                    done();
                });
        });
    });



    describe('Searching & Filtering in users/main', function () {
        var agent = require('supertest').agent(url); // Another agent!
        
        before(function(){
            dropAllSchema();
        });
        
        after(function(){
            agent
                .get('\logout')
                .end(function(err, response){});
        });
        
        it('Should create Restaurant1', function (done) {
            createRest({
                type: 'owner',
                email: 'restaurant1@mail.utoronto.ca',
                restName: 'Restaurant1',
                password: 'aaaaa',
                confirmPassword: 'aaaaa',
                location: 'khongb',
                cuisine: CUISINE[0] // Japanese
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to /users/main');
                mongoose.model('Restaurant').findOne({
                    name: 'Restaurant1'
                }, function (err, rest) {
                    expect(rest.name).to.equal('Restaurant1');
                    done();
                });
            });
        });

        it('Should create Restaurant2', function (done) {
            createRest({
                type: 'owner',
                email: 'restaurant2@mail.utoronto.ca',
                restName: 'Restaurant2',
                password: 'aaaaa',
                confirmPassword: 'aaaaa',
                location: 'khongb',
                cuisine: CUISINE[1] // Thai
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to /users/main');
                mongoose.model('Restaurant').findOne({
                    name: 'Restaurant2'
                }, function (err, rest) {
                    expect(rest.name).to.equal('Restaurant2');
                    done();
                });
            });
        });

        it('Should create Restaurant3', function (done) {
            createRest({
                type: 'owner',
                email: 'restaurant3@mail.utoronto.ca',
                restName: 'Restaurant3',
                password: 'aaaaa',
                confirmPassword: 'aaaaa',
                location: 'khongb',
                cuisine: CUISINE[1] // Thai
            }, function (err, response) {
                expect(response.statusCode).to.equal(302);
                expect(response.text).to.include('Redirecting to /users/main');
                mongoose.model('Restaurant').findOne({
                    name: 'Restaurant3'
                }, function (err, rest) {
                    expect(rest.name).to.equal('Restaurant3');
                    done();
                });
            });
        });

        it('Should create a user to view the restaurant', function (done) {
            agent
                .post('/users')
                .field('user', 'user')
                .field('email', 'user@mail.utoronto.ca')
                .field('name', 'IamUser')
                .field('age', '50')
                .field('password', 'aaaaa')
                .field('confirmPassword', 'aaaaa')
                .field('Japanese', 'Japan')
                .field('Thai', 'Thailand')
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                        done(err);
                    }
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to /users/admin');
                    mongoose.model('User').findOne({
                        name: 'IamUser'
                    }, function (err, user) {
                        expect(user.name).to.equal('IamUser');
                        done();
                    });
                });
        });


        it('Should display only the restaurant with Thai cuisine if the user ', function (done) {
            agent
                .get('/users/main')
                .query('cuisine=Thai')
                .end(function (err, response) {
                    expect(response.statusCode).to.equal(200);
                    expect(response.text).not.to.include('Restaurant1'); // Restaurant1 doesn't have Thai as cuisine.
                    expect(response.text).to.include('Restaurant2'); // Restaurant2 has Thai as cuisine.
                    expect(response.text).to.include('Restaurant3'); // Restaurant3 has Thai as cuisine.
                    done();
                });
        });
        
        it('Should not display the restaurant with Thai cuisine if the user selected Japanese as cuisine', function(done) {
            agent
                .get('/users/main')
                .query('cuisine=Japanese')
                .end(function(err, response) {
                    expect(response.statusCode).to.equal(200);
                    expect(response.text).to.include('Restaurant1'); // Restaurant 1 has Japanese as cuisine
                    expect(response.text).not.to.include('Restaurant2'); // Restaurant 2 has Thai as cuisine
                    expect(response.text).not.to.include('Restaurant3'); // Restaurant 3 also has Thai as cuisine
                    done();
            });
        });
        
    });
    
    
    // Reuse data created in "Searching & Filtering in users/main" test
    describe('Commenting & Rating', function() {
        var agent = require('supertest').agent(url); // Another agent to test this functionality
        it('Should log in as admin', function (done) {
            agent
                .post('/login')
                .send({
                    email: 'user@mail.utoronto.ca',
                    password: 'aaaaa'
                })
                .end(function (err, response) {
                    expect(response.statusCode).to.equal(302);
                    expect(response.text).to.include('Redirecting to /users/admin');
                    done();
                });
        });
        
        
        it('Should transfer to a restaurant profile page', function(done) {
            agent
                .get('/users/admin')
                .end(function (err, response) {
                    expect(response.statusCode).to.equal(200);
                    mongoose.model('Auth').findOne({email: 'restaurant3@mail.utoronto.ca'}, function(err, rest) {
                        expect(rest).not.to.equal(null);
                        agent
                            // access the restaurant profile page of Restaurant3
                            .get('/users/' + rest._id)
                            .end(function(err, response) {
                                // The profile page should contain all info about restaurant3.
                                expect(response.text).to.contain('restaurant3@mail.utoronto.ca'); // restaurant3 email.
                                expect(response.text).to.contain('khongb') // its location
                                done(); 
                        });
                    });
            });
        });
        
        it('Should post a comment with rating', function (done) {
            mongoose.model('Auth').findOne({
                email: 'restaurant3@mail.utoronto.ca'
            }, function (err, rest) {
                expect(rest).not.to.equal(null);
                agent
                // access the restaurant profile page of Restaurant3
                    .get('/users/' + rest._id)
                    .end(function (err, response) {
                        // The profile page should contain all info about restaurant3.
                        expect(response.statusCode).to.equal(200);
                        expect(response.text).to.contain('restaurant3@mail.utoronto.ca'); // restaurant3 email.
                        expect(response.text).to.contain('khongb') // its location
                        agent 
                            .post(/users/ + rest._id + '/comment')
                            .end(function (err, response) {
                                console.log(response.text);
                                expect(response.text);
                                expect(response.statuSCode)
                                done();
                        });
                    });
            });
        });
        it('Should be able to view the comment');
    });
    
    describe('Messaging Between Users', function(done) {
        it('Should create a message');
    });
    
    describe('Admin Power', function(done) {
        it('Should be able to edit profile of another user');
        it('Should be able to delete another user');
    });
    
    describe('Security Access control', function(done) {
        it('Should not be able to access to the admin page, if is not an admin.')
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


// Creating a user for testing and don't follow the redirection.
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


// Creating a restaurant and don't follow the redirection.
function createRest(rest, callback) {
    request2
        .post('/users')
        .field('user', rest.type)
        .field('email', rest.email)
        .field('password', rest.password)
        .field('confirmPassword', rest.confirmPassword)
        .field('location', rest.location)
        .field('restName', rest.restName)
        .field(rest.cuisine, rest.cuisine)
        .end(function (err, response) {
            if (err) {
                console.log(err);
                callback(err);
            }
            callback(err, response);
        });
}