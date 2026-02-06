(async function(){
  try{
    const { connectIfNeeded } = require('../src/db/mongo');
    const Delivery = require('../src/models/Delivery');
    await connectIfNeeded();
    const docs = await Delivery.find({ driverId: { $exists: false }, userId: { $exists: true, $ne: null } }).lean().exec();
    console.log('Found deliveries to update:', docs.length);
    let updated = 0;
    for (const d of docs) {
      await Delivery.updateOne({ _id: d._id }, { $set: { driverId: d.userId } }).exec();
      updated++;
    }
    console.log('Updated count:', updated);
    process.exit(0);
  }catch(e){
    console.error('Error:', e);
    process.exit(1);
  }
})();
