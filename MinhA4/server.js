/* Please read my README file. */

/* Modules */
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var multer = require("multer");
var fs = require("fs");

/* Location of where the user avatars will be stored. */
var upload = multer({
    dest: "User-avatar/"
})

/* Using EXPRESS */
var app = express();

/* Listening port */
var PORT = 3000;


app.set('json spaces', 10);
app.use(bodyParser.urlencoded({
    extended: true
}));


/* Connecting to mongodata base */
mongoose.connect('mongodb://127.0.0.1:27017/A4DataBase', {
    user: "",
    pass: ""
});

/* Check connection status. */
var db = mongoose.connection;
db.on("error", console.error.bind(console, 'connection error:'));
db.once("open", function callback() {
    console.log("Connected to MongoDB");
});

/* 
Create a schema for storing user data. In the professor example, he also capitalized all of the words. 
*/
var UserSchema = mongoose.Schema({
    /* Email is the key field, which is unique. */
    email: String, 
    password: String,
    description: String,
    /* URL to the image file. */
    profileImage: String,
    displayName: String,
    /* Account Type basic, admin or superadmin*/
    status: String 
});

/*
Create a schema for storing user data that can only be accessed by the admins.
*/
var AdminDataSchema = mongoose.Schema({
    /* Email is the key field, which is unique. */
    email : String,
    /* User operating system used in the last login. */
    os: String,
    /* Location of the user in latitude and longitude. */
    latitude : Number,
    longitude : Number,
    /* Last login date and time */
    loginTime : String,
    /* Web browser used for the last login. */
    browser : String,
    /* Ip address */
    ipAddress: String,
    /* Is the user using mobile device in last login to the app*/
    isMobile: Boolean,
    /* View count the number of time his/ her profile page was visited.*/
    viewCount: Number
});

/* Data base model */
var Users = mongoose.model("Users", UserSchema);
var adminDataOnly = mongoose.model("Admin Data", AdminDataSchema);


/* Serving the static files */
app.get(["/", "/index.html"], function (req, res) {
    console.log("Request index.html: " + req.url);
    console.log("Request IP: " + req.ip);
    res.setHeader("Content-Type", "text/html");
    res.sendFile(__dirname + "/index.html");
});

app.get("/client.css", function (req, res) {
    console.log("Request client.css: " + req.url);
    res.setHeader("Content-Type", "text/css");
    res.sendFile(__dirname + "/client.css");
})

app.get("/client.js", function (req, res) {
    console.log("Request client.js: " + req.url);
    res.setHeader("Content-Type", "text/javascript");
    res.sendFile(__dirname + "/client.js");
})


/* Handle request for logging user into the app. */
app.post("/users/login", function (req, res) {
    console.log("A client made a POST login request: " + req.originalUrl);
    var email = req.body.email;
    var password = req.body.password;
    var loginTime = req.body["login-time"];
    var browser = req.body.browser;
    var os = req.body.os;
    var lat = req.body.lat;
    var long = req.body.long;
    var isMobile = req.body["is-mobile"];
    
    Users.find({
        email: email,
        password: password
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }
        
        /* Update data for the admin */
        adminDataOnly.findOneAndUpdate({
            email: email
        }, {
            loginTime: loginTime,
            browser : browser,
            os : os,
            lat : lat,
            long: long,
            isMobile : isMobile,
            ipAddress : req.ip
        }, function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }
        });
        
        /* Send back the JSON object of that logged in user */
        res.setHeader("Content-Type", "application/json");
        res.json(doc);
    });
});




/* Handle post request for adding new user to the server. */
app.post("/users/new-account", function (req, res) {
    console.log("A client made a POST request to create new account: " + req.originalUrl);
    var displayName = req.body.name;
    var email = req.body.email;
    var password = req.body.pswrd;
    var description = req.body.dcrpt;
    var loginTime = req.body["login-time"];
    var browser = req.body.browser;
    var os = req.body.os;
    var lat = req.body.lat;
    var long = req.body.long;
    var isMobile = req.body["is-mobile"];
    
    /* If the display name is empty, then replace the display name by email. */
    if (displayName == undefined || displayName == "") {
        displayName = email;
    }

    /* Check if there is any matched email in the database. */
    Users.find({
        email: email
    }, function (err, doc) {
        if (err) {
            console.log(err)
            return;
        }
        
        /* No matched email in the database found, then this email can be used to sign up. */
        if (doc.length == 0) {

            Users.find({}, function (err, doc) {
                var status = "basic";
                if (err) {
                    console.log(err);
                    return;
                }

                /* If there is no user in the database yet, then this new user is the super admin */
                if (doc.length == 0) {
                    status = "superadmin";
                }

                /* Create new user and save it in the database. */
                var User = new Users({
                    email: email,
                    password: password,
                    description: description,
                    displayName: displayName,
                    status: status,
                    profileImage: "User-avatar/default-ava.png"
                });
                
                /* create data for admin only. */
                var adminData = new adminDataOnly({
                    email: email,
                    ipAddress: req.ip,
                    loginTime : loginTime,
                    browser : browser,
                    os: os,
                    latitude : lat,
                    longitude : long,
                    isMobile : isMobile,
                    viewCount : 0
                });

                adminData.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                
                User.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    res.setHeader("Content-Type", "application/json");
                    res.json([User]);
                });
            });

        /* If there is a matched email, send empty json array indicating unsuccessful sign up. */
        } else {
            res.setHeader("Content-Type", "application/json");
            res.json([]);
        }
    });
});





/* Handle request for getting users in the database. */
app.get("/users", function (req, res) {
    
    /* Getting all of the users in the database by leaving the query blank. */
    if (req.query.email == undefined) {
        console.log("A client made a GET request to get a list of all users (not contain their password): " + req.url);
        Users.find({}, function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }
            var returnUsers = doc;
            
            /* Remove the password for every user then return the data. */
            for (var i = 0; i < returnUsers.length; i++) {
                returnUsers[i].password = "";
            }
            res.setHeader("Content-Type", "application/json");
            res.json(returnUsers);
        });
    
    /* Getting a single user using their email. */
    } else if (req.query.email != undefined) {
        console.log("A client made a GET request to get a user (not contain their password): " + req.url);
        var searchMail = req.query.email;
        Users.find({
            email: searchMail
        }, function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }
            res.setHeader("Content-type", "application/json");

            /* No such a user found */
            if (doc.length == 0) {
                res.json([]);

                /* 
                If found, a json array of a single user object is sent back
                to the client with the user password removed.
                */
            } else {
                /* Removed the password from the returned result. */
                doc[0].password = "";
                res.json(doc);
            }
        });
    }
});




/* Handle a PUT request for updating an avatar using multer. */
app.put("/users/avatars", upload.single("file"), function (req, res) {
    console.log("A client made a PUT request to update the avatar: " + req.originalUrl);
    var file = req.file;
    var requesterMail = req.body["requester-email"];
    var requesterPass = req.body["requester-pass"];
    var targetUserMail = req.body["target-email"];
    res.setHeader("Content-Type", "text/plain");
    Users.find({
            email: requesterMail,
            password: requesterPass
        },
        function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }

            if (doc.length > 0) {
                /* Set the profile picture for any user if the user is an admin. */
                if ((doc[0]["status"] == "admin") || (doc[0]["status"] == "superadmin")) {
                    Users.findOneAndUpdate({
                        email: targetUserMail
                    }, {
                        profileImage: file.path
                    }, {
                        new: true
                    }, function (err, doc) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        
                        fs.readFile(doc.profileImage, function (err, data) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            var base64Image = data.toString("base64");
                            res.send(base64Image);
                        });
                    });
                    
                /* Can also set picture if a user is change their own profile. */
                } else if (requesterMail == targetUserMail) {
                    Users.findOneAndUpdate({
                        email: requesterMail
                    }, {
                        profileImage: file.path
                    }, {
                        new: true
                    }, function (err, doc) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        fs.readFile(doc.profileImage, function (err, data) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            var base64Image = data.toString("base64");
                            res.send(base64Image);
                        });
                    });
                } else {
                    res.send("fail");
                }
            } else {
                res.send("fail");
            }
        });
});





/* Handle GET request to get the avatar. */
app.get("/users/avatars", function (req, res) {
    console.log("A client made a GET request to get the avatar: " + req.url);
    var email = req.query.email;
    Users.find({
        email: email
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }
        if (doc.length > 0) {
            fs.readFile(doc[0].profileImage, function (err, data) {
                if (err) {
                    console.log(err);
                    return;
                }
                var base64Image = data.toString("base64");
                res.send(base64Image);
            });
        } else {
            res.send();
        }
    });
});




/* Handle PUT request for updating user profile */
app.put("/users/profiles", function (req, res) {
    console.log("A client made a PUT request to update their profile: " + req.originalUrl);
    var requesterMail = req.body["requester-email"];
    var requesterPass = req.body["requester-pass"];
    var newDisplayName = req.body["new-dname"];
    var newDescription = req.body["new-description"];
    var targetUserMail = req.body["target-email"];
    res.setHeader("Content-Type", "text/plain");
    
    Users.find({
        email: requesterMail,
        password: requesterPass
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }
        if (doc.length > 0) {
            /* 
            If the requester is an admin then the changes is applied to the user with targetUserMail. 
            It also handle the case that an admin change his/her own profile.
            */
            if ((doc[0]["status"] == "admin") || (doc[0]["status"] == "superadmin")) {
                Users.findOneAndUpdate ({
                    email: targetUserMail
                }, {
                    displayName: newDisplayName,
                    description: newDescription
                }, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    res.send("success");
                });

            /* 
            If the requester is not an admin making a request, then it must be a non admin user 
            is changing his/her own profile.
            */
            } else if (requesterMail == targetUserMail) {
                Users.findOneAndUpdate({
                    email: requesterMail
                }, {
                    description: newDescription,
                    displayName: newDisplayName
                }, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    res.send("success");
                });

            /* 
            If the requester is not an admin and also not changing the profile for themselve, then
            they are not allowed to change anything. 
            */
            } else {
                res.send("fail");
            }
            
        /* If no such a requester found in the user list, then it must be a hacker!*/
        } else {
            res.send("fail");
        }
    });
});




/* Handle PUT request for changing password */
app.put("/users/passwords", function (req, res) {
    console.log("A client made a PUT request to change the password: " + req.originalUrl);
    var requesterMail = req.body["requester-email"];
    var requesterPass = req.body["old-password"];
    var newPass = req.body["new-password"];
    res.setHeader("Content-Type", "text/plain");
    
    Users.find({
            email: requesterMail,
            password: requesterPass
        },
        function (err, doc) {
            if (err) {
                console.log(err);
                return;
            }

            /* 
            Found a user in the database that have a matched email and password.
            So we can change the password of that user. 
            */
            if (doc.length > 0) {
                Users.findOneAndUpdate({
                        email: requesterMail,
                        password: requesterPass
                    }, {
                        password: newPass
                    },
                    function (err, doc) {
                        if (err) {
                            console.log(err);
                        }
                        res.send("success")
                    });
                
            /* If not found */
            } else {
                res.send("fail");
            }
        });
});




/* Set a user to be admin */
app.post("/users/admins", function (req, res) {
    console.log("A client made a POST request to assign an admin" + req.originalUrl);
    var requesterEmail = req.body["requester-email"];
    var requesterPass = req.body["requester-pass"];
    var targetEmail = req.body["target-email"];
    res.setHeader("Content-Type", "text/plain");

    /* Only the super admin can assign a new admin*/
    Users.find({
        email: requesterEmail,
        password: requesterPass
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }

        /* If requester is a user in the database */
        if (doc.length > 0) {

            /* Check if it is a superadmin. */
            if (doc[0].status == "superadmin") {
                Users.findOneAndUpdate({
                        email: targetEmail
                    }, {status: "admin"} ,
                    function (err, doc) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                    
                        /* if no such a user with target Email found. */
                        if (doc == null) {
                            res.send("fail");
                            return;
                        }
                        
                        /* Cannot set a super admin to become admin. */
                        if (doc.status == "superadmin") {
                            res.send("fail")
                        }
                            
                        res.send("success");
                    });
                
            /* If it is not an admin */
            } else {
                res.send("fail")
            }

        /* If requester is not in our database */
        } else {
            res.send("fail");
        }
    });
});




/* Remove admin priviledge of a user */
app.delete("/users/admins", function (req, res) {
    console.log("A client made a DELETE request to remove admin priviledge of a user");
    var requesterEmail = req.body["requester-email"];
    var requesterPass = req.body["requester-pass"];
    var targetEmail = req.body["target-email"];
    res.setHeader("ContentType", "plain/text");
    
    /* Only super admin can unassign an admin */
    Users.find({
        email: requesterEmail,
        password: requesterPass,
        status: "superadmin"
    }, function (err, doc) {
        
        if (err) {
            console.log(err);
            return;
        }
        
        /* If the requester is a superadmin*/
        if (doc.length > 0) {
            Users.findOneAndUpdate({
                email: targetEmail,
                status: "admin"
            }, {
                status: "basic"
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                    return;
                }
                
                /* If the target has been removed from the server  */
                if (doc == null) {
                    res.send("fail");
                } 
                res.send("success");
            });
        /* If the requester is not a super admin. */
        } else {
            res.send("fail");
        }
    });
});




/* Delete a user */
app.delete("/users", function (req, res) {
    console.log("A client made a DELETE request to delete a user: " + req.url);
    var requesterEmail = req.body["requester-email"];
    var requesterPass = req.body["requester-pass"];
    var targetEmail = req.body["target-email"];
    res.setHeader("ContentType", "plain/text");

    /* Find email and password of the requester in the database. */
    Users.find({
        email: requesterEmail,
        password: requesterPass
    }, function (err, doc) {
        if (err) {
            console.log("error");
            return;
        }
        if (doc.length > 0) {
            
            /* If requester is an admin and not try to delete themselve  */
            if ((doc[0].status == "admin" || doc[0].status == "superadmin") &&
                requesterEmail != targetEmail) {
                Users.find({
                    email: targetEmail,
                }, function (err, doc) {
                    if (err) {
                        console.log("error");
                        return;
                    }
                    
                    /* Check if the target has not been removed from the server */
                    if (doc.length > 0) {
                        
                        /* 
                        Admin can only delete basic user, so we check if the target is a basic account.
                        */
                        if (doc[0].status == "basic") {
                            adminDataOnly.findOneAndRemove({
                                email: doc[0].email
                            }, function (err, doc, result) {
                                if (err) {
                                    console.log("error");
                                    return;
                                }
                            });

                            Users.findOneAndRemove({
                                email: doc[0].email
                            }, function (err, doc, result) {
                                if (err) {
                                    console.log("error");
                                    return;
                                }
                                res.send("success");
                            });
                            
                        
                        /* If the target is not a basic account. */
                        } else {
                            res.send("fail");
                        }
                        
                    /* If target has been removed from the server. */
                    } else {
                        res.send("fail");
                    }
                });

            /* If requester is not an admin. */
            } else {
                res.send("fail")
            }
            
        /* If no such a requester found in the database. */
        } else if (doc.length == 0) {
            res.send("fail");
        }
    });
    return;
});


/* Adding the view count of target Email user by 1*/
app.put("/users/admins/data/viewcounts", function (req, res) {
    console.log("A client made a PUT request for updating admin data: " + req.originalUrl);
    var requesterEmail = req.body.email;
    var requesterPass = req.body.pass;
    var targetEmail = req.body.target;
    res.setHeader("Content-Type", "text/plain");
    
    Users.find({
        email: requesterEmail,
        password: requesterPass
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }
        
        /* If such a requester exists in the database. */
        if (doc.length > 0) {
            adminDataOnly.find({
                email: targetEmail
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                    return;
                }
                /* If the target user exists in the database. */
                if (doc.length > 0) {
                    
                    /* Increament the view count by one. */
                    adminDataOnly.findOneAndUpdate({
                        email: targetEmail
                    }, {
                        viewCount: (doc[0].viewCount + 1)
                    }, function (err, doc) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        res.send("success");
                    });
                    
                /* If the target no longer exists in the database */
                } else {
                    res.send("fail");
                }
            });
            
        /* If the requester doesn't exist in the database. */
        } else {
            res.send("fail");
        }
    });
});


/* Get the admin data. POST for safety reason. */
app.post("/users/admins/data", function (req, res) {
    console.log("A client made a POST request for admin data: " + req.originalUrl);
    var requesterEmail = req.body.email;
    var requesterPass = req.body.pass;
    var target = req.body.target;
    res.setHeader("Content-Type", "application/json");

    Users.find({
        email: requesterEmail,
        password: requesterPass
    }, function (err, doc) {
        if (err) {
            console.log(err);
            return;
        }
        /* such a requester exists in the system. */
        if (doc.length > 0) {

            /* Only the admin user can retrieve admin data. */
            if (doc[0].status == "admin" || doc[0].status == "superadmin") {

                /* Find the target user in the admin data table*/
                adminDataOnly.find({
                    email: target
                }, function (err, doc) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    
                    /* If the target exists then send back that user object to the client. */
                    if (doc.length > 0) {
                        res.json(doc);

                    /* If the target doesn't exists */
                    } else {
                        res.json([]);
                    }
                });

            /* If requester is not an admin */
            } else {
                res.json([]);
            }
            
        /* if a requester is not in the system. */
        } else {
            res.json([]);
        }
    });
});



app.listen(PORT);
console.log("Express server is listening on PORT: " + PORT);