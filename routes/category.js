const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const Product = require('../model/product');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
const Brand = require('../model/brand');
dotenv.config();

const serverUrl = process.env.SERVER_URL;
const serverPort = process.env.PORT;

// Get all categories with pagination
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
        
        const totalItems = await Category.countDocuments(searchQuery);
        
        const categories = await Category.find(searchQuery)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories,
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

// Get a category by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category retrieved successfully.", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new category with image upload
router.post('/', asyncHandler(async (req, res) => {
    try {
        const { name, imageUrl } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        try {
            const newCategory = new Category({
                name: name,
                image: imageUrl
            });
            await newCategory.save();
            res.json({ success: true, message: "Category created successfully.", data: null });
        } catch (error) {
            console.error("Error creating category:", error);
            res.status(500).json({ success: false, message: error.message });
        }

    }

    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Update a category
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        const { name, imageUrl } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required." });
        }

        try {
            const updatedCategory = await Category.findByIdAndUpdate(categoryID, { name: name, image: imageUrl }, { new: true });
            if (!updatedCategory) {
                return res.status(404).json({ success: false, message: "Category not found." });
            }
            res.json({ success: true, message: "Category updated successfully.", data: null });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Delete a category
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        // Check if any products reference this category
        const products = await Product.find({ proCategory: categoryID });
        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Products are referencing it." });
        }

        // Check if any brand reference this category
        const brands = await Brand.find({ categoryId: categoryID });
        if (brands.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete category. Brands are referencing it." });
        }

        const category = await Category.findByIdAndDelete(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category deleted successfully." });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));






module.exports = router;
