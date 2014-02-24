
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = io.listen(server);
var fs = require('fs');
var currentSlideId;

 // Loading server and static repository definition to include inside it.
app.configure(function () {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/public/ppt' }));
});
app.get('/', function (req, res, next) {
    res.render('./public/index.html');
});
app.post('/public/ppt', function(req, res){
	fs.renameSync(req.files.newPresentation.path,"./public/ppt/Presentation.html");
	console.log("New presentation uploaded");
	server.emit("nouveau");
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
	
	// Catches video "events" and sending information to all clients 
	client.on('envoiControlVideo', function (video) {
		var obj_video = JSON.parse(video);
		client.broadcast.emit('emettreControlVideo', JSON.stringify({
			pause: obj_video.pause,
			play: obj_video.play,
			toPlay: obj_video.toPlay     // play video on actual "Play" position 
		}));
    });
  
    client.on('requestMaster', function (identifiant) {
        console.log("demande annimateur " + identifiant);
    }); 
    
    client.on('new_message_PersonalChat', function(infos){
            
       var obj = JSON.parse(infos);
        
       client.broadcast.emit('notification_PersonalChat', JSON.stringify({
         emetteur: obj.emetteur,
         destinataire: obj.destinataire,
         contenu: obj.contenu
       }));
    });
    
});
