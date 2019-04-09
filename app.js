 
// Dépendances de modules
_ = require('underscore');
var express = require('express')
  , routes = require('./routes')
  , app = express()
  , server = require('http').createServer(app)
  , path = require('path')
  , io = require('socket.io')
  , MemoryStore = express.session.MemoryStore
  , sessionStore = new MemoryStore();

// Variable globales
config = require('./config.json');
mongoose = require('mongoose');
if (config.mongodb.use == 'local')
    connectionString = config.mongodb.local.connectionString;
else
    connectionString = config.mongodb.mongohq.connectionString;

MongoManager = require('./game/MongoManager.js');
MongoManager.init();

GameMaster = require('./game/GameMaster.js');

// Configuration
app.configure(function(){
  app.set('port', process.env.PORT || 4545);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('SecretCookieParser'));
  app.use(express.session({store: sessionStore, secret: 'SecretCookieParser', key: 'express.sid'}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

process.on('exit', function() {
  console.log('About to exit.');
});

/**************************** Création des routes ****************************/

app.get('/', routes.index);
app.get('/play' , routes.play);
app.get('/register', routes.register);
app.post('/register', routes.register_post);
app.get('/login', routes.login);
app.post('/login', routes.login_post);
app.get('/administration_game', routes.administration_game);
app.post('/administration_game', routes.administration_game_post);


// Démarrage du serveur web
server.listen(app.get('port'), function(){
  console.log("Server listening on port " + app.get('port'));
});

var GameLoop = require('./game/GameLoop.js');
GameLoop.startLoop();

/**************************** Configuration de socket.io ****************************/

// Démarrage de l'écoute des connexions par websocket
var SocketConfig = require('./game/SocketConfig.js');
SocketConfig.setSocket(io, server);
SocketConfig.go();
