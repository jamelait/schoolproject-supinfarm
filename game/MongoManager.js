/*
 * MongoManager
 */
exports.openConnection = openConnection;
function openConnection() {
    try {
        mongoose.connect(connectionString, function (err) {
            if (err)
            //{
                throw err;
            //} else {
                //console.log('MongoDB connected');
            //}
        });
    } catch (err) {
        console.log("ERROR : " + err);
    }
}

exports.closeConnection = closeConnection;
function closeConnection() {
    mongoose.disconnect(function(err) {
        if (err) {
            throw err;
        } else {
            //console.log('MongoDB disconnected');
        }
    });
}

exports.init = init;
function init() {
    // Initialisation du schema User
    var UserSchema = new mongoose.Schema({
        mail : String,
        password : String,
        isAdmin : Boolean,
        farmer_id : String
    });
    var ConstantSchema = new mongoose.Schema({
        id_constant : Number,
        start_money : Number,
        tile_radius : Number,
        market_price : Number,
        default_weapon : String,
        regeneration_speed : Number,
        grace_time : Number,
        crop_maturation : Number,
        crop_productivity : Number,
        crop_decay : Number,
        tomate_price : Number,
        mais_price : Number,
        ble_price : Number
    });
    var FarmerSchema = new mongoose.Schema({
        nickname : String,
        level : Number,
        money : Number,
        alliance_id : String 
    });
    var TileSchema = new mongoose.Schema({
        id_farmer : String,
        type : String,
        fertility : Number,
        position_x : Number,
        position_y : Number,
        humidity : Number
    });
    var CropSchema = new mongoose.Schema({
        farmer_id: String,
        type: String,
        tile_id: String,
        health: Number,
        maturity: Number
    });
    var BuildingSchema = mongoose.Schema({
        farmer_id: String,
        type: String,
        tile_id: String,
        stored_quantity: Number
    });

    // Creation du model basé sur le schéma à l'aide de mongoose
    this.UserModel = mongoose.model('user', UserSchema);
    this.ConstantModel = mongoose.model('constant', ConstantSchema);
    this.FarmerModel = mongoose.model('farmer', FarmerSchema);
    this.TileModel = mongoose.model('Tile', TileSchema);
    this.CropModel = mongoose.model('Crop', CropSchema);
    this.BuildingModel = mongoose.model('Building', BuildingSchema);
}

/*
 ********************************  User
 */
exports.createUser = createUser;
function createUser(mail, password, nickname, difficulty) {
    MongoManager.ConstantModel.findOne({ id_constant: 1 }, function (err, constant) {
            // Retourne un objet UserModel (model mongoose)
    var farmer;
    if(difficulty=="easy"){
        farmer = MongoManager.createFarmer(nickname, 1, constant.start_money, null);
    }else if(difficulty=="medium"){
        farmer = MongoManager.createFarmer(nickname, 1, constant.start_money / 2, null);
    }else if(difficulty=="hard"){
        farmer = MongoManager.createFarmer(nickname, 1, constant.start_money / 10, null);
    }
    
    var user = new MongoManager.UserModel({
                mail: mail, 
                password: password, 
                isAdmin: false, 
                farmer_id: null
        });
    saveFarmer(farmer, user);

//        console.log('createUser constant=' + constant);
    });

}

exports.saveUser = saveUser;
function saveUser(user) {
    //console.log('in MongoManager.saveUser(%s)', user);
    //try{
    openConnection();
    //}catch(err){
    //    console.log("error : "+  err);
    //}
    //console.log("use : " + user);
    //console.log("dans le saveUser");
    user.save(function(err) {
        if (err){
            throw err;
        }else console.log('user created : ' + user._id + ' ' + user.mail);
    });
    
    closeConnection(); // TODO quand faut-il fermer la connexion ?
}

exports.getUserByMail = getUserByMail;
function getUserByMail(mail, callback) {
    //console.log('searching for %s', mail);
    openConnection();
    var q = MongoManager.UserModel.findOne({ mail: mail }, function (err, obj) {
        closeConnection();

        if (err)
            console.error('erreur getUserByMail');
        else
            callback.fn(obj, callback.req, callback.res);
    });
}

exports.getUserById = getUserById;
function getUserById(userId, callback) {
    //console.log('getUserById for %s', userId);
    openConnection();
    var q = MongoManager.UserModel.findOne({ _id: userId }, function (err, obj) {
        closeConnection();

        if (err)
            console.error('erreur getUserByMail');
        else
            callback(obj);
    });
}

exports.getUserByFarmerId = getUserByFarmerId;
function getUserByFarmerId(farmerId, callback) {
    openConnection();
    var q = MongoManager.UserModel.findOne({ farmer_id: farmerId }, function (err, obj) {
        //closeConnection();

        if (err)
            console.error('erreur getUserByFarmerId');
        else
            callback(obj);
    });
}

/*
 ********************************  Farmer
 */
exports.createFarmer = createFarmer;
function createFarmer(nickname, level, money, alliance_id){
    return new this.FarmerModel({
        nickname : nickname,
        level : level,
        money : money,
        alliance_id : alliance_id 
    })
}

exports.saveFarmer = saveFarmer;
function saveFarmer(farmer, user){
    try{
    openConnection();
    }catch(err){
        console.log("error : "+  err);
    }
    farmer.save(function(err){
        if (err){
            throw err;
        }
        else{ 
            user.farmer_id = farmer._id;
            user.save(function(err) {
                if (err){
                    throw err;
                }else console.log('user created : ' + user._id + ' ' + user.mail);
                // on définit un champs de tile appartenant au fermier
                var q = MongoManager.ConstantModel.findOne({id_constant :1}, function(err, constant){
                    if (err) console.log('erreur');
                    else{ 
                        MongoManager.TileModel.find({}, function(err, docs) {
                                if (!err){ 
                                    var maxX = 0;
                                    var length = docs.length;
                                    for(var j = 0; j < length;j++){
                                        if(docs[j].id_farmer != "")
                                            if(maxX < docs[j].position_x)
                                                maxX = docs[j].position_x;
                                    }
                                    var firstX=0;
                                    if(maxX == 0){
                                        firstX = 0;
                                    }else
                                        firstX = maxX + constant.tile_radius;
                                    var lastX = firstX + 8;
                                    var fertility = 0;
                                    
                                    for(firstX;firstX<lastX;firstX++){
                                        fertility = Math.floor((Math.random()*100)+1);
                                        for(j=0;j<8;j++){
                                            if(fertility > 90)
                                                fertility--;
                                            else if(fertility < 10)
                                                fertility++;
                                            else 
                                                fertility++;
//                                            console.log(fertility);
                                            setOwnerTile(firstX, j, user.farmer_id, fertility);
                                        }
                                    }
                                    
                                }else { throw err;}
                            }
                        );
                        
                    }
                });
            }); 
        }
        
    });
}


exports.getFarmerId = getFarmerId;
function getFarmerId(farmerId, callback) {
    //console.log('getFarmerById for %s', farmerId);
    openConnection();
    var q = MongoManager.FarmerModel.findOne({ _id: farmerId }, function (err, obj) {
        closeConnection();

        if (err)
            console.error('erreur getFarmerById');
        else
            callback(obj.id);
    });
}

exports.getFarmerById = getFarmerById;
function getFarmerById(farmerId, callback) {
    //console.log('getFarmerById for %s', farmerId);
    openConnection();
    var q = MongoManager.FarmerModel.findOne({ _id: farmerId }, function (err, obj) {
        closeConnection();

        if (err)
            console.error('erreur getFarmerById');
        else
            callback(obj);
    });
}

/*
 ********************************  Constant
 */

exports.createConstant = createConstant;
function createConstant(id_constant, start_money, tile_radius, market_price, default_weapon, regeneration_speed, grace_time, crop_maturation, crop_productivity, crop_decay, tomate_price, mais_price, ble_price) {
    // Retourne un objet constantmodel
    return new this.ConstantModel({
        id_constant : id_constant,
        start_money: start_money, 
        tile_radius: tile_radius, 
        market_price: market_price, 
        default_weapon: default_weapon,
        regeneration_speed : regeneration_speed,
        grace_time : grace_time,
        crop_maturation : crop_maturation,
        crop_productivity : crop_productivity,
        crop_decay : crop_decay,
        tomate_price : tomate_price,
        mais_price : mais_price,
        ble_price : ble_price
    })

}

exports.saveConstant = saveConstant;
function saveConstant(constant) {
    //try{
    openConnection();
    //}catch(err){
    //    console.log("error : "+  err);
    //}
    
    var query = MongoManager.ConstantModel.count(function(err, count){
        if(count==1){
            var q = MongoManager.ConstantModel.findOne({id_constant :1}, function(err, doc){
                if (err) console.log('erreur');
                else{ 
                    console.log('constant : '+ doc);
                    doc.start_money = constant.start_money;
                    doc.tile_radius = constant.tile_radius;
                    doc.market_price = constant.market_price;
                    doc.default_weapon = constant.default_weapon;
                    doc.regeneration_speed = constant.regeneration_speed;
                    doc.grace_time = constant.grace_time;
                    doc.crop_maturation = constant.crop_maturation;
                    doc.crop_productivity = constant.crop_productivity;
                    doc.crop_decay = constant.crop_decay;
                    doc.tomate_price = constant.tomate_price;
                    doc.mais_price = constant.mais_price;
                    doc.ble_price = constant.ble_price;
                    doc.save();
                    console.log(' l\'objet constante a ete sauvegarder');
                }

            });
        }else{
            constant.save(function(err){
                if (err){
                    throw err;
                }
                else{ 
                    console.log('constant created : ' + constant._id + ' ' +constant.start_money);
                }

            });
        }
    });
    
}


exports.getConstant = getConstant;
function getConstant(req, res) {
    //try{
    openConnection();
    //}catch(err){
    //    console.log("error : "+  err);
    //}
    var query = this.ConstantModel.count(function(err, count){
        if (err) console.log('erreur');
        else if(count>0){
            var q = MongoManager.ConstantModel.findOne({id_constant :1}, function(err, constant){
                if (err) console.log('erreur');
                else{ 
                    console.log('constant : '+ constant);
                    res.render('administration_game', {constant:constant});
                }
                
            });
        }else{
            var constant = MongoManager.createConstant(
            1, //id_constant
            10000, //start_money
            50, //tile_radius
            30, //market_price
            "", //default_weapon
            60, //regeneration_speed
            60, //grace_time
            60, //crop_maturation
            60, //crop_productivity
            30, //crop_decay
            200, //tomate_price
            100, //mais_price
            50 //ble_price
            );
            saveConstant(constant);
            console.log('constant : '+ constant);
            res.render('administration_game', {constant:constant});
        }
    });
}


/**************************Tiles*********************************/

exports.createTile = createTile;
function createTile(id_farmer, type, fertility, position_x, position_y, humidity){
    console.log("fertility = " +fertility);
    return new this.TileModel({
        id_farmer : id_farmer,
        type : null,
        fertility : fertility,
        position_x : position_x,
        position_y : position_y,
        humidity : humidity
    });
}

// definir la possession d'une tile et sauvegader !!!
exports.setOwnerTile = setOwnerTile;
function setOwnerTile(x, y, id_farmer, fertility){
    openConnection();
    
    var tile = null;

    var humidity = Math.floor((Math.random()*100)+1);
    tile = MongoManager.createTile(id_farmer, null, fertility, x, y, humidity);
    tile.save(function(err){
                if (err){
                    throw err;
                }
                else{ 
                            console.log('tile sauved (' + x +',' + y+ ')' + "fertility = "+fertility);
                }
    });
    
    closeConnection();
}

exports.getOwnerTile = getOwnerTile;
function getOwnerTile(tileX, tileY, callback){
    var query = this.TileModel.count({position_x :tileX, position_y:tileY}, function(err, count){
        if (err) console.log('erreur');
        else if(count==0){
            console.log("count :" + count);
            MongoManager.setOwnerTile(tileX, tileY, 0);
            callback(0);
        }else{
            var q = MongoManager.TileModel.findOne({position_x :tileX, position_y :tileY}, function(err, doc){
                if (err) console.log('erreur');
                else{ 
                    console.log("id_farmer dans le getOwnerTile: "+ id);
                    callback(doc.id_farmer);
                }    
            });
        }
    });
}

// on récupère un tableau de tile appartenant au fermier
exports.getTabTile = getTabTile;
function getTabTile(farmer_id, callback){
    MongoManager.TileModel.find({id_farmer :farmer_id}, function(err, docs) {
            if (!err){ 
                callback(docs);
                      }
            else { throw err;}
        }
    );
}

exports.Watering = Watering;
function Watering(x, y){
    var q = MongoManager.TileModel.findOne({position_x :x, position_y :y}, function(err, doc){
        if (err) console.log('erreur');
        else{ 
            doc.humidity = doc.humidity + 10;
            doc.save();
        }    
    });
}

exports.Battle = Battle;
function Battle(x, y, id, callback){
    var query = this.TileModel.count({position_x :x, position_y:y}, function(err, count){
        if (err) console.log('erreur');
        else if(count==0){
            var fertility = Math.floor((Math.random()*100)+1);
            var humidity = Math.floor((Math.random()*100)+1);
//            setOwnerTile(x, y, id, fertility);
            var tile = MongoManager.createTile(id, null, fertility, x, y, humidity);
            tile.save(function(err){
                if (err){
                    throw err;
                }
                else{ 
                    callback(tile);
                }
            });
        }
    });
}

/*
 ********************************  Crops
 */

exports.createAndSaveCrop = createAndSaveCrop;
function createAndSaveCrop(type, x, y, farmerId, callback) {
    //openConnection();
    var crop = new this.CropModel({
        farmer_id: farmerId,
        type: type,
        tile_id: x + ';' + y,
        health: 100,
        maturity: 0
    });

    crop.save();

    callback(crop);
}

exports.getGrowingCrops = getGrowingCrops;
function getGrowingCrops(callback) {
    openConnection();
    var query = this.CropModel.find({ maturity: { $lt: 100} }, function (err, doc) {
        closeConnection();
        callback(doc);
    });
}

exports.getCrops = getCrops;
function getCrops(callback) {
    openConnection();
    var query = this.CropModel.find({}, function (err, doc) {
        closeConnection();
        callback(doc);
    });
}

exports.getBuildings = getBuildings;
function getBuildings(callback) {
    openConnection();
    var query = this.BuildingModel.find({}, function (err, doc) {
        closeConnection();
        callback(doc);
    });
}

//exports.save = save;
//function save(obj) {
//    openConnection();
//    obj.save();
//    closeConnection();
//}

exports.createAndSaveBuilding = createAndSaveBuilding;
function createAndSaveBuilding(type,x,y,farmerId,callback ){

    var building = new this.BuildingModel({
        farmer_id: farmerId,
        type: type,
        tile_id: x + ';' + y,
        health: 100,
        stored_quantity: 0
    });

    building.save();

    callback(building);
}

exports.getBuildingById = getBuildingById;
function getBuildingById(buildingId, callback) {
    openConnection();
    console.log('searching for buildin id ' + buildingId);
    var q = this.BuildingModel.findOne({ _id: buildingId }, function (err, obj) {
        closeConnection();
        if (err)
            console.error('erreur getBuildingById');
        else {
            //console.log('we found it : ' + obj)
            callback(obj);
        }
            
    });
}

exports.removeCropById = removeCropById;
function removeCropById(cropId) {
    this.CropModel.remove({ _id: cropId }, function (err) {
        if (!err) {
            console.log('crop deleted!');
        }
        else {
            console.log('error removeCropById');
        }
    });
}

exports.farmerBoughtCrop = farmerBoughtCrop;
function farmerBoughtCrop(farmer, cropType, callback) {
    var q = MongoManager.ConstantModel.findOne({ id_constant: 1 }, function (err, constant) {
        if (err) console.log('erreur');
        else {

            if (cropType == 'Tomato')
                farmer.money -= constant.tomate_price;
            else if (cropType == 'Corn')
                farmer.money -= constant.mais_price;
            else if (cropType == 'Wheat')
                farmer.money -= constant.ble_price;

            farmer.save();

            callback(farmer);
        }
    });
}

exports.farmerBoughtBuilding = farmerBoughtBuilding;
function farmerBoughtBuilding(farmer, buildingType, callback) {
    if (buildingType == 'Barn')
        farmer.money -= 150;
    else if (buildingType == 'Silo')
        farmer.money -= 100;
    else if (buildingType == 'Coldstorage')
        farmer.money -= 200;

    farmer.save();

    callback(farmer);

    //var q = MongoManager.ConstantModel.findOne({ id_constant: 1 }, function (err, constant) {
    //    if (err) console.log('erreur');
    //    else {

    //    }
    //});
}
