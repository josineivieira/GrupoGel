const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateDriver);
router.put('/change-password', auth, authController.changePassword);

// Admin routes
router.get('/drivers', auth, authController.getAllDrivers);

module.exports = router;
