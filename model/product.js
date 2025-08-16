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
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    offerPrice: {
        type: Number
    },
    proCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }],
    proBrand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    images: [{
        type: String,
        required: true
    }],
    // productVariants: [{
    //     variantType: String,
    //     variants: [{
    //         variantName: String,
    //         quantity: Number,
    //     }]
    // }],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
