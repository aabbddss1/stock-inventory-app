const express = require('express');
const router = express.Router();
const Dealership = require('../models/Dealership'); // Create this model

// Get all dealerships
router.get('/', async (req, res) => {
  try {
    const dealerships = await Dealership.find();
    res.status(200).json(dealerships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a dealership
router.post('/add', async (req, res) => {
  const dealership = new Dealership(req.body);
  try {
    const newDealership = await dealership.save();
    res.status(201).json(newDealership);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a dealership
router.delete('/:id', async (req, res) => {
  try {
    await Dealership.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Dealership deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
