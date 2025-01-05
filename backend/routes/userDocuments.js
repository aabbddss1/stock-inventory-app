const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db'); // Your database connection
const authenticate = require('../middleware/authenticate'); // Middleware for authentication

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/user-documents/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Upload a document for a user
router.post('/upload', authenticate, upload.single('document'), (req, res) => {
  const { userId } = req.body;
  const filePath = req.file.path;

  const query = 'INSERT INTO user_documents (userId, filePath, fileName) VALUES (?, ?, ?)';
  db.query(query, [userId, filePath, req.file.originalname], (err) => {
    if (err) {
      console.error('Error uploading document:', err);
      return res.status(500).json({ error: 'Failed to upload document' });
    }
    res.status(201).json({ message: 'Document uploaded successfully' });
  });
});

// Fetch all documents for a specific user
router.get('/:userId', authenticate, (req, res) => {
  const { userId } = req.params;

  const query = 'SELECT id, filePath, fileName FROM user_documents WHERE userId = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching documents:', err);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
    res.status(200).json(results);
  });
});

// Delete a document
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM user_documents WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error('Error deleting document:', err);
      return res.status(500).json({ error: 'Failed to delete document' });
    }
    res.status(200).json({ message: 'Document deleted successfully' });
  });
});

module.exports = router;