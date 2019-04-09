var io;
var server;

exports.setSocket = setSocket;
function setSocket(socket, svr) {
    io = socket;
    server = svr;
}

exports.go = go;
function go() {
    io = io.listen(server);

    io.set('authorization', function (data, accept) {
        //console.log('in authorization...');
        accept(null, true);
    });

/**************************** Enregistrement des events ****************************/

    io.sockets.on('connection', function (socket, session) {
        //console.log('nouvelle connexion');

        // Déconnexion
        socket.on('disconnect', function () {
            console.log('deconnexion');
        });

        // Test
        socket.on('clt_test', function (data) {
            console.log('data from client : ' + data.value);
            socket.emit('svr_test_response', { data: 'coucou from server' });
        });

        // Un joueur a rejoint la partie
        socket.on('clt_justJoined', function (data) {
            handleJustJoined(data, socket);
        });

        /**************************** Buildings ****************************/

        socket.on('clt_build', function (data) {
            handleBuild(data, socket);
        });

        /**************************** Tile ****************************/
        socket.on('clt_getTile', function (data) {
            handleGetTile(data, socket);
        });

        socket.on('clt_getFarmer', function (data) {
            handleGetFamerId(data, socket);
        });

        socket.on('clt_getTabTile', function (data) {
            handleGetTabTile(data, socket);
        });
        
        socket.on('clt_watering', function (data){
            handleWatering(data, socket);
        });
        
        socket.on('clt_battle', function (data){
            handleBattle(data, socket);
        });

        /**************************** Crops ****************************/
        socket.on('clt_new_crop', function (data) {
            handleNewCrop(data, socket);
        });

        socket.on('clt_new_crop_harvested', function (data) {
            handleNewCropHarvested(data, socket);
        });
        // Fin
    });
}

function handleJustJoined(data, socket) {
    // Garder en mémoire le joueur et sa connexion
    GameMaster.addPlayer(data, socket);
    // Envoyer au joueur qui vient d'arriver tout les autres joueurs
    GameMaster.sendPlayers(socket);
    // Informer les autres joueurs de la venue d'un nouveau joueur
    GameMaster.sendJustJoinedPlayer(socket);
    // Informer le joueur de ses informations
    GameMaster.sendPlayerInfo(socket);
    // Envoyer au joueur les items
    GameMaster.sendItems(socket);
}

function handleBuild(data, socket) {
    // Enregistrer le batiment en bdd
    GameMaster.saveNewBuilding(data, socket);
    // Envoyer le nouveau batiment aux autres joueurs
    GameMaster.sendToAllBut('svr_build', data, socket);
    // Mettre à jour l'argent du joueur

    GameMaster.getFarmerBySocket(socket, function (farmer) {
        MongoManager.farmerBoughtBuilding(farmer, data.type, function (f) {
            // Envoyer au joueur son argent
            socket.emit('svr_update_player_info', { money: f.money });
        });
    });
}


function handleGetTile(data, socket){
    GameMaster.getTileOwner(data.x, data.y, function(id){
       socket.emit('svr_getTile_response', { id: id });
    });
}

function handleGetFamerId(data, socket){
    console.log("get farmer id");
    GameMaster.getFarmerBySocket(socket, function(farmer){
       console.log("id : "+farmer._id);
       socket.emit('svr_getFarmer_response', { id: farmer._id });
    });
}

function handleGetTabTile(data, socket){
    GameMaster.getFarmerBySocket(socket, function(farmer){
        console.log("id in getTabTile server : " +farmer._id);
        MongoManager.getTabTile(farmer._id, function(tiles){
//            console.log(tiles);
            socket.emit('srv_getTabTile_response', {tiles: tiles});
        });
    });
}


function handleWatering(data, socket){
    MongoManager.Watering(data.x, data.y);
}

function handleBattle(data, socket){
    MongoManager.Battle(data.x, data.y, data.id, function (tile) {
        socket.emit('svr_battle_response', { tile: tile });
        GameMaster.sendPlayerInfo(socket);
    });
}

// Une nouvelle graine a été plantée.
function handleNewCrop(data, socket) {
    //console.log('new crop : ' + data.type);
    GameMaster.getFarmerBySocket(socket, function (farmer) {

        // On l'enregistre en bdd
        MongoManager.createAndSaveCrop(data.type, data.x, data.y, farmer._id, function (crop) {
            // On retourne au client le vrai id du crop
            socket.emit('svr_crop_new_id', { tempId: data.tempId, newId: crop._id });
            
            // Mettre à jour l'argent du joueur
            MongoManager.farmerBoughtCrop(farmer, data.type, function (f) {
                // Envoyer au joueur son argent
                socket.emit('svr_update_player_info', { money: farmer.money });
            });

            // Envoyer le nouveau crop aux autres joueurs
            var cropData = {
                dbId: crop._id,
                x: data.x,
                y: data.y,
                type: data.type
            };
            //crop.x = data.x;
            //crop.y = data.y;
            //crop.dbId = crop._id;
            console.log('sending : ', cropData.type, cropData.x, cropData.y, cropData.dbId);
            GameMaster.sendToAllBut('svr_new_crop', cropData, socket);
        });
    });

}

function handleNewCropHarvested(data, socket) {
    console.log('handleNewCropHarvested', data);
    // changer la valeur stored_quantity du building
    MongoManager.getBuildingById(data.building_dbId, function (building) {
        building.stored_quantity += data.quantity;
        building.save();
        // Envoyer au joueur la nouvelle stored quantity du building
        socket.emit('svr_update_building_info', { buildingId: data.building_dbId, stored_quantity: building.stored_quantity });
    });
    // supprimer la crop de la bdd
    MongoManager.removeCropById(data.crop_dbId);
    // dire aux autres joueurs de supprimer la crop de leur map
    GameMaster.sendToAllBut('svr_remove_crop', { cropId: data.crop_dbId });
}