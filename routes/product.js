const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // Import mongoose


// Get all products with pagination
router.get('/', asyncHandler(async (req, res) => {
    try {
        // Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const category = req.query.category || '';
        const brand = req.query.brand || '';
        
        const skip = (page - 1) * limit;
        
        // Build search query
        let searchQuery = {};
        
        if (search) {
            // For searching in populated fields, we need to use aggregation or multiple queries
            // Let's first search in the main product fields
            searchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            searchQuery.proCategories = category;
        }
        
        if (brand) {
            searchQuery.proBrand = brand;
        }
        
        // Get total count for pagination info
        const totalItems = await Product.countDocuments(searchQuery);
        
        let products;
        
        if (search) {
            // Use aggregation for searching in populated fields (brand and category names)
            products = await Product.aggregate([
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'proCategories',
                        foreignField: '_id',
                        as: 'proCategories'
                    }
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'proBrand',
                        foreignField: '_id',
                        as: 'proBrand'
                    }
                },
                {
                    $unwind: {
                        path: '$proBrand',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } },
                            { 'proBrand.name': { $regex: search, $options: 'i' } },
                            { 'proCategories.name': { $regex: search, $options: 'i' } }
                        ]
                    }
                },
                {
                    $sort: { [sortBy]: sortOrder }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ]);
            
            // Recalculate total for search results
            const searchResults = await Product.aggregate([
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'proCategories',
                        foreignField: '_id',
                        as: 'proCategories'
                    }
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'proBrand',
                        foreignField: '_id',
                        as: 'proBrand'
                    }
                },
                {
                    $unwind: {
                        path: '$proBrand',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } },
                            { 'proBrand.name': { $regex: search, $options: 'i' } },
                            { 'proCategories.name': { $regex: search, $options: 'i' } }
                        ]
                    }
                },
                {
                    $count: "total"
                }
            ]);
            
            const searchTotalItems = searchResults.length > 0 ? searchResults[0].total : 0;
            const searchTotalPages = Math.ceil(searchTotalItems / limit);
            
            res.json({
                success: true,
                message: "Products retrieved successfully",
                data: products,
                pagination: {
                    currentPage: page,
                    totalPages: searchTotalPages,
                    totalItems: searchTotalItems,
                    itemsPerPage: limit,
                    hasNextPage: page < searchTotalPages,
                    hasPrevPage: page > 1
                }
            });
        } else {
            // Get paginated results with population for non-search queries
            products = await Product.find(searchQuery)
                .populate('proCategories')
                .populate('proBrand', 'id name')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean(); // Use lean() for better performance
            
            const totalPages = Math.ceil(totalItems / limit);
            
            res.json({
                success: true,
                message: "Products retrieved successfully",
                data: products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get products by name
router.get('/search', asyncHandler(async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ success: false, message: "Query parameter 'name' is required." });
        }
        const products = await Product.find({ name: { $regex: name, $options: 'i' } })
            .populate('proCategories')
            .populate('proBrand', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategories')
            .populate('proBrand', 'id name');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product retrieved successfully.", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));




// create new product
router.post('/', asyncHandler(async (req, res) => {
    try {

        // Extract product data from the request body
        const { name, description, quantity, price, offerPrice, proCategories, proBrand, imageUrls } = req.body;

        // Check if any required fields are missing
        if (!name || !price || !quantity || !proCategories) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        // const parsedProductVariants = JSON.parse(productVariants);

        // Create a new product object with data
        const newProduct = new Product({ name: name, description: description, quantity: quantity, price: price, offerPrice: offerPrice, proCategories: proCategories, proBrand: proBrand, images: imageUrls });

        // Save the new product to the database
        await newProduct.save();

        // Send a success response back to the client
        res.json({ success: true, message: "Product created successfully.", data: null });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID." });
    }
    try {
        // Execute the Multer middleware to handle file fields
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategories, proBrand, imageUrls } = req.body;

            // Find the product by ID
            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            // const parsedProductVariants = JSON.parse(productVariants);

            // Update product properties if provided
            productToUpdate.name = name || productToUpdate.name;
            productToUpdate.description = description || productToUpdate.description;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.price = price || productToUpdate.price;
            productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            productToUpdate.proCategories = proCategories || productToUpdate.proCategories;
            productToUpdate.proBrand = proBrand || productToUpdate.proBrand;
            productToUpdate.images = imageUrls || productToUpdate.images;
            // productToUpdate.productVariants = parsedProductVariants || productToUpdate.productVariants;


            // Save the updated product
            await productToUpdate.save();
            res.json({ success: true, message: "Product updated successfully." });
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findById(productID);
        if (product === null) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        // if (product.images.length > 0) {
        //     // Iterate over the images array and delete the image files
        //     product.images.forEach(async (img) => {
        //         // Extract the filename from the URL
        //         const filename = path.basename(img.url);

        //         // Construct the correct path to the image file
        //         const imagePath = path.join(__dirname, '../public/products', filename);

        //         // Delete the file
        //         await fs.promises.unlink(imagePath, async (err) => {
        //             if (err) {
        //                 console.error("Failed to delete image file:", err);
        //                 return res.status(404).json({ success: false, message: "Image not found." });
        //                 // You can choose to handle the error or continue with the product deletion
        //             } else {
        //             }
        //         });
        //     });
        // }
        await Product.findByIdAndDelete(productID);
        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
