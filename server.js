const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const path = require('path');
const mongo = require('mongo');
const mongoose = require('mongoose');
const fs = require('fs');

let app = express();

// Configuration
  app.set('port', process.env.PORT || 3000);
  app.set('view engine', 'jade');
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, 'app')));

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/data/db');

mongoose.connection.once('connected', function() {
	console.log("Database connected successfully")
});

app.listen(app.get('port'), function() {
  console.log('running on port: ' + app.get('port'));
});


let data = fs.readFileSync("./configuration.json");
let config = JSON.parse(data);
const businessLayer = require('./controllers/business.js');
businessLayer.setConfig(config);
const routes = require('./controllers/routes.js')(app, config);
