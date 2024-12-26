const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
