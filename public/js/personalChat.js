    
var destinataire = window.destinataire;
var mon_identifiant = window.mon_identifiant;
        
socket = window.socket; //io.connect();
        
socket.on('notification_PersonalChat', function(infos){
                        
    var obj = JSON.parse(infos);
            
    if(obj.destinataire === mon_identifiant && obj.emetteur === destinataire) {
        document.getElementById("messageChat").innerHTML += "<p class='destinataire'>" /* + obj.emetteur + ":" */ + obj.contenu + "</p>";   
    }
});
    
function ajouterMessageChat(messageInput,event) {
        
   var texte = messageInput.value;

   if(event.keyCode == 13) {
     document.getElementById("messageChat").innerHTML += "<p class='emetteur'>" /* + mon_identifiant + ":" */ + texte + "</p>";
     document.getElementById("zone_texte_Chat").value = "";
                              
     socket.emit('new_message_PersonalChat', JSON.stringify({
          emetteur: mon_identifiant,
          destinataire: destinataire,
          contenu: texte
     }));    
   }
}
        
function chargerDonnees(){
    document.getElementById("pseudo").innerHTML = /*window.mon_identifiant + " --> " + */ window.destinataire;
    document.getElementById("messageChat").innerHTML = window.historique;
}
        
window.onbeforeunload = function(e){ 
    socket.emit('MAJ_tab_windows_opened', JSON.stringify({
        emetteur: mon_identifiant,
        destinataire: destinataire
    }));            
} 
    