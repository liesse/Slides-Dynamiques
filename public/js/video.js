var myVideo;
    
function initVideo() { 
    
    /* On recupere l'element video  */	
    myVideo = $($('#notre_frame').contents()).find("video")[0];
    
    /* On affiche la barre de controle video lors du passage de la souris sur la video  */
    $($('#notre_frame').contents()).find("video").hover(function () {        
        $("#cadre-video").removeClass("isHidden");            
    });
    
    $('#fermeture_controle_video').click(function () {
        $("#cadre-video").addClass("isHidden");
    });
    
    if (myVideo) {
        $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-play"} });
        
        /* Capture le temps de la video l'affiche  */		
        $(myVideo).bind('timeupdate',function() {
            TimeNow = myVideo.currentTime;
            $("#lectureVideo").button( "option", "label", TimeNow.toFixed(1));
            $('#barre').slider('value', TimeNow);
        });
             
        /* Lorsque l'on detecte l'evenement pause on l'envoi aux postes esclaves */
        $(myVideo).bind("pause", function () {
            $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-play"} });
            if (master == true) {	
                socket.emit('envoiControlVideo', JSON.stringify({
                    pause: 'pause'
                }));
            }
        });
        
        /* Lorsque l'on detecte l'evenement lecture on l'envoi aux postes esclaves */
        $(myVideo).bind("playing", function () {
            $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-pause"} });
            if (master == true) {	
                socket.emit('envoiControlVideo', JSON.stringify({
                    play: 'play'
                }));
            }
        });
            
        /* Definition du slider pour la video */
        var video_duration = myVideo.duration;
        $('#barre').slider({
            value: 0,
            step: 0.1,
            orientation: "horizontal",
            range: "min",
            max: video_duration,
            animate: true,					
            slide: function(){},
            stop:function(e,ui){
                myVideo.currentTime = ui.value;
            }
        });	
        
        /* Boutton de lecture video */
        $("#lectureVideo").click(function() {
            if (myVideo.paused) {
                myVideo.play(); 
            } else if (myVideo.played) {
                myVideo.pause(); 
            }
        }) ;
                            
        /* Lors du changement de la position de la video on envoi la nouvelle position aux postes esclaves */
        $(myVideo).bind("seeked", function () {
            if (master == true) {	
                socket.emit('envoiControlVideo',JSON.stringify({
                    toPlay: myVideo.currentTime
                }));
            }		
        });
    }
    
    /* Lors de la reception du controle video envoye par le serveur on l'execute */
    socket.on('emettreControlVideo', function (video) {
    var obj_video = jQuery.parseJSON(video);
        if (obj_video.play) {
            myVideo.play();
        } else if (obj_video.pause) {
            myVideo.pause(); 
        } else if (obj_video.toPlay) {
            myVideo.currentTime = obj_video.toPlay;
        }   
    });
};