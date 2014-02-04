
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = io.listen(server);

 // Loading server and static repository definition to include inside it.
app.configure(function () {
    app.use(express.static(__dirname + '/public'));
});
app.get('/', function (req, res, next) {
    res.render('./public/index.html');
});
app.post('/public/ppt', function(req, res){
	fs.renameSync(req.files.a.path,"./public/ppt/Presentation.html");
	console.log("New presentation uploaded");
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
    
	// After enter a password, we begin the session
	client.on('ouvertureSession', function (connect) {
		var obj_connect = JSON.parse(connect);
        allClients += 1;
        
        if (obj_connect.identifant === "root" && obj_connect.password === "pass") {
            asRoot = true;
            arrayMasters.push(obj_connect.identifant);
            root = client;
            console.log("Bonjour Didier !");
        }
        
     // We check if a master exists or not. If it doesn't, we give it the right.
		if (arrayMasters.length === 0 || obj_connect.master) {
            arrayMasters.push(obj_connect.identifant);
		}
        
		TempoPseudo = obj_connect.identifant;
		tab_client.push(TempoPseudo);
		
    // We send client's tab to users that began connection
		client.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "connexion": TempoPseudo,
            "arrayMasters": arrayMasters,
            le_slide : slide_currently,
            ppt: TempoPPT
		}));
        
		// We send tab's client to all clients connected
		client.broadcast.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "pseudo": TempoPseudo
		}));
		 
    });

	
	// Slides management and messages management
	client.on('message', function (data) {
		var obj_client = JSON.parse(data);
		slide_currently = obj_client.slide;
		
		client.broadcast.send(JSON.stringify({
			le_next: obj_client.suivant,
			le_prev: obj_client.precedant,
			le_first: obj_client.premier,
			le_last: obj_client.dernier,
			le_msg: obj_client.message,      // Discussion channel
			le_pseudo: obj_client.pseudo,    // pseudo
			le_slide: obj_client.slide,      // Slide "id"
			url: obj_client.url
		}));
	});
	
	// Catches "id" of clicked element and sending "id" to all clients
	client.on('envoiRefObjetHtml', function (idtempo) {
		client.broadcast.emit('recupObjetHtml', idtempo);
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
