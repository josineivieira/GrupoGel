const mongoose = require('mongoose');

let connected = false;

async function connectIfNeeded() {
  if (connected) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not provided');

  mongoose.set('strictQuery', false);

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  connected = true;
  console.log('✓ Connected to MongoDB');
  return mongoose;
}

module.exports = {
  connectIfNeeded,
  mongoose
};
