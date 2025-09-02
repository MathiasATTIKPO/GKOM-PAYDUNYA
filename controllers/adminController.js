const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Transaction = require('../models/transaction');
const Order = require('../models/Order');
const Article = require('../models/Article');

// Formulaire de connexion
const loginForm = (req, res) => res.render('auth/login', {
  errors: [],
  email: ''
});

// Formulaire d'inscription
const registerForm = (req, res) => res.render('auth/register', {
  fullname: '',
  phone: '',
  email: '',
  errors: []
});

// Inscription d’un admin
const register = async (req, res) => {
  try {
    const { username, password, fullname, phone, email } = req.body;
    const errors = [];

    if (!username || !password) {
      errors.push('Champs requis.');
      return res.render('auth/register', { fullname, phone, email, errors });
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      errors.push('Nom d’utilisateur déjà utilisé.');
      return res.render('auth/register', { fullname, phone, email, errors });
    }

    await Admin.create({ username, password, fullname, phone, email });
    res.redirect('/auth/login');

  } catch (err) {
    console.error('Erreur register:', err.message);
    return res.render('auth/register', {
      fullname: '',
      phone: '',
      email: '',
      errors: ['Erreur serveur.']
    });
  }
};

// Connexion d’un admin
const login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin || !(await admin.comparePassword(password))) {
    return res.render('auth/login', {
      errors: ['Identifiants incorrects'],
      email: username
    });
  }

  const token = jwt.sign(
    { admin: true, id: admin._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.cookie('token', token);
  res.redirect('/admin/dashboard');
};

// Dashboard
const dashboard = async (req, res) => {
  const transactions = await Transaction.find().sort({ created_at: -1 });
  const orders = await Order.find().populate('article').sort({ created_at: -1 });
  const articles = await Article.find();
  res.render('admin/dashboard', { transactions, orders, articles });
};

// Déconnexion
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};

module.exports = { loginForm, registerForm, register, login, dashboard, logout };
