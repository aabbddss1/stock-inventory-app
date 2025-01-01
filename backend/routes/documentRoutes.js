const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const { body, validationResult } = require('express-validator');
const db = require('../db'); // Import your database connection
require('dotenv').config(); // Load environment variables
const router = express.Router();

// Constants
const ALLOWED_CATEGORIES = ['Invoice', 'Contract', 'Report', 'Other'];

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

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
            // Validate customer exists
            const [customer] = await db.promise().query('SELECT id FROM customers WHERE id = ?', [customerId]);
            if (!customer.length) {
                return res.status(404).json({ error: 'Customer ID not found.' });
            }

            // Clean and sanitize file name
            const cleanFileName = req.file.originalname
                .replace(/\s+/g, '-') // Replace spaces with dashes
                .replace(/[()]/g, ''); // Remove parentheses
            const fileKey = `${Date.now()}-${cleanFileName}`;

            // Upload file to S3
            const uploadResult = await s3
                .upload({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: fileKey,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                })
                .promise();

            const fileUrl = uploadResult.Location; // S3 file URL
            const uploadDate = new Date();

            // Save document metadata to the database
            const [result] = await db.promise().query(
                'INSERT INTO documents (customer_id, name, category, file_path, upload_date) VALUES (?, ?, ?, ?, ?)',
                [customerId, name, category, fileUrl, uploadDate]
            );

            res.status(201).json({
                message: 'File uploaded successfully',
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
            handleError(res, err, 'Failed to upload document');
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

// Generate a pre-signed URL for downloading a document
router.get('/download/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [document] = await db.promise().query('SELECT file_path FROM documents WHERE id = ?', [id]);
        if (!document.length) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const fileUrl = document[0].file_path;
        const fileKey = decodeURIComponent(fileUrl.split('/').pop()); // Decode the key

        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
            Expires: 60 * 5, // URL expires in 5 minutes
        });

        res.status(200).json({ signedUrl });
    } catch (err) {
        handleError(res, err, 'Failed to generate download URL');
    }
});

// Delete a document from S3 and database
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch document metadata
        const [document] = await db.promise().query('SELECT file_path FROM documents WHERE id = ?', [id]);
        if (!document.length) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const fileUrl = document[0].file_path;
        const fileKey = fileUrl.split('/').pop();

        // Delete the file from S3
        await s3
            .deleteObject({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileKey,
            })
            .promise();

        // Delete the document record from the database
        await db.promise().query('DELETE FROM documents WHERE id = ?', [id]);

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        handleError(res, err, 'Failed to delete document');
    }
});

module.exports = router;