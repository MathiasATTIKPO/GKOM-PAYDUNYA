const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  type: { type: String, enum: ['payment', 'withdraw'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], required: true },
  amount: Number,
  mode: String, // mode utilisé pour paiement ou retrait (on utilise toujours ce champ)
  customer: {
    name: String,
    phone: String,
  },
  transaction_id: String, // pour les paiements (ID transaction PayDunya)
  disburse_tx_id: String, // pour les retraits (ID transaction de retrait)
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: null },
},{ timestamps: true }); 

// Ajout d'un middleware pour mettre à jour "updated_at" automatiquement
transactionSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);