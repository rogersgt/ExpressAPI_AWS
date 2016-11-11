const mongoose = require('mongoose');
const schema = mongoose.Schema;

const message = new schema({
  encryptedData: String,
  timeStamp: { type: Date, default: Date.now },
  read: {type: Boolean, default: false }
});

const Message = mongoose.model('Message', message);

module.exports = Message;
