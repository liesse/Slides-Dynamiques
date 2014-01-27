
var io = require('socket.io');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var socket = io.listen(server);

 // Chargement du serveur et definition du dossier static a inclure dans le serveur
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});
app.get('/', function(req, res, next) {
  res.render('./public/index.html');
});
server.listen(8333);
 
 
// Attributs
var my_timer;
var allClients = 0;
var tab_client = new Array();
var arrayMasters = new Array();
var slide_currently;
var TempoPPT;
var root = false;

// On definie le fichier client
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});


// Connection d'un client
socket.on('connection', function (client) {
    var TempoPseudo;
    
	// Apres avoir saisie son pseudo on ouvre la session
	client.on('ouvertureSession', function (connect) {
		var obj_connect = JSON.parse(connect);
        allClients ++;
        
        if ( obj_connect.identifant == "desiderius" && obj_connect.password == "linux") {
            root = true;
            arrayMasters.push(obj_connect.identifant);
            console.log("Bonjour Didier !");
        }
        
        // On verifie si un master existe deja sinon, comme il n'existe pas, on lui attribue le droit
		if (arrayMasters.length == 0 || obj_connect.master) {
            arrayMasters.push(obj_connect.identifant);
		}
        
		TempoPseudo = obj_connect.identifant;
		tab_client.push(TempoPseudo);
		
        // On envoi la nouvelle tab de client a l'utilisateur qui a demandé la connection
		client.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "connexion":TempoPseudo,
            "arrayMasters": arrayMasters,
            le_slide : slide_currently,
            ppt: TempoPPT,
		}));
        
		// On envoi la nouvelle tab de client a tous les clients connectes
		client.broadcast.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "pseudo": TempoPseudo
		}));
		 
    });

	
	// Reception d'un message pour la gestion des slides et l'envoi au poste esclave
	client.on('message', function (data) {
		var obj_client = JSON.parse(data);
		slide_currently = obj_client.slide;
		
		client.broadcast.send(JSON.stringify({
			le_next: obj_client.suivant,
			le_prev: obj_client.precedant,
			le_first: obj_client.premier,
			le_last: obj_client.dernier,
			le_msg: obj_client.message,      // channel de discution
			le_pseudo: obj_client.pseudo,    // pseudo
			le_slide: obj_client.slide,      // id du SLide
			url: obj_client.url
		}));  
	});
	
	// Reception de l'id de l'element clique et on envoi l'id a tous les clients
	client.on('envoiRefObjetHtml', function (idtempo) {
		client.broadcast.emit('recupObjetHtml', idtempo);
    });
	
	// Reception d'un traitement video et l'envoi a tous les clients
	client.on('envoiControlVideo', function (video) {
		var obj_video = JSON.parse(video);
		client.broadcast.emit('emettreControlVideo', JSON.stringify({
			pause: obj_video.pause,
			play: obj_video.play, 
			toPlay: obj_video.toPlay     // jouer la video sur position de lecture saisie
		}));
    });


	// Lors de la deconnexion d'un client
	client.on('disconnect', function () {
		console.log('disconnect ' + TempoPseudo);
		
		if (TempoPseudo) {
			tab_client.splice(tab_client.indexOf(TempoPseudo), 1);
            
            if (arrayMasters.indexOf(TempoPseudo) != -1) {
                arrayMasters.splice(arrayMasters.indexOf(TempoPseudo), 1);
                if (arrayMasters.length == 0 && tab_client.length > 0) {
                    arrayMasters.push(tab_client[0]);
                }
            }
		}
        
		allClients -= 1;
        
        // On renvoi la nouvelle table de client a tous les clients
		client.broadcast.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "deconnexion": TempoPseudo,
            "arrayMasters": arrayMasters
		}));
		
	});
});