/* Please read my README file */
window.onload = function () {
    /* CONSTANT */
    
    /* 
    A regluar expression used to check if the user input is an email. 
    Source: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    */
    var MAIL_VALID_REX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
    
    /* Variable */
    /* Array of all of the app users without their password. */
    var allUsers = []; 
    
    /* The client that is currenttly logged in. */
    var currentUser = []; 
    
    /* Indicate whether this client has been logged in yet. */
    var loginYet = false;
    
    /* 
    Indicate that the client has been kicked out from the app while they are logging in. It is 
    either because a bad request, or be removed by admin.
    */
    var gotKickedOut;
    
    /* latitude and longitude for a user. */
    var lat;
    var long;
    detectLocation();
    
    /* Get the user web browser and Operating system */
    var browser = detectBrowser();
    var OS = detectOS();
    
    /* 
    Detect mobile device.
    Source : http://magentohostsolution.com/3-ways-detect-mobile-device-jquery/
    */
    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };


    /* The user choose login in the front page. */
    $("#login-btn").click(function () {
        $("#login-signup").hide();
        $("#login-page").show();
        return;
    });

    /* The user choose sign up in the front page.*/
    $("#signup-btn").click(function () {
        $("#login-signup").hide();
        $("#signup-page").show();
        return;
    });

    /* The user submit the user email and password for verification. */
    $("#submit-login").click(function () {
        var currentDate = new Date();
        var loginTime = (currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" +
                    currentDate.getFullYear() + " @ " + currentDate.getHours() + ":" +
                    currentDate.getMinutes() + ":" + currentDate.getSeconds());
        $.ajax({
            url: "http://127.0.0.1:3000/users/login",
            method: "post",
            data: {
                "email": $("#input-mail").val(),
                "password": $("#input-pass").val(),
                "login-time": loginTime,
                "browser": browser,
                "os": OS,
                "lat": lat,
                "long": long,
                "is-mobile": isMobile.any()
            },
            dataType: "json",
            success: checkpwd
        });
        return;
    });

    /* The user submit the sign up form. */
    $("#submit-sign-up").click(function () {
        var ready = true;
        if ($("#su-pass").val() != $("#su-pass2").val()) {
            $("#help-block-pass2").text("Your confirmed password did not match.");
            setTimeout(function(){$("#help-block-pass2").text("")}, 3000);
            ready = false;
        } else {
            $("#help-block-pass2").text("");
            ready = true && ready;
        }

        if ($("#su-name").val().length > 20) {
            $("#help-block-name").text("Your display name should be less than 20 characters.");
            setTimeout(function(){$("#help-block-name").text("")}, 3000);
            ready = false;
        } else {
            $("#help-block-name").text("");
            ready = true && ready;
        }

        if ($("#su-pass").val().length < 5 || $("#su-pass").val().length > 12) {
            $("#help-block-pass").text("Your password should be between 5 and 12 characters.");
            setTimeout(function(){$("#help-block-pass").text("")}, 3000);
            ready = false;
        } else {
            $("#help-block-pass").text("");
            ready = true && ready;
        }
        
        
        if ($("#su-email").val().length > 80 || $("#su-email").val().length < 3) {
            $("#help-block-email").text("Your email should be between 3 and 50 characters.");
            setTimeout(function(){$("#help-block-email").text("")}, 3000);
            ready = false;
        } else {
            if (MAIL_VALID_REX.test($("#su-email").val()) == false) {
                $("#help-block-email").text("Not a valid email address");
                setTimeout(function(){$("#help-block-email").text("")}, 3000);
                ready = false;
            } else {
                $("#help-block-email").text("");
                ready = true && ready;
            }
        }
        
        if ($("#su-descript").val().length > 500) {
            $("#help-block-descript").text("Please type in less than 500 characters for the description.");
            setTimeout(function(){$("#help-block-descript").text("")}, 3000);
            ready = false;
        } else {
            $("#help-block-descript").text("");
            ready = true && ready;
        }
        
        var currentDate = new Date();
        var loginTime = (currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" +
                    currentDate.getFullYear() + " @ " + currentDate.getHours() + ":" +
                    currentDate.getMinutes() + ":" + currentDate.getSeconds());

        if (ready == true) {
            $.ajax({
                url: "http://127.0.0.1:3000/users/new-account",
                method: "post",
                data: {
                    "email": $("#su-email").val(),
                    "pswrd": $("#su-pass").val(),
                    "name": $("#su-name").val(),
                    "dcrpt": $("#su-descript").val(),
                    "login-time": loginTime,
                    "browser": browser,
                    "os" : OS,
                    "lat" : lat,
                    "long" : long,
                    "is-mobile": isMobile.any()
                },
                success: checkSignUp,
                dataType: "json"
            });
        }
        return;
    });

    /* 
    Empty json array received from the server indicating there is no such user in the database, so we 
    print the error and let the user to retype. Otherwise, transfer the user to the welcome page. 
    */
    function checkpwd(data) {
        if (data.length == 0) {
            $("#login-error-mess").text("Incorrect User Id or Password!");
            setTimeout(function(){$("#login-error-mess").text("")}, 3000);
        } else if (data.length > 0) {
            $("#login-error-mess").text("");
            
            /* global variable current user is the client that is just logged in. */
            currentUser = data;
            welcomeUser();
        }
        return;
    }


    /*
    Empty json array received from the server indicating there has been a user with that email address, so
    we ask the user to retype their email. Otherwise transfer the user to the welcome page.
    */
    function checkSignUp(data) {
        if (data.length == 0) {
            $("#su-info-mess").text("Please select another email. The email you typed in has been used.");
            setTimeout(function(){$("#su-info-mess").text("")}, 4000);
        } else {
            $("#su-info-mess").text("");
            /* global variable current user is the client that is just logged in. */
            currentUser = data;
            welcomeUser();
        }
        return;
    }
    
    /*
    Processing the welcome page. 
    */
    function welcomeUser() {

        loginYet = true;
        gotKickedOut = false;
        $("form").trigger("reset");

        /* Transfer from either login or signup page to welcome user page. */
        $("#login-page").hide();
        $("#signup-page").hide();
        $("#welcome-user-page").show();

        /* Display the user pannel on the header. */
        $("#user-section").css("display", "inline-block");

        /* Welcome message. */
        $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");
        $("#user-acc").text("User: " + currentUser[0]["displayName"]);

        /* Get list of all users from the server. */
        $.getJSON("http://127.0.0.1:3000/users", "", function (data) {

            /* All users without their passwords received from the server. */
            allUsers = data;
            for (var i = 0; i < allUsers.length; i++) {
                var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                    allUsers[i]["displayName"] + "</td></tr>");
                $("#user-list tbody").append(row);
            }
            return;
        });

        /* Get avatar of a user using their email and display it on the header. */
        $.get("http://127.0.0.1:3000/users/avatars",
            "email=" + currentUser[0]["email"],
            function (data) {
                $("#user-ava > img").attr("src", "data:image/png;base64," + data);
                return;
            });
        return;
    }
    
    
    
    
    /* 
    Detect click on a row in the list and transfers the user to the profile page of the
    corresponding user.
    */
    $("#user-list tbody").on("click", "tr", function () {
        var clickUserEmail = $(this).find("td:first").text();
        var clickUserName = $(this).find("td:nth-child(2)").text();
        var user = null;

        /* Update currentUser and allUsers */
        updateAllUser();
        updateCurrentUser();

        /* Wait for the currentUser and allUser to be updated. */
        setTimeout(function () {

            /* If the current user is still in the database then process */
            if (gotKickedOut == false) {

                /* Get the user object of the user that was clicked. */
                for (var i = 0; i < allUsers.length; i++) {
                    if (allUsers[i]["email"] == clickUserEmail) {
                        user = allUsers[i];
                    }
                }

                /* If the user that gets clicked is still in the data base */
                if (user != null) {
                    
                    /* Transferring from welcome user page to profile page. */
                    $("#welcome-user-page").hide();
                    $("#profile-page").show();


                    /* Set the profile information for the target that the client clicked on */
                    $("#pf-name").text(user["displayName"]);
                    $("#pf-email").text(user["email"]);
                    $("#pf-description").text(user["description"]);
                    $("#pf-status").text(user["status"]);

                    /* Set the profile image for target */
                    $.get("http://127.0.0.1:3000/users/avatars",
                        "email=" + user["email"],
                        function (data) {
                            $("#profile-image > img").attr("src", "data:image/png;base64," + data);
                            return;
                        });
                    
                    /* Adding view count for this user */
                    addingViewCount();
                    setTimeout(function(){displayTrackingInfo()}, 10);
                    
                    
                    /* Make everything show then filter what dont need to show. */
                    $("#profile-admin-section").show();
                    $("#delete-user-btn").show();
                    $("#make-admin-btn").show();
                    $("#unassign-admin-btn").show();
                    $("#admin-edit-btn").show();
                    $("#edit-profile-bottom").show();
                    
                    /* If the current user is not an admin, then hide the admin section in the profile page. */
                    if (currentUser[0].status != "admin" && currentUser[0].status != "superadmin") {
                        $("#profile-admin-section").hide();
                    }

                    /* If the current user is not a super admin, hide the button "Make Admin" and "Unassign Admin" */
                    if (currentUser[0].status != "superadmin") {
                        $("#make-admin-btn").hide();
                        $("#unassign-admin-btn").hide();
                    }

                    /* If the current user is a superadmin and the target is a basic user, then show "Make Admin" button. */
                    if (currentUser[0].status == "superadmin" && user.status == "basic") {
                        $("#make-admin-btn").show();
                        $("#unassign-admin-btn").hide();
                    }

                    /* If the current user is a superadmin and the target is an admin, then show "Unassign admin" button.*/
                    if (currentUser[0].status == "superadmin" && user.status == "admin") {
                        $("#make-admin-btn").hide();
                        $("#unassign-admin-btn").show();
                    }

                    /* If a super admin is viewing the profile of himself then hide both*/
                    if (currentUser[0].status == "superadmin" && user.status == "superadmin") {
                        $("#make-admin-btn").hide();
                        $("#unassign-admin-btn").hide();
                    }
                    
                    /* An admin user can only delete basic user. Superadmin cannot directly delete an admin. */
                    if (user.status == "superadmin" || user.status == "admin") {
                        $("#delete-user-btn").hide();   
                    }
                    
                    /* Admin cannot edit superadmin profile */
                    if (currentUser[0].status == "admin" && user.status == "superadmin") {
                        $("#admin-edit-btn").hide();
                    }
                    
                    return;

                /* The target click user has been removed from the database */
                } else if (user == null) {
                    
                    alert("That user has been removed from the database");
                    /* 
                    Stay in welcome user page and Update the user array, 
                    there may be new user that is just signed up.
                    */
                    $("#user-list tbody").children("tr").remove();
                    for (var i = 0; i < allUsers.length; i++) {
                        var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                            allUsers[i]["displayName"] + "</td></tr>");
                        $("#user-list tbody").append(row);
                    }
                    
                    /* Update the welcome message too */
                    $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");   
                }

            /* The current client has been removed from the database */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database.")
                logout();
            }
        }, 100);
    });
    
    
    /* Handle click on edit user profile in the admin section of user profile page. */
    $("#admin-edit-btn").on("click", function () {

        /* Update currentUser and allUsers */
        updateAllUser();
        updateCurrentUser();
        
        /* Wait for the update to be finished before continue to execute. */
        setTimeout(function() {
            
            /* If the client has not been removed from the server*/
            if (gotKickedOut == false) {
                
                /* Get the Json object of the user the client is viewing. */
                $.getJSON("http://127.0.0.1:3000/users",
                    "email=" + $("#pf-email").text(),
                    function (data) {
                    
                        /* 
                        If the target user has been removed from the server, then transferring 
                        back to the welcome-page. 
                        */
                        if (data.length == 0) {
                            alert("The target user has been deleted from the server.");
                            $("#welcome-user-page").show();
                            $("#profile-page").hide();
                            
                            /* Update display name of the current user. */
                            $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");
                            
                            
                            /* Update the array of users. */
                            $("#user-list tbody").children("tr").remove();
                            for (var i = 0; i < allUsers.length; i++) {
                                var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                allUsers[i]["displayName"] + "</td></tr>");
                                $("#user-list tbody").append(row);
                            }
                            
                            return;
                        }
                        
                        /* Transferring from profile page to edit profile page if the target exists. */
                        $("#profile-page").hide();
                        $("#edit-profile-page").show();
                        
                        /* Populate the text field by orignal data. */
                        $("#edit-email").val(data[0].email);
                        $("#edit-dname").val(data[0].displayName);
                        $("#edit-description").val(data[0].description);
                        
                        if (currentUser[0].email != data[0].email) {
                            $("#edit-profile-bottom").hide();
                        } else {
                            $("#edit-profile-bottom").show();
                        }
                        
                        /* Set the picture of the user that the client is viewing */
                        $.get("http://127.0.0.1:3000/users/avatars",
                            "email=" + data[0].email,
                            function (data) {
                                $("#profile-image-edit > img").attr("src", "data:image/png;base64," + data);
                                return;
                            });
                        return;
                    });
                
            /* If the current user has been removed from the server */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database.");
                logout();
            }
        }, 100);
    });
    
    
    
    
    /* Handle click to assign a user to be an admin. */
    $("#make-admin-btn").on("click", function () {
        
        /* Update currentUser and allUsers */
        updateAllUser();
        updateCurrentUser();

        /* Wait for all user and current user is update */
        setTimeout(function () {

            /* If the current client is still in the server database */
            if (gotKickedOut == false) {
                var requesterEmail = currentUser[0].email;
                var requesterPass = currentUser[0].password;
                var targetEmail = $("#pf-email").text();

                $.post("http://127.0.0.1:3000/users/admins",
                    "requester-email=" + requesterEmail + "&" +
                    "requester-pass=" + requesterPass + "&" +
                    "target-email=" + targetEmail,
                    function (data) {

                        /* If the target user is still exists in the database.  */
                        if (data == "success") {
                            /* Updating all user */
                            updateAllUser();
                            
                            $("#admin-mess").text("You have successfully assigned this user to be an admin.");
                            setTimeout(function () {
                                $("#admin-mess").text("");
                            }, 3000);

                            /* Displaying unassign admin button instead */
                            $("#make-admin-btn").hide();
                            $("#delete-user-btn").hide(); /* Cannot delete an admin. */
                            $("#unassign-admin-btn").show();
                            
                            /* Update the profile picture of that user. */
                            $.get("http://127.0.0.1:3000/users/avatars",
                                "email=" + targetEmail,
                                function (data) {
                                    $("#profile-image > img").attr("src", "data:image/png;base64," + data);
                                    return;
                                });
                            
                            /* Update the profile too. */
                            $.get("http://127.0.0.1:3000/users",
                                "email=" + targetEmail,
                                function (data) {
                                    $("#pf-name").text(data[0]["displayName"]);
                                    $("#pf-email").text(data[0]["email"]);
                                    $("#pf-description").text(data[0]["description"]);
                                    $("#pf-status").text(data[0]["status"]);
                                    return;
                                });
                            
                            /* Update the tracking info  */
                            displayTrackingInfo();

                        /* If the target not exists in the database. Just go back to the welcome page. */
                        } else {
                            alert("The target user has been deleted from the server");
                            $("#welcome-user-page").show();
                            $("#profile-page").hide();

                            /* Update the user array */
                            $("#user-list tbody").children("tr").remove();
                            for (var i = 0; i < allUsers.length; i++) {
                                var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                    allUsers[i]["displayName"] + "</td></tr>");
                                $("#user-list tbody").append(row);
                            }

                            /* Update the welcome message too */
                            $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");
                            
                            
                            /* Reset the four buttons in admin section of user profile and the change password section. */
                           $("#admin-edit-btn").show();
                           $("#delete-user-btn").show();
                           $("#make-admin-btn").show();
                           $("#unassign-admin-btn").show();

                           /* Reset change password section in edit profile page. */
                           $("#edit-profile-bottom").show();
                        }
                    });

            /* If the current client has been removed, then restart. */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database. ")
                logout();
            }
        }, 100);
    });
    
    
    
    /* Handle click to unassign admin privileage for a user. */
   $("#unassign-admin-btn").on("click", function () {

       /* Updating all user and current user */
       updateAllUser();
       updateCurrentUser();

       /* Waiting for all update to be done. */
       setTimeout(function () {
           /* If the user is still in the database */
           if (gotKickedOut == false) {
               var requesterEmail = currentUser[0].email;
               var requesterPass = currentUser[0].password;
               var targetEmail = $("#pf-email").text();

               /* Send a delete request to delete an admin to the server.*/
               $.ajax({
                   url: "users/admins",
                   type: "delete",
                   data: {
                       "requester-email": currentUser[0].email,
                       "requester-pass": currentUser[0].password,
                       "target-email": $("#pf-email").text()
                   },
                   success: function (data) {


                       /* If successfully unassign admin */
                       if (data == "success") {
                           
                           /* Updating all user */
                           updateAllUser();
                           
                           $("#admin-mess").text("You have successfully unassign admin priviledge for this user.");
                           setTimeout(function () {
                               $("#admin-mess").text("");
                           }, 3000);

                           /* Displaying assign admin button and delete user */
                           $("#make-admin-btn").show();
                           $("#delete-user-btn").show(); /* Can delete a basic account */
                           $("#unassign-admin-btn").hide();

                           /* Update the profile picture of that user. */
                           $.get("http://127.0.0.1:3000/users/avatars",
                               "email=" + targetEmail,
                               function (data) {
                                   $("#profile-image > img").attr("src", "data:image/png;base64," + data);
                                   return;
                               });

                           /* Update their profile */
                           $.get("http://127.0.0.1:3000/users",
                               "email=" + targetEmail,
                               function (data) {
                                   $("#pf-name").text(data[0]["displayName"]);
                                   $("#pf-email").text(data[0]["email"]);
                                   $("#pf-description").text(data[0]["description"]);
                                   $("#pf-status").text(data[0]["status"]);
                                   return;
                               });
                           
                           /* Update their tracking info */
                           displayTrackingInfo();

                        /* Return to the welcome page if unsuccessful. */
                       } else {
                           alert("The user has been deleted from the database");

                           /* Transfer to welcome page. */
                           $("#welcome-user-page").show();
                           $("#profile-page").hide();

                           /* Update the user array */
                           $("#user-list tbody").children("tr").remove();
                           for (var i = 0; i < allUsers.length; i++) {
                               var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                   allUsers[i]["displayName"] + "</td></tr>");
                               $("#user-list tbody").append(row);
                           }

                           /* Update the welcome message too */
                           $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");


                           /* Reset the four buttons in admin section of user profile and the change password section. */
                           $("#admin-edit-btn").show();
                           $("#delete-user-btn").show();
                           $("#make-admin-btn").show();
                           $("#unassign-admin-btn").show();

                           /* Reset change password section in edit profile page. */
                           $("#edit-profile-bottom").show();
                       }
                   }
               });

            /* If the current User has been kicked out from the server. */
           } else if (gotKickedOut == true) {
               console.log("Your account has been removed from the database. ")
               logout();
           }
       }, 100);
   });
    
    
    
    
    /* 
    Handle click on the logo, return the user welcome page if the user has been login othewise 
    transfer them to the login-sign up selection page. 
    */
    $("#logo").on("click", function () {
        $("#old-password").val("");
        $("#new-password").val("");
        $("#confirm-password").val("");
        
        /* If already login */
        if (loginYet == true) {

            /* Update currentUser and allUsers */
            updateAllUser();
            updateCurrentUser();

            /* Wait for all of the update to be done, then continue */
            setTimeout(function () {
                
                /* If the current client has not been removed from the database. */
                if (gotKickedOut == false) {
                    
                    $("#welcome-user-page").show();
                    $("#profile-page").hide();
                    $("#edit-profile-page").hide();

                    /* Reset the welcome message. */
                    $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");

                    /* Update the user array, there may be new user that is just signed up. */
                    $("#user-list tbody").children("tr").remove();
                    for (var i = 0; i < allUsers.length; i++) {
                        var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                            allUsers[i]["displayName"] + "</td></tr>");
                        $("#user-list tbody").append(row);
                    }
                    
                    /* Reset the four buttons in admin section of user profile and the change password section. */
                    $("#admin-edit-btn").show();
                    $("#delete-user-btn").show();
                    $("#make-admin-btn").show();
                    $("#unassign-admin-btn").show();
                    
                    /* Reset change password section in edit profile page. */
                    $("#edit-profile-bottom").show();
                    
                /* If the current client is removed from the database */
                } else if (gotKickedOut == true) {
                    alert("Your account has been removed from the database.");
                    logout();
                }
            }, 100);
            
        /* If not login yet */
        } else if (loginYet == false) {
            $("form").trigger("reset");
            $("#login-error-mess").text("");
            $("#su-info-mess").text("");
            $("#login-signup").show();
            $("#login-page").hide();
            $("#signup-page").hide();
        }
    });
    
    
    
    
    /* Handle log out in the header */
    $("#log-out-btn").on("click", logout);
    function logout() {
        $("#login-signup").show();
        $("#profile-page").hide();
        $("#edit-profile-page").hide();
        $("#welcome-user-page").hide();
        $("#user-section").hide();
        $("form").trigger("reset");
        $("#user-section").css("display", "none");

        /* reset in welcome user page. */
        $("#user-list tbody").children("tr").remove();
        $("#wc-mess").text("");

        /* reset header */
        $("#user-ava > img").attr("src", "");
        $("#user-acc").text("");

        /* reset in profile page */
        $("#profile-image > img").attr("src", "");
        $("#pf-name").text("");
        $("#pf-email").text("");
        $("#pf-description").text("");
        $("#pf-status").text("");
        $("#profile-admin-section").show();
        $("#delete-user-btn").show();
        $("#make-admin-btn").show();
        $("#unassign-admin-btn").show();
        $("#edit-profile-bottom").show();
        $("#admin-edit-btn").show();
        
        /* reset in edit-profile-page */
        $("#profile-image > img").attr("src", "");
        $("#help-block-edit-mail").val("src", "");
        $("#help-block-edit-dname").val("src", "");
        $("#help-block-edit-description").val("src", "");
        $("#help-block-old-password").val("src", "");
        $("#help-block-new-password").val("src", "");
        $("#help-block-confirm-password").val("src", "");
        $("#edit-info-mess").text("");
        $("#edit-profile-mess").text("");
        $("#edit-profile-bottom").show();
        $("#old-password").val("");
        $("#new-password").val("");
        $("#confirm-password").val("");
        
        /* Reset variable */
        gotKickedOut = undefined;
        loginYet = false;
        currentUser = [];
        allUsers = [];
    }
    
    
    
    
    /* Handle click on delete user button in profile page. Only works for the admins*/
    $("#delete-user-btn").on("click", function () {
        updateAllUser();
        updateCurrentUser();

        /* Waiting for all user and current user to be updated. */
        setTimeout(function () {
            if (gotKickedOut == false) {
                $.ajax({
                    url: '/users',
                    type: 'delete',
                    data: {
                        "requester-email": currentUser[0].email,
                        "requester-pass": currentUser[0].password,
                        "target-email": $("#pf-email").text()
                    },
                    success: function (data) {
                        
                        /* If successfully */
                        if (data == "success") {
                            /* update all user after the deletion. */
                            updateAllUser();
                            $("#admin-edit-btn").hide();
                            $("#delete-user-btn").hide();
                            $("#make-admin-btn").hide();
                            $("#unassign-admin-btn").hide();
                            
                            /* Notify the the client that this user has been succesfully deleted from the server */
                            $("#admin-mess").text("Removed ! Redirecting to the main page");
                            setTimeout(function () {
                                $("#admin-mess").text("");

                                /* Transfer the user back to welcome user page.*/
                                $("#welcome-user-page").show();
                                $("#profile-page").hide();
                                $("#edit-profile-page").hide();

                                /* Reset the welcome message. */
                                $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");

                                /* Reset the list of all users. */
                                $("#user-list tbody").children("tr").remove();
                                for (var i = 0; i < allUsers.length; i++) {
                                    var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                        allUsers[i]["displayName"] + "</td></tr>");
                                    $("#user-list tbody").append(row);
                                }

                                /* Reset the four buttons in admin section of user profile and the change password section. */
                                $("#admin-edit-btn").show();
                                $("#delete-user-btn").show();
                                $("#make-admin-btn").show();
                                $("#unassign-admin-btn").show();

                                /* Reset change password section in edit profile page. */
                                $("#edit-profile-bottom").show();

                            }, 2200);

                        /* If fail to delete the user from the server. */
                        } else {

                            alert("The target user has been removed from the database");

                            /* Transfer the user back to welcome user page.*/
                            $("#welcome-user-page").show();
                            $("#profile-page").hide();
                            $("#edit-profile-page").hide();

                            /* Reset the welcome message. */
                            $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");

                            /* Reset the list of all users. */
                            $("#user-list tbody").children("tr").remove();
                            for (var i = 0; i < allUsers.length; i++) {
                                var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                    allUsers[i]["displayName"] + "</td></tr>");
                                $("#user-list tbody").append(row);
                            }

                            /* Reset the four buttons in admin section of user profile and the change password section. */
                            $("#admin-edit-btn").show();
                            $("#delete-user-btn").show();
                            $("#make-admin-btn").show();
                            $("#unassign-admin-btn").show();

                            /* Reset change password section in edit profile page. */
                            $("#edit-profile-bottom").show();
                        }
                    }
                });

                /* If this client has been removed from the server, then basically log this user out. */
            } else if (gotKickedOut == true) {
                alert("Your account has been deleted from the database. ")
                logout();
            };
        }, 100);
    });
    
    
                             
                             
    /* Handle click on edit profile button in the header */
    $("#edit-prof-btn-header").on("click", function () {
        $("#old-password").val("");
        $("#new-password").val("");
        $("#confirm-password").val("");
        
        /* update all user and current user. */
        updateAllUser();
        updateCurrentUser();

        /* Wait for all updates to be done. */
        setTimeout(function () {

            /* If a user is still in the database. */
            if (gotKickedOut == false) {

                /* transfer the user to the edit profile page */
                $("#edit-profile-page").css("display", "block");
                $("#welcome-user-page").hide();
                $("#profile-page").hide();

                /* Set the default value for the input box. */
                $("#edit-email").val(currentUser[0]["email"]);
                $("#edit-dname").val(currentUser[0]["displayName"]);
                $("#edit-description").val(currentUser[0]["description"]);
                $("#edit-profile-bottom").show();

                /* Get avatar of a user using their email.*/
                $.get("http://127.0.0.1:3000/users/avatars",
                    "email=" + currentUser[0]["email"],
                    function (data) {
                        $("#user-ava > img").attr("src", "data:image/png;base64," + data);
                        $("#profile-image-edit > img").attr("src", "data:image/png;base64," + data);
                    });


            /* if the user has been removed from the database */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database!")
                logout();
            }
        }, 100);
    });
    
    
    
    
    /* Handle click on the profile change button in edit user profile page. */
    $("#pf-change-btn").click(function () {

        /* Update all user and current user */
        updateAllUser();
        updateCurrentUser();

        /* Wait for the update to be done. */
        setTimeout(function () {

            /* The client is still in the database */
            if (gotKickedOut == false) {
                var ready = true;

                /* Some form validation just like in the sign up page. */
                if ($("#edit-dname").val().length > 20) {
                    $("#help-block-edit-dname").text("The display name must be at most 20 characters");
                    setTimeout(function () {
                        $("#help-block-edit-dname").text("")
                    }, 3000);
                    ready = false;
                } else {
                    $("#help-block-edit-dname").text("");
                    ready = ready && true;
                }

                if ($("#edit-description").val().length > 500) {
                    $("#help-block-edit-description").text("The description cannot be longer than 500 characters");
                    setTimeout(function () {
                        $("#help-block-edit-description").text("")
                    }, 3000);
                } else {
                    $("#help-block-edit-description").text("");
                    ready = ready && true;
                }

                if (ready == true) {
                    /* 
                    Send request to update data to the server. Note that the target email may be 
                    the same or different from the current user email (requester). 
                    */
                    var requester = currentUser[0]["email"];
                    var requesterPassword = currentUser[0]["password"];
                    $.ajax({
                        url: "http://127.0.0.1:3000/users/profiles",
                        data: {
                            "new-dname": $("#edit-dname").val(),
                            "new-description": $("#edit-description").val(),
                            "requester-email": requester,
                            "requester-pass": requesterPassword,
                            "target-email": $("#edit-email").val()
                        },
                        method: "put",
                        success: function (data) {

                            /* If successfully update */
                            if (data == "success") {
                                $("#edit-profile-mess").text("The user profile has been successfully updated.");
                                setTimeout(function () {
                                    $("#edit-profile-mess").text("")
                                }, 3000);

                                /* Update the target profile image*/
                                $.get("http://127.0.0.1:3000/users/avatars",
                                    "email=" + $("#edit-email").val(),
                                    function (data) {
                                        $("#profile-image-edit > img").attr("src", "data:image/png;base64," + data);
                                    });

                                /* Update all user and current user after the operation is completed.*/
                                updateAllUser();
                                updateCurrentUser();

                                /* Reset the editable profile data */
                                $.get("http://127.0.0.1:3000/users",
                                    "email=" + $("#edit-email").val(),
                                    function (data) {
                                        $("#edit-dname").val(data[0].displayName);
                                        $("#edit-description").val(data[0].description);
                                        return;
                                    });

                                /* If not successfully update because the target has been removed! Then 
                                return back to the user welcome page. */
                            } else {
                                alert("The target user has been removed from the server");

                                /* Transfer the user back to welcome user page.*/
                                $("#welcome-user-page").show();
                                $("#profile-page").hide();
                                $("#edit-profile-page").hide();

                                /* Reset the welcome message. */
                                $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");

                                /* Reset the list of all users. */
                                $("#user-list tbody").children("tr").remove();
                                for (var i = 0; i < allUsers.length; i++) {
                                    var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                        allUsers[i]["displayName"] + "</td></tr>");
                                    $("#user-list tbody").append(row);
                                }

                                /* Reset the four buttons in admin section of user profile and the change password section. */
                                $("#admin-edit-btn").show();
                                $("#delete-user-btn").show();
                                $("#make-admin-btn").show();
                                $("#unassign-admin-btn").show();

                                /* Reset change password section in edit profile page. */
                                $("#edit-profile-bottom").show();
                            }
                        }
                    });
                }

                /* The client has been kicked out. */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database");
                logout();
            }
        }, 100);
    });
    
    
    
    /* Handle click on the submit change password button in edit user profile page. */
    $("#password-change-btn").click(function () {
        updateAllUser();
        updateCurrentUser();

        setTimeout(function () {
            if (gotKickedOut == false) {
                var ready = true;
                if ($("#new-password").val().length < 5 || $("#new-password").val().length > 12) {
                    $("#help-block-new-password").text("Vew password should be between 5 and 12 characters.");
                    ready = false;
                    setTimeout(function () {
                        $("#help-block-new-password").text("");
                    }, 3000);
                } else {
                    $("#help-block-new-password").text("");
                    ready = true && ready;
                }

                if ($("#new-password").val() != $("#confirm-password").val()) {
                    $("#help-block-confirm-password").text("Your confirm password did not match.");
                    ready = false;
                    setTimeout(function () {
                        $("#help-block-confirm-password").text("");
                    }, 3000);
                } else {
                    $("#help-block-confirm-password").text("");
                    ready = true && ready;
                }
                

                /* Only the current user can change the password, so we don't have to worry about 
                whether the target is exists or not here. */
                if (ready == true) {
                    var requester = currentUser[0]["email"];
                    var requesterPassword = currentUser[0]["password"];
                    $.ajax({
                        url: "http://127.0.0.1:3000/users/passwords",
                        method: "put",
                        data: {
                            "requester-email": requester,
                            "old-password": $("#old-password").val(),
                            "new-password": $("#new-password").val()
                        },
                        success: function (data) {
                            if (data == "fail") {
                                $("#help-block-old-password").text("Incorrect Old Password");
                                setTimeout(function () {
                                    $("#help-block-old-password").text("")
                                }, 4000);
                            } else if (data == "success") {
                                $("#help-block-old-password").text("");
                                $("#help-block-confirm-password").text("");
                                $("#help-block-new-password").text("");
                                $("#old-password").val("");
                                $("#new-password").val("");
                                $("#confirm-password").val("");
                                $("#edit-info-mess").text("You have successfully changed your password");
                                setTimeout(function () {
                                    $("#edit-info-mess").text("");
                                }, 3000);

                                /* Update all user and current user after the operation completed. */
                                updateAllUser();
                                updateCurrentUser();

                                /* Reset the editable profile data */
                                $.get("http://127.0.0.1:3000/users",
                                    "email=" + $("#edit-email").val(),
                                    function (data) {
                                        $("#edit-dname").val(data[0].displayName);
                                        $("#edit-description").val(data[0].description);
                                        return;
                                    });

                                /* Update the current profile image */
                                $.get("http://127.0.0.1:3000/users/avatars",
                                    "email=" + $("#edit-email").val(),
                                    function (data) {
                                        $("#user-ava > img").attr("src", "data:image/png;base64," + data);
                                    });
                            }
                        }
                    });
                }

                /* If has been removed from the database. */
            } else if (gotKickedOut == true) {
                alert("Your account has been removed from the database. ");
                logout();
            }
        }, 100);
    });
    
    
    
    
    /* Handle upload file */
    $("#upload-img-but").click(function () {
        updateAllUser();
        updateCurrentUser();

        if (gotKickedOut == false) {
            var selectedFile = $("#img-input").get(0).files[0];
            var files = $("#img-input").get(0).files;
            if (!files.length) {
                alert("No file selected yet. Please select a file.");
                return;
            }

            var requester = currentUser[0]["email"];
            var requesterPassword = currentUser[0]["password"];
            var formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("requester-email", requester);
            formData.append("requester-pass", requesterPassword);
            formData.append("target-email", $("#edit-email").val());
            
            $.ajax({
                url: "http://127.0.0.1:3000/users/avatars",
                data: formData,
                type: "put",
                contentType: false,
                processData: false,
                success: function (data) {
                    if (data != "fail") {
                        /* Make update to all of the user */
                        updateAllUser();
                        updateCurrentUser();
                        
                        /* Update the new profile image for this user. */
                        $("#profile-image-edit > img").attr("src", "data:image/png;base64," + data);
                        
                        /* Reset the input */
                        $("#img-input").replaceWith($("#img-input").clone(true));
                        
                        /* Reset the editable profile data */
                        $.get("http://127.0.0.1:3000/users",
                            "email=" + $("#edit-email").val(),
                            function (data) {
                                $("#edit-dname").val(data[0].displayName);
                                $("#edit-description").val(data[0].description);
                                return;
                            });

                    } else {
                        alert("This user may have been deleted from the server");
                        /* Transfer the user back to welcome user page.*/
                        $("#welcome-user-page").show();
                        $("#profile-page").hide();
                        $("#edit-profile-page").hide();

                        /* Reset the welcome message. */
                        $("#wc-mess").text("Welcome " + currentUser[0]["displayName"] + " to the mystery of A4.");

                        /* Reset the list of all users. */
                        $("#user-list tbody").children("tr").remove();
                        for (var i = 0; i < allUsers.length; i++) {
                            var row = $("<tr><td>" + allUsers[i]["email"] + "</td><td>" +
                                allUsers[i]["displayName"] + "</td></tr>");
                            $("#user-list tbody").append(row);
                        }

                        /* Reset the four buttons in admin section of user profile and the change password section. */
                        $("#admin-edit-btn").show();
                        $("#delete-user-btn").show();
                        $("#make-admin-btn").show();
                        $("#unassign-admin-btn").show();

                        /* Reset change password section in edit profile page. */
                        $("#edit-profile-bottom").show();
                    }
                }
            });
        } else if (gotKickedOut == true) {
            alert("Your account has been deleted from the database");
            logout();
        }
    });
    
    
    
    /* 
    Updating the current user whenever they go from one page of the app
    to another. 
    */
    function updateCurrentUser() {
        $.getJSON("http://127.0.0.1:3000/users",
            "email=" + currentUser[0].email,
            function (data) {
            
                /* If the current user is removed from the server while online. */
                if (data.length == 0) {
                    gotKickedOut = true;
                    // loginYet = false;
                    currentUser = [];
                    allUsers = [];
                
                /* If the current user still exists in the main database. */
                } else {
                    var currentUserPass = currentUser[0].password;
                    currentUser = data;
                    currentUser[0].password = currentUserPass;
                    
                    /* Update the header */
                    $.get("http://127.0.0.1:3000/users/avatars",
                        "email=" + currentUser[0].email,
                        function (data) {
                            $("#user-ava > img").attr("src", "data:image/png;base64," + data);
                            return;
                        });
                    $("#user-acc").text("User: " + currentUser[0].displayName);
                }
            });
    }
    
    
    
    /*
    Updating the list of all users from the server.
    */
    function updateAllUser() {
        $.getJSON("http://127.0.0.1:3000/users", "",
            function (data) {
                allUsers = data;
                return;
            });
        return;
    }
    
    
    
    /*
    Update tracking information.
    */
    function addingViewCount() {
        $.ajax({
            url: "http://127.0.0.1:3000/users/admins/data/viewcounts",
            method: "put",
            data: {
                "email": currentUser[0].email,
                "pass": currentUser[0].password,
                "target": $("#pf-email").text()
            },
            success: function (data) {
                if(data != "success") {
                    alert("Cannot update tracking detail! you are loging out");
                    logout();
                }
            }
        });
    }
    
    
    
    
    /* Send request to get tracking data */
    function displayTrackingInfo() {
        $.ajax({
            url: "http://127.0.0.1:3000/users/admins/data",
            method: "post",
            data: {
                "email": currentUser[0].email,
                "pass": currentUser[0].password,
                "target": $("#pf-email").text()
            },
            dataType: "json",
            success: function (data) {
                if (data.length > 0) {
                    $("#ip-display").text(data[0].ipAddress);
                    $("#log-time-display").text(data[0].loginTime);
                    $("#os-display").text(data[0].os);
                    $("#location-display").text("(" + data[0].latitude + ", " +
                        data[0].longitude + ")");
                    $("#is-mobile-display").text(data[0].isMobile);
                    $("#web-browser-display").text(data[0].browser);
                    $("#profile-view-count-display").text(data[0].viewCount);
                }
            }
        });
    }
    
    
    /* 
    Detect which browser the user is using .
    Source : http://www.sitepoint.com/jquery-todays-date-ddmmyyyy/ 
    */
    function detectBrowser() {
        var browser;
        /* Check if browser is IE or not */
        if (navigator.userAgent.search("MSIE") >= 0) {
            browser = "InternetExplorer";
        }
        /* Check if browser is Chrome or not */
        else if (navigator.userAgent.search("Chrome") >= 0) {
            browser = "Chrome";
        }
        /* Check if browser is FireFox */
        else if (navigator.userAgent.search("Firefox") >= 0) {
            browser = "Firefox";
        }
        /* Check if browser is Safari */
        else if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {
            browser = "Safari";
        }
        /* Check if browser is Opera. */
        else if (navigator.userAgent.search("Opera") >= 0) {
            browser = "Opera";
        }
        return browser;
    }
    
    
    
    /* 
    Detect Operating system 
    Source : http://stackoverflow.com/questions/11219582/how-to-detect-my-browser-version-
    and-operating-system-using-javascript
    */
    function detectOS() {
        var OSName = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) {
            OSName = "Windows";
        } else if (navigator.appVersion.indexOf("Mac") != -1) {
            OSName = "MacOS";
        } else if (navigator.appVersion.indexOf("X11") != -1) {
            OSName = "UNIX";
        } else if (navigator.appVersion.indexOf("Linux") != -1) {
            OSName = "Linux";
        }
        return OSName;
    }
    
    /* 
    Detect location
    source : W3 school geolocation
    */
    function detectLocation() {
        navigator.geolocation.getCurrentPosition(function(position){
            lat = position.coords.latitude;
            long = position.coords.longitude;
        }, function() {
            lat = "";
            long = "";
        });
    }
    
}