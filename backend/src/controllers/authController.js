const mockdb = require('../mockdb');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

    // Check if driver already exists
    const existingDriver = mockdb.findOne('drivers', { 
      $or: [{ email }, { username }] 
    });

    if (existingDriver) {
      return res.status(400).json({ success: false, message: 'Motorista já cadastrado' });
    }

    // Create new driver
    const driver = mockdb.create('drivers', {
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

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuário e senha obrigatórios' });
    }

    // Check for driver
    const driver = mockdb.findOne('drivers', { username: username.toLowerCase() });

    if (!driver) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Check password
    const hashedPassword = hashPassword(password);
    if (hashedPassword !== driver.password) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Check if driver is active
    if (!driver.isActive) {
      return res.status(401).json({ success: false, message: 'Motorista desativado' });
    }

    const token = generateToken(driver._id, driver.role);

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
    console.error('Erro login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};

// Get current driver
exports.getMe = async (req, res) => {
  try {
    const driver = mockdb.findById('drivers', req.user.id);
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
    const drivers = mockdb.find('drivers', { role: 'driver' });
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
    const driver = mockdb.updateOne('drivers', { _id: req.user.id }, { name, email, phone });

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

    const driver = mockdb.findById('drivers', req.user.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
    }

    const hashedOldPassword = hashPassword(oldPassword);
    if (hashedOldPassword !== driver.password) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    }

    mockdb.updateOne('drivers', { _id: req.user.id }, { password: hashPassword(newPassword) });

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro no servidor', error: error.message });
  }
};
