
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
var slide_currently;
var TempoPPT;
var master = false;


// On definie le fichier client
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});


// Connection d'un client
socket.on('connection', function (client) {
	allClients ++;
	var TempoPseudo;
	var TempoMaster;
	
	// Apres avoir saisie son speudo on ouvre la session
	client.on('ouvertureSession', function (connect) {
	
		console.log("Ouverture Session");

		var obj_connect = JSON.parse(connect);
		console.log("LE ppt : " + obj_connect.ppt);
        
        // On verifie si un master existe deja sinon, comme il n'existe pas, on lui attribue le droit
		if (obj_connect.master && master == false) {
			master = true;
			TempoMaster = obj_connect.master;
			TempoPseudo = obj_connect.identifant + " [master]";
			if (obj_connect.ppt) { 
				TempoPPT = obj_connect.ppt;
            }
		} else {
			TempoPseudo = obj_connect.identifant;
        }
			
		tab_client.push(TempoPseudo); 
		
        // On envoi la nouvelle tab de client a l'utilisateur qui demande la connection
		client.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "connexion":TempoPseudo,
            le_slide : slide_currently,
            ppt: TempoPPT,
            master: TempoMaster
		}));
        
		// On envoi la nouvelle tab de client a tous les clients connectes
		client.broadcast.send(JSON.stringify({
            "clients": allClients,
            "tab_client": tab_client,
            "pseudo": TempoPseudo
		}));
		 
    });

	
	// Reception d'un message pour la gestion des slide et l'envoi au poste esclave
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
			if (TempoPseudo.indexOf("[master]") != -1) {
				master = false;
            }
		}
        
		allClients -= 1;
        
        // On renvoi la nouvelle table de client a tous les clients
		client.broadcast.send(JSON.stringify({
		  "clients": allClients,
		  "tab_client": tab_client,
		  "deconnexion": TempoPseudo
		}));
		
	});
});