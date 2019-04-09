/*
 * Classe pour la gestion du temps.
 */

var loopCount = 0;
var time;

function init() {
    time = new Date(2000, 1, 2, 0, 0, 0, 0);
}

exports.startLoop = startLoop;
function startLoop() {
    init();
    console.log("Game loop starting...");
    setInterval(gameLoop, 1000); // Une boucle equivault a 1 seconde
}

//exports.gameLoop = gameLoop;
function gameLoop() {
    //console.log('in game loop ' + ' - ' + time.getTime());
    
    // Avancer dans le temps
    // Chaque boucle (chaque seconde) equivault a 60 secondes virtuelles
    //time.setTime(time.getTime() + (60 * 1000)); // pour faire avancer le temps plus rapidement que irl

    placeNewFarmers();
    growCrops();
    decayCrops();
    spendMoney();
    //placeNewBuildings(); // ?
    //placeNewCrops(); // ?

    startOrStopRain();

}

function placeNewFarmers() {
    // Placer les joueurs en attente
}

var CROP_MATURATION_RATE = 5; // Les crops augmentent leur maturation time de 5% à chaque boucle.
function growCrops() {
    
    // Récupérer les crops à partir de la bdd
    MongoManager.getGrowingCrops(function (growingCrops) {
        //console.log('growCrops() growingCrops size = ' + _.size(growingCrops));
        MongoManager.openConnection();
        _.each(growingCrops, function (crop) {
            // Augmenter le maturity et enregistrer
            crop.maturity += CROP_MATURATION_RATE;
            crop.save();
            // Envoyer les nouvelles informations aux joueurs
            GameMaster.sendUpdateCropInfo(crop);

            //GameMaster.getSocketByFarmerId(crop.farmer_id, function (socket) {
            //});
        });
        MongoManager.closeConnection();
    });

    // Mettre a jour maturation_time
    // Mettre a jour health
    // Mettre a jour humidity
    // Mettre a jour fertility

    // Diminuer humidity des tiles
    // Diminuer fertility des tiles
}

function decayCrops() {
    // Diminuer le health des crops en stock
}

function spendMoney() {
    // Diminuer l'argent des joueurs en fonction des cold storage utilisés
}

var WHEATHER_RAIN_ENABLED = false; // Activer ou désactiver la pluie.
var WEATHER_RAIN_COUNTDOWN = 20; // La pluie tombe toute les 20 secondes.
var WEATHER_RAIN_FALLING_TIME = 10; // La pluie tombe pendant 10 secondes.
var countdownToRain = WEATHER_RAIN_COUNTDOWN;
var rainFallingTime = 0;

function startOrStopRain() {
    if (!WHEATHER_RAIN_ENABLED)
        return;

    if (GameMaster.rainIsFalling) { // Si la pluie est en train de tomber
        if (rainFallingTime >= WEATHER_RAIN_FALLING_TIME) {
            // Si la pluie tombe depuis 10 secondes ou plus
            // On arrete la pluie
            GameMaster.weatherSendRain(false);
            rainFallingTime = 0;
        }
        else { // La pluie doit continuer de tomber
            rainFallingTime++;
        }
    }
    else {
        if (countdownToRain <= 0) {
            // Démarrer la pluie
            GameMaster.weatherSendRain(true);
            countdownToRain = WEATHER_RAIN_COUNTDOWN;
        }
        else {
            countdownToRain--;
        }
    }
}
