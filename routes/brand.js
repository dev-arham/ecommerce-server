const express = require('express');
const router = express.Router();
const Brand = require('../model/brand');
const Product = require('../model/product');
const asyncHandler = require('express-async-handler');

// Get all brands with pagination
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
            searchQuery.name = { $regex: search, $options: 'i' };
        }
        
        const totalItems = await Brand.countDocuments(searchQuery);
        
        const brands = await Brand.find(searchQuery)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Brands retrieved successfully",
            data: brands,
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

// Get a brand by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const brandID = req.params.id;
        const brand = await Brand.findById(brandID);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.json({ success: true, message: "Brand retrieved successfully.", data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new brand
router.post('/', asyncHandler(async (req, res) => {
    const { name, image } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Brand name is required." });
    }
    try {
        const brand = new Brand({ name, image });
        await brand.save();
        res.json({ success: true, message: "Brand created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a brand
router.put('/:id', asyncHandler(async (req, res) => {
    const brandID = req.params.id;
    const { name, image } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Brand name is required" });
    }

    try {
        const updatedBrand = await Brand.findByIdAndUpdate(brandID, { name, image }, { new: true });
        if (!updatedBrand) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.json({ success: true, message: "Brand updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a brand
router.delete('/:id', asyncHandler(async (req, res) => {
    const brandID = req.params.id;
    try {
        // Check if any products reference this brand
        const products = await Product.find({ proBrand: brandID });
        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete brand. Products are referencing it." });
        }

        // If no products are referencing the brand, proceed with deletion
        const brand = await Brand.findByIdAndDelete(brandID);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand not found." });
        }
        res.json({ success: true, message: "Brand deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


module.exports = router;
