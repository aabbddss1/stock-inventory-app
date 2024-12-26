// Fetch all inventory items
exports.getInventory = async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Add a new inventory item
exports.addInventory = async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    const status = getStatus(quantity);

    const [result] = await req.db.query(
      'INSERT INTO inventory (name, category, quantity, price, status) VALUES (?, ?, ?, ?, ?)',
      [name, category, quantity, price, status]
    );

    res.status(201).json({ id: result.insertId, name, category, quantity, price, status });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add inventory item' });
  }
};

// Update an inventory item
exports.updateInventory = async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body;
    const status = getStatus(quantity);

    await req.db.query(
      'UPDATE inventory SET name = ?, category = ?, quantity = ?, price = ?, status = ? WHERE id = ?',
      [name, category, quantity, price, status, req.params.id]
    );

    res.json({ id: req.params.id, name, category, quantity, price, status });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update inventory item' });
  }
};

// Delete an inventory item
exports.deleteInventory = async (req, res) => {
  try {
    await req.db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.status(204).send(); // No content response
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete inventory item' });
  }
};

// Helper function to calculate status based on quantity
const getStatus = (quantity) => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity < 10) return 'Low Stock';
  return 'In Stock';
};
