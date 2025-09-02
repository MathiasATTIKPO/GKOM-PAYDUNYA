const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  token: { type: String, required: true },
  customer: {
    name: String,
    phone: String,
    payment_method: String,
  },
  amount: Number,
  mode: String,
  status: { type: String, enum: ['validée', 'annulée'], default: 'validée' },
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
