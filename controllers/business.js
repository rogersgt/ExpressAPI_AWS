const Admin = require('../models/admin.js');
const JWT = require('jwt-async');
const AWS = require('aws-sdk');
const crypto = require('crypto');
var config;
var secret;
var jwt = new JWT();


module.exports.setConfig = function(c) {
  config = c;
  secret = config[1].secret;
  jwt.setSecret(secret);
};

module.exports.sendNotification = function() {

    const env = config[3].ENV;
    AWS.config.update({region: config[0].region});
    let ses = new AWS.SES();

      var params = {
      Destination: { /* required */
        BccAddresses: [],
        CcAddresses: [],
        ToAddresses: [
          config[0].email_Receiver
        ]
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
            Data: '<p> You have a new encrypted inquiry from a paitent. Please follow this link to view: '
            + '<a href="https://' + env.server + env.port + '/#/admin">jettdental.com/#/admin</a></p>',
            Charset: 'UTF-8'
          },
          Text: {
            Data: 'You have a new encrypted inquiry from a paitent. Please copy and paiste the following'
            + ' link into your web browser to view:' + 'https://' + env.server + env.port + '/#/admin',
            Charset: 'UTF-8'
          }
        },
        Subject: { /* required */
          Data: config[0].email_Subject, /* required */
          Charset: 'UTF-8'
        }
      },
      Source: config[0].email_Sender, /* required */
      ReplyToAddresses: [],
      ReturnPath: config[0].email_Sender,
      ReturnPathArn: config[0].senderARN,
      SourceArn: config[0].senderARN
    };
      ses.sendEmail(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });

};

var activeClients = [];

// garbage collection - every 24 hours check for tokens over 24 hours old to remove
setInterval(function() {
  var now = new Date().getTime();
  for (var i = 0; i < activeClients.length; i++) {
    if (activeClients[i].loginTime < (now - 86400000)) {
      activeClients.splice(i,1);
    }
  }
}, 86400000);

module.exports.authenticate = function(token) {
  let authPromise = new Promise(function(resolve,reject) {
    if (!token) {
      reject('no token');
    } else {
      for (var i = 0; i < activeClients.length; i++) {
        if (activeClients[i].token === token) {
          resolve('found client');
        }
      }
      reject('not logged in');
    }
  });

  return authPromise;
};

module.exports.storeToken = function(jwt) {

    let tokenPromise = new Promise(function(resolve,reject) {
    let dt = new Date().getTime();
    var client = {
      token: jwt,
      loginTime: dt
    };

    activeClients.push(client);

    if (activeClients.indexOf(client) != -1) {
      resolve('token stored');
    } else {
      reject('token not stored');
    }
  });

  return tokenPromise;

};

module.exports.removeClient = function(jwt) {
  for (var i = 0; i < activeClients.length; i++) {
    if (activeClients[i].token === jwt) {
      activeClients.splice(i,1);
      return true;
    }
  }
};
