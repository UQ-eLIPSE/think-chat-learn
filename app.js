var express = require('express');
var app = express();

var phpExpress = require('php-express')({
  binPath: 'php'
});

app.set('views', './views');
app.engine('php', phpExpress.engine);
app.set('view engine', 'php');

// Route all php files to php-express
app.all(/.+\.php$/, phpExpress.router);

global.app = app;

var conf;
if (process.argv.length >= 2 + 1) {
  conf = require(process.argv[2]);
} else {
  conf = require('./config/conf.json');
}

global.conf = conf;

// Load the database module
var database = require('./controllers/database');
global.db = database.db;
global.collections = database.collections;

// Load the websocket
var websockets = require('./controllers/websockets');

app.use(express.static('public'));

app.get('/', function (req, res) {

});

app.listen(3000, function () {
  console.log('MoocChat listening on port 3000');
});
