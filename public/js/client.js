/* Globals variables */
var master = false,
    identifiant,
    password,
    socket = io.connect('http://localhost:8333'), //socket = io.connect('https://localhost:8333',{secure: true});
    slideControlContainer,
    containers,
    currentSlide = 0,
    tab_windows_opened = [],    // This tab contains all pseudos of all opened windows
    messages_history = [],      // This tab contains history of all opened windows
    presentationsList = [],     // This tab contains all presentation already upload on the server
    token;

$(document).ready(function () {
    "use strict";
    //setMaster(sessionStorage.getItem('isMaster'));
    identifiant = sessionStorage.getItem('identifiant');

    /**
     * Open the socket with the token built by login process
     */
    token = sessionStorage.getItem('token');
    socket.emit('ouvertureSession', JSON.stringify({
        token: token,
        identifiant: identifiant
    }));
    
    /**
     * This event allow users (master or salves) to properly disconnect from the server.
     * After that, the user is redirected on log in page.
     */
    $("#deconnexion").click(function(){
        socket.disconnect();
        sessionStorage.setItem('token', '');
        document.location.href="/login.html"
    });
        
	// Event that check if we are really loading an html presentation
    $("#img-select").click(function () {
        $("#hiddenfile").click();
        $("#hiddenfile").change(function () {
            if ($("#hiddenfile").val().split('.').reverse()[0] === "html") {
                $("#selected-Slide").val($("#hiddenfile").val());
            }
        });
    });

    /**
     * This event allows animator to run another presentation as he wants
     * A button on the top left-hand corner has been specially placed. 
     */
    $("#bouton-selectPPT").click(function () {
        setPresentationsList();
        var w = window.open('upload.html', 'popUpWindow', 'height=200, width=400, left=10, top=10, resizable=no, scrollbars=yes, toolbar=no, menubar=no, location=no, directories=no, status=yes');
        w.focus();
    });

    /**
     * Management of received messages and DOM insertion, modification, deletion
     *    --> if '.client' parameter : client's number and connected pannel users
     *    --> if '.newMessage' parameter : retrieve some messages from broadcast discussion
     *    --> if '.videoState' parameter : video management in order to adjust videos (move forward, move back, pause, play)
     *    --> if '.messageContent' parameter : messages retrieve from broadcast (we have both sender and content liked to it)
     *    --> if '.arrayMasters' : become an animator (master) if the server send a tab with client's identifier
     *    --> if '.connexion' : warns all users (master and slaves) that a new slave has come around
     *    --> if '.dexonnexion' : warns all users (master and slaves) that one slave left
     */
    socket.on('message', function (message) {
        var newMessage = jQuery.parseJSON(message);
       
        if (newMessage.clients) {
            document.getElementById("cadre-menu-droite").innerHTML = "<p><strong>" + (newMessage.clients-1) + " utilisateur(s) connecté(s):</strong></p>";
            for(var i=0; i < newMessage.tab_client.length; i++) {
                if(newMessage.tab_client[i] != identifiant) {               
                    document.getElementById("cadre-menu-droite").innerHTML += "<p class='users' onclick='lancerChat(this);'>" + newMessage.tab_client[i] + "</p>";
                }
            } 
        }

        if (newMessage.messageContent) { 
          $("#message ul").append("<li style='font-weight:bold;'>" + newMessage.messageSender + " : " + newMessage.messageContent + "</li>");
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
        } else if (newMessage.videosStates) {
            videosStates(newMessage.videosStates);
        } else {
            var ma_liste = "";
            var i;

            for (i = 0; i < newMessage.tab_client.length; i += 1) {
                ma_liste += "<li>" + newMessage.tab_client[i] + "</li>";
            }
            
            $('#cadre-user ul').html(ma_liste);         // Update pseudos list
            $('#clients').text(newMessage.clients);     // Display the number of connected users

            if (newMessage.connexion) {
                $("#message ul").append("<li><font color='green'>(" + newMessage.connexion + ") s'est connect&#233;</font> </li>");
                var timeLoad = 200;

                setTimeout(function() {
                    $("#div_connection").hide();
                    $("#overlay").hide();
                }, timeLoad);
            }
            
            if (newMessage.arrayMasters) {
                if (newMessage.arrayMasters.indexOf(identifiant) === -1) {
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

   /**
    * Slaves receive current slide 'id' from master's computer.
    * Then we simulate 'click' event on slaves computers.
    */
    socket.on('click', function (eltId) {
        alert("**click " + eltId);
        $($('#notre_frame').contents()).find(eltId)[0].click();
    });
     
    socket.on('activeSlide', function(activeSlideId) {
        if (activeSlideId !== null) {
            if (typeof slideControlContainer === 'undefined') {
                containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
                slideControlContainer =  containers[containers.length-1];
            }
            slideControlContainer.selectIndex(activeSlideId);
        }
    });

    // Functions that are presents below allow to retrieve events on master computer and then sends informations to slaves computer.
    socket.on('updateSlide', function(filePath, activeSlideIndex) {
        console.log('***client receives updateSlide');
        updateSlide(filePath, activeSlideIndex);
    });
    
    /**
     * Test if the personal chat window liked to the recipient receive message is open or not.
     * If not, we underline the name on the connected user panel in order to warn it that one user want to contact him/her
     */ 
    socket.on('test_presence', function(infos) {
        var obj = JSON.parse(infos);
         
        messages_history[obj.emetteur] = "<p class='destinataire'>" + obj.contenu + "</p>";
        
        for (var i=0; i <tab_windows_opened.length; i++) {
            if (tab_windows_opened[i] === obj.emetteur) {
                return;
            }
        }
        
        // The pseudo window is closed client side, we underline it with orange colour.
        var tab_p = document.getElementsByClassName('users');
        for (var i=0; i < tab_p.length; i++) {
            if (tab_p[i].innerHTML === obj.emetteur) {
                tab_p[i].style.backgroundColor = "orange";
            }
        }
    });
    
    // Update the table that contains all opened windows in order to both - notify client and - keep the table updated
    socket.on('MAJ_tab_windows_opened', function(infos) {
        var obj = JSON.parse(infos);
        
        for (var i in tab_windows_opened) {
            if (tab_windows_opened[i] === obj.destinataire) {
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
    
    socket.on('setMaster', function(isMaster) {
        setMaster(isMaster);
    });
    
    /**
     * Functions that are presents below allow to retrieve events on master computer and then sends informations to slaves
     * computer.
     */
    
    //  Going to the next slide
    $("#next1").click(function () {
        if (typeof slideControlContainer === 'undefined') {
            containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
            slideControlContainer =  containers[containers.length-1];
        }
        if (master) {
            pauseAllVideos(); //Pause playing videos when changing slide
            $($('#notre_frame').contents()).find("#next").click();
            //socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
            socket.emit('SlideChanged', slideControlContainer.currentIndex);           
        }
    });
    
	//  Going on the previous slide
    $("#prev1").click(function () {
        if (typeof slideControlContainer === 'undefined') {
            containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
            slideControlContainer =  containers[containers.length-1];
        }
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#prev").click();
            //socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
            socket.emit('SlideChanged', slideControlContainer.currentIndex);
        }
    });

	//  Going at the beginning of this presentation
    $("#first1").click(function () {
        if (typeof slideControlContainer === 'undefined') {
            containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
            slideControlContainer =  containers[containers.length-1];
        }
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#first").click();
            socket.emit('SlideChanged', slideControlContainer.currentIndex);
        }
    });

	//  Going at the end of this presentation
    $("#last1").click(function () {
        if (typeof slideControlContainer === 'undefined') {
            containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
            slideControlContainer =  containers[containers.length-1];
        }
        if (master) {
            pauseAllVideos();
            $($('#notre_frame').contents()).find("#last").click();
            socket.emit('SlideChanged', slideControlContainer.currentIndex);
        }
    });

    // import session 
    $("#import_session").click(function () {
        $($('#notre_frame').contents()).find("#session_import").click();
    });

    // play session
    $("#play_session").click(function () {
        window["notre_frame"].playSession();
    });

    // pause session
    $("#pause_session").click(function () {
        window["notre_frame"].pauseSession();
    });

    // stop session
    $("#stop_session").click(function () {
        window["notre_frame"].stopSession();
    });

    // record session
    $("#record_session").click(function () {
        $($('#notre_frame').contents()).find("#session_rec").click();
    });

    // export session
    $("#export_session").click(function () {
        $($('#notre_frame').contents()).find("#session_export").click();
    });

    $("#notre_frame").load(function() {
        alert("nav : " + $($('#notre_frame').contents()).find('#navigation_par'));
        $($('#notre_frame').contents()).find('#navigation_par').hide();
        alert('navigation_par hidden');
        containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
        slideControlContainer =  containers[containers.length-1];
        $($('#notre_frame').contents()).find('*[class^="elsommaire"], .linkitem, .plus, #slideshow div, li[smil], span.spanli[id^="s"]').click(function(event) {
            //event.stopPropagation();
            if (master && (event.target.nodeName !== "VIDEO")) {
                console.log("click on: " + getSelector($(this)));
                socket.emit('click', getSelector($(this)));
            }
        });
        initVideo("load");
    });
});

// Load a new presentation selected by the animator
function updateSlide(filePath, activeSlideIndex) { 
    $('#notre_frame').attr('src', filePath);
    console.log('loading ' + filePath);
    slideControlContainer.selectIndex(activeSlideIndex);
}

/**
 * Function that create a new frame to begin communication
 *   -> Create a new frame names PersonalChat.html
 *   -> Set it many attributes (identifier, recipient, socket, last message history)
 *   -> Check if the frame is opened after notification (then pseudo color is orange) or not and then do some actions to update
 */
function lancerChat(pseudo) {

    var myWindow = window.open("PersonalChat.html", pseudo.innerHTML, "width=400, height=400");
    myWindow.identifiant = identifiant;
    myWindow.destinataire = pseudo.innerHTML;
    myWindow.socket = socket;
    myWindow.historique = '';
    
    tab_windows_opened.push(myWindow.destinataire);  

    var tab_p = document.getElementsByClassName('users');
    for (var i=0; i < tab_p.length; i++) {
        if (tab_p[i].innerHTML == myWindow.destinataire && tab_p[i].style.backgroundColor == "orange") {
            tab_p[i].style.backgroundColor = "white";
            myWindow.historique = messages_history[myWindow.destinataire];
        }
    }
}


function getCurrentSlideId() {
    return $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id");
}

var getSelector = function (elt) {
    //alert('in getSelector: ' + elt.attr('id') + ' classname: ' + elt.attr('class'));
    if (elt.attr('id')) {
        return '#' + elt.attr('id');
    }
    
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

function alert_server(filePath, activeSlideIndex) {
    socket.emit('updateSlide', filePath, activeSlideIndex);
}

//returns the active slide
function activeSlide () {
    return $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id");
}

// Allow to set a new master if he's not and the contrary delete master privilege if he's not.
function setMaster(isMaster) {
    "use strict";
    console.log(isMaster);
    if (isMaster) {
        master = true;
        $("#menu-control").show();
        $("#bouton-selectPPT").show();
    } else {
        master = false;
        $("#menu-control").hide();
        $("#bouton-selectPPT").hide();
    }
    initVideo("setMaster");
}

// Use to choose a new presentation
function getPresentationsList() {
    return presentationsList;
}

// Use for ???
function alert_server(filePath) {
    socket.emit('updateSlide', filePath);
}
