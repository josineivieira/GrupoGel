/*
Simple smoke test to validate persistence in MongoDB and file deletions.
- Creates a temporary delivery
- Creates a dummy file under BACKEND_UPLOADS_DIR/<city>/<deliveryNumber>/test.txt
- Deletes delivery using Delivery model and deleteDeliveryFiles helper
- Verifies DB and file removal
*/
const fs = require('fs');
const path = require('path');
const { connectIfNeeded } = require('../src/db/mongo');
const Delivery = require('../src/models/Delivery');
const { deleteDeliveryFiles } = require('../src/utils/storageUtils');

async function main() {
  // Fallbacks to avoid shell quoting issues when running locally from PowerShell/cmd
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://app_entregas_user:dFhd1RYIImvIHl4N@cluster0.c25w2rw.mongodb.net/grupogel?retryWrites=true&w=majority';
  process.env.BACKEND_UPLOADS_DIR = process.env.BACKEND_UPLOADS_DIR || (require('path').join(__dirname, '..', 'persistent_uploads'));

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set. Set it and re-run the script.');
    process.exit(1);
  }

  await connectIfNeeded();

  const city = 'manaus';
  const deliveryNumber = 'SMOKE_' + Date.now();

  console.log('Creating delivery', deliveryNumber);
  const created = await Delivery.create({ deliveryNumber, city, status: 'pending', documents: {} });
  console.log('Created with id:', created._id);

  // create persistent uploads dir
  const base = process.env.BACKEND_UPLOADS_DIR ? path.resolve(process.env.BACKEND_UPLOADS_DIR) : path.join(__dirname, '..', 'uploads');
  const dir = path.join(base, city, deliveryNumber);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'test.txt');
  fs.writeFileSync(filePath, 'hello');
  console.log('Created test file at', filePath);

  // attach file to delivery
  const rel = path.join(deliveryNumber, 'test.txt').replace(/\\/g, '/');
  const docs = { canhotNF: rel };
  await Delivery.updateOne({ _id: created._id }, { $set: { documents: docs } }).exec();
  console.log('Attached file to delivery documents');

  // Verify exists in DB and on disk
  const found = await Delivery.findById(created._id).lean().exec();
  console.log('Found delivery in DB:', !!found);
  console.log('File exists before delete:', fs.existsSync(filePath));

  // Now delete files using helper
  const removed = await deleteDeliveryFiles(found);
  console.log('deleteDeliveryFiles returned:', removed);

  // Remove delivery doc
  await Delivery.deleteOne({ _id: created._id }).exec();
  const still = await Delivery.findById(created._id).lean().exec();
  console.log('Delivery still in DB after delete:', !!still);

  console.log('File exists after delete:', fs.existsSync(filePath));

  console.log('Smoke test finished');
  process.exit(0);
}

main().catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});