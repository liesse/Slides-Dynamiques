// Include all necessary packages
var socketio_jwt = require('socketio-jwt'),
    fs = require('fs'),
    formidable = require('formidable'),
    jwt = require('jsonwebtoken'),
    jwt_secret = 'knkninnfsf,;sdf,ozqefsdvsfdbsnoenerkls,d;:',
    app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    express = require('express');

// Attributs
var asRoot = false,
    allClients = 0,         // number of all connected users
    slide_currently,
    my_timer,
    TempoPPT,
    tab_client = [],        // contains all connected clients
    arrayMasters = [],      // contains the master who has all controls on presentation
    rootToken,
    clientTokens = [],
    rootSocketId = "",
    newClientSocketId,
    tab_pseudo_socket = [], // contains all pseudo and their socket id (used to contact specific user when necessary)
    currentSlideId,
    videosStates;

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
   console.log('token: ' + sessionStorage.getItem('token'));
    res.redirect('/index.html');
});

app.post('/login', function (req, res) {
    var user = {
    	identifiant: req.body.identifiant,
    	password: req.body.password
    };

    console.log(user.identifiant + ' ' + user.password);
    if (user.identifiant === 'root' &&  user.password === 'lkp') {
        // We are sending the profile inside the token
        var token = jwt.sign(user, jwt_secret, { expiresInMinutes: 60*5 });
        res.json({token: token, isMaster: true});
        rootToken = token;
    } else if (user.identifiant !== undefined &&  user.password === 'comete'){
    	// We are sending the profile inside the token
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
    	console.log('index.html sent');
    } else {
        // Otherwise we redirect him to login form
    	console.log('not authenticated, request rejected');
    	res.redirect("/login.html");
  	}
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
  console.log('listening on http://localhost:8333');
});


// Client's connection
io.on('connection', function (client) {
	"use strict";
    var user;

	// After entering a password, the session begin
	client.on('ouvertureSession', function (connection) {
		user = JSON.parse(connection);
		newClientSocketId = client.id;
        allClients += 1;

		if (rootToken === user.token || arrayMasters.length === 0) {
			asRoot = true;
			rootToken = user.token;
			rootSocketId = client.id;
            arrayMasters.push(user.identifiant);
            client.emit('setMaster', true);
		}

		tab_client.push(user.identifiant);
        tab_pseudo_socket[user.identifiant] = client.id;

		// We send client's tab to users that began connection
		client.send(JSON.stringify({
			"clients": allClients,
			"tab_client": tab_client,
			"connexion": user.identifiant,
			"arrayMasters": arrayMasters
		}));

        client.emit('login_success');
		client.emit('activeSlide', currentSlideId);

		if (newClientSocketId !== rootSocketId) {
            console.log('Server request videos states to root');
            io.sockets.socket(rootSocketId).emit('videoStates_request');
		}

		// We send tab's client to all clients connected
		client.broadcast.send(JSON.stringify({
			"clients": allClients,
			"tab_client": tab_client,
			"messageSender": user.identifiant
		}));
	});

	// Slides management and messages management
	client.on('message', function (message) {
		var newMessage = JSON.parse(message);
		if (newMessage.videosStates) {
			console.log('videos states sent to client');
            io.sockets.socket(newClientSocketId).send(message);
		}
		else {		
			client.broadcast.send(JSON.stringify({
				messageContent: newMessage.messageContent,      // Discussion channel
				messageSender: newMessage.messageSender     	// pseudo
			}));
		}
	});

	// Broadcast the message to warn clients that a new presentation is selected by the animator 
	client.on('updateSlide', function (filePath) {
		console.log('server receives and broadcast updateSlide');
		//client.broadcast.emit('updateSlide');
		console.log('filePath: ' + filePath);
        io.sockets.emit('updateSlide', filePath)
	});

	client.on('SlideChanged', function (activeSlideId) {
		currentSlideId = activeSlideId;
		client.broadcast.emit('activeSlide', currentSlideId);
	});

	client.on('activeSlideIdRequest', function() {
		client.broadcast.emit('activeSlide', currentSlideId);
	});

    /*
	client.on('actionOnVideo', function(data) {
		client.broadcast.emit('actionOnVideo', data);
	});
    */
    
	client.on('requestMaster', function (identifiant) {
		console.log("demande annimateur " + identifiant);
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
	client.on('disconnect', function (){
		console.log('disconnect ' + user.identifiant);

		if (user.identifiant) {
			tab_client.splice(tab_client.indexOf(user.identifiant), 1);

			if (arrayMasters.indexOf(user.identifiant) !== -1) {
				arrayMasters.splice(arrayMasters.indexOf(user.identifiant), 1);
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
			"deconnexion": user.identifiant,
			"arrayMasters": arrayMasters
		}));
	});

});