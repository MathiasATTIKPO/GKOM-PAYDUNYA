// routes/articleRoutes.js
const router = require('express').Router();
const Article = require('../models/Article');
const scrapeArticles = require('../services/scraper');

// Liste tous les articles (pour la boutique)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find();
    res.render('client/article-list', { articles });  // On suppose que ta vue est dans /views/client/index.ejs
  } catch (err) {
    console.error('Erreur récupération articles:', err.message);
    res.status(500).send('Erreur serveur.');
  }
});

// Synchronise avec le scraping (quand prêt)
router.get('/sync', async (req, res) => {
  try {
    const articles = await scrapeArticles();
    await Article.deleteMany();
    await Article.insertMany(articles);
    res.redirect('/articles');
  } catch (err) {
    console.error('Erreur scraping:', err.message);
    res.status(500).send('Erreur lors du scraping.');
  }
});

// Affiche un formulaire pour ajouter un article
router.get('/new', (req, res) => {
  res.render('client/article-form'); // Vue du formulaire
});

// Enregistre un nouvel article
router.post('/new', async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).render('client/article-form', {
        error: 'Nom, prix et stock sont requis.',
      });
    }

    const article = await Article.create({
      name,
      description: description || '',
      price: parseFloat(price),
      stock: parseInt(stock),
      created_at: new Date(),
    });

    res.redirect('/articles');  // Retourne à la liste après ajout
  } catch (err) {
    console.error('Erreur ajout article:', err.message);
    res.status(500).render('client/article-form', {
      error: 'Erreur lors de l’enregistrement.',
    });
  }
});

module.exports = router;
