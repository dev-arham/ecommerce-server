const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const serverUrl = process.env.SERVER_URL;
const serverPort = process.env.PORT;

// Helper function to validate media type
const isValidMediaType = (mediaType) => {
    const validTypes = ['product', 'category', 'brand', 'poster', 'users', 'general'];
    return validTypes.includes(mediaType);
};

// Helper function to get upload path and URL prefix
const getMediaConfig = (mediaType) => {
    switch (mediaType) {
        case 'product':
            return {
                uploadPath: 'public/products',
                urlPath: '/image/products/'
            };
        case 'category':
            return {
                uploadPath: 'public/category',
                urlPath: '/image/category/'
            };
        case 'brand':
            return {
                uploadPath: 'public/brands',
                urlPath: '/image/brands/'
            };
        case 'poster':
            return {
                uploadPath: 'public/posters',
                urlPath: '/image/posters/'
            };
        case 'users':
            return {
                uploadPath: 'public/users',
                urlPath: '/image/users/'
            };
        default:
            return {
                uploadPath: 'public/media',
                urlPath: '/image/media/'
            };
    }
};

// Configure multer for general media uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Get mediaType from query parameters
        const mediaType = req.query.mediaType || 'general';
        
        // Validate media type
        if (!isValidMediaType(mediaType)) {
            return cb(new Error('Invalid media type. Allowed types: product, category, poster, users, general'), false);
        }
        
        const { uploadPath } = getMediaConfig(mediaType);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExtension);
        const uniqueName = baseName + '_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + fileExtension;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedMimetypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    if (allowedMimetypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Upload single image
router.post('/upload', asyncHandler(async (req, res) => {
    try {
        upload.single('file')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'File size is too large. Maximum filesize is 5MB.' 
                    });
                }
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            } else if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No file uploaded.' 
                });
            }

            const mediaType = req.query.mediaType || 'general';
            
            // Validate media type
            if (!isValidMediaType(mediaType)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid media type. Allowed types: product, category, poster, users, general' 
                });
            }
            
            const { urlPath } = getMediaConfig(mediaType);
            const imageUrl = `${serverUrl}:${serverPort}${urlPath}${req.file.filename}`;

            const fileInfo = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: imageUrl,
                mediaType: mediaType,
                uploadDate: new Date()
            };

            res.json({ 
                success: true, 
                message: "File uploaded successfully.", 
                data: fileInfo 
            });
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// Upload multiple images
router.post('/upload/multiple', asyncHandler(async (req, res) => {
    try {
        upload.array('files', 10)(req, res, async function (err) { // Limit to 10 files
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'File size is too large. Maximum filesize is 5MB per file.' 
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Too many files. Maximum 10 files allowed.' 
                    });
                }
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            } else if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No files uploaded.' 
                });
            }

            const mediaType = req.query.mediaType || 'general';
            
            // Validate media type
            if (!isValidMediaType(mediaType)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid media type. Allowed types: product, category, poster, users, general' 
                });
            }
            
            const { urlPath } = getMediaConfig(mediaType);
            
            const filesInfo = req.files.map(file => {
                const imageUrl = `${serverUrl}:${serverPort}${urlPath}${file.filename}`;

                return {
                    filename: file.filename,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    url: imageUrl,
                    mediaType: mediaType,
                    uploadDate: new Date()
                };
            });

            res.json({ 
                success: true, 
                message: `${req.files.length} files uploaded successfully.`, 
                data: filesInfo 
            });
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// Delete uploaded file
router.delete('/delete/:filename', asyncHandler(async (req, res) => {
    try {
        const filename = req.params.filename;
        const mediaType = req.query.mediaType || 'general';
        
        // Validate media type
        if (!isValidMediaType(mediaType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid media type. Allowed types: product, category, poster, users, general' 
            });
        }
        
        // Validate filename to prevent path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid filename.' 
            });
        }
        
        const { uploadPath } = getMediaConfig(mediaType);
        const filePath = path.join(uploadPath, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'File not found.' 
            });
        }

        // Delete the file
        fs.unlinkSync(filePath);

        res.json({ 
            success: true, 
            message: 'File deleted successfully.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// Get list of uploaded files by type
router.get('/list', asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Default 20 for images
        const search = req.query.search || '';
        const mediaType = req.query.mediaType || 'general';
        const sortBy = req.query.sortBy || 'uploadDate';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        // Validate media type
        if (!isValidMediaType(mediaType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid media type. Allowed types: product, category, brand, poster, users, general' 
            });
        }
        
        const { uploadPath, urlPath } = getMediaConfig(mediaType);
        const urlPrefix = `${serverUrl}:${serverPort}${urlPath}`;

        // Check if directory exists
        if (!fs.existsSync(uploadPath)) {
            return res.json({ 
                success: true, 
                message: 'No files found.', 
                data: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }

        // Read directory contents
        const files = fs.readdirSync(uploadPath);
        
        let fileList = files
            .filter(file => {
                // Filter only image files
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            })
            .map(file => {
                const filePath = path.join(uploadPath, file);
                const stats = fs.statSync(filePath);
                
                return {
                    filename: file,
                    originalName: file.split('_')[0], // Extract original name before timestamp
                    url: urlPrefix + file,
                    size: stats.size,
                    mediaType: mediaType,
                    uploadDate: stats.birthtime,
                    mimeType: `image/${path.extname(file).substring(1)}`
                };
            });

        // Apply search filter
        if (search) {
            fileList = fileList.filter(file => 
                file.filename.toLowerCase().includes(search.toLowerCase()) ||
                file.originalName.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort files
        fileList.sort((a, b) => {
            const aValue = a[sortBy] || a.uploadDate;
            const bValue = b[sortBy] || b.uploadDate;
            
            if (sortOrder === 1) {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Calculate pagination
        const totalItems = fileList.length;
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;
        
        // Apply pagination
        const paginatedFiles = fileList.slice(skip, skip + limit);

        res.json({ 
            success: true, 
            message: 'Media files retrieved successfully', 
            data: paginatedFiles,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

module.exports = router;
