const mongoose = require('mongoose');

// Define the Brand schema
const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        // Adding custom error message
        trim: true
    },
    image: {
        type: String,
        required: false
    }
}, { timestamps: true });

// Create the Brand model
const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
