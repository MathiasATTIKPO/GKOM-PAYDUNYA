const Transaction = require('../models/transaction');
const Order = require('../models/Order');

const processedTransactions = new Set();

function checkIfPing(req, res, next) {
  const body = req.body;

  if (!body || Object.keys(body).length === 0) {
    return res.status(200).send('Ping OK');
  }

  if (body.data === '') {
    return res.status(200).send('Ping OK');
  }

  next();
}

async function handleCallback(req, res) {
  console.log('📬 Callback PayDunya reçu');

  let data = req.body;
  console.log('💡 Aperçu de data:', data);

  if (typeof data === 'string') {
    try {
      data = data.replace(/,\s*([\]}])/g, '$1');
      data = data.replace(/\\([{}])/g, '$1');
      data = data.replace(/\\"/g, '"');
      data = JSON.parse(data);
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      return res.status(400).send('Format JSON invalide');
    }
  }

  const payload = data.data || data;
  const isRetrait = payload.hasOwnProperty('withdraw_mode') && payload.hasOwnProperty('transaction_id');

  try {
    if (isRetrait) {
      console.log('🔁 Type détecté : Retrait');
      return await handleWithdrawCallback(payload, res);
    } else {
      console.log('🔁 Type détecté : Paiement');
      return await handlePaymentCallback(payload, res);
    }
  } catch (err) {
    console.error('❌ Erreur lors de l’exécution du callback spécifique :', err);
    return res.status(500).send('Erreur interne lors du traitement du callback.');
  }
}

async function handlePaymentCallback(data, res) {
  const innerData = data.data || data;
  const { response_code, response_text, status, invoice, payment_method } = innerData;
  console.log('🎯 Données reçues dans handlePaymentCallback :', JSON.stringify(innerData, null, 2));

  if (!response_code || !response_text || !invoice) {
    return res.status(400).send('Structure de données invalide (paiement)');
  }

  const token = invoice.token;
  if (processedTransactions.has(token)) {
    return res.status(200).json({ message: 'Callback déjà traité.' });
  }

  processedTransactions.add(token);

  const baseCustomer = {
    name: innerData.customer?.name || 'Client inconnu',
    phone: innerData.customer?.phone || 'Non fourni',
    payment_method: innerData.customer?.payment_method || 'Non spécifié'
  };

  const transaction = {
    type: 'payment',
    status: status === 'completed' && response_code === '00' ? 'success' : 'failed',
    token,
    mode: baseCustomer.payment_method,
    amount: invoice.total_amount,
    response_code,
    response_text,
    customer: baseCustomer,
    updated_at: new Date(),
  };

  try {
    await Transaction.findOneAndUpdate(
      { token },
      { $set: transaction },
      { upsert: true, new: true }
    );
    console.log(`📝 Paiement enregistré avec statut : ${transaction.status}`);

    await Payment.findOneAndUpdate(
      { token },
      { $set: { status: transaction.status, updated_at: new Date() } },
      { new: true }
    );

    console.log(`📝 Paiement mis à jour dans Payment avec statut : ${transaction.status}`);

    if (transaction.status === 'success') {
      await Order.create({
        token,
        customer: transaction.customer,
        amount: transaction.amount,
        mode: transaction.mode,
        created_at: new Date(),
        status: 'validée'
      });

      console.log('📦 Commande enregistrée avec succès.');
    }
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: `Callback paiement traité (${transaction.status})`,
    data: transaction,
  });
}

async function handleWithdrawCallback(data, res) {
  const innerData = data.data || data;

  const {
    status,
    token,
    amount,
    updated_at,
    disburse_tx_id,
  } = innerData;

  console.log('🎯 Données reçues dans handleWithdrawCallback :', JSON.stringify(innerData, null, 2));

  if (!token || !status) {
    console.warn('⚠️ Champs manquants pour retrait :', { token, status });
    return res.status(400).send('Structure de données invalide (retrait)');
  }

  if (processedTransactions.has(token)) {
    return res.status(200).json({ message: 'Callback retrait déjà traité.' });
  }

  processedTransactions.add(token);

  const parsedUpdateDate = updated_at && !isNaN(Date.parse(updated_at)) 
    ? new Date(updated_at) 
    : new Date();

  const transaction = {
    type: 'withdraw',
    status: status === 'success' ? 'completed' : 'failed',
    token,
    amount,
    disburse_tx_id,
    updated_at: parsedUpdateDate,
  };

  try {
    await Transaction.findOneAndUpdate(
      { token },
      { $set: transaction },
      { upsert: true, new: true }
    );

    console.log(`📝 Retrait mis à jour dans Withdraw avec statut : ${transaction.status}`);
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
  }

  return res.status(200).json({
    success: true,
    message: `Callback retrait traité (${transaction.status})`,
    data: transaction,
  });
}

module.exports = {
  handleCallback,
  handlePaymentCallback,
  handleWithdrawCallback,
  checkIfPing
};