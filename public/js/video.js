
function initVideo() {
    "use strict";
    // We retrieve video element  
    var videos = $($('#notre_frame').contents()).find("video");
    if (videos.length == 0){
        return;
    }
    
    videos.each(function(){
        $(this)[0].controls = false;

        if (master) {
            $(this)[0].controls = true;

            // When detect "pause" event, we send information to slaves 
            $(this).bind("pause", function () {
                socket.emit('actionOnVideo', {id: $(this).attr("id"), action: "pause"});
            });
            
            // When detect "lecture" event, we send information to slaves
            $(this).bind("playing", function () {
                socket.emit('actionOnVideo', {id: $(this).attr("id"), action: "playing"});
            });

            // When video position change, we give new positions to slaves computers
            $(this).bind("seeked", function () {
                socket.emit('actionOnVideo', {id: $(this).attr("id"), action: "seeked", value: $(this)[0].currentTime});
                //alert("seeked: " + $(this)[0].currentTime);
            });

            //// When video volume change, we give new volume value to slaves computers
            $(this).bind("volumechange", function () {
                socket.emit('actionOnVideo', {id: $(this).attr("id"), action: "volumechange", value: $(this)[0].volume});
            });            
        }
    });

    socket.on('actionOnVideo', function(data){
        var action = data.action;
        var video = $($('#notre_frame').contents()).find("#"+data.id)[0];
        switch(action){
            case "playing" : video.play();
            break;
            case "pause" : video.pause();
            break;
            case "seeked" : video.currentTime = data.value;
            break;
            case "volumechange" : video.volume = data.value;
        }
    });
}