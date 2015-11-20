$("signupform").submit(function (e) {
    e.preventDefault();
    var form = this;
    if ($('#password1').val() == $('#password2').val()) {
        form.submit();
    } else {
        alert("Passwords don't match");
    }
});

$('#user-radio').click(function() {
    $('.restaurant-section').hide();
    $('.user-only').show();
});

$('#rest-radio').click(function() {
    $('.restaurant-section').show();
    $('.user-only').hide();
});

