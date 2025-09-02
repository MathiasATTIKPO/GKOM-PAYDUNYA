// controllers/orderController.js
const Order = require('../models/Order');
const Article = require('../models/Article');
const { processInvoiceAndPayment } = require('../services/paydunya');

// const orderForm = (req, res) => {
//   res.render('client/new');
// };

const orderForm = (req, res) => {
  // Article fictif pour les tests
  const article = {
    _id: '1234567890',
    name: 'Livre Test',
    price: 5000,
    stock: 10,
  };

  res.render('client/new', { article });
};

const createOrder = async (req, res) => {
  try {
    const { articleId, quantity, payment_mode, phone } = req.body;

    // Validation
    if (!articleId || !quantity || !payment_mode || !phone) {
      return res.status(400).render('order-result', { success: false, message: 'Données manquantes.' });
    }

    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).render('order-result', { success: false, message: 'Numéro Mobile Money invalide (8 chiffres requis).' });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).render('order-result', { success: false, message: 'Article non trouvé.' });
    }

    if (quantity > article.stock) {
      return res.status(400).render('order-result', { success: false, message: 'Quantité demandée supérieure au stock disponible.' });
    }

    const totalAmount = article.price * quantity;

    // Crée la commande en statut "pending"
    const order = await Order.create({
      article: article._id,
      quantity,
      amount: totalAmount,
      phone,
      status: 'pending',
      created_at: new Date(),
    });

    // Lance le paiement via PayDunya
    const invoice = await processInvoiceAndPayment({
      amount: totalAmount,
      payment_mode,
      name: `Client-${phone}`,
      phone_number: phone,
    });

    if (!invoice.success) {
      order.status = 'failed';
      await order.save();
      return res.render('order-result', { success: false, message: 'Le paiement a échoué.' });
    }

    // Paiement initié, stock et statut seront mis à jour via callback PayDunya
    return res.render('order-result', {
      success: true,
      message: 'Paiement initié avec succès. Confirmation en attente.',
      invoiceToken: invoice.token,
    });
  } catch (err) {
    console.error('Erreur lors de la création de commande :', err);
    return res.status(500).render('order-result', { success: false, message: 'Erreur serveur.' });
  }
};

module.exports = { orderForm, createOrder };
