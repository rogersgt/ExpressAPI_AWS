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
    AWS.config.update(
      {
        accessKeyId: config[0].accessKeyId,
        secretAccessKey: config[0].secretAccessKey,
        region: config[0].region
      }
    );
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
            Data: '<p> You have a new encrypted message. Please follow this link to view: '
            + '<a href="http://' + env.server + env.port '/#/admin">jettdental.com/#/admin</a></p>',
            Charset: 'UTF-8'
          },
          Text: {
            Data: 'You have a new encrypted inquiry from a paitent. Please copy and paiste the following'
            + ' link into your web browser to view: ' + 'http://' + env.server + env.port '/#/admin',
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

// need to implement garbage collection
var activeClients = [];

module.exports.authenticate = function(token) {
  if (!token) {
    return false;
  } else {
    for (var i = 0; i < activeClients.length; i++) {
      if (activeClients[i].token === token) {
        return true;
      }
    }
    return false;
  }
};

module.exports.storeToken = function(jwt) {
  let dt = new Date().getTime();
  var client = {
    token: jwt,
    loginTime: dt
  };
  activeClients.push(client);
};

module.exports.removeClient = function(jwt) {
  for (var i = 0; i < activeClients.length; i++) {
    if (activeClients[i].token === jwt) {
      activeClients.splice(i,1);
      return true;
    }
  }
  console.log(activeClients);
};
