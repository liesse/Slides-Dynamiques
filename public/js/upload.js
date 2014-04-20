
// Script used for uploading some presentations towards the server
$(document).ready(function() {

    var files = window.opener.getPresentationsList();
    
    $('#uploadedFiles ul').innerHTML = '';
    
    var list = $('#uploadedFiles ul');
    
    for (var i = 0; i < files.length; i++) {
        list.append(createFileNode(files[i]));  
    }

    $('#uploadedFiles ul li').click(function() {
        window.opener.alert_server('./ppt/' + $(this).find('.span1')[0].innerHTML, 0);
        $("#hiddenfile").innerHTML = '';
        self.close();
    });

    $("#submit").click( function() {
        var fileName = $("#hiddenfile").val();
        if (fileName.split('.').reverse()[0] === "html") {
            if (window.opener && !window.opener.closed ) {
                $("#submitForm").click();
                
                if (fileName.indexOf('\\') !== -1) {
                    var tab = fileName.split('\\');
                    fileName = tab[tab.length-1];
                }
             
                $('#uploadedFiles').find('ul').prepend(createFileNode(fileName));

                $('#uploadedFiles ul li').click(function() {
                    window.opener.alert_server('./ppt/' + fileName, 0);
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

function createFileNode(fileName){
    var newNode = $('#fileElementModel')[0].content.cloneNode(true);
    var list = newNode.firstElementChild;
    $(list).find('.span1')[0].innerHTML = fileName;
    $(list).find('.span2')[0].innerHTML = "public/ppt/" + fileName; 
    return newNode;
}