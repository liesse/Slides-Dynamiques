// Include all necessary packages for HTTPS

var socketio_jwt = require('socketio-jwt'),
    fs = require('fs'),
    sslOptions = {
        key: fs.readFileSync('ssl_layer/server.key'),
        cert: fs.readFileSync('ssl_layer/server.crt'),
        ca: fs.readFileSync('ssl_layer/ca.crt'),
        requestCert: true
    },
    formidable = require('formidable'),
    jwt = require('jsonwebtoken'),
    jwt_secret = 'knkninnfsf,;sdf,ozqefsdvsfdbsnoenerkls,d;:',
    app = require('express')(),
    http = require('http').createServer(app),
    server = require('https').createServer(sslOptions, app),
    socket = require('socket.io').listen(server),
    express = require('express');


// Attributs
var nbUsers = 0,
    slide_currently,
    my_timer,
    TempoPPT,
    newClientSocketId,
    currentSlideId,
    videosStates,
    rootSocketId = "",
    currentPresentation = "",
    clientTokens = [],
    users = [],             // contains all connected clients
    masters = [],           // contains the master who has all controls on presentation
    tab_pseudo_socket = []; // contains all pseudo and their socket id (used to contact specific user when necessary)


// Config for Express, set static folder and add middleware
app.configure(function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(app.router);
});

// Routes for Express
app.get('/', function (req, res, next) {
  	res.redirect('/index.html');
});

app.get('/login.html', function (req, res, next) {
    res.redirect('/index.html');
});

app.post('/login', function (req, res) {
    var user = {
    	identifiant: req.body.identifiant,
    	password: req.body.password
    };

    console.log(user.identifiant + ' ' + user.password);
    if (user.identifiant === 'root' &&  user.password === 'lkp' && users.indexOf(user.identifiant) === -1) {
        var token = jwt.sign(user, jwt_secret, { expiresInMinutes: 60*5 });
        res.json({token: token, isMaster: true});
        rootToken = token;
    } else if (user.identifiant !== undefined &&  user.password === 'comete' && users.indexOf(user.identifiant) === -1) {
        var token = jwt.sign(user, jwt_secret, { expiresInMinutes: 60*5 });
        res.json({token: token, isMaster: false});
    } else {
       console.log("client rejected");
       res.json({rejected: true});
    }
});

app.get('/index.html', function (req, res, next) {
    if (req.headers.token !== undefined) {
        // User is authenticated, let him in
    	console.log('request accepted');
    	res.sendfile('./public/views/index.html');
    } else {
        // Otherwise we redirect him to login form
    	console.log('not authenticated, request rejected');
    	res.redirect("/login.html");
  	}
});

// TODO : test if auth
app.get('/upload.html', function (req, res, next) {
    res.sendfile('./public/views/upload.html');
});

// TODO : test if auth
app.get('/PersonalChat.html', function (req, res, next) {
    res.sendfile('./public/views/PersonalChat.html');
});

// Events for uploading new presentations
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

server.listen(8333, function () {
  console.log('listening on https://127.0.0.1:8333');
});

// Client's connection
socket.on('connection', function (client) {
	"use strict";
    var user;

	// After entering a password, the session begin
	client.on('ouvertureSession', function (connection) {
		user = JSON.parse(connection);
		newClientSocketId = client.id;
        nbUsers += 1;

		if (rootToken === user.token || masters.length === 0) {
			rootToken = user.token;
			rootSocketId = client.id;
            masters.push(user.identifiant);
        }

		users.push(user.identifiant);
        tab_pseudo_socket[user.identifiant] = client.id;

		// We send client's tab to users that began connection
		client.send(JSON.stringify({
			"clients": nbUsers,
			"users": users,
			"connexion": user.identifiant,
			"masters": masters
		}));

		
		if (newClientSocketId != rootSocketId && currentPresentation != "") {
			client.emit('updateSlide', currentPresentation, currentSlideId);
		}

		// We send tab's client to all clients connected
		client.broadcast.send(JSON.stringify({
			"clients": nbUsers,
			"users": users,
			"messageSender": user.identifiant
		}));
	});

	// Slides management and messages management
	client.on('message', function (message) {
		var newMessage = JSON.parse(message);
		client.broadcast.send(JSON.stringify({
			messageContent: newMessage.messageContent,      // Discussion channel
			messageSender: newMessage.messageSender     	// pseudo
		}));
	});

	// Broadcast the message to prevent clients that a new presentation is selected by the animator 
	client.on('updateSlide', function (filePath, activeSlideIndex) {
		console.log('server receives and broadcast updateSlide');
		console.log('filePath: ' + filePath);
		currentPresentation = filePath;
		currentSlideId = activeSlideIndex;
		client.broadcast.emit("updateSlide",currentPresentation, activeSlideIndex);
	});

	client.on('SlideChanged', function (activeSlideId) {
		currentSlideId = activeSlideId;
		client.broadcast.emit('activeSlide',currentSlideId);
	});
	
	client.on('videoStates_request', function() {
		sendMessage(rootSocketId, 'videoStates_request');
		console.log('root: ' + rootSocketId);
		console.log('****Server requested videos states to root');
	});
	
	client.on('activeSlide_request', function() {
		client.emit('updateSlide', currentPresentation, currentSlideId);
	});
	
	client.on('videoStates', function(data) {
		console.log('videoStates server: ' + data);
        socket.sockets.socket(newClientSocketId).emit('videoStates', data);
	});

    client.on('actionOnVideo', function(data) {
    	if (client.id !== rootSocketId) { // ignore message if the sender is not the root
			console.log('message ignored');
			return;
		}
		client.broadcast.emit('actionOnVideo', data);
	});

	client.on('requestMaster', function (identifiant) {
		console.log("demande animateur " + identifiant);
	}); 

	client.on('click', function (eltId) {
		client.broadcast.emit('click', eltId);
	});

    // Event that both warn recipient of a new message and check recicpient's disponibility
	client.on('new_message_PersonalChat', function(infos){
       var obj = JSON.parse(infos);
        
       socket.sockets.socket(tab_pseudo_socket[obj.destinataire]).emit('notification_PersonalChat', JSON.stringify({
         emetteur: obj.emetteur,
         destinataire: obj.destinataire,
         contenu: obj.contenu
       }));
        
      socket.sockets.socket(tab_pseudo_socket[obj.destinataire]).emit('test_presence', JSON.stringify({
         emetteur: obj.emetteur,
         contenu: obj.contenu
       }));
    });
    
    // Event that update the tab that contains all opened recipient windows (to keep at date notification)
    client.on('MAJ_tab_windows_opened', function(infos){
        var obj = JSON.parse(infos);
       
        socket.sockets.socket(tab_pseudo_socket[obj.emetteur]).emit('MAJ_tab_windows_opened', JSON.stringify({
           destinataire: obj.destinataire          
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
        if (user === undefined || user.identifiant === undefined || users.indexOf(user.identifiant) === -1) {
            console.log('disconnect of a user of an older server');
            user = {identifiant: ""};
        } else {
            console.log('disconnect ' + user.identifiant);
            users.splice(users.indexOf(user.identifiant), 1);
            nbUsers -= 1;

            if (masters.indexOf(user.identifiant) !== -1) {
                masters.splice(masters.indexOf(user.identifiant), 1);
                if (masters.length === 0 && users.length > 0) {
                    masters.push(users[0]);
                    //must update rootToken and rootSocketId
                }
            }

            // We send the new client table to all clients
            client.broadcast.send(JSON.stringify({
                "clients": nbUsers,
                "users": users,
                "masters": masters
            }));
        }
	});
});

function alertClients(filePath, activeSlideIndex) {
	socket.broadcast.emit('updateSlide', filePath, activeSlideIndex);
}

function sendMessage(socketId, messageType) {
	socket.sockets.socket(socketId).emit(messageType);
}

function sendData(socketId, data) {
	socket.sockets.socket(socketId).send(data);
}
