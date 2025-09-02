const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Authentification
router.get('/login', adminController.loginForm);
router.post('/login', adminController.login);
router.get('/register', adminController.registerForm);
router.post('/register', adminController.register);

// Dashboard protégé
router.get('/dashboard', isAdmin, adminController.dashboard);

// Déconnexion
router.get('/logout', isAdmin, adminController.logout);

module.exports = router;
