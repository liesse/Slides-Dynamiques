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

    function connect_socket(token) {
        socket = io.connect('', {
            query: 'token=' + token
        });
    
        socket.emit('ouvertureSession', JSON.stringify({
            identifant: mon_identifiant,
            password: password,
            socketId: socket.id
        }));
    
        socket.on('time', function (data) {
            console.log('- broadcast: ' + data);
        }).on('authenticated', function () {
            console.log('- authenticated');
        }).on('disconnect', function () {
            console.log('- disconnected');
        });
    }

    socket.on('pong', function () {
        console.log('- pong');
    }).on('time', function (data) {
        console.log('- broadcast: ' + data);
    }).on('authenticated', function () {
        console.log('- authenticated');
    }).on('disconnect', function () {
        console.log('- disconnected');
    });

    connect(); //connect now, it will drop

    $('#ping').on('click', function () {
        console.log('- ping');
        socket.emit('ping');
    });

});
