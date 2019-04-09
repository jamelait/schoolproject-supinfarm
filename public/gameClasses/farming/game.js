window.onload = function () {
    //console.info('in game.js');

    sock_startSocket();
    //testSocket();
    // Afficher les information de l'item séléctionné dans la barre latérale gauche en temps réél
    setInterval(displayLeftBarInfo, 500);
}

function uiReady() {
    sock_justJoined();
}

rainAnimationCreated = false;

// Change la taille de la map
function resizeMap(size) {
    ige.client.tileMap1.drawGrid(size);
}

// Ajouter un item
function placeItem(type, tileX, tileY) {
    ige.client.placeItem(type, tileX, tileY);
}

// Place un joueur sur la map
function placePlayer(playerNickName, tileX, tileY) {
    //console.info('placement du joueur');
    ////console.log(ige.client.player.id());
    //console.info('players = ');
    //console.info(players);
    var character = players[playerNickName];   // var character = ige.client.player;
    character.translateToTile(tileX, tileY);
    //console.info('joueur déplacé');
}

// Crée un joueur avec le pseudo spécifié
function createPlayer(playerNickame) {
    log.info('creating ' + playerNickame);
    ige.client.setFarmer(playerNickame);
}

function addToPendingPlayers(playerNickname) {
    if (meCreated) {
        createPlayer(playerNickname);
        placePlayer(playerNickname, 3, 0);
    }
    else {
        pendingPlayers[playerNickname] = playerNickname;
        log.info(playerNickname + ' added to pendingPlayers');
    }
}

function createPendingPlayers() {
    _.each(pendingPlayers, function (playerNickname) {
        createPlayer(playerNickname);
        placePlayer(playerNickname, 3, 0);
    });
}

function weather_rain_start() {
    if (!rainAnimationCreated)
        createRainAnimation();

    var d = document.getElementById('weatherRain');
    d.style.visibility = 'visible';
}

function weather_rain_stop() {
    var d = document.getElementById('weatherRain');
    d.style.visibility = 'hidden';
}

function createRainAnimation() {
    new Rain('weatherRain', {
      speed: 500, 
      angle: 20, 
      intensity: 10, 
      size: 10,
      color: '#fff'
    }).canvas.setSize(window.innerWidth, window.innerHeight);

    rainAnimationCreated = true;
}

itemUndefinedFirstTime = true; // il faut cliquer deux fois sur une case vide pour masquer les information d'un item sélectionné
// Affiche les informations d'un item dans la barre latérale gauche.
function displayItemInfo(item) {
    //if (harvest_in_progress)
    //    return;
    if (!item) {
        //if (itemUndefinedFirstTime) {
        //    itemUndefinedFirstTime = false;
        //    return;
        //}
            return;
        // Si aucun item est défini masquer les images et le texte
        ige.client.imageItem.unMount();
        ige.client.txtItemLine1.unMount();
        ige.client.txtItemLine2.unMount();
        ige.client.txtHarvest.unMount();
        return;
    }

    var t, l1, l2;

    l1 = item.classId();
    if (isBuilding(item)) {
        l2 = 'Storage : ' + item.stored_quantity + '/' + getLimitStorageByType(item.classId());
        // Afficher le bouton permettant la récolte
        ige.client.txtHarvest.mount(ige.client.leftBar)
    }
    else if (isCrop(item)) {
        ige.client.txtHarvest.unMount();
        if (item.maturity)
            l2 = 'Maturity : ' + item.maturity + '%';
        else
            l2 = 'Maturity : ?%';
    }

    if (item.classId() == 'Tomato') {
        t = ige.client.gameTexture.ui_seeds_tomato;
    }
    else if (item.classId() == 'Corn') {
        t = ige.client.gameTexture.ui_seeds_corn;
    }
    else if (item.classId() == 'Wheat') {
        t = ige.client.gameTexture.ui_seeds_wheat;
    }
    else if (item.classId() == 'Barn') {
        t = ige.client.gameTexture.barn;
        //l2 += LIMIT_STORAGE_BARN;
    }
    else if (item.classId() == 'Silo') {
        t = ige.client.gameTexture.silo;
        //l2 += LIMIT_STORAGE_SILO;
    }
    else if (item.classId() == 'Coldstorage') {
        t = ige.client.gameTexture.coldstorage;
        //l2 += LIMIT_STORAGE_COLD_STORAGE;
    }

    ige.client.imageItem
        .mount(ige.client.leftBar)
        .texture(t);
    ige.client.txtItemLine1
        .mount(ige.client.leftBar)
        .value(l1);
    ige.client.txtItemLine2
        .mount(ige.client.leftBar)
        .value(l2);
}

/* Changement des informations du joueur */
function updatePlayerMoney(money) {
    if (money != undefined)
        ige.client.txtPlayerMoney.value('' + money);
}

function updatePlayerNickname(nickname) {
    if (nickname != undefined)
        ige.client.txtPlayerNickname.value('' + nickname);
}

function updatePlayerLevel(level) {
    if (level != undefined)
        ige.client.txtPlayerLevel.value('Level : ' + level);
}

selectedItemForInfoDisplay = null;
function displayLeftBarInfo() {
    if (harvest_in_progress)
        displayItemInfo(selectedBuildingForHarvest);
    else
        displayItemInfo(selectedItemForInfoDisplay);
}