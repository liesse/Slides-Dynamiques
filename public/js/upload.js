$(document).ready(function() {

    var files = window.opener.getPresentationsList();
    
    $('#uploadedFiles ul').innerHTML = '';
    
    for (var i = 0; i < files.length; i++) {
        $('#uploadedFiles ul').append("<li><a href=\"#\"><img src='images/file.png' /><span class='span1'>" + files[i] + "</span><br /><span class='span2'>public/ppt/" + files[i] +"</span></li>");  
    }

    $('#uploadedFiles ul li').click(function() {
        window.opener.alert_server('./ppt/' + $(this).find('.span1')[0].innerHTML);
        $("#hiddenfile").innerHTML = '';
        self.close();
    });

    $("#submit").click( function() {
        if ($("#hiddenfile").val().split('.').reverse()[0] === "html") {
            if (window.opener && !window.opener.closed ) {
                $("#submitForm").click();
                $('#uploadedFiles ul').prepend("<li><a href=\"#\"><img src='images/file.png' /><span class='span1'>" + $("#hiddenfile").val() + "</span><br /><span class='span2'>public/ppt/" + $("#hiddenfile").val() +"</span></li>");
                $('#uploadedFiles ul li').click(function() {
                    window.opener.alert_server('./ppt/' + $(this).find('.span1')[0].innerHTML);
                    $("#hiddenfile").innerHTML = '';
                    self.close();
                });
            }

        }
        else {
            alert("Veuillez choisir une présentation EAST");
        }   
    });
});