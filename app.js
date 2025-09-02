const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const articleRoutes = require('./routes/articleRoute');
const orderRoutes = require('./routes/orderRoute');
const adminRoutes = require('./routes/adminRoute');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', articleRoutes);
app.use('/auth', adminRoutes);
app.use('/order', orderRoutes);
app.use('/admin', adminRoutes);

// Connexion à MongoDB avant le lancement du serveur
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Échec de connexion à MongoDB :', err.message);
    process.exit(1);
  });

  

