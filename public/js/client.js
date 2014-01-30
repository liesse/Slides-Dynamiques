/* Variable global */
var TempoMaster = false;
var master = false;
var mon_identifiant;
var password;
var socket;
var slideControlContainer;


$(document).ready(function () {
    "use strict";
    socket = io.connect();

    // Se lance apres l authentification, et permet de s enregistrer aupres du serveur afin d avertir un nouvelle utilisateur
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


    
    // On Verifie si on charge bien une presentation html
    $("#img-select").click(function () {
        $("#hiddenfile").click();
        $("#hiddenfile").change(function () {
            if ($("#hiddenfile").val().split('.').reverse()[0] === "html") {
                $("#selected-Slide").val($("#hiddenfile").val());
            }
        });
    });

    // Permet de selectionner une nouvelle presentation
    $("#bouton-selectPPT").click(function () {
        var w = window.open('upload.html', 'popUpWindow', 'height=200, width=400, left=10, top=10, resizable=no, scrollbars=yes, toolbar=no, menubar=no, location=no, directories=no, status=yes');
        w.focus();
    });

    // Reception des messages du serveur et traitement des messages en fonction des donnees recues
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
        } else if (obj.le_msg) { // reception et traitement des messages de discussion
            $("#message ul").append("<li>(" + obj.le_pseudo + "): " + obj.le_msg + "</li>");
            $("#message").scrollTop(100000);
                
            // Notification du pannel (rouge clignotant)
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
            
            $('#cadre-user ul').html(ma_liste); // actualisation de la liste des pseudos
            $('#clients').text(obj.clients);    // affichage nombre de client connecte
                
            if (obj.connexion) {
                $("#message ul").append("<li><font color='green'>(" + obj.connexion + ") s'est connect&#233;</font> </li>");
                var timeLoad = 200;
                
                if (obj.ppt) { // Change la presentation sur les postes esclave
                    $("#notre_frame").attr("src", "ppt/" + obj.ppt);
                    timeLoad = 3000;
                }
                    
                setTimeout(function() {
                    initVideo(); //charge les controles pour la gestion de la video
                    chargementSlide();
                        
                    if (obj.le_slide) {
                        slideControlContainer.selectIndex(obj.le_slide); // lors de la connection on charge le slide en cours
                    }
                            
                    $("#div_connection").hide();
                    $("#overlay").hide();
                }, timeLoad);
            }
            
            // Devenir annimateur si le serveur nous l'indique
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
                
    // Les esclaves recois l id du slide ou de l element clique du poste master et on simule le click
    socket.on('recupObjetHtml', function (idtempo) {
        if (idtempo) {
            $($('#notre_frame').contents()).find("#" + idtempo).click();
        }
    });
    
    // Permet de recuperer les evenements de la gestion des slides et de les envoyer au poste esclave
    $("#next1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#next").click();
            socket.send(JSON.stringify({
                suivant: "next",
                slide: slideControlContainer.currentIndex // on envoi l'ID du slide
            }));
        }
    });

    $("#prev1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#prev").click();
            socket.send(JSON.stringify({
                precedant: "prev",
                slide: slideControlContainer.currentIndex // on envoi l'ID du slide
            }));
        }
    });

    $("#first1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#first").click();
            socket.send(JSON.stringify({
                premier: "first"
            }));
        }
    });

    $("#last1").click(function () {
        if (master) {
            $($('#notre_frame').contents()).find("#last").click();
            socket.send(JSON.stringify({
                dernier: "last"
            }));
        }
    });
});
  
// Permet de charger les slides et de creer des evenements sur la presentation
function chargementSlide() {
    "use strict";
    console.log("chargementSlide");
    var containers = $($('#notre_frame').contents())[0].getTimeContainersByTagName("*");
    slideControlContainer = containers[containers.length - 1];

    // Permet de recuperer l action fait sur le master et de le simuler sur les postes client connectes
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

// Permet de ne pas autocratiser les caracteres speciaux pour le pseudo
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