var MAIL_VALID_REX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
var CUISINE = ['Japanese', 'Thai', 'Chinese', 'Korean', 'Italian', 'French', 'VietNamese', 'Indian', 'FastFood', 'Others']

$("#signupform").submit(function (e) {
    e.preventDefault();
    var form = this;
    var ready = true;

    if (MAIL_VALID_REX.test($('#input-email').val()) == true) {
        $('#email-helper').text('');
        ready = true && ready;
    } else {
        $('#email-helper').text('Invalid Email Address');
        ready = false;
    }

    if ($('#password1').val().length >= 5 && $('#password1').val().length <= 12) {
        $('#pass1-helper').text('');
        ready = true && ready;
    } else {
        $('#pass1-helper').text('Your password should be between 5 and 12 characters in length.');
        ready = false;
    }

    if ($('#password1').val() == $('#password2').val()) {
        $('#pass2-helper').text('');
        ready = true && ready;
    } else {
        $('#pass2-helper').text('Your comfirm password does not match');
        ready = false;
    }

    // 
    if ($('#signupform input:checkbox:checked').length > 0) {
        $('#checkbox-helper').text('');
        ready = true && ready;
    } else {
        $('#checkbox-helper').text('Please select at least a cuisine.');
        ready = false;
    }

    // if client is a basic user
    if ($('#user-radio').is(':checked')) {
        if ($('#input-user-name').val().length >= 5 && $('#input-user-name').val().length <= 25) {
            $('#name-helper').text('');
            ready = true && ready;
        } else {
            ready = false;
            $('#name-helper').text('Your display name should be between 5 and 25 characters in length.');
        }

        if ($('#input-age').val().length > 0 && !isNaN($('#input-age').val())) {
            $('#age-helper').text('');
            ready = true && ready;
        } else {
            ready = false;
            $('#age-helper').text('Age must be a number and cannot be empty.');
        }
    }


    // if client is a restaurant
    if ($('#rest-radio').is(':checked')) {
        if ($('#input-res-name').val().length >= 5 && $('#input-res-name').val().length <= 25) {
            $('#res-name-helper').text('');
            ready = true && ready;
        } else {
            ready = false;
            $('#res-name-helper').text('The restaurant name should be between 5 and 25 characters in length.');
        }

        if ($('#input-location').val().length >= 5 && $('#input-location').val().length <= 30) {
            $('#location-helper').text('');
            ready = true && ready;
        } else {
            $('#location-helper').text('The restaurant address should be between 5 and 30 characters.');
            ready = false;
        }
    }

    if (ready == true) {
        form.submit();
    }
});


// Activate when the users (FB, regular or admin user) click button to update their profile.
$('#user-update-prof-btn').click(function () {
    var newAge = $('#user-age-update').val();
    var newName = $('#user-name-update').val();
    var newCuisine = [];
    $('#user-profile-success').text("");
    $('#user-profile-fail').text("");
    
    for (var i = 0; i < CUISINE.length; i++) {
        if ($('#c' + i).is(":checked")) {
            newCuisine.push(CUISINE[i]);
        }
    }

    var ready = true;

    // check if we have at least one check box checked.
    if ($('#user-update-form input:checkbox:checked').length > 0) {
        $('#user-checkbox-edit-helper').text('');
        ready = true && ready;
    } else {
        $('#user-checkbox-edit-helper').text('Please select at least a cuisine.');
        ready = false;
    }

    // check if the update user name has length between 5 and 25 characters.
    if ($('#user-name-update').val().length >= 5 && $('#user-name-update').val().length <= 25) {
        $('#user-name-edit-helper').text('');
        ready = true && ready;
    } else {
        ready = false;
        $('#user-name-edit-helper').text('User name should be between 5 and 25 characters in length.');
    }

    // check if the input age is > 0 and is a number.
    if ($('#user-age-update').val().length > 0 && !isNaN($('#user-age-update').val())) {
        $('#user-age-edit-helper').text('');
        ready = true && ready;
    } else {
        ready = false;
        $('#user-age-edit-helper').text('Age cannot be empty and must be a number');
    }

    if (ready) {
        $.ajax({
            url: $('#user-update-form').attr('action'),
            method: 'put',
            data: {
                age: newAge,
                name: newName,
                cuisine: newCuisine
            },
            success: function (data) {
                // alert(data);
                if (data == 'success') {
                    $('#user-profile-success').text("Sucessfully update the user profile.");
                    setTimeout(function () {
                        $('#user-profile-success').text("");
                    }, 2000);
                } else {
                    $('#user-profile-fail').text("Fail to update the user profile.");
                    setTimeout(function () {
                        $('#user-profile-fail').text("");
                    }, 2000);
                }
            }
        });
    }
});


// Activate when the restaurant click button to update their profile.
$('#rest-update-prof-btn').click(function () {
    var newLocation = $('#rest-loc-update').val();
    var newName = $('#rest-name-update').val();
    var newCuisine = [];
    $('#rest-profile-success').text("");
    $('#rest-profile-fail').text("");
    
    for (var i = 0; i < CUISINE.length; i++) {
        if ($('#r' + i).is(":checked")) {
            newCuisine.push(CUISINE[i]);
        }
    }

    var ready = true;

    // check if we have at least one check box checked.
    if ($('#rest-update-form input:checkbox:checked').length > 0) {
        $('#rest-checkbox-edit-helper').text('');
        ready = true && ready;
    } else {
        $('#rest-checkbox-edit-helper').text('Please select at least a cuisine.');
        ready = false;
    }

    // Check if the resutant name is between 5 and 25 characters.
    if ($('#rest-name-update').val().length >= 5 && $('#rest-name-update').val().length <= 25) {
        $('#rest-name-edit-helper').text('');
        ready = true && ready;
    } else {
        ready = false;
        $('#rest-name-edit-helper').text('The restaurant name should be between 5 and 25 characters in length.');
    }

    // Check if the restaurant address is between 5 and 30 characters.
    if ($('#rest-loc-update').val().length >= 5 && $('#rest-loc-update').val().length <= 30) {
        $('#rest-loc-edit-helper').text('');
        ready = true && ready;
    } else {
        $('#rest-loc-edit-helper').text('The restaurant address should be between 5 and 30 characters.');
        ready = false;
    }

    if (ready) {
        $.ajax({
            url: $('#rest-update-form').attr('action'),
            method: 'put',
            data: {
                location: newLocation,
                name: newName,
                cuisine: newCuisine
            },
            success: function (data) {
                // alert(data);
                if (data == 'success') {
                    $('#rest-profile-success').text("Sucessfully update the restaurants profile.");
                    setTimeout(function () {
                        $('#rest-profile-success').text("");
                    }, 2000);
                } else {
                    $('#rest-profile-fail').text("Fail to update the restaurant profile.");
                    setTimeout(function () {
                        $('#rest-profile-fail').text("");
                    }, 2000);
                }
            }
        });
    }
});


// Activate when the user click to update the user password.
$('#user-update-pass-btn').click(function () {
    var oldPassword = $('#user-edit-old-pass').val();
    var newPassword = $('#user-edit-new-pass').val();
    var confirmPassword = $('#user-edit-confirm-pass').val();
    var ready = true;
    $('#user-old-pass-helper').text("");
    $('#user-pass-success').text("");
    $('#user-pass-fail').text("");
    
    if (newPassword.length >= 5 && newPassword.length <= 12) {
        $('#user-new-pass-helper').text("");
        ready = true && ready;
    } else {
        $('#user-new-pass-helper').text("Your password should be between 5 and 12 characters.");
        ready = false;
    }

    if (newPassword == confirmPassword) {
        $('#user-confirm-pass-helper').text("");
        ready = true && ready;
    } else {
        $('#user-confirm-pass-helper').text("Your confirm password does not match");
        ready = false;
    }

    if (ready) {
        $.ajax({
            url: $('#user-update-pass-form').attr('action'),
            method: 'put',
            data: {
                password: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            },
            success: function (data) {
                if (data == 'Invalid Old Password') {
                    $('#user-old-pass-helper').text("Invalid password");
                } else if (data == 'success') {
                    $('#user-pass-success').text("Successfully update the password");
                    setTimeout(function () {
                        $('#user-pass-success').text("");
                    }, 2000);
                } else {
                    $('#user-pass-fail').text("Fail to update the password");
                    setTimeout(function () {
                        $('#user-pass-fail').text("");
                    }, 2000);
                }
            }
        });
    }
});

// Activate when the restaurant click to update the user password.
$('#rest-update-pass-btn').click(function () {
    var oldPassword = $('#rest-edit-old-pass').val();
    var newPassword = $('#rest-edit-new-pass').val();
    var confirmPassword = $('#rest-edit-confirm-pass').val();
    var ready = true;
    $("#rest-old-pass-helper").text("");
    $('#rest-pass-success').text("");
    $('#rest-pass-fail').text("");
    
    if (newPassword.length >= 5 && newPassword.length <= 12) {
        $('#rest-new-pass-helper').text("");
        ready = true && ready;
    } else {
        $('#rest-new-pass-helper').text("Your password should be between 5 and 12 characters.");
        ready = false;
    }

    if (newPassword == confirmPassword) {
        $('#rest-confirm-pass-helper').text("");
        ready = true && ready;
    } else {
        $('#rest-confirm-pass-helper').text("Your confirm password does not match");
        ready = false;
    }

    if (ready) {
        $.ajax({
            url: $('#rest-update-pass-form').attr('action'),
            method: 'put',
            data: {
                password: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            },
            success: function (data) {
                if (data == 'Invalid Old Password') {
                    $('#rest-old-pass-helper').text("Invalid password");
                } else if (data == 'success') {
                    $('#rest-pass-success').text("Successfully update the password");
                    setTimeout(function () {
                        $('#rest-pass-success').text("");
                    }, 2000);
                } else {
                    $('#rest-pass-fail').text("Fail to update the password");
                    setTimeout(function () {
                        $('#rest-pass-fail').text("");
                    }, 2000);
                }
            }
        });
    }
});


// Select regular user sign up form.
$('#user-radio').click(function () {
    $('.restaurant-section').hide();
    $('.user-only').show();
    $('.helper').text('');
    //$('signupform').trigger('reset');
});


// Select restaurant sign up form.
$('#rest-radio').click(function () {
    $('.restaurant-section').show();
    $('.user-only').hide();
    $('.helper').text('');
    // $('#signupform').trigger('reset');
});




$(".rating input:radio").attr("checked", false);
$('.rating input').click(function () {
    $(".rating span").removeClass('checked');
    $(this).parent().addClass('checked');
});

$('input:radio').change(
    function () {
        var userRating = this.value;
    });