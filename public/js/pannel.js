/* This function is executed when the DOM is loaded */
			
$(document).ready(function() { 
    
    /* Send messages to all clients */
    $("#img-send").click(function() { 

        if ($("#input_text").val() != "") {
            $("#message ul").append("<li style='font-weight:bold;'>" + identifiant + " : " + $("#input_text").val() + "</li>");	
            $("#message").scrollTop(100000);

            socket.send(JSON.stringify({
                messageContent: $("#input_text").val(),
                messageSender: identifiant
            }));
        }

    });

    /* Allow to open and close the panel. The goal is to see and broadcast information to all connected users */
    $("#bouton-menu").click(function() { 

        if ($("#cadre-menu").css("margin-Left") == "0px") {

            $("#cadre-menu").animate({marginLeft: "175px"}, 400 );
            $("#notre_frame").animate({ marginLeft: "175px"}, 400 );
            $("#notre_frame").css("width", "calc(100% - 175px)");	
            $("#bouton-menu").html("");
            $("#bouton-menu").css("background", "url('images/fond-demo-menu-close.jpg')  bottom no-repeat");	
        }
        else {

            $("#notre_frame").animate({ marginLeft: "0"  }, 300 );
            $("#cadre-menu").animate({ marginLeft: "0"  }, 300 );
            setTimeout(function (){$("#notre_frame").css("width", "100%")}, 300);	
            $("#bouton-menu").css("background", "url('images/fond-demo-menu-open.jpg')  bottom no-repeat");
        }

    });
    
}); 
