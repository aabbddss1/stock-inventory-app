const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const db = require('../db'); // Import your database connection
require('dotenv').config(); // Load environment variables
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const sendEmail = require('../utils/emailUtils');

// Constants
const ALLOWED_CATEGORIES = ['Invoice', 'Contract', 'Report', 'Other'];

// Multer memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Only PDF and Word document files are allowed.'));
        }
        cb(null, true);
    },
});

// Error handler utility
const handleError = (res, error, message = 'An error occurred', status = 500) => {
    console.error(message, error);
    res.status(status).json({ error: message, details: error.message });
};

// Remove AWS S3 configuration and replace with local storage config
const UPLOAD_DIR = process.env.STORAGE_PATH || '/var/www/xcloud-storage/uploads';
const BASE_URL = `http://${process.env.SERVER_IP}:5001/uploads`; // Adjust port if needed

// Upload a document to S3 and save metadata
router.post(
    '/upload',
    [
        upload.single('file'),
        body('customerId').isInt().withMessage('Customer ID must be an integer'),
        body('name').notEmpty().withMessage('Document name is required'),
        body('category').isIn(ALLOWED_CATEGORIES).withMessage('Invalid document category'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { customerId, name, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'File not uploaded' });
        }

        try {
            // Validate customer exists and get their email
            const [customer] = await db.promise().query('SELECT id, email FROM customers WHERE id = ?', [customerId]);
            if (!customer.length) {
                return res.status(404).json({ error: 'Customer ID not found.' });
            }

            // Clean and sanitize file name
            const cleanFileName = `${Date.now()}-${req.file.originalname
                .replace(/\s+/g, '-')
                .replace(/[()]/g, '')}`;
            
            // Ensure upload directory exists
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
            
            // Save file to local storage
            const filePath = path.join(UPLOAD_DIR, cleanFileName);
            await fs.writeFile(filePath, req.file.buffer);

            const fileUrl = `${BASE_URL}/${cleanFileName}`;
            const uploadDate = new Date();

            // Save document metadata to database
            const [result] = await db.promise().query(
                'INSERT INTO documents (customer_id, name, category, file_path, upload_date) VALUES (?, ?, ?, ?, ?)',
                [customerId, name, category, fileUrl, uploadDate]
            );

            // Send email notification to the customer
            const emailHtml = `
                <h2>New Document Uploaded</h2>
                <p>A new document has been uploaded to your account:</p>
                <ul>
                    <li><strong>Document Name:</strong> ${name}</li>
                    <li><strong>Category:</strong> ${category}</li>
                    <li><strong>Upload Date:</strong> ${uploadDate.toLocaleString()}</li>
                </ul>
                <p>You can view this document in your customer portal.</p>
            `;

            await sendEmail({
                to: customer[0].email,
                subject: 'New Document Upload Notification',
                html: emailHtml,
                attachments: [{
                    filename: req.file.originalname,
                    path: filePath
                }]
            });

            res.status(201).json({
                message: 'File uploaded successfully and notification email sent',
                document: {
                    id: result.insertId,
                    customerId,
                    name,
                    category,
                    fileUrl,
                    uploadDate,
                },
            });
        } catch (err) {
            handleError(res, err, 'Failed to upload document or send notification');
        }
    }
);

// Fetch all documents with pagination
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const [documents] = await db.promise().query(
            'SELECT * FROM documents ORDER BY upload_date DESC LIMIT ? OFFSET ?',
            [parseInt(limit), parseInt(offset)]
        );

        const [total] = await db.promise().query('SELECT COUNT(*) as count FROM documents');
        const totalPages = Math.ceil(total[0].count / limit);

        res.status(200).json({ documents, totalPages });
    } catch (err) {
        handleError(res, err, 'Failed to fetch documents');
    }
});

// Fetch a single document by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [document] = await db.promise().query('SELECT * FROM documents WHERE id = ?', [id]);
        if (!document.length) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.status(200).json(document[0]);
    } catch (err) {
        handleError(res, err, `Failed to fetch document with ID ${id}`);
    }
});

// Fetch documents for a specific user
router.get('/user/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        const [documents] = await db.promise().query(
            'SELECT * FROM documents WHERE customer_id = ? ORDER BY upload_date DESC',
            [customerId]
        );

        res.status(200).json({ 
            documents,
            totalCount: documents.length 
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch user documents');
    }
});

// Generate a pre-signed URL for downloading a document
router.get('/download/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [document] = await db.promise().query('SELECT * FROM documents WHERE id = ?', [id]);
        if (!document.length) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Extract filename from the file_path
        const fileUrl = document[0].file_path;
        const fileName = fileUrl.split('/').pop();
        const filePath = path.join(UPLOAD_DIR, fileName);

        console.log('Attempting to download file:', {
            filePath,
            fileName,
            exists: require('fs').existsSync(filePath)
        });

        // Check if file exists
        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Set headers and send file
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Stream the file to response
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete a document from S3 and database
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [document] = await db.promise().query('SELECT file_path FROM documents WHERE id = ?', [id]);
        if (!document.length) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const fileUrl = document[0].file_path;
        const fileName = fileUrl.split('/').pop();
        const filePath = path.join(UPLOAD_DIR, fileName);

        // Delete file from local storage
        await fs.unlink(filePath);

        // Delete database record
        await db.promise().query('DELETE FROM documents WHERE id = ?', [id]);

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        handleError(res, err, 'Failed to delete document');
    }
});

module.exports = router;




