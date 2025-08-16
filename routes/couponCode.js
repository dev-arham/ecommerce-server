const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Coupon = require('../model/couponCode'); 
const Product = require('../model/product');
const Brand = require('../model/brand');

// Get all coupons with pagination
router.get('/', asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const status = req.query.status || '';
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { couponCode: { $regex: search, $options: 'i' } },
                { couponTitle: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            searchQuery.status = status;
        }
        
        const totalItems = await Coupon.countDocuments(searchQuery);
        
        const coupons = await Coupon.find(searchQuery)
            .populate('applicableCategory', 'id name')
            .populate('applicableBrand', 'id name')
            .populate('applicableProduct', 'id name')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Coupons retrieved successfully",
            data: coupons,
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

// Get a coupon by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const coupon = await Coupon.findById(couponID)
            .populate('applicableCategory', 'id name')
            .populate('applicableBrand', 'id name')
            .populate('applicableProduct', 'id name');
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.json({ success: true, message: "Coupon retrieved successfully.", data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new coupon
router.post('/', asyncHandler(async (req, res) => {
    const { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableBrand, applicableProduct } = req.body;
    if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
        return res.status(400).json({ success: false, message: "Code, discountType, discountAmount, endDate, and status are required." });
    }



    try {
        const coupon = new Coupon({
            couponCode,
            discountType,
            discountAmount,
            minimumPurchaseAmount,
            endDate,
            status,
            applicableCategory,
            applicableBrand,
            applicableProduct
        });

        const newCoupon = await coupon.save();
        res.json({ success: true, message: "Coupon created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


// Update a coupon
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableBrand, applicableProduct } = req.body;
        if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
            return res.status(400).json({ success: false, message: "CouponCode, discountType, discountAmount, endDate, and status are required." });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponID,
            { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableBrand, applicableProduct },
            { new: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        res.json({ success: true, message: "Coupon updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


// Delete a coupon
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponID);
        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.post('/check-coupon', asyncHandler(async (req, res) => {
    const { couponCode, productIds,purchaseAmount } = req.body;

    try {
        // Find the coupon with the provided coupon code
        const coupon = await Coupon.findOne({ couponCode });


        // If coupon is not found, return false
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found." });
        }

        // Check if the coupon is expired
        const currentDate = new Date();
        if (coupon.endDate < currentDate) {
            return res.json({ success: false, message: "Coupon is expired." });
        }

        // Check if the coupon is active
        if (coupon.status !== 'active') {
            return res.json({ success: false, message: "Coupon is inactive." });
        }

       // Check if the purchase amount is greater than the minimum purchase amount specified in the coupon
       if (coupon.minimumPurchaseAmount && purchaseAmount < coupon.minimumPurchaseAmount) {
        return res.json({ success: false, message: "Minimum purchase amount not met." });
    }

        // Check if the coupon is applicable for all orders
        if (!coupon.applicableCategory && !coupon.applicableBrand && !coupon.applicableProduct) {
            return res.json({ success: true, message: "Coupon is applicable for all orders." ,data:coupon});
        }

        // Fetch the products from the database using the provided product IDs
        const products = await Product.find({ _id: { $in: productIds } }).populate('proCategories').populate('proBrand');

        // Check if any product in the list is not applicable for the coupon
        const isValid = products.every(product => {
            // Check category condition - product.proCategories is an array, so check if any category matches
            if (coupon.applicableCategory) {
                const categoryMatch = product.proCategories.some(category => 
                    category._id.toString() === coupon.applicableCategory.toString()
                );
                if (!categoryMatch) {
                    return false;
                }
            }
            
            // Check brand condition
            if (coupon.applicableBrand && product.proBrand && coupon.applicableBrand.toString() !== product.proBrand._id.toString()) {
                return false;
            }
            
            // Check specific product condition
            if (coupon.applicableProduct && coupon.applicableProduct.toString() !== product._id.toString()) {
                return false;
            }
            
            return true;
        });

        if (isValid) {
            return res.json({ success: true, message: "Coupon is applicable for the provided products." ,data:coupon});
        } else {
            return res.json({ success: false, message: "Coupon is not applicable for the provided products." });
        }
    } catch (error) {
        console.error('Error checking coupon code:', error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}));




module.exports = router;
