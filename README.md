Slides-Dynamiques 
=================

Projet R&amp;D of Liesse NADJI, Philippe BENOIT and Abdoul karim CISSE
Ce projet est la suite de ce qui a été fait par Aurelien GEANT et Julian DEMAREST l'an dernier

Ce projet consiste à diffuser des slides utilisant la technologie SMIL/EAST sur des postes client.
Les changements de slides, les animations sont synchronisés entre tous les utilisateurs grâce aux Websocket.

Aujourd'hui, les animations sont fonctionnelles et le visionnage des slides se fait sans connexion à internet.
    

VERSION 2.0
---------------------------

Ajout des fonctionalités suivantes :

    - Débogage de la liste itératives ;
    - Débogage du nombre d'utilisateurs connectés ;
    - Ajout d'un channel rétractable à gauche du slide ;
    - Début intégration vidéo (en cours de dév)

VERSION 3.0
----------------------------

Ajout des fonctionalités suivantes :

    - Ajout d'une liste des utilisateurs connectés qui s'affiche au passage de la souris sur le nombre d'utilisateurs connectés
    - Amélioration du channel retractable fonctionnant sous tout environnment (Linux, Windows, etc.)
    - Notification d'un nouveau message lorsque le Channel est fermé.
    - Intégration video synchronisée. Fonctionne avec les contrôles par défaut ou avec le nouveau contrôleur video situé en haut du menu qui apparait    
      lorsque la video est détectée dans le slide. Synchronisation video à la seconde près entre le poste maître et les postes esclaves.
    - Compatible avec la nouvelle version de Express 3 
    - Optimisation de la gestion des utilisateurs (plus aucune socket n'est envoyée inutilement)
    - Lorsqu'un nouvel utilisateur se connecte, le slide se positionne à la slide courante du poste maître
    
VERSION 4.0
----------------------------  

Ajout des fonctionalités suivantes :

    - Synchronisation des slides des postes esclaves avec les slides du master
    - Amélioration de la gestion de l’animateur/master (système de jeton)
    - Nouvelle fonctionnalité : interface permettant de charger une présentation autre que celle par défaut et de la diffusée sur les postes esclaves.
    - Correction du bug sur la fermeture du contrôleur vidéo.
    
VERSION 5.0
----------------------------  

Ajout des fonctionalités suivantes :

    - mise à jours de Node.js
    - mise à jour d'Express
    - éclaircir/nettoyer le code
    - Amélioration de la communication des messages 
    - éviter les chemins en dur 
    - Possibilité de choisir une présentation sur le disque


VERSION 6.0
----------------------------

Ajout des fonctionalités suivantes :

    - correction du bug vidéo
    - émetteur / proxy -> client
    - émetteur -> proxy / client
    - émetteur / proxy -> proxy / client
    

VERSION 7.0
----------------------------  

Ajout des fonctionalités suivantes :

    - possibilité d'échanger les rôles (maître / esclave)
    
    
HOW TO
-----------------------------

Pour faire fonctionner le Projet Slides-Dynamiques :

    https://github.com/aurelien/Slides-Dynamiques/wiki

    
ESSENTIAL FILES
-----------------------------
    - server.js  	      // Gestion serveur
    - public/index.html   // Interface graphique manipulée par le client (slide, annimation, utilisateur)
    - public/upload.html  // Permet d'uploader une nouvelle présentation sur le serveur
    - public/js/video.js  // Gestion vidéo
    - public/js/pannel.js // Gestion channel de discussion
    - public/js/client.js // Gestion des évenements du client
 
