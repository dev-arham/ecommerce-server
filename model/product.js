const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    offerPrice: {
        type: Number
    },
    proCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    proSubCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },
    proBrand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    images: [{
        image: {
            type: String, // Changed from Number to String
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    productVariants: [{
        variantType: String,
        variants: [{
            variantName: String,
            quantity: Number,
        }]
    }],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
