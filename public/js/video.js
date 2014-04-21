var videosStates;
function initVideo() {
    "use strict";
    // We retrieve video element  
    var videos = $($('#notre_frame').contents()).find("video");
    
    if (videos.length === 0) {
        return;
    }
    
    videos.each(function(){
        $(this)[0].controls = false;
        
        if (sessionStorage.getItem('isMaster') == 'true') {
            
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
            });

            // When video volume change, we give new volume value to slaves computers
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


    socket.on('videoStates_request', function(){
        var videosStates = [];
        var videos = $($('#notre_frame').contents()).find("video");
        videos.each(function(){
            var item = {
                videoId: $(this).attr('id'), 
                videoPaused: $(this)[0].paused, 
                videoCurrentTime: $(this)[0].currentTime
            };
            videosStates.push(item);              
        });
        socket.send(JSON.stringify({videosStates: videosStates}));
    });
}

videosStates = function (videos) {
    //alert('videos states received');
    for (var i = 0; i < videos.length; i++) {
        var id = "#" + videos[i].videoId;
        var video = $($('#notre_frame').contents()).find(id);
        video[0].currentTime = videos[i].videoCurrentTime;
        if (!videos[i].videoPaused){
            video[0].play();
        }        
    }
    //alert('videos states updated');
}



