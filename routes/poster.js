const express = require('express');
const router = express.Router();
const Poster = require('../model/poster');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const serverUrl = process.env.SERVER_URL;
const serverPort = process.env.PORT;

// Get all posters with pagination
router.get('/', asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { posterName: { $regex: search, $options: 'i' } },
                { targetUrl: { $regex: search, $options: 'i' } }
            ];
        }
        
        const totalItems = await Poster.countDocuments(searchQuery);
        
        const posters = await Poster.find(searchQuery)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Posters retrieved successfully",
            data: posters,
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
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a poster by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const posterID = req.params.id;
        const poster = await Poster.findById(posterID);
        if (!poster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }
        res.json({ success: true, message: "Poster retrieved successfully.", data: poster });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new poster
router.post('/', asyncHandler(async (req, res) => {
    try {
        const { posterName, imageUrl, targetUrl } = req.body;

        if (!posterName || !imageUrl) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        try {
            const newPoster = new Poster({
                posterName: posterName,
                imageUrl: imageUrl,
                targetUrl: targetUrl
            });
            await newPoster.save();
            res.json({ success: true, message: "Poster created successfully.", data: null });
        } catch (error) {
            console.error("Error creating Poster:", error);
            res.status(500).json({ success: false, message: error.message });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Update a poster
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        const { posterName, imageUrl, targetUrl } = req.body;

        if (!posterName || !imageUrl) {
            return res.status(400).json({ success: false, message: "Name and image are required." });
        }

        try {
            const updatedPoster = await Poster.findByIdAndUpdate(categoryID, { posterName: posterName, imageUrl: imageUrl, targetUrl: targetUrl }, { new: true });
            if (!updatedPoster) {
                return res.status(404).json({ success: false, message: "Poster not found." });
            }
            res.json({ success: true, message: "Poster updated successfully.", data: null });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Delete a poster
router.delete('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    try {
        const deletedPoster = await Poster.findById(posterID);
        if (!deletedPoster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }

        // if (deletedPoster.imageUrl) {
        //     // Extract the filename from the URL
        //     const filename = path.basename(deletedPoster.imageUrl);

        //     // Construct the correct path to the image file
        //     const imagePath = path.join(__dirname, '../public/posters', filename);

        //     // Delete the file
        //     await fs.promises.unlink(imagePath, async (err) => {
        //         if (err) {
        //             console.error("Failed to delete image file:", err);
        //             return res.status(404).json({ success: false, message: "Image not found." });
        //             // You can choose to handle the error or continue with the category deletion
        //         } else {
        //         }
        //     });

        // }
        await Poster.findByIdAndDelete(posterID);
        res.json({ success: true, message: "Poster deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
