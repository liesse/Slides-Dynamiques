
/* Globals variables */
var TempoMaster = false;
var master = false;
var mon_identifiant;
var password;
var socket;
var slideControlContainer;


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
        
        if (obj.le_next) {
            slideControlContainer.selectIndex(obj.le_slide);
        } else if (obj.le_prev) {
            slideControlContainer.selectIndex(obj.le_slide);
        } else if (obj.le_first) {
            $($('#notre_frame').contents()).find("#first").click();
        } else if (obj.le_last) {
            $($('#notre_frame').contents()).find("#last").click();
        } else if (obj.url) {
            $('#notre_frame').attr("src", obj.url);
        } else if (obj.le_msg) { // Treatment of discussion messages
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
                        
                    if (obj.le_slide) {
                        slideControlContainer.selectIndex(obj.le_slide); // When a connection happen, we load the ongoing slide presentation
                    }
                            
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
                
    // Slaves receive slide "id" of the click element on master computer, then we simulate "the click" on slaves computers.
    socket.on('recupObjetHtml', function (idtempo) {
        if (idtempo) {
            $($('#notre_frame').contents()).find("#" + idtempo).click();
        }
    });
    
    //Functions that are presents below allow to retrieve events on master computer and then sends informations on slaves computer.
		
		// Going on the next slide
    $("#next1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#next").click();
            socket.send(JSON.stringify({
                suivant: "next",
                slide: slideControlContainer.currentIndex // on envoi l'ID du slide
            }));
        }
    });

		// Going on the previous slide
    $("#prev1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#prev").click();
            socket.send(JSON.stringify({
                precedant: "prev",
                slide: slideControlContainer.currentIndex // on envoi l'ID du slide
            }));
        }
    });

		// Going at the beginning of this presentation
    $("#first1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#first").click();
            socket.send(JSON.stringify({
                premier: "first"
            }));
        }
    });

		// Going at the end of this presentation
    $("#last1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#last").click();
            socket.send(JSON.stringify({
                dernier: "last"
            }));
        }
    });
});
  
// Allow to load slides and create events on it
function chargementSlide() {
    "use strict";
    console.log("chargementSlide");
    var containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
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
        $("#menu-control").show();
        $("#bouton-selectPPT").show();
    } else {
        master = false;
        $("#menu-control").hide();
        $("#bouton-selectPPT").hide();
    }
}