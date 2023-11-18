const mongoose = require('mongoose');
const {
  db: { name, host, port },
} = require('../configs/config.mongodb');
const connectString = `mongodb://${host}:${port}/${name}`;

mongoose
  .connect(connectString)
  .then((_) => console.log('Connected Mongodb Success'))
  .catch((err) => console.log('Error Connect!'));

// dev
if (1 === 1) {
  mongoose.set('debug', true);
  mongoose.set('debug', { color: true });
}

module.exports = mongoose;
