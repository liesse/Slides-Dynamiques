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
app.post('/public/ppt', function(req, res) {
	console.log("new post");
	var fileName;
	var form = new formidable.IncomingForm( { 
		uploadDir: __dirname + '/public/ppt/',
		keepExtensions: true
	});

	form
	.on('aborted', function() {
	})

	.on('error', function(err) {
		req.resume();
		console.log('request resumed after error');
	})
	
	.on ('fileBegin', function(name, file) {
		// Rename the incoming file to the file's name
		file.path = form.uploadDir + "/" + file.name;
	})

	.on('file', function(field, file) {
		// On file received
		console.log("new file: " + './ppt/' + file.name);
	})

	.on('progress', function(bytesReceived, bytesExpected) {
		var percent = (bytesReceived / bytesExpected * 100) | 0;
		process.stdout.write('Uploading: ' + percent + '%\r');
	})

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
var rootSocketId = "";
var newClientSocketId;
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
		var user = JSON.parse(connection);
		newClientSocketId = client.id;
		allClients += 1;

		if (user.identifant === "root" && user.password === "pass") {
			asRoot = true;
			arrayMasters.push(user.identifant);
			root = client;
			rootSocketId = client.id;
			console.log("Bonjour Didier !");            
		}

		// We check if a master exists or not. If it doesn't, we give it the right.
		if (arrayMasters.length === 0 ) {
			arrayMasters.push(user.identifant);
			rootSocketId = client.id;
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

		if (newClientSocketId != rootSocketId) {
			sendMessage(rootSocketId, 'videoStates_request');
			console.log('Server request videos states to root');
		}

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
		if (newMessage.videosStates) {
			sendData(newClientSocketId, message);
			console.log('videos states sent to client');
		}
		else {		
			client.broadcast.send(JSON.stringify({
				messageContent: newMessage.messageContent,    // Discussion channel
				messageSender: newMessage.messageSender,    	// pseudo
			}));
		}
	});

	// Broadcast the message to prevent clients that a new presentation is selected by the animator 
	client.on('updateSlide', function (filePath) {
		console.log('server receives and broadcast updateSlide');
		//client.broadcast.emit('updateSlide');
		console.log('filePath: ' + filePath);
		alertClients(filePath);
	});

	client.on('SlideChanged', function (activeSlideId) {
		currentSlideId = activeSlideId;
		client.broadcast.emit('activeSlide', currentSlideId);
	});

	client.on('activeSlideIdRequest', function() {
		client.broadcast.emit('activeSlide', currentSlideId);
	});

	client.on('actionOnVideo', function(data) {
		client.broadcast.emit('actionOnVideo', data);
	});

	client.on('requestMaster', function (identifiant) {
		console.log("demande annimateur " + identifiant);
	}); 

	client.on('click', function (eltId) {
		client.broadcast.emit('click', eltId);
	});

	client.on('new_message_PersonalChat', function(infos) {
		var obj = JSON.parse(infos);
		client.broadcast.emit('notification_PersonalChat', JSON.stringify({
			emetteur: obj.emetteur,
			destinataire: obj.destinataire,
			contenu: obj.contenu
		}));
	});

	client.on('allPresentationsList_request', function() {
		var files = fs.readdirSync(__dirname + '/public/ppt/');
		var htmlFiles = [];
		for (var i = 0; i < files.length; i++) {
			if (files[i].split('.').reverse()[0] === "html") {
				htmlFiles.push(files[i]);
			}
		}
		client.emit('allPresentationsList_response', JSON.stringify({files: htmlFiles}));
	});

	// Executed when a client disconnects
	client.on('disconnect', function () {
		console.log('disconnect ' + TempoPseudo);

		if (TempoPseudo) {
			tab_client.splice(tab_client.indexOf(TempoPseudo), 1);

			if (arrayMasters.indexOf(TempoPseudo) !== -1) {
				arrayMasters.splice(arrayMasters.indexOf(TempoPseudo), 1);
				if (arrayMasters.length === 0 && tab_client.length > 0) {
					arrayMasters.push(tab_client[0]);
				}
			}
		}

		allClients -= 1;

		// We send the new client table to all clients
		client.broadcast.send(JSON.stringify({
			"clients": allClients,
			"tab_client": tab_client,
			"deconnexion": TempoPseudo,
			"arrayMasters": arrayMasters
		}));
	});

});

function alertClients(filePath) {
	socket.sockets.emit('updateSlide', filePath);
}

function sendMessage(socketId, messageType) {
	socket.sockets.socket(socketId).emit(messageType);
}

function sendData(socketId, data) {
	socket.sockets.socket(socketId).send(data);
}
