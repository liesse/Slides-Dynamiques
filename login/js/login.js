$(document).ready(function () {
    "use strict";

    // This event allow users' connection by simply Enter
    $('#password').keypress(function(e) {
        if (e.keyCode === 13) {
            $("#identification").click();
        }
    });
    
    // When the user click on the login button
    $("#identification").click(function (e) {
        e.preventDefault();
        $.post('/login', {
            identifiant: $('#identifiant').val(),
            password: $('#password').val()
        }).done(function (result) {
            sessionStorage.setItem('token', result.token);
            document.location.href = "/index.html";
        });
    });
});
