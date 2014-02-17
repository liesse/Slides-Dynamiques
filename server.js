
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = io.listen(server);
var fs = require('fs');
var formidable = require('formidable');
var currentSlideId;
var videosStates;

 // Loading server and static repository definition to include inside it.
app.configure(function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.json());
	app.use(express.urlencoded());
});
app.get('/', function (req, res, next) {
    res.render('./public/index.html');
});
app.post('/public/ppt', function(req, res){
	console.log("new post");

	var form = new formidable.IncomingForm({ 
	  uploadDir: __dirname + '/public/ppt/',  // don't forget the __dirname here
	  keepExtensions: true
	});

    console.log(form.uploadDir);

    form
    .on('error', function(err) {
    	console.log("An error occured");
    	throw err;
    })

    .on('field', function(field, value) {
		//receive form fields here
	})

    /* this is where the renaming happens */
    .on ('fileBegin', function(name, file){
        //rename the incoming file to the file's name
        file.path = form.uploadDir + "/" + file.name;
	})

    .on('file', function(field, file) {
        //On file received
        console.log("new file: " + './ppt/' + file.name);
        preventClients('./ppt/' + file.name); //tell to all clients to update their presentation
    })

    .on('progress', function(bytesReceived, bytesExpected) {
    	//self.emit('progess', bytesReceived, bytesExpected)
    	var percent = (bytesReceived / bytesExpected * 100) | 0;
    	process.stdout.write('Uploading: ' + percent + '%\r');
    })

    .on('end', function() {

    });

    form.parse(req); 

    return;
});
server.listen(8333);

// Attributs
var asRoot = false;
var allClients = 0;
var root;
var slide_currently;
var my_timer;
var TempoPPT;
var tab_client = [];
var arrayMasters = [];
var users = [];

// We define client side file
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/video.html');
});

// Client's connection
socket.on('connection', function (client) {
    "use strict";
    var TempoPseudo;
    
	// After entering a password, the session begin
	client.on('ouvertureSession', function (connection) {
        
        // LNA
        
        
		var user = JSON.parse(connection);
        allClients += 1;

        console.log("new client: " + client.id);
        
        if (user.identifant === "root" && user.password === "pass") {
            asRoot = true;
            arrayMasters.push(user.identifant);
            root = client;
            console.log("Bonjour Didier !");
        }
        
     	// We check if a master exists or not. If it doesn't, we give it the right.
		if (arrayMasters.length === 0 ) {
            arrayMasters.push(user.identifant);
		}
        
		TempoPseudo = user.identifant;
		tab_client.push(TempoPseudo);
    
    	// We send client's tab to users that began connection
		client.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "connexion": TempoPseudo,
            "arrayMasters": arrayMasters,
		}));

		client.emit('activeSlide', currentSlideId);
        
		// We send tab's client to all clients connected
		client.broadcast.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "messageSender": TempoPseudo
		}));
		 
    });

	// Slides management and messages management
	client.on('message', function (message) {
		var newMessage = JSON.parse(message);
		client.broadcast.send(JSON.stringify({
			messageContent: newMessage.messageContent,      // Discussion channel
			messageSender: newMessage.messageSender,    	// pseudo
		}));
	});

	// Broadcast the message to prevent clients that a new presentation is selected by the animator 
	client.on('updateSlide', function () {
		console.log('server receives and broadcast updateSlide');
		client.broadcast.emit('updateSlide');
	});

	client.on('SlideChanged', function (activeSlideId) {
		currentSlideId = activeSlideId;
		client.broadcast.emit('activeSlide', currentSlideId);
	});

	client.on('activeSlideIdRequest', function(){
		client.broadcast.emit('activeSlide', currentSlideId);
	});

	client.on('actionOnVideo', function(data){
		client.broadcast.emit('actionOnVideo', data);
	});

    client.on('requestMaster', function (identifiant) {
        console.log("demande annimateur " + identifiant);
    }); 
    
    client.on('new_message_PersonalChat', function(infos){

    client.on('click', function (eltId) {
        client.broadcast.emit('click', eltId);
    });

	// Executed when a client disconnects
	client.on('disconnect', function () {
		console.log('disconnect ' + TempoPseudo);
		
		if (TempoPseudo) {
			tab_client.splice(tab_client.indexOf(TempoPseudo), 1);
            
        var obj = JSON.parse(infos);
        
        client.broadcast.emit('notification_PersonalChat', JSON.stringify({
         emetteur: obj.emetteur,
         destinataire: obj.destinataire,
         contenu: obj.contenu
        }));
    });
    
});

function preventClients(filePath){
	socket.sockets.emit('updateSlide', filePath);
}
