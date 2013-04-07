Slides-Dynamiques 
=================

Projet R&amp;D et DLL de Aurelien GEANT et Julian DEMAREST

Ce projet consiste à diffuser des slides utilisant la technologie SMIL/EAST sur des postes client.
Les changements de slides, les animations sont synchronisés entre tous les utilisateurs grâce aux Websocket.

Aujourd'hui, les animations sont d'ors et déjà fonctionnelles et le visionnage des slides se fait sans connexion à internet.

Pour la suite du projet DLL, nous comptons ajouter plusieurs fonctionnalités à celles ci, comme :

    - Ajout d'un système de sécurité (authentification, définition du master avec un mot de passe) ;
    - Correction du nombre d'utilisateurs connectés ;
    - Diffusion de vidéos dans EAST sur tous les postes connectés ;
    - Correction sur la diffusion des animations itératives ;
    - Initialisation du slide de l'utilisateur avec celui du master lors de sa connexion.
    
Merci de prendre en compte le fait que l'on a perdu du temps, du fait de l'abandon de l'autre projet
pour la version 1.0 du projet DLL :

    Voice Memos -> https://github.com/aurelien/Voice-Memos-OWA

Ceci est dû au fait que l'enregistrement de l'audio avec mediaStreamRecorder n'est pas encore possible
sous Firefox pour l'instant.

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
    - Intégration video synchronisée. Fonctionne avec les contrôles par défaut ou avec le nouveau contrôleur video situé en haut du menu qui apparait lorsque la video est détectée dans le slide. Synchronisation video à la seconde près entre le poste maître et les postes esclaves.
    - Compatible avec la nouvelle version de Express 3 
    - Optimisation de la gestion des utilisateurs (plus aucune socket n'est envoyée inutilement)
    - Lorsqu'un nouvel utilisateur se connecte, le slide se positionne à la slide courante du poste maître

HOW TO
-----------------------------

Pour faire fonctionner le Projet Slides-Dynamiques :

    - Voir le Wiki. 
