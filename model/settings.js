const mongoose = require('mongoose');

// Define the Settings schema based on the Settings System Documentation
const settingsSchema = new mongoose.Schema({
    // App Configuration
    appName: {
        type: String,
        default: 'EWA Dash',
        trim: true
    },
    appDescription: {
        type: String,
        default: 'E-commerce Admin Panel for managing products, orders, and customers',
        trim: true
    },
    appLogo: {
        type: String,
        default: '',
        trim: true
    },
    favicon: {
        type: String,
        default: '',
        trim: true
    },
    
    // Server Configuration
    serverUrl: {
        type: String,
        default: '',
        trim: true
    },
    
    // Currency & Localization
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'PKR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
        trim: true
    },
    currencySymbol: {
        type: String,
        default: '$',
        trim: true
    },
    currencyPosition: {
        type: String,
        default: 'before',
        enum: ['before', 'after'],
        trim: true
    },
    dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY'],
        trim: true
    },
    timeFormat: {
        type: String,
        default: '12h',
        enum: ['12h', '24h'],
        trim: true
    },
    timezone: {
        type: String,
        default: 'UTC',
        trim: true
    },
    language: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
        trim: true
    },
    
    // Contact & Support
    supportEmail: {
        type: String,
        default: '',
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                // Allow empty string or valid email
                return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    companyName: {
        type: String,
        default: '',
        trim: true
    },
    companyAddress: {
        type: String,
        default: '',
        trim: true
    },
    companyPhone: {
        type: String,
        default: '',
        trim: true
    },
    companyWebsite: {
        type: String,
        default: '',
        trim: true,
        validate: {
            validator: function(v) {
                // Allow empty string or valid URL
                return !v || /^https?:\/\/.+\..+/.test(v);
            },
            message: 'Please enter a valid website URL'
        }
    },
    
    // System settings
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    // Ensure only one settings document exists
    collection: 'settings'
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        // Create default settings if none exist
        settings = await this.create({});
    }
    return settings;
};

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updateData) {
    let settings = await this.findOne();
    if (!settings) {
        // Create with provided data if none exist
        settings = await this.create(updateData);
    } else {
        // Update existing settings
        Object.assign(settings, updateData);
        await settings.save();
    }
    return settings;
};

// Instance method to format currency
settingsSchema.methods.formatCurrency = function(amount) {
    const formattedAmount = parseFloat(amount).toFixed(2);
    if (this.currencyPosition === 'before') {
        return `${this.currencySymbol}${formattedAmount}`;
    } else {
        return `${formattedAmount}${this.currencySymbol}`;
    }
};

// Instance method to get API URL
settingsSchema.methods.getApiUrl = function(endpoint) {
    const baseUrl = this.serverUrl || '';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}/api/v1${cleanEndpoint}`;
};

// Create the Settings model
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
