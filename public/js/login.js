/* Globals variables */
var master = false;
var identifiant;
var password;
var socket;
var token;

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
        identifiant = $('#identifiant').val();
        password = $('#password').val();
        $.post('/login', {
            type: 'POST',
            data: {
                identifiant: identifiant,
                password: password
            }
        }).done(function (result) {
            sessionStorage.setItem('token', result.token);
            document.location.href = "/index.html";
        });
    });
});
