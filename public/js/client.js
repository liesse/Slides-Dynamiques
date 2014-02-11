
/* Globals variables */
var TempoMaster = false;
var master = false;
var mon_identifiant;
var password;
var socket;
var slideControlContainer;
var containers;
var currentSlide = 0;

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
            
            if ($("#master").is(':checked') === true) {
                TempoMaster = true;
                $("#menu-control").removeClass('isHidden');
            }
    
            socket.emit('ouvertureSession', JSON.stringify({
                identifant: mon_identifiant,
                password: password,
                master: TempoMaster
            }));
              
            $("#menu-pseudo").html("Bonjour " + mon_identifiant);
        }
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
        var w = window.open('upload.html', 'popUpWindow', 'height=200, width=400, left=10, top=10, resizable=no, scrollbars=yes, toolbar=no, menubar=no, location=no, directories=no, status=yes');
        w.focus();
    });

    // Management of received messages (validity treatment, Retrieval of datas, DOM manipulation) 
    socket.on('message', function (data) {
        var obj = jQuery.parseJSON(data);
       
        if (obj.le_msg) { // Treatment of discussion messages
            $("#message ul").append("<li>(" + obj.le_pseudo + "): " + obj.le_msg + "</li>");
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
        } else {
            var ma_liste = "";
            var i;
                
            for (i = 0; i < obj.tab_client.length; i += 1) {
                ma_liste += "<li>" + obj.tab_client[i] + "</li>";
            }
            
            $('#cadre-user ul').html(ma_liste); // Update pseudos list
            $('#clients').text(obj.clients);    // Display the number of connected users
                
            if (obj.connexion) {
                $("#message ul").append("<li><font color='green'>(" + obj.connexion + ") s'est connect&#233;</font> </li>");
                var timeLoad = 200;
                
                if (obj.ppt) { // Change presentation on slave computers
                    $("#notre_frame").attr("src", "ppt/" + obj.ppt);
                    timeLoad = 3000;
                }
                    
                setTimeout(function() {
                    initVideo(); // load controls for video management
                    chargementSlide();
  
                    $("#div_connection").hide();
                    $("#overlay").hide();
                }, timeLoad);
            }
            
            // Become an animator if the server tell us.
            if (obj.arrayMasters) {
                if (obj.arrayMasters.indexOf(mon_identifiant) === -1) {
                    setMaster(false);
                } else {
                    setMaster(true);
                }
            }
                    
            if (obj.pseudo) {
                $("#message ul").append("<li><font color='green'>(" + obj.pseudo + ") s'est connect&#233;</font> </li>");
            }
            
            if (obj.deconnexion) {
                $("#message ul").append("<li><font color='red'>(" + obj.deconnexion + ") s'est d&#233connect&#233;</font> </li>");
            }
        }
    });
                
    //Slaves receive slide "id" of the click element on master computer, then we simulate "the click" on slaves computers.
    socket.on('recupObjetHtml', function (idtempo) {
        console.log("recupObjetHtml " + idtempo);
        if (idtempo) {
            $($('#notre_frame').contents()).find("#" + idtempo).click();
        }
    });
    

    socket.on('activeSlide', function(activeSlideId) {
        if (activeSlideId != null){
            var slide = $($('#notre_frame').contents()).find('#' + activeSlideId);
            $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr('smil', 'idle');
            slide.attr('smil', 'active');
        }
    });

    //Functions that are presents below allow to retrieve events on master computer and then sends informations to slaves computer.
    socket.on('updateSlide', function(){
        console.log('***client receives updateSlide');
        updateSlide();
    });

    // Permet de recuperer les evenements de la gestion des slides et de les envoyer au poste esclave
    $("#next1").click(function () {
        console.log('clic next1');
        if (master) {
            $($('#notre_frame').contents()).find("#next").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
            console.log('Master send index: ' + slideControlContainer.currentIndex);
        }
    });

	// Going on the previous slide
    $("#prev1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#prev").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

	// Going at the beginning of this presentation
    $("#first1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#first").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });

	// Going at the end of this presentation
    $("#last1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#last").click();
            socket.emit('SlideChanged', $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
        }
    });
});

// prevent clients when a new presentation is selected
function preventSlideUpdate(){
    console.log("***Master telling slide updated");
    socket.emit('updateSlide');
    console.log('***Message updateSlide sent');
}

//Load a new presentation selected by the animator
function updateSlide(){ 
    console.log("***Updating slide...");  
    $('#notre_frame').attr('src', $('#notre_frame').attr('src'));
    containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
    slideControlContainer = containers[containers.length - 1];
    slideControlContainer.selectIndex(0);
    console.log("***Slide updated");
}

// Permet de charger les slides et de creer des evenements sur la presentation
function chargementSlide() {
    //"use strict";
    console.log("chargementSlide");
    containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
    slideControlContainer = containers[containers.length - 1];

    // Allow to retrieve action done on master computer and simulate it on slaves computers
    $($('#notre_frame').contents()).find(".slide").click(function(e) {
        e.stopPropagation();
        if (master) {
            var idtempo = this.id;
            socket.emit('envoiRefObjetHtml', idtempo);
        }
    });
    
    $($('#notre_frame').contents()).find("li").not("[class='highlight']").click(function (e) {
        if ($(this).parent().attr("class") !== "incremental") {
            e.stopPropagation();
            if (master) {
                idtempo = this.id;
                socket.emit('envoiRefObjetHtml', idtempo);
            }
        }
    });
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
        //$("#menu-control").show();
       // $("#bouton-selectPPT").show();
        $("#menu-control").removeClass('isHidden');
        $("#bouton-selectPPT").removeClass('isHidden');
    } else {
        master = false;
        //$("#menu-control").hide();
        //$("#bouton-selectPPT").hide();
        $("#menu-control").addClass('isHidden');
        $("#bouton-selectPPT").addClass('isHidden');
    }
}

function getCurrentSlideIndex(){
   alert("current slide id: " + $($('#notre_frame').contents()).find('#slideshow [smil=active]').attr("id"));
}