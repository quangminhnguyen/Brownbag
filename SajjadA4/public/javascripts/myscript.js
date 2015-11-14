$("#signupform").submit(function(e){
  e.preventDefault();
  var form = this;
  console.log('one is '  + $('input[name=password]').val());
  console.log('one is '  + $('input[name=confirmPassword]').val());
  if ($('#password1').val() == $('#password2').val()) {
    form.submit();
  } else {
    alert("Passwords don't match");
  }
});
