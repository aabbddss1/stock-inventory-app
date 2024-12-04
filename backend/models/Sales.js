// backend/models/Sales.js
const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Sales', salesSchema);
