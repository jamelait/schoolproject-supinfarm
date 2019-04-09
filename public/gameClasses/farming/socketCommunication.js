// Connexion via socket.io
function sock_startSocket() {
    socket = io.connect('ws://' + document.getElementById('hidden-serverip').innerHTML + ':4545');
    sock_listen();
}

function sock_getFarmer(){
    socket.emit('clt_getFarmer');
    //On récupère une fois l'id du fermier
    socket.on('svr_getFarmer_response', function (data) {
        console.log("id from client side : " + data.id);
        id_farmer = data.id;
    });
}

// Démarrer l'écoute des events
function sock_listen() {
    
    socket.on('disconnect', function () {
        console.info('La connexion au serveur a été coupée')
    });

    socket.on('svr_update_player_info', function (data) {
        if (data.money != 'undefined')
            updatePlayerMoney(data.money);
        if (data.nickname != 'undefined')
            updatePlayerNickname(data.nickname);
        if (data.level != 'undefined')
            updatePlayerLevel(data.level);
    });

    // Construction d'un batiment
    socket.on('svr_build', function(data) {
        placeItem(data);
    });

    socket.on('svr_new_players', function (data) {
        //console.info('recu : ' + _.size(data.players) + ' joueurs');
        log.info('reception');
        console.info('reception');
    });

    socket.on('svr_new_player', function (data) {
        /*
        Le jeu bug si on créée les autres joueurs avant de créer le joueur principal.
        On ajoute donc tout les joueurs à une liste d'attente qui sera traitée une fois
        que le joueur principal sera créée.
        */
        return;
        addToPendingPlayers(data.nickname);
    });

    socket.on('svr_weather_rain', function (data) {
        if (data.rainIsFalling)
            weather_rain_start();
        else
            weather_rain_stop();
    });

    socket.on('srv_getTabTile_response', function(data){
       var length = data.tiles.length;
       for(var i = 0; i < length; i++){
            tabTile.push(data.tiles[i]);
//            console.log("tabTile = "+tabTile[i].farmer_id);
        }
    });
    
    socket.on('svr_battle_response', function(data){
       tabTile.push(data.tile);
    });
    
    sock_listen_harvesting();
    sock_listen_building();
}

// Informer le serveur de notre venue
function sock_justJoined() {
    socket.emit('clt_justJoined', { userid: document.getElementById('hidden-userid').innerHTML });
}

// Test
function sock_testSocket() {
    // Envoi d'un message du client au serveur
    socket.emit('clt_test', { value: 'from client' });
    // Réception d'un message
    socket.on('svr_test_response', function (data) {
        console.info('received "' + data.data + '" from server');
    });
}

/**************************** Buildings ****************************/


/**************************** Crops ****************************/

/**************************** Tile ****************************/
function sock_getTile(x, y, callback) {
    socket.emit('clt_getTile', {x: x, y: y });
    socket.on('svr_getTile_response',function(data){
        callback(data.id);
    });
}

function sock_getTabTile(){
    socket.emit('clt_getTabTile');
}

function sock_watering(x, y){
    socket.emit('clt_watering', {x: x, y: y });
}

function sock_battle(x, y, id){
   socket.emit('clt_battle', {x: x, y: y, id: id});
}