const Article = require('../models/Article');

// Affiche le formulaire d'ajout d'article
const newArticleForm = (req, res) => {
  res.render('admin/new-article');
};

// Crée un nouvel article dans la base
const createArticle = async (req, res) => {
  try {
    const { name, price, stock } = req.body;

    if (!name || !price || !stock) {
      return res.render('admin/new-article', { error: 'Tous les champs sont obligatoires.' });
    }

    await Article.create({ name, price, stock });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Erreur ajout article:', err.message);
    res.render('admin/new-article', { error: 'Erreur lors de l’ajout de l’article.' });
  }
};

// Récupère tous les articles pour les afficher
const listArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('client/article-list', { articles });
  } catch (err) {
    console.error('Erreur récupération articles:', err.message);
    res.status(500).send('Erreur serveur.');
  }
};

module.exports = { newArticleForm, createArticle, listArticles };
