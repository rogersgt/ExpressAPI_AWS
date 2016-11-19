module.exports = function(app, config) {

  const bodyParser = require('body-parser');
  const fs = require('fs');
  const crypto = require('crypto');
  const Admin = require('../models/admin.js');
  const Message = require('../models/message.js');
  let secret = config[1].secret;
  const JWT = require('jwt-async');
  var jwt = new JWT();
  jwt.setSecret(secret);
  const businessLayer = require('./business.js');

  app.get('/api', function (req, res) {
    res.json({server: 'https rest api'});
  });

  app.post('/api/mail', function(req, res) {

    try {
      var cipher = crypto.createCipher('aes192', secret);
      var string = JSON.stringify(req.body);
        var cryptedString = cipher.update(string,'utf8','base64');
        cryptedString += cipher.final('base64');

        var m = new Message({
          encryptedData: cryptedString
        });
        m.save();

        businessLayer.sendNotification();
        res.status(200).send(true);

    } catch (e) {
        console.log(e);
        var date = Date.now.toString();
        var file = data + '-ErrLog.txt';
        fs.writeFile(file, e);
        res.status(404).send(false);
    }
  });

  app.post('/api/delete-message', function(req, res) {
    let id = req.body.id;
    let token = req.headers.authorization;
    businessLayer.authenticate(token).then(function(data) {
      Message.findById(id, function(err,message) {
        if (message) {
          console.log(message);
          message.remove();
          res.send(true);
        } else if (err) {
          res.status(404).send(false);
        }
      });
    }, function(err) {
      res.status(401).send(false);
    });
  });

  app.get('/api/all-messages', function(req,res) {
    var token = req.headers.authorization;
    let validation = new Promise(function(resolve,reject) {
      businessLayer.authenticate(token).then(function(data) {
        resolve(true);
      }, function(err) {
        reject(err);
      });
    });

    validation.then(function(data) {
      Message.find({}, function(err,messages) {
        if (err) {
          console.log(err);
        } else {
          for (var i = 0; i < messages.length; i++) {
            var decipher = crypto.createDecipher('aes192', secret);
            let encryptedData = messages[i].encryptedData;
            let dec = decipher.update(encryptedData, 'base64', 'utf8')
            dec += decipher.final('utf8');
            messages[i].encryptedData = dec;
          }
          res.send(messages);
        }
      });
    }, function(err) {
      console.log(err);
      res.send(false);
    });
  });


  app.post('/api/get-message', function(req,res) {
    var decipher = crypto.createDecipher('aes192', secret);
    let token = req.headers.authorization;
    businessLayer.authenticate(token).then(function(data) {
      let id = req.body.messageID;
        Message.findById(id, function(err,message) {

          if (err) console.log(err);

          try {
            let encryptedData = message.encryptedData;
            let dec = decipher.update(encryptedData, 'base64', 'utf8')
            dec += decipher.final('utf8');
            res.send(dec);
          } catch (e) {
            console.log(e);
          }
        });
    }, function(err) {
      res.send(false);
    });
  });

  app.post('/api/login', function(req,res) {
    let credentials = req.body;
    var cipher = crypto.createCipher('aes192', secret);
    var cryptedPW = cipher.update(credentials.password, 'utf8', 'hex');
    cryptedPW += cipher.final('hex');
    console.log('hit login route');
    Admin.findOne({email: credentials.email.toLowerCase()}).exec(function(err,user) {
      if (user != null) {
        if (user.password != cryptedPW) {
          res.send(false);
        } else {

          jwt.sign({email: credentials.email.toLowerCase()}, function(err,token) {
            if (err) {
              console.log(err);
               res.send(false);
            }
            let storeIt = new Promise(function(resolve,reject) {
              businessLayer.storeToken(token).then(function(data) {
                resolve('added');
              }, function(err) {
                console.log(err);
                reject(err);
              });
            });
            storeIt.then(function(data) {
              res.send(token);
            }, function(err) {
              console.log(err);
            });
          });

        }
      } else {
        res.send(false);
      }
    });

  });

  app.get('/login', function(req,res) {
    res.redirect('/#/login');
  });

  app.post('/api/logout', function(req,res) {
    let token = req.body.token;
    businessLayer.removeClient(token);
  });

  app.post('/api/update-admin', function(req,res) {

    let newPassword = req.body.newPassword;
    let token = req.headers.authorization;
    businessLayer.authenticate(token).then(function(result) {
      jwt.verify(token, function(err,data) {
        let emailAddress = data.claims.email;
        Admin.findOne({email: emailAddress}, function(err,admin) {
          if (err) {
            console.log(err);
          }
          var cipher = crypto.createCipher('aes192', secret);
          var cryptedPW = cipher.update(newPassword, 'utf8', 'hex');
          cryptedPW += cipher.final('hex');
          admin.password = cryptedPW;

          admin.save(function(err) {
            if (err) {
              console.log(err);
              res.send(false);
            } else {
              res.send(true);
            }
          });
        });
      });
    }, function(err) {
      res.send(false);
    });
  });

  app.get('update-admin', function(req,res) {
      res.redirect('/#/login');
  });

  app.post('/api/update-message', function(req,res) {
    let params = req.body;
    Message.findById(params.messageID, function(err,message) {
      message.read = params.read;
      message.save(function(err) {
        if (err) console.log(err);
      });
    });
  });

}
