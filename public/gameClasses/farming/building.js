//var ARR_LIMIT_STORAGE = {
//    silo: 50,
//    barn: 100,
//    cold_storage: 60
//};

//LIMIT_STORAGE = 30;
LIMIT_STORAGE_SILO = 5;
LIMIT_STORAGE_BARN = 100;
LIMIT_STORAGE_COLD_STORAGE= 60;

function getLimitStorageByType(type) {
    if (type == 'Barn') {
        return LIMIT_STORAGE_BARN;
    }
    else if (type == 'Silo') {
        return LIMIT_STORAGE_SILO;
    }
    else if (type == 'Coldstorage') {
        return LIMIT_STORAGE_COLD_STORAGE;
    }

    return 0;
}

function isBuilding(item) {
    if (item.classId() == 'Silo')
        return true;
    if (item.classId() == 'Barn')
        return true;
    if (item.classId() == 'Coldstorage')
        return true;

    return false;
}

var arrBuildings = new Array();

function sock_listen_building() {
    socket.on('svr_persistent_building', function (data) {
        handlePersistentBuilding(data);
    });
    socket.on('svr_building_new_id', function (data) {
        console.info('received new id for building');
        handleBuildingNewId(data.tempId, data.newId);
    });
    socket.on('svr_update_building_info', function (data) {
        console.info('received building info');
        handleUpdateBuildingInfo(data);
    });
}

// Informer le serveur de la construction d'un nouveau batiment
function sock_newBuilding(type, x, y, item) {
    // Affecter un id temporaire à l'objet
    item.tempId = randomString();
    // Enregistrer l'objet dans le tableau des buildings
    arrBuildings.push(item);
    // Informer le serveur de la création d'un nouveau building
    socket.emit('clt_build', { type: type, x: x, y: y, tempId: item.tempId });
}

// On a créée un nouveau batiment, cette fonction va lui affecter un id
function handleBuildingNewId(tempId, newId) {
    var item = _.find(arrBuildings, function (o) { return o.tempId == tempId; });
    item.dbId = newId;
    item.stored_quantity = 0;
}

function handlePersistentBuilding(building) {
    ige.client.placeItem(building);

}

function handleUpdateBuildingInfo(building) {
    var item = _.find(arrBuildings, function (o) { return o.dbId == building.buildingId; });
    item.stored_quantity = building.stored_quantity;
}