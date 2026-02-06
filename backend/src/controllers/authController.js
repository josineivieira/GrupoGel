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


// Register a new driver
exports.register = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;
    const db = req.mockdb;

    // Check if driver already exists
    const existingDriver = await db.findOne('drivers', { 
      $or: [{ email }, { username }] 
    });

    if (existingDriver) {
      return res.status(400).json({ success: false, message: 'Motorista já cadastrado' });
    }

    // Create new driver
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
    const db = req.mockdb;
    
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
    driver = await db.findOne('drivers', { username: loginKey });
    if (!driver) driver = await db.findOne('drivers', { email: loginKey });

    console.log('👤 Driver found:', driver ? driver.username : 'NOT FOUND');

    if (!driver) {
      console.log('❌ Driver not found for:', loginKey);
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Check password: support legacy SHA256 (mockdb) and bcrypt (MongoDB)
    const hashedSha256 = hashPassword(password);
    let passwordMatch = false;

    // 1) explicit legacy field
    if (driver.legacyPasswordSha256) {
      passwordMatch = (hashedSha256 === driver.legacyPasswordSha256);
      if (passwordMatch) {
        try {
          const bcryptHash = await bcrypt.hash(password, 10);
          await db.updateOne('drivers', { _id: driver._id }, { password: bcryptHash, legacyPasswordSha256: null });
        } catch (e) {
          console.warn('⚠️ Failed to migrate legacy password to bcrypt:', e && e.message ? e.message : e);
        }
      }
    } else {
      // 2) handle case where SHA256 was stored in `password` field (legacy mockdb)
      const maybeLegacySha = typeof driver.password === 'string' && /^[0-9a-f]{64}$/i.test(driver.password);
      if (maybeLegacySha) {
        passwordMatch = (hashedSha256 === driver.password);
        if (passwordMatch) {
          try {
            const bcryptHash = await bcrypt.hash(password, 10);
            await db.updateOne('drivers', { _id: driver._id }, { password: bcryptHash, legacyPasswordSha256: null });
          } catch (e) {
            console.warn('⚠️ Failed to migrate legacy password-stored-in-password to bcrypt:', e && e.message ? e.message : e);
          }
        }
      } else {
        // 3) assume bcrypt
        try {
          passwordMatch = await bcrypt.compare(password, driver.password || '');
        } catch (e) {
          console.error('Error comparing bcrypt password:', e);
        }
      }
    }

    console.log('🔑 Password check:', { providedSha256: hashedSha256.substring(0,10)+'...', passwordMatch });
    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
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
