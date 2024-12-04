// backend/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sales.find();
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new sale
router.post('/add', async (req, res) => {
  try {
    const sale = new Sales(req.body);
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit a sale
router.put('/edit/:id', async (req, res) => {
  try {
    const updatedSale = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a sale
router.delete('/delete/:id', async (req, res) => {
  try {
    await Sales.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
