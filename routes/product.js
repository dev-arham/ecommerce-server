const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
const mongoose = require('mongoose'); // Import mongoose
dotenv.config();

const serverUrl = process.env.SERVER_URL;
const serverPort = process.env.PORT;

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
        .populate('proCategory', 'id name')
        .populate('proSubCategory', 'id name')
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
            .populate('proCategory', 'id name')
            .populate('proSubCategory', 'id name')
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
        // Execute the Multer middleware to handle multiple file fields
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                // Handle Multer errors, if any
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB per image.';
                }
                console.log(`Add product: ${err}`);
                return res.json({ success: false, message: err.message });
            } else if (err) {
                // Handle other errors, if any
                console.log(`Add product: ${err}`);
                return res.json({ success: false, message: err });
            }

            // Extract product data from the request body
            const { name, description, quantity, price, offerPrice, proCategory, proSubCategory, proBrand } = req.body;

            // Check if any required fields are missing
            if (!name || !price || !proCategory || !proSubCategory || !quantity) {
                return res.status(400).json({ success: false, message: "Required fields are missing." });
            }

            // Initialize an array to store image URLs
            const imageUrls = [];

            // Iterate over the file fields
            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `${serverUrl}:${serverPort}/image/products/${file.filename}`;
                    imageUrls.push({ image: (index + 1).toString(), url: imageUrl }); // Changed index to string
                }
            });

            // Create a new product object with data
            const newProduct = new Product({ name: name, description: description, quantity: quantity, price: price, offerPrice: offerPrice, proCategory: proCategory, proSubCategory: proSubCategory, proBrand: proBrand, images: imageUrls });

            // Save the new product to the database
            await newProduct.save();

            // Send a success response back to the client
            res.json({ success: true, message: "Product created successfully.", data: null });
        });
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
                console.log(`Update product: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategory, proSubCategory, proBrand, productVariants} = req.body;

            // Find the product by ID
            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            const parsedProductVariants = JSON.parse(productVariants);

            // Update product properties if provided
            productToUpdate.name = name || productToUpdate.name;
            productToUpdate.description = description || productToUpdate.description;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.price = price || productToUpdate.price;
            productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            productToUpdate.proCategory = proCategory || productToUpdate.proCategory
            productToUpdate.proSubCategory = proSubCategory || productToUpdate.proSubCategory;
            productToUpdate.proBrand = proBrand || productToUpdate.proBrand;
            productToUpdate.productVariants = parsedProductVariants || productToUpdate.productVariants;

            // Iterate over the file fields to update images
            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `${serverUrl}:${serverPort}/image/products/${file.filename}`;
                    // Update the specific image URL in the images array
                    let imageEntry = productToUpdate.images.find(img => img.image === (index + 1));
                    if (imageEntry) {
                        imageEntry.url = imageUrl;
                    } else {
                        // If the image entry does not exist, add it
                        productToUpdate.images.push({ image: index + 1, url: imageUrl });
                    }
                }
            });

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
    if (!mongoose.isValidObjectId(productID)) {
        return res.status(400).json({ success: false, message: "Invalid product ID." });
    }
    try {
        const product = await Product.findById(productID);
        if (product === null) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        if (product.images.length > 0) {
            // Iterate over the images array and delete the image files
            product.images.forEach(async (img) => {
                // Extract the filename from the URL
                const filename = path.basename(img.url);

                // Construct the correct path to the image file
                const imagePath = path.join(__dirname, '../public/products', filename);

                // Delete the file
                await fs.promises.unlink(imagePath, async (err) => {
                    if (err) {
                        console.error("Failed to delete image file:", err);
                        return res.status(404).json({ success: false, message: "Image not found." });
                        // You can choose to handle the error or continue with the product deletion
                    } else {
                        console.log("Image file deleted successfully:", imagePath);
                    }
                });
            });
            await Product.findByIdAndDelete(productID);
            res.json({ success: true, message: "Product deleted successfully." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
