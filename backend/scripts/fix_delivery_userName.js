#!/usr/bin/env node
/**
 * Fix deliveries where userName is missing/Unknown by looking up driver and
 * setting userName to driver.fullName || driver.name || driver.username
 *
 * Usage:
 *   Windows PowerShell:
 *     $env:MONGODB_URI='your_uri_here'; node scripts/fix_delivery_userName.js
 *   Bash:
 *     MONGODB_URI='your_uri_here' node scripts/fix_delivery_userName.js
 */
const { connectIfNeeded } = require('../src/db/mongo');
const Delivery = require('../src/models/Delivery');
const Driver = require('../src/models/Driver');

(async () => {
  try {
    await connectIfNeeded();
    console.log('✓ Connected to MongoDB');

    const deliveries = await Delivery.find({ $or: [{ userName: { $in: ['', null] } }, { userName: 'Unknown' }] }).lean().exec();
    console.log('Found deliveries to update:', deliveries.length);

    let updated = 0;
    for (const d of deliveries) {
      if (!d.userId) continue;
      const drv = await Driver.findById(d.userId).lean().exec();
      if (!drv) continue;
      const newUserName = drv.fullName || drv.name || drv.username || null;
      if (!newUserName) continue;
      await Delivery.updateOne({ _id: d._id }, { $set: { userName: newUserName } });
      updated++;
      console.log('Updated', d._id, '->', newUserName);
    }

    console.log('Updated count:', updated);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
