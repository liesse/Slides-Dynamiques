    /* Send messages to all clients by simply press enter on text field */
    function ajouterMessageGlobal(messageEnvoye, event){
      var texte = messageEnvoye.value;

      if (event.keyCode === 13) {
          if (texte !== "") {
              $("#message ul").append("<li style='font-weight:bold;'>" + identifiant + " : " + texte + "</li>");	
              $("#message").scrollTop(100000);
              $("#input_text").val('');

              socket.send(JSON.stringify({
                messageContent: texte,
                messageSender: identifiant
              }));
          }
       }
    }

    /* Allow to open and close the panel. The goal is to see and broadcast information to all connected users */
    $("#bouton-menu").click(function() { 
        if ($("#cadre-menu").css("margin-Left") === "0px") {
            $("#cadre-menu").animate({marginLeft: "175px"}, 400 );
            $("#notre_frame").animate({ marginLeft: "175px"}, 400 );
            $("#notre_frame").css("width", "calc(100% - 175px)");	
            $("#bouton-menu").html("");
            $("#bouton-menu").css("background", "url('images/fond-demo-menu-close.jpg')  bottom no-repeat");	
        } else {
            $("#notre_frame").animate({ marginLeft: "0"  }, 300 );
            $("#cadre-menu").animate({ marginLeft: "0"  }, 300 );
            setTimeout(function (){$("#notre_frame").css("width", "100%")}, 300);	
            $("#bouton-menu").css("background", "url('images/fond-demo-menu-open.jpg')  bottom no-repeat");
        }
    });
