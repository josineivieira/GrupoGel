#!/usr/bin/env node
/**
 * Data Migration Script
 * 
 * Purpose: Migrate legacy data to new role/contractor structure:
 * - Normalize roles: 'driver' -> 'MOTORISTA', 'admin' -> 'ADMIN'
 * - Set contractorId for MOTORISTA users
 * - Ensure CONTRATADO has contractorId = _id
 * - Update deliveries with driverId and contractorId
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Driver = require('./src/models/Driver');
const Delivery = require('./src/models/Delivery');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-docs';
    await mongoose.connect(mongoUri);
    log.success('Connected to MongoDB');
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
};

const normalizeRoles = (role) => {
  if (!role) return 'MOTORISTA';
  const upper = String(role).toUpperCase();
  if (upper === 'DRIVER') return 'MOTORISTA';
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'MOTORISTA' || upper === 'CONTRATADO') return upper;
  return upper;
};

const migrateDrivers = async () => {
  log.info('Starting driver migration...');
  
  try {
    // Find all drivers
    const drivers = await Driver.find({});
    log.info(`Found ${drivers.length} drivers`);

    let updated = 0;
    let contractors = [];

    for (const driver of drivers) {
      let changed = false;
      const oldRole = driver.role;
      
      // Normalize role
      const newRole = normalizeRoles(driver.role);
      if (newRole !== driver.role) {
        driver.role = newRole;
        changed = true;
        log.info(`  Normalized role: ${driver.username} (${oldRole} -> ${newRole})`);
      }

      // CONTRATADO should have contractorId = _id
      if (newRole === 'CONTRATADO') {
        if (!driver.contractorId || String(driver.contractorId) !== String(driver._id)) {
          driver.contractorId = driver._id;
          changed = true;
          log.info(`  Set contractorId for CONTRATADO: ${driver.username}`);
        }
        contractors.push(driver._id);
      }

      if (changed) {
        await driver.save();
        updated++;
      }
    }

    log.success(`Migrated ${updated} drivers. Found ${contractors.length} contractors.`);

    // If no contractors, create a default one
    if (contractors.length === 0) {
      log.warn('No CONTRATADO (contractor) users found. Creating default...');
      const defaultContractor = new Driver({
        username: 'contratado-padrao',
        email: 'contratado@empresa.local',
        password: 'default-change-me',
        fullName: 'Empresa Padrão',
        role: 'CONTRATADO',
        contractorId: null // Will be set after save
      });
      await defaultContractor.save();
      defaultContractor.contractorId = defaultContractor._id;
      await defaultContractor.save();
      contractors.push(defaultContractor._id);
      log.success(`Created default contractor: ${defaultContractor.username}`);
    }

    // Now assign MOTORISTA to a contractor if not already set
    const motoristas = await Driver.find({ role: 'MOTORISTA', contractorId: { $in: [null, undefined] } });
    if (motoristas.length > 0) {
      log.info(`${motoristas.length} MOTORISTA users need contractorId assignment...`);
      const defaultContractor = contractors[0];
      for (const motorista of motoristas) {
        motorista.contractorId = defaultContractor;
        await motorista.save();
      }
      log.success(`Assigned ${motoristas.length} MOTORISTA to default contractor`);
    }

    return { updated, contractors: contractors.length };
  } catch (error) {
    log.error(`Driver migration failed: ${error.message}`);
    throw error;
  }
};

const migrateDeliveries = async () => {
  log.info('Starting delivery migration...');
  
  try {
    const deliveries = await Delivery.find({});
    log.info(`Found ${deliveries.length} deliveries`);

    let updated = 0;

    for (const delivery of deliveries) {
      let changed = false;

      // Ensure driverId is set (from userId if missing)
      if (!delivery.driverId && delivery.userId) {
        delivery.driverId = delivery.userId;
        changed = true;
        log.info(`  Set driverId from userId: ${delivery.deliveryNumber}`);
      }

      // Ensure contractorId is set
      if (!delivery.contractorId && delivery.driverId) {
        const driver = await Driver.findById(delivery.driverId);
        if (driver && driver.contractorId) {
          delivery.contractorId = driver.contractorId;
          changed = true;
          log.info(`  Set contractorId from driver: ${delivery.deliveryNumber}`);
        }
      }

      // If still no contractorId, find any CONTRATADO to use
      if (!delivery.contractorId) {
        const contractor = await Driver.findOne({ role: 'CONTRATADO' });
        if (contractor) {
          delivery.contractorId = contractor._id;
          changed = true;
          log.warn(`  Assigned default contractor: ${delivery.deliveryNumber}`);
        }
      }

      if (changed) {
        await delivery.save();
        updated++;
      }
    }

    log.success(`Migrated ${updated} deliveries`);
    return updated;
  } catch (error) {
    log.error(`Delivery migration failed: ${error.message}`);
    throw error;
  }
};

const main = async () => {
  console.log('\n═════════════════════════════════════════');
  console.log('  Data Migration: Roles & Contractor IDs');
  console.log('═════════════════════════════════════════\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      log.error('Failed to connect to database');
      process.exit(1);
    }

    const driverStats = await migrateDrivers();
    const deliveryStats = await migrateDeliveries();

    console.log('\n═════════════════════════════════════════');
    log.success('Migration completed successfully!');
    console.log('═════════════════════════════════════════\n');
    console.log(`Drivers updated: ${driverStats.updated}`);
    console.log(`Contractors found: ${driverStats.contractors}`);
    console.log(`Deliveries updated: ${deliveryStats}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.log('\n═════════════════════════════════════════');
    log.error('Migration failed!');
    console.log('═════════════════════════════════════════\n');
    process.exit(1);
  }
};

main();
