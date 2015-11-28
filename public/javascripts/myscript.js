var MAIL_VALID_REX = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;

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
        
        if ($('#input-location').val().length > 0 && $('#input-location').val().length <= 30) {
            $('#location-helper').text('');
            ready = true && ready;
        } else {
            $('#location-helper').text('The restaurant location should not be empty and should not exceed 30 characters.');
            ready = false;
        }
    }
    
    if (ready == true) {
        form.submit();
    }
});

$('#user-radio').click(function() {
    $('.restaurant-section').hide();
    $('.user-only').show();
    $('.helper').text('');
    //$('signupform').trigger('reset');
});

$('#rest-radio').click(function() {
    $('.restaurant-section').show();
    $('.user-only').hide();
    $('.helper').text('');
    // $('#signupform').trigger('reset');
});





