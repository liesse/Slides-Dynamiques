// pour jslint
var EVENTS = EVENTS || {};
var console = console || {};
var unescape = unescape || {};
var playSession;
var playing = false;
var pauseSession;
var stopSession;
var position = 0;

$(document).ready(function(){

// public API
document.SESSION = {};

// session events list
var sessionEvents = [];
// absolute time of last event
var sessionLastEventTime = (new Date()).getTime();
// are we recording or playing a session ?
var sessionIsRecording = true;
// 
var slideControlContainer = null;
// counter for elsommaire2 elements
var id_cpt = 100;

// adds an event to the session events list
var pushEvent = function(eventName, id, event) {
  if (''+id == 'undefined'){
    return;
  }
  var item;
  var eventTime = (new Date()).getTime();
  var interval = eventTime - sessionLastEventTime;
  sessionLastEventTime = eventTime;

  // do not catch show or reset event happening after slide event
  if (sessionEvents[sessionEvents.length-1].type !== 'slide' ||
      (event !== 'show' && event !== 'reset')) {
 
    item = {
      type: eventName,
      id: id,
      time: interval
    }

    if (eventName === 'video') {

      item.action = event.type;
      if (event.type === 'seeked') {
        item.currentTime = event.target.currentTime;
      }
      if (event.type === 'volumechange') {
        item.volume = event.target.volume;
      }
    }

    sessionEvents.push(item);
    
  }
};

// === Events functions
var new_selectIndex = function(){
  // arguments[0] is the index number
  if (sessionIsRecording){
    pushEvent('slide', arguments[0]);
  }
  return this.org_selectIndex.apply(this, arguments);
};
var new_slide_reset = function(){
  if (sessionIsRecording){
    pushEvent('reset');
  }
  return this.org_reset.apply(this, arguments);
};
var new_slide_show = function(){
  if (sessionIsRecording){
    pushEvent('show');
  }
  return this.org_show.apply(this, arguments);
};
var new_slide_click = function(e) {
  if (sessionIsRecording){
    pushEvent('click');
  }
};
var new_li_click = function(id, e) {
  if (sessionIsRecording){
    pushEvent('li', id);
  }
};

var new_listItem_click = function(id) {
  if (sessionIsRecording){
    pushEvent('itemClick', id);
  }
};

var new_video_action = function(id, e) {
  if (sessionIsRecording){
    pushEvent('video', id, e);
  }
}
// ===

// Adds an id to title elements if necessary
var checkID = function(node){
  if (!node.hasAttribute('id')) {
    node.id = 'el'+(id_cpt++);
  }
  return node.id;
};

// Converts session events array to XML
var sessionEventsToXml = function() {
  var doc = document.implementation.createDocument("", "", null);
  doc.appendChild(doc.createComment("SMIL session file"));
  doc.appendChild(doc.createComment("Open your presentation, click \"Load session\" button and select this file."));
  doc.appendChild(doc.createElement('xml'));
  doc.lastChild.appendChild(doc.createTextNode('\n'));
  for (var _e=0; _e<sessionEvents.length; _e+=1) {
    var e = doc.createElement('event');
    e.setAttribute('type', sessionEvents[_e].type);
    e.setAttribute('id', sessionEvents[_e].id);
    e.setAttribute('time', sessionEvents[_e].time);

    if (sessionEvents[_e].type === 'video') {
      e.setAttribute('action', sessionEvents[_e].action);
      if (sessionEvents[_e].action === 'seeked') {
        e.setAttribute('currentTime', sessionEvents[_e].currentTime);
      }
      if (sessionEvents[_e].action === 'volumechange') {
        e.setAttribute('volume', sessionEvents[_e].volume);
      }
    }

    doc.lastChild.appendChild(e);
    doc.lastChild.appendChild(doc.createTextNode('\n'));
  }
  return (new XMLSerializer()).serializeToString(doc);
};

var xmlToSessionEvents = function(xml) {
  var doc = (new DOMParser()).parseFromString(xml, "application/xml");
  var events = doc.getElementsByTagName('event');
  var session = [];
  var item;
  for (var _e=0; _e<events.length; _e+=1) {
    var eventType = events[_e].getAttribute('type');

    item = {
        type: eventType,
        id: events[_e].getAttribute('id'),
        time: events[_e].getAttribute('time')
      }

    if (eventType === 'video') {
      item.action = events[_e].getAttribute('action');
      if (item.action === 'volumechange') {
        item.volume = events[_e].getAttribute('volume');
      }
      if (item.action === 'seeked') {
        item.currentTime = events[_e].getAttribute('currentTime');
      }
    }
      session.push(item);
  }
  return session;
};

pauseSession = function(){
  playing = false;
}

stopSession = function(){
  pauseSession();
  position = 0;
  window.parent.$('#session_status').text('Stopped');
}

playSession = function() {
  //var position = 0;
  var lastTimeout;
  playing = true;

  var walkSession = function(){
    if (!playing){
      return;
    }
    switch (sessionEvents[position].type){
      case 'slide':
        slideControlContainer.selectIndex(parseInt(sessionEvents[position].id, 10));
        parent.socket.emit('SlideChanged', slideControlContainer.currentIndex); //parent.activeSlide());
        break;
      case 'reset':
        document.getTimeContainersByTarget(document.getElementById(window.location.hash.slice(1)))[0].reset();
        break;
      case 'show':
        document.getTimeContainersByTarget(document.getElementById(window.location.hash.slice(1)))[0].show();
        break;
      case 'click':
        document.getElementById(window.location.hash.slice(1)).click();
        break;
      case 'li':
        document.getElementById(sessionEvents[position].id).click();
        break;
      case 'itemClick':
        $(sessionEvents[position].id).click();
        parent.socket.emit('click', sessionEvents[position].id);
        break;
      case 'video':
        var video = document.getElementById(sessionEvents[position].id);
        switch(sessionEvents[position].action){
            case "playing" : video.play();
            break;
            case "pause" : video.pause();
            break;
            case "seeked" : video.currentTime = sessionEvents[position].currentTime;
            break;
            case "volumechange" : video.volume = sessionEvents[position].volume;
            parent.socket.emit('actionOnVideo', {id: sessionEvents[position].id, action: "volumechange", value: video.volume});
        }
    }
    position += 1;
    if (position < sessionEvents.length) {
      lastTimeout = window.setTimeout(walkSession, sessionEvents[position].time);
    }else {
      stopSession();
    }
  };

  sessionIsRecording = false;
  walkSession();
};

document.SESSION.record = function(){
  sessionEvents = [{
    type: 'slide',
    id: slideControlContainer.currentIndex,
    time: 0
  }];
  sessionLastEventTime = (new Date()).getTime();
  sessionIsRecording = true;
};

EVENTS.onSMILReady(function() {
  var containers = document.getTimeContainersByTagName("*");
  slideControlContainer = containers[containers.length-1];
  for (var _i=0; _i<containers.length; _i+=1) {
    var navigation = containers[_i].parseAttribute("navigation");
    if (navigation) {
      // overrides selectIndex for each slide
      containers[_i].org_selectIndex = containers[_i].selectIndex;
      containers[_i].selectIndex = new_selectIndex;

      for (var _j=0; _j<containers[_i].timeNodes.length; _j+=1) {
        var slide = containers[_i].timeNodes[_j];
        // overrides slide.reset()
        slide.org_reset = slide.reset;
        slide.reset = new_slide_reset;
        // overrides slide.show()
        slide.org_show = slide.show;
        slide.show = new_slide_show;
        // intercepts slide click
        EVENTS.bind(slide.target, "click", new_slide_click);
      }
    }
  }


  // intercepts click on list
 /* var liTab = document.getElementsByTagName("li");
  for (_i=0; _i<liTab.length; _i+=1) {
    if (liTab[_i].hasAttribute("smil")){
      liTab[_i].addEventListener("click", new_li_click.bind(null, checkID(liTab[_i])));
    }
  }
*/

  $('*[class^="elsommaire"], .linkitem, .plus, #slideshow div, li[smil], span.spanli[id^="s"]').click(function(event) {
    console.log('log click event on ' + parent.getSelector($(this)));
    new_listItem_click(parent.getSelector($(this)));
  });
 

  // intercepts action on video
  var videoTab = document.getElementsByTagName("video");
  var video;
  for (_i=0; _i<videoTab.length; _i+=1) {
    video = videoTab[_i]; 
    video.addEventListener("playing", function (event) {
      new_video_action(this.id, event);
    });
    video.addEventListener("pause", function (event) {
      new_video_action(this.id, event);
    });
    video.addEventListener("seeked", function (event) {
      new_video_action(this.id, event);
    });
    video.addEventListener("volumechange", function (event) {
      new_video_action(this.id, event);
    });
  }

  // add buttons in navbar
  var recbtn = document.createElement('button');
  var exportbtn = document.createElement('button');
  var fileInput = document.createElement('input');
  recbtn.setAttribute('id', 'session_rec');
  recbtn.title = 'Start session recording';
  recbtn.appendChild(document.createTextNode('Record session'));
  exportbtn.id = 'session_export'; 
  exportbtn.title = 'Export session';
  exportbtn.appendChild(document.createTextNode('Export session'));
  fileInput.type = 'file'; fileInput.id = 'session_import'; fileInput.title = 'Import session';

  recbtn.addEventListener('click', document.SESSION.record);
  
  exportbtn.addEventListener('click', function(){
    window.open('data:text/xml;base64,' +
                    window.btoa(unescape(
                      encodeURIComponent(sessionEventsToXml())
                    )));
  });

  fileInput.addEventListener('change', function(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(f){
      sessionEvents = xmlToSessionEvents(f.target.result);
    };
    reader.readAsText(file);
  });

  document.getElementById('navigation_par').appendChild(recbtn);
  document.getElementById('navigation_par').appendChild(exportbtn);
  document.getElementById('navigation_par').appendChild(fileInput);

  document.SESSION.record();
});

});

