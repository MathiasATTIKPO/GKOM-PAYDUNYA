const router = require('express').Router();
const Order = require('../models/Order');
const Article = require('../models/Article');
const { processInvoiceAndPayment } = require('../services/paydunya');
const orderController = require('../controllers/orderController');

// Page de formulaire d'achat
router.get('/new', orderController.orderForm);

// Crée une nouvelle commande
router.post('/new', async (req, res) => {
  try {
    const { articleId, quantity, payment_mode, phone } = req.body;

    // Vérification des champs obligatoires
    if (!articleId || !quantity || !payment_mode || !phone) {
      return res.status(400).render('order-result', { success: false, message: 'Données manquantes.' });
    }

    // Vérifie le format du numéro (8 chiffres)
    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).render('order-result', { success: false, message: 'Numéro invalide (8 chiffres).' });
    }

    // Récupère l'article (ou données fictives si scraping pas encore dispo)
    let article = await Article.findById(articleId);
    if (!article) {
      // Article fictif pour tests
      article = {
        _id: articleId,
        name: 'Article Test',
        price: 5000,
        stock: 10
      };
    }

    // Vérifie le stock
    if (quantity > article.stock) {
      return res.status(400).render('order-result', { success: false, message: 'Stock insuffisant.' });
    }

    // Crée une commande en statut "pending"
    const totalAmount = article.price * quantity;
    const order = await Order.create({
      article: article._id,
      quantity,
      amount: totalAmount,
      phone,
      status: 'pending',
      created_at: new Date()
    });

    // Lance le paiement via PayDunya
    const invoice = await processInvoiceAndPayment({
      amount: totalAmount,
      payment_mode,
      name: `Client-${phone}`,
      phone_number: phone
    });

    if (!invoice.success) {
      order.status = 'failed';
      await order.save();
      return res.render('order-result', { success: false, message: 'Échec du paiement.' });
    }

    // Laisser le stock et le statut en attente :
    // -> ils seront mis à jour par le callback PayDunya après confirmation
    res.render('order-result', { success: true, message: 'Paiement en cours. Confirmation en attente.' });
  } catch (err) {
    console.error('Erreur commande:', err.message);
    res.status(500).render('order-result', { success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
