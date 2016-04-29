var express = require('express');
var app = express();
var sso = require('./controllers/single_sign_on');
var url = require('url');

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

if (conf.ssl) {
  var options = {
    key: fs.readFileSync(conf.key),
    cert: fs.readFileSync(conf.cert)
  };
  server = https.createServer(options, app).listen(conf.portNum);
} else {
  server = require('http').createServer(app).listen(conf.portNum);
  console.log('Socket.io server listening on port ' + conf.portNum);
}

var io = require('socket.io')(server, { serveClient: false });

global.io = io;
global.server = server;

// Load the database module
var database = require('./controllers/database');
global.db = database.db;
global.collections = database.collections;

// Load the websocket
var websockets = require('./controllers/websockets');

app.use(express.static('public'));

app.get('/login', function(req, res) {
  //TODO: Replace the redirect URI with an actual one
  var uri = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl
  });

  res.redirect(sso.redirects.login(uri));
});

/**
 * The root of the website
 */
app.get('/', function (req, res) {
  // Redirect the user to the index.php page
  console.log(req.headers);

  res.redirect('index.php');
});

app.listen(3000, function () {
  console.log('MoocChat listening on port 3000');
});
