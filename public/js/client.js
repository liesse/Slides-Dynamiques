
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

$(document).ready(function () {
    "use strict";
    socket = io.connect();

	// Executed after authentication, this event allows users' register in order to warn the server of new user
    $("#identification").click(function () {
        if ($("#identifiant").val() !== "") {
            $('#identification').unbind('click');
            $(".img-loading").css("visibility", "visible");
            mon_identifiant = $("#identifiant").val();
            password = $("#password").val();

            socket.emit('ouvertureSession', JSON.stringify({
                identifant: mon_identifiant,
                password: password,
                socketId: socket.id
            }));

            $("#menu-pseudo").html("Bonjour " + mon_identifiant);
        }
    });
    
    $("#identifiant").keypress(function(e) {
        
        if(e.keyCode == 13) {
         $("#identification").click();
        }
    });
    
    $("#deconnexion").click(function(){
        socket.disconnect();
        document.location.href="index.html"
    });

	// Function that check if we are really loading an html presentation
    $("#img-select").click(function () {
        $("#hiddenfile").click();
        $("#hiddenfile").change(function () {
            if ($("#hiddenfile").val().split('.').reverse()[0] === "html") {
                $("#selected-Slide").val($("#hiddenfile").val());
            }
        });
    });

    // Allow animators to run another presentation
    $("#bouton-selectPPT").click(function () {
        setPresentationsList();
        var w = window.open('upload.html', 'popUpWindow', 'height=200, width=400, left=10, top=10, resizable=no, scrollbars=yes, toolbar=no, menubar=no, location=no, directories=no, status=yes');
        w.focus();
    });

    // Management of received messages (validity treatment, Retrieval of datas, DOM manipulation) 
    socket.on('message', function (message) {
        var newMessage = jQuery.parseJSON(message);
       
        if (newMessage.clients) {
            document.getElementById("cadre-menu-droite").innerHTML = "<p><strong>" + (newMessage.clients-1) + " utilisateur(s) connecté(s):</strong></p>";
            for(var i=0; i < newMessage.tab_client.length; i++) {
                if(newMessage.tab_client[i] != mon_identifiant) {               
                    document.getElementById("cadre-menu-droite").innerHTML += "<p class='users' onclick='lancerChat(this);'>" + newMessage.tab_client[i] + "</p>";
                }
            } 
        }

        if (newMessage.messageContent) { // Treatment of discussion messages
            $("#message ul").append("<li>(" + newMessage.messageSender + "): " + newMessage.messageContent + "</li>");
            $("#message").scrollTop(100000);

            // Panel notification (blinking red)
            if ($("#cadre-menu").css("margin-Left") === "0px") {
                var nbNewMessage;
                if ($('#bouton-menu').html()) {
                    nbNewMessage = parseInt($('#bouton-menu b').html()) + 1;
                } else {
                    nbNewMessage = 1;
                }
                $('#bouton-menu').html("(<b>" + nbNewMessage + "</b>)");
            }
        }

        else if (newMessage.videosStates) {
            videosStates(newMessage.videosStates);
        } 

        else {
            var ma_liste = "";
            var i;

            for (i = 0; i < newMessage.tab_client.length; i += 1) {
                ma_liste += "<li>" + newMessage.tab_client[i] + "</li>";
            }
            
            $('#cadre-user ul').html(ma_liste); 			// Update pseudos list
            $('#clients').text(newMessage.clients);   // Display the number of connected users

            if (newMessage.connexion) {
                $("#message ul").append("<li><font color='green'>(" + newMessage.connexion + ") s'est connect&#233;</font> </li>");
                var timeLoad = 200;

                setTimeout(function() {
                    $("#div_connection").hide();
                    $("#overlay").hide();
                }, timeLoad);
            }
            
            // Become an animator if the server tell us.
            if (newMessage.arrayMasters) {
                if (newMessage.arrayMasters.indexOf(mon_identifiant) === -1) {
                    setMaster(false);
                } else {
                    setMaster(true);
                }
            }

            if (newMessage.messageSender) {
                $("#message ul").append("<li><font color='green'>(" + newMessage.messageSender + ") s'est connect&#233;</font> </li>");
            }
            
            if (newMessage.deconnexion) {
                $("#message ul").append("<li><font color='red'>(" + newMessage.deconnexion + ") s'est d&#233connect&#233;</font> </li>");
            }
        }
    });

    // Slaves receive slide "id" of the click element on master computer, then we simulate "the click" on slaves computers.
    socket.on('click', function (eltId) {
        console.log("**click " + eltId);
        $($('#notre_frame').contents()).find(eltId).click();
    });
    
    socket.on('activeSlide', function(activeSlideId) {
        if (activeSlideId !== null) {
            var slide = $($('#notre_frame').contents()).find('#' + activeSlideId);
            $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr('smil', 'idle');
            slide.attr('smil', 'active');
        }
    });

    // Functions that are presents below allow to retrieve events on master computer and then sends informations to slaves computer.
    socket.on('updateSlide', function(filePath) {
        console.log('***client receives updateSlide');
        updateSlide(filePath);
    });
    
    // Test if the window is open or not. If not, we underline the name on the connected user panel
    socket.on('test_presence', function(infos){
                        
        var obj = JSON.parse(infos);
         
        messages_history[obj.emetteur] = "<p class='destinataire'>" + obj.contenu + "</p>";
        
        for(var i=0; i <tab_windows_opened.length; i++) {
            
            if(tab_windows_opened[i] === obj.emetteur) {
                return;
            }
        }
        
        // The pseudo window is closed client side, we underline it on orange
        var tab_p = document.getElementsByClassName('users');
        for(var i=0; i < tab_p.length; i++){
            
            if(tab_p[i].innerHTML === obj.emetteur){
                tab_p[i].style.backgroundColor = "orange";
            }
        }
    });
    
    socket.on('MAJ_tab_windows_opened', function(infos){
                        
        var obj = JSON.parse(infos);
        
        for(var i in tab_windows_opened){
            if(tab_windows_opened[i] == obj.destinataire){
                delete tab_windows_opened[i];
            }
        }
    });

    socket.on('allPresentationsList_response', function (data) {
        var files = jQuery.parseJSON(data).files;
        presentationsList = [];
        for (var i = 0; i < files.length; i++) {
            presentationsList.push(files[i]);
        }
    });

    // Going to the next slide
    $("#next1").click(function () {
        if (master) {
            pauseAllVideos(); //Pause playing videos when changing slide
            $($('#notre_frame').contents()).find("#next").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

	// Going on the previous slide
    $("#prev1").click(function () {
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#prev").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

	// Going at the beginning of this presentation
    $("#first1").click(function () {
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#first").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

	// Going at the end of this presentation
    $("#last1").click(function () {
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#last").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

    $("#notre_frame").load(function() {
        $($('#notre_frame').contents()).find('#navigation_par').hide();
        $($('#notre_frame').contents()).find('#slideshow div').click(function(event) {
            if (master && (event.target.nodeName !== "VIDEO")) {
                socket.emit('click', getSelector($(this)));
            }
        });
        initVideo();
    });

});

// Load a new presentation selected by the animator
function updateSlide(filePath) { 
    $('#notre_frame').attr('src', filePath);
}

// Allow to forbid special characters for the pseudo
function special_caract(evt) {
    "use strict";
    var keyCode = evt.which ? evt.which : evt.keyCode;
    if (keyCode === 9) {
        return true;
    }
    var interdit = 'ààâäãçéèêëìîïòôöõµùûüñ &\?!:\.;,\t#~"^¨@%\$£?²¤§%\*()[]{}-_=+<>|\\/`\'';
    if (interdit.indexOf(String.fromCharCode(keyCode)) >= 0) {
        return false;
    }
}

// Allow to set a new master if he's not and the contrary delete master privilege if he's not.
function setMaster(isMaster) {
    "use strict";
    if (isMaster) {
        master = true;
        initVideo();
        $("#menu-control").show();
        $("#bouton-selectPPT").show();
    } else {
        master = false;
        initVideo();
        $("#menu-control").hide();
        $("#bouton-selectPPT").hide();
    }
}

// Display a div structure in order to chat with someone
function lancerChat(pseudo) {
    var myWindow = window.open("PersonalChat.html",pseudo.innerHTML,"width=400,height=400");
    myWindow.mon_identifiant = mon_identifiant;
    myWindow.destinataire = pseudo.innerHTML;
    myWindow.socket = socket;
    myWindow.historique = '';
    //messages_history[myWindow.destinataire] = '';
    
    tab_windows_opened.push(myWindow.destinataire);  

    var tab_p = document.getElementsByClassName('users');
    for(var i=0; i < tab_p.length; i++){
        
        if(tab_p[i].innerHTML == myWindow.destinataire && tab_p[i].style.backgroundColor == "orange"){
            tab_p[i].style.backgroundColor = "white";
            myWindow.historique = messages_history[myWindow.destinataire];
        }
    }
 }


function getCurrentSlideId() {
    return $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id");
}

function getSelector(elt) {
    var selector = elt.parents()
                    .map(function() { return this.tagName; })
                    .get().reverse().join(" ");

    if (selector) { 
      selector += " " + elt[0].nodeName;
    }

    var id = elt.attr("id");
    if (id) { 
      selector += "#" + id;
    }

    var classNames = elt.attr("class");
    if (classNames) {
      selector += "." + $.trim(classNames).replace(/\s/gi, ".");
    }

    return selector;
}

function pauseAllVideos() {
    var videos = $($('#notre_frame').contents()).find('#' + getCurrentSlideId() + ' video');
    videos.each(function() {
        $(this)[0].pause();
    });
}

function setPresentationsList() {
    socket.emit('allPresentationsList_request');
}

function getPresentationsList() {
    return presentationsList;
}

function alert_server(filePath) {
    socket.emit('updateSlide', filePath);
}