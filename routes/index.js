// INDEX
exports.index = function(req, res){
    res.render('index', { title: 'Fermier à Bagdad'});
};


// REGISTER
exports.register = function(req, res) {
    res.render('register')
}

// REGSITER POST
exports.register_post = function (req, res) {
    // Vérifer les données
    // TODO
    //	nickname = req.body.nickname || 'undefined';
    //	req.session.nickname = nickname;
    // Créer un nouveau User

    var user = MongoManager.createUser(req.body.mail, req.body.password, req.body.nickname, req.body.difficulty);
    //    MongoManager.saveUser(user);
    res.redirect('/play');
};

// PLAY
exports.play = function (req, res) {
    // Si le joueur est connecté
    if (!(typeof req.session.userid == 'undefined' || req.session.userid == 'undefined')) {
        res.render('play', { serverip: config.server.ip, userid: req.session.userid });
    }
    else {
        res.redirect('/login');
    }
}

// ADMINISTRATION DU JEU
exports.administration_game = function(req, res){
    MongoManager.getConstant(req, res);
}

// ADMINISTRATION POST
exports.administration_game_post = function(req, res) {
    
    var constant = MongoManager.createConstant(1, req.body.start_money, req.body.tile_radius, req.body.market_price, req.body.default_weapon, req.body.regeneration_speed, req.body.grace_time, req.body.crop_maturation, req.body.crop_productivity, req.body.crop_decay, req.body.tomate_price, req.body.mais_price, req.body.ble_price);
    MongoManager.saveConstant(constant);
    res.render('index', { title: 'Fermier à Bagdad'});
//    res.redirect('/index');
};

// LOGIN
exports.login = function (req, res) {
    res.render('login', { message: "" });
}

// LOGIN POST
exports.login_post = function (req, res) {
    // Verifier email et mot de passe
    //console.log('mail = %s - password = %s', mail, password);

    // Récupérer le user et continuer le traitement grâce à un callback
    var callback = { fn: login_post_callback, req: req, res: res};
    MongoManager.getUserByMail(req.body.mail, callback);
}

// LOGIN POST CALLBACK
function login_post_callback(user, req, res) {

    if (user != null && user != 'undefined') {
        if (user.password == req.body.password) {
            req.session.userid = user.id;

            res.redirect('/play');
        }
    }

    res.render('login', { message: "L'email ou le mot de passe est incorrect." });
}