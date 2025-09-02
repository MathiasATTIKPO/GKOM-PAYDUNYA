const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  stock: Number
});

module.exports = mongoose.model('Article', articleSchema);