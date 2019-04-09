exports.test = test;
function test() {
    console.log('testing GameMaster');
}

// arrSocket[data.pseudo] = socket;
var arrSocket = new Object();

/****************************/// Fonctions internes

function getUserIdBySocket(socket) {
    // Retourne le userId du joueur à partir de sa socket
    for (var userId in arrSocket) {
		if (socket.id == arrSocket[userId].id) {
//		    console.log('socket found');
			return userId;
			break;
		}
	}
    console.log('socket not found');
}
exports.getFarmerBySocket = getFarmerBySocket;
function getFarmerBySocket(socket, callback) {
//    _.each(arrSocket, function(s){console.log(s)});
//    console.log('getFarmerBySocket');
    
    var userId = getUserIdBySocket(socket);
    //console.log('userId = ' + userId);
    var user = MongoManager.getUserById(userId, function (user) {
        //console.log('user = ' + user);
        //console.log('user.farmer_id = ' + user.farmer_id);
        //if (!user) return;
        MongoManager.getFarmerById(user.farmer_id, function (farmer) {
            //if (!farmer) return;
            callback(farmer);
        });
    });
}

//exports.getFarmerIdBySocket = getFarmerIdBySocket;
//function getFarmerIdBySocket(socket, callback) {
//    var userId = getUserIdBySocket(socket);
//    console.log("userid = " +userId);
//    var user = MongoManager.getUserById(userId, function (user) {
//        if (!user) return;
//        console.log("user = " +user);
//        MongoManager.getFarmerById(user.farmer_id, function (farmer) {
////            console.log(" get farmer id by socket");
//            if (!farmer) return;
//            callback(user.farmer_id);
//        });
//    });
//}


function sendPlayer(socketDestination, playerNickname) {
    socketDestination.emit('svr_new_player', { nickname: playerNickname });
}

function getSocketByFarmerId(farmerId, callback) {
    // Récupérer le user qui a farmer_id == farmerId
    MongoManager.getUserByFarmerId(farmerId, function (user) {
        for (var userId in arrSocket) {
            if (user._id == userId) {
                callback(arrSocket[userId]);
            }
        }
    });
}

/****************************/// Fonctions utilisées par les events

/* 
 * socketExclusion à null si on veut envoyer à tout le monde
 */
exports.sendToAllBut = sendToAllBut;
function sendToAllBut(eventName, data, socketExclusion) {
	_.each(arrSocket, function(socket) {
        if (socketExclusion == null || socket.id != socketExclusion.id)
			socket.emit(eventName, data);
	});
}

exports.addPlayer = addPlayer;
function addPlayer(data, socket) {
    arrSocket[data.userid] = socket;
    console.log('nombre de joueurs : ', _.size(arrSocket));
}

exports.removePlayer = removePlayer;
function removePlayer(socket) {    // TODO à tester
    var userId = getUserIdBySocket(socket);
    if (userId) {
        delete arrSocket[userId];
        console.log('deconnexion de ' + userid + ' (deleted)');
    }
        
	//for (var userId in arrSocket) {
	//	if (socket.id == arrSocket[userId].id) {
	//		delete arrSocket[userId];
 //           console.log('deconnexion de ' + userId + ' (deleted)');
	//		break;
	//	}
	//}
}

exports.saveNewBuilding = saveNewBuilding;
function saveNewBuilding(data, socket) {
    // Récupérer le farmer à l'origine du nouveau batiment
    getFarmerBySocket(socket, function (farmer) {
        console.log('[Building] ' + farmer.nickname + ' a construit : ' + data.type);
        // Enregistrer le batiment en bdd
        MongoManager.createAndSaveBuilding(data.type, data.x, data.y, farmer._id, function (building) {
            // On retourne au client le vrai id du building
            console.log('tempId = ' + data.tempId + ' newId = ' + building._id);
            socket.emit('svr_building_new_id', { tempId: data.tempId, newId: building._id })
        });
    });
}

exports.sendPlayers = sendPlayers;
function sendPlayers(socketDestination) {
    _.each(arrSocket, function (socket) {
        // Pour chaque socket, récupérer le nickname du joueur concerné et l'envoyer à socketDestination
        if (socket.id != socketDestination.id) { // pour ne pas se recevoir soit-même
            getFarmerBySocket(socket, function (farmer) {
                sendPlayer(socketDestination, farmer.nickname);
            });
        }
    });
}

exports.sendJustJoinedPlayer = sendJustJoinedPlayer;
function sendJustJoinedPlayer(socketJustJoined) {
    getFarmerBySocket(socketJustJoined, function (farmer) {
        _.each(arrSocket, function (socket) {
            if (socket.id != socketJustJoined.id) { // pour ne pas se recevoir soit-même
                sendPlayer(socket, farmer.nickname);
            }
        });
    });
}

exports.rainIsFalling = false;
exports.weatherSendRain = weatherSendRain;
function weatherSendRain(b) {
    this.rainIsFalling = b;
    sendToAllBut('svr_weather_rain', { rainIsFalling: b }, null);
}


// recupérer l'owner de la tile
exports.getTileOwner = getTileOwner;
function getTileOwner(tileX, tileY, callback){
    MongoManager.getOwnerTile(tileX, tileY, function(id){
        callback(id);
    });   
//    console.log("rest = " + rest );
}
//exports.sendCropId = sendCropId;
//function sendCropId(cropId) {
//}


exports.sendUpdateCropInfo = sendUpdateCropInfo;
function sendUpdateCropInfo(crop) {
    var data = { cropId: crop._id, cropMaturity: crop.maturity };
    sendToAllBut('svr_update_crop_info', data, null);
}

exports.sendPlayerInfo = sendPlayerInfo;
function sendPlayerInfo(socket) {
    getFarmerBySocket(socket, function (farmer) {
        MongoManager.getTabTile(farmer._id, function (tabTiles) {
            var data = {
                nickname: farmer.nickname,
                money: farmer.money,
                level: _.size(tabTiles)
            };
            socket.emit('svr_update_player_info', data);
        });
    });
}

//function getFarmerLevel(farmerId) {
//    return 'X';
//}

exports.sendItems = sendItems;
function sendItems(socket) {
    //return;
    MongoManager.getCrops(function (crops) {
        _.each(crops, function (c) {
            var dbItem = {
                dbId: c._id,
                type: c.type,
                x: parseInt(c.tile_id.split(';')[0]),
                y: parseInt(c.tile_id.split(';')[1]),
                maturity: c.maturity,
                farmer_id: c.farmer_id
            };
            socket.emit('svr_persistent_crop', dbItem);
        });
        MongoManager.getBuildings(function (buildings) {
            _.each(buildings, function (obj) {
                var dbItem = {
                    dbId: obj._id,
                    type: obj.type,
                    x: parseInt(obj.tile_id.split(';')[0]),
                    y: parseInt(obj.tile_id.split(';')[1]),
                    stored_quantity: obj.stored_quantity,
                    farmer_id: obj.farmer_id
                };
                socket.emit('svr_persistent_building', dbItem);
            });
        });

    });
}