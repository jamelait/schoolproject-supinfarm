function isCrop(item) {
    if (item.classId() == 'Tomato')
        return true;
    if (item.classId() == 'Corn')
        return true;
    if (item.classId() == 'Wheat')
        return true;

    return false;
}

function sock_listen_harvesting() {
    socket.on('svr_update_crop_info', function (data) {
        handleUpdateCropInfo(data);
        // crop id - crop maturation
        // update maturation / health / water / fertility
    });

    //socket.on('svr_update_crop_info', function (data) {
    //    updateCropSprite(data.cropId, cropMaturity);
    //});

    socket.on('svr_crop_new_id', function (data) {
        handleCropNewId(data.tempId, data.newId);
    });

    socket.on('svr_persistent_crop', function (data) {
       handlePersistentCrop(data);
    });

    socket.on('svr_remove_crop', function (data) {
        handleRemoveCrop(data);
    });

    socket.on('svr_new_crop', function (data) {
        console.log('received : ', data.type, data.x, data.y, data.dbId);
        handleNewCrop(data);
    });
}
var arrCrops = new Array(); // tableau contenant les objets images de tout les crops de la map

function sock_newCrop(type, x, y, item) {
    // affecter un id temporaire à l'objet
    item.tempId = randomString();
    item.farmer_id = id_farmer;
    // enregistrer l'objet dans le tableau des crops
    arrCrops.push(item);
    // Informer le serveur de la création d'un nouveau crop
    socket.emit('clt_new_crop', { type: type, x: x, y: y, tempId: item.tempId });
}

function handleNewCrop(crop) {
    console.log('placing : ', crop.type, crop.x, crop.y, crop.dbId);
    placeItem(crop);
}

function handleCropNewId(tempId, newId) {
    // Récupérer l'objet ayant pour id temporaire oldId
    //console.info('essai de recuperation de tempId = ' + tempId);
    var item = _.find(arrCrops, function (o) { return o.tempId == tempId; });
    //if (item == 'undefined')
    //    console.info('recuperation echouée')
    //else
    //    console.log('recuperation reussie : type=' + item.classId());
    //console.info('settin newId = ' + newId);
    item.dbId = newId;
    item.texture = ige.client.gameTexture.seeds_tomato;
    item.maturity = 0;
}

function handlePersistentCrop(crop) {
                //dbId: c._id,
                //type: c.type,
                //x: c.tile_id.split(';')[0],
                //y: c.tile_id.split(';')[1],
                //maturity: c.maturity
    //console.info('placing : ' + crop.dbId);
    ige.client.placeItem(crop);
}

// Changer l'image de la crop qui a pour id cropId en fonction de cropMaturity
function handleUpdateCropInfo(data) {
    var item = _.find(arrCrops, function (o) { return o.dbId == data.cropId; });
    if (!item) {
        console.info('handleUpdateCropInfo : item not found');
        return;
    }

    item.maturity = data.cropMaturity;
    updateCropImage(item, data.cropMaturity);
}


spriteTomato = {
    0: ige.client.gameTexture.seeds_tomato,
    1: ige.client.gameTexture.seeds_tomato_1,
    2: ige.client.gameTexture.seeds_tomato_2,
    3: ige.client.gameTexture.seeds_tomato_3,
    'decay': ige.client.gameTexture.seeds_tomato_decay
};
spriteCorn = {
    0: ige.client.gameTexture.seeds_corn,
    1: ige.client.gameTexture.seeds_corn_1,
    2: ige.client.gameTexture.seeds_corn_2,
    3: ige.client.gameTexture.seeds_corn_3,
    'decay': ige.client.gameTexture.seeds_corn_decay
};
spriteWheat = {
    0: ige.client.gameTexture.seeds_wheat,
    1: ige.client.gameTexture.seeds_wheat_1,
    2: ige.client.gameTexture.seeds_wheat_2,
    3: ige.client.gameTexture.seeds_wheat_3,
    'decay': ige.client.gameTexture.seeds_wheat_decay
};

function updateCropImage(item, cropMaturity) {
    var arr;
    if (item.classId() == 'Tomato')
        arr = spriteTomato;
    else if (item.classId() == 'Corn')
        arr = spriteCorn;
    else if (item.classId() == 'Wheat')
        arr = spriteWheat;

    var t;
    if (cropMaturity < 0)
        t = arr['decay'];
    else if (cropMaturity <= 25)
        t = arr[0];
    else if (cropMaturity <= 50)
        t = arr[1];
    else if (cropMaturity <= 75)
        t = arr[2];
    else if (cropMaturity == 100)
        t = arr[3];

    item.imageEntity.texture(t);
}

harvest_in_progress = false;
text_start_harvesting = 'Start harvesting';
text_stop_harvesting = 'Stop harvesting';
selectedBuildingForHarvest = null;
function start_harvest() {
    console.log('start_harvest'); ;
    harvest_in_progress = ige.client.txtHarvest.value() == text_start_harvesting;
    if (harvest_in_progress) {
        ige.client.txtHarvest.value(text_stop_harvesting);
        ige.client.data('cursorMode', 'harvest');
        selectedBuildingForHarvest = lastSelectedItemForInfoDisplay;
    }
    else {
        ige.client.txtHarvest.value(text_start_harvesting);
        selectedBuildingForHarvest = null;
        ige.client.data('cursorMode', 'select');
    }
}

function harvest(item) {
    if (!item || !isCrop(item) || !selectedBuildingForHarvest)
        return;

    if (item.farmer_id != id_farmer) { // Si ce n'est pas le joueur actuel qui a planté
        //log.info('vous ne pouvez pas récolter ce que vous n\'avez pas planté.');
        //return;
    }

    if (item.maturity < 100) {
        log.info('Ce n\'est pas encore pret pour la récolte.')
        return;
    }

    if (selectedBuildingForHarvest.stored_quantity >= getLimitStorageByType(selectedBuildingForHarvest.classId())) {
        log.info('Le ' + selectedBuildingForHarvest.classId() + ' est plein.');
        return;
    }
        
    console.info('selectedBuildingForHarvest.dbId', selectedBuildingForHarvest.dbId);
    // Prévenir le serveur qu'on vient de récolter ceci
    var data = {
        crop_dbId: item.dbId,
        building_dbId: selectedBuildingForHarvest.dbId,
        //building_dbId: selectedItemForHarvest.dbId,
        quantity: 1
    };
    socket.emit('clt_new_crop_harvested', data);
    console.log('harvesting : ' + item.classId() + ' dbId = ' + item.dbId);
}

function handleRemoveCrop(crop) {
    console.info('handleRemoveCrop');
    // Récupérer l'item à partir du tableau
    var item = _.find(arrCrops, function (o) { return o.dbId == crop.cropId; });
    // Supprimer l'item du tableau
    delete arrCrops[_.indexOf(arrCrops, item)];
    // Retirer l'item de la carte
    item.destroy();
}