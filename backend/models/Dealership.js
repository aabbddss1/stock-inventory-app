const mongoose = require('mongoose');

const dealershipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
});

module.exports = mongoose.model('Dealership', dealershipSchema);
