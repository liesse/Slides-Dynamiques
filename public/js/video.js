var myVideo;
    
function initVideo() {
    "use strict";
    
    /* We retrieve video element  */
    myVideo = $($('#notre_frame').contents()).find("video")[0];
    
    /* We display video controls panel when mouse hover the video */
    $($('#notre_frame').contents()).find("video").hover(function () {
        if (master) {
            $("#cadre-video").show();
        }
    });
    
    $('#fermeture_controle_video').click(function () {
        if (master) {
            $("#cadre-video").hide();
        }
    });
    
    if (myVideo) {
        $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-play"} });
        
        /* Display video timer  */
        $(myVideo).bind('timeupdate', function () {
            TimeNow = myVideo.currentTime;
            $("#lectureVideo").button("option", "label", TimeNow.toFixed(1));
            $('#barre').slider('value', TimeNow);
        });
             
        /* When detect "pause" event, we send information to slaves */
        $(myVideo).bind("pause", function () {
            $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-play"} });
            if (master) {
                socket.emit('envoiControlVideo', JSON.stringify({
                    pause: 'pause'
                }));
            }
        });
        
        /* When detect "lecture" event, we send information to slaves */
        $(myVideo).bind("playing", function () {
            $("#lectureVideo").button({ text: true, icons: {primary: "ui-icon-pause"} });
            if (master) {
                socket.emit('envoiControlVideo', JSON.stringify({
                    play: 'play'
                }));
            }
        });
            
        /* Slider definition for the video */
        var video_duration = myVideo.duration;
        $('#barre').slider({
            value: 0,
            step: 0.1,
            orientation: "horizontal",
            range: "min",
            max: video_duration,
            animate: true,
            slide: function () {},
            stop: function (e, ui) {
                myVideo.currentTime = ui.value;
            }
        });
        
        /* Button to play video */
        $("#lectureVideo").click(function () {
            if (myVideo.paused) {
                myVideo.play();
            } else if (myVideo.played) {
                myVideo.pause();
            }
        });
                            
        /* When video position change, we give new positions to slaves computers */
        $(myVideo).bind("seeked", function () {
            if (master) {
                socket.emit('envoiControlVideo', JSON.stringify({
                    toPlay: myVideo.currentTime
                }));
            }
        });
    }
    
    /* When we receive video controls from the server, we run it */
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
}