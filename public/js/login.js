/* Globals variables */
var TempoMaster = false;
var master = false;
var mon_identifiant;
var password;
var socket;
var slideControlContainer;
var containers;
var currentSlide = 0;
var tab_windows_opened = []; // this tab contains all pseudos of all opened windows 
var messages_history = []; // This tab contains history of all opened windows. 
var presentationsList = [];
var token;

$(document).ready(function () {
    "use strict";

    var token, socket;
    
    $("#identification").click(function (e) {
        console.log("entré dans le controlleur du boutton");
        e.preventDefault();
        mon_identifiant = $('#identifiant').val();
        password = $('#password').val();
        console.log(mon_identifiant + " " + password);
        $.post('/login', {
            type: 'POST',
            data: {
                identifiant: mon_identifiant,
                password: password
            }
        }).done(function (result) {
            connect_socket(result.token);
        });
    });

    // This event allow users' connection by simply Enter
    $("#identifiant").keypress(function(e) {    
        if(e.keyCode == 13) {
         $("#identification").click();
        }
    });
    
    function connect_socket(token) {
        sessionStorage.setItem('token', token);
        socket = io.connect('', {
            query: 'token=' + token
        });
    
        socket.emit('ouvertureSession', JSON.stringify({
            identifant: mon_identifiant,
            password: password,
            socketId: socket.id
        }));
      
        socket.on('login_success', function(data) {
            document.location.href = "/index.html";
        }).on('time', function (data) {
            console.log('- broadcast: ' + data);
        }).on('authenticated', function () {
            console.log('- authenticated');
        }).on('disconnect', function () {
            console.log('- disconnected');
        });
    }
});
