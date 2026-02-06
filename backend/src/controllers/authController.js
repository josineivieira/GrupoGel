const mockdb = require('../mockdb');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'seu_jwt_secret_super_seguro_aqui_mude_em_producao', { expiresIn: '7d' });
};

const hashPassword = (pwd) => {
  return crypto.createHash('sha256').update(pwd).digest('hex');
};

// Helper to detect Mongo mode
const usingMongo = !!process.env.MONGODB_URI;
let DriverModel = null;
if (usingMongo) {
  try {
    DriverModel = require('../models/Driver');
  } catch (e) {
    console.warn('Driver model not available:', e.message);
  }
}


// Register a new driver
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;

    if (usingMongo && DriverModel) {
      // Check if exists in Mongo
      const loginKey = String(username).toLowerCase();
      const existing = await DriverModel.findOne({ $or: [{ email: email }, { username: loginKey }] }).exec();
      if (existing) return res.status(400).json({ success: false, message: 'Motorista já cadastrado' });

      const driver = await DriverModel.create({
        username: loginKey,
        email: String(email).toLowerCase(),
        password: password, // will be hashed by model pre-save
        name,
        fullName: name,
        phone,
        role: 'driver',
        isActive: true
      });

      const token = generateToken(driver._id, driver.role);
      return res.status(201).json({ success: true, message: 'Motorista cadastrado com sucesso', token, driver: { id: driver._id, username: driver.username, email: driver.email, fullName: driver.fullName, role: driver.role } });
    }

    const db = req.mockdb;
    // Check if driver already exists
    const existingDriver = await db.findOne('drivers', { 
      $or: [{ email }, { username }] 
    });

    if (existingDriver) {
      return res.status(400).json({ success: false, message: 'Motorista já cadastrado' });
    }

    // Create new driver (mockdb)
    const driver = await db.create('drivers', {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      name,
      fullName: name,
      phone,
      role: 'driver',
      isActive: true
    });

    const token = generateToken(driver._id, driver.role);

    res.status(201).json({
      success: true,
      message: 'Motorista cadastrado com sucesso',
      token,
      driver: {
        id: driver._id,
        username: driver.username,
        email: driver.email,
        fullName: driver.fullName,
        role: driver.role
      }
    });
  } catch (error) {
    console.error('Erro register:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Debug: log incoming city / header to help diagnose mobile/ngrok issues
    console.log('🔐 LOGIN ATTEMPT:', { username, passwordLength: password?.length });
    console.log('🔎 Request headers city:', req.header('x-city'), 'resolved req.city:', req.city, 'origin:', req.headers.origin);

    // Validate input
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ success: false, message: 'Usuário e senha obrigatórios' });
    }

    // Allow login by username or email (case-insensitive)
    const loginKey = String(username).toLowerCase();

    let driver = null;

    if (usingMongo && DriverModel) {
      driver = await DriverModel.findOne({ $or: [{ username: loginKey }, { email: loginKey }] }).lean().exec();
    } else {
      const db = req.mockdb;
      driver = await db.findOne('drivers', { username: loginKey });
      if (!driver) driver = await db.findOne('drivers', { email: loginKey });
    }

    console.log('👤 Driver found:', driver ? driver.username : 'NOT FOUND');

    if (!driver) {
      console.log('❌ Driver not found for:', loginKey);
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Check password
    if (usingMongo && DriverModel) {
      // Try bcrypt first
      const bcryptMatch = await bcrypt.compare(password, driver.password || '');
      if (!bcryptMatch && driver.legacyPasswordSha256) {
        const hashedPassword = hashPassword(password);
        if (hashedPassword !== driver.legacyPasswordSha256) {
          console.log('❌ Password mismatch (mongo legacy check)');
          return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
        }
      } else if (!bcryptMatch) {
        console.log('❌ Password mismatch (mongo bcrypt)');
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
    } else {
      const hashedPassword = hashPassword(password);
      console.log('🔑 Password check:', { 
        provided: hashedPassword.substring(0, 10) + '...',
        stored: driver.password.substring(0, 10) + '...',
        match: hashedPassword === driver.password
      });
      if (hashedPassword !== driver.password) {
        console.log('❌ Password mismatch');
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
    }

    // Check if driver is active
    if (!driver.isActive) {
      console.log('❌ Driver inactive');
      return res.status(401).json({ success: false, message: 'Motorista desativado' });
    }

    const token = generateToken(driver._id, driver.role);
    console.log('✅ Login success:', driver.username);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      driver: {
        id: driver._id,
        username: driver.username,
        email: driver.email,
        fullName: driver.fullName,
        role: driver.role
      }
    });
  } catch (error) {
    console.error('❌ Erro login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Get current driver
exports.getMe = async (req, res) => {
  try {
    if (usingMongo && DriverModel) {
      const driver = await DriverModel.findById(req.user.id).lean().exec();
      if (!driver) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
      return res.json({ success: true, driver: { id: driver._id, username: driver.username, email: driver.email, fullName: driver.fullName, role: driver.role } });
    }

    const db = req.mockdb;
    const driver = await db.findById('drivers', req.user.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
    }

    res.json({
      success: true,
      driver: {
        id: driver._id,
        username: driver.username,
        email: driver.email,
        fullName: driver.fullName,
        role: driver.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Get all drivers (admin only)
exports.getAllDrivers = async (req, res) => {
  try {
    if (usingMongo && DriverModel) {
      const drivers = await DriverModel.find({ role: 'driver' }).lean().exec();
      return res.json({ success: true, drivers: drivers.map(d => ({ id: d._id, username: d.username, fullName: d.fullName || d.name, email: d.email, role: d.role })) });
    }

    const db = req.mockdb;
    const drivers = await db.find('drivers', { role: 'driver' });
    res.json({
      success: true,
      drivers: drivers.map(d => ({
        id: d._id,
        username: d.username,
        fullName: d.fullName,
        email: d.email,
        role: d.role
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Update driver profile
exports.updateDriver = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (usingMongo && DriverModel) {
      const updated = await DriverModel.findByIdAndUpdate(req.user.id, { name, email, phone }, { new: true }).lean().exec();
      if (!updated) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
      return res.json({ success: true, message: 'Perfil atualizado', driver: { id: updated._id, username: updated.username, email: updated.email, fullName: updated.fullName || updated.name, role: updated.role } });
    }

    const db = req.mockdb;
    const driver = await db.updateOne('drivers', { _id: req.user.id }, { name, email, phone });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado',
      driver: {
        id: driver._id,
        username: driver.username,
        email: driver.email,
        fullName: driver.fullName,
        role: driver.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (usingMongo && DriverModel) {
      const driver = await DriverModel.findById(req.user.id).exec();
      if (!driver) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });

      // verify with bcrypt or legacy sha256
      const bcryptMatch = await bcrypt.compare(oldPassword, driver.password || '');
      if (!bcryptMatch && driver.legacyPasswordSha256) {
        const hashedOld = hashPassword(oldPassword);
        if (hashedOld !== driver.legacyPasswordSha256) return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
      } else if (!bcryptMatch) return res.status(401).json({ success: false, message: 'Senha atual incorreta' });

      driver.password = newPassword;
      driver.legacyPasswordSha256 = undefined;
      await driver.save();

      return res.json({ success: true, message: 'Senha alterada com sucesso' });
    }

    const db = req.mockdb;
    const driver = await db.findById('drivers', req.user.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
    }

    const hashedOldPassword = hashPassword(oldPassword);
    if (hashedOldPassword !== driver.password) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    }

    await db.updateOne('drivers', { _id: req.user.id }, { password: hashPassword(newPassword) });

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};
