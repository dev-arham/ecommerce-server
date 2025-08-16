const express = require('express');
const router = express.Router();
const Settings = require('../model/settings');
const asyncHandler = require('express-async-handler');
const { verifyJWT } = require('../middlewares/auth.middleware');

// GET /api/v1/settings - Fetch all settings
router.get('/', asyncHandler(async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        res.json({
            success: true,
            message: "Settings retrieved successfully",
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// POST /api/v1/settings - Create or update settings (Admin only)
router.post('/', verifyJWT, asyncHandler(async (req, res) => {
    try {
        // Validate user role if needed (assuming admin check)
        // You might want to add role-based middleware here
        
        const {
            appName,
            appDescription,
            appLogo,
            favicon,
            serverUrl,
            currency,
            currencySymbol,
            currencyPosition,
            dateFormat,
            timeFormat,
            timezone,
            language,
            supportEmail,
            companyName,
            companyAddress,
            companyPhone,
            companyWebsite
        } = req.body;

        // Create update object with only provided fields
        const updateData = {};
        
        if (appName !== undefined) updateData.appName = appName;
        if (appDescription !== undefined) updateData.appDescription = appDescription;
        if (appLogo !== undefined) updateData.appLogo = appLogo;
        if (favicon !== undefined) updateData.favicon = favicon;
        if (serverUrl !== undefined) updateData.serverUrl = serverUrl;
        if (currency !== undefined) updateData.currency = currency;
        if (currencySymbol !== undefined) updateData.currencySymbol = currencySymbol;
        if (currencyPosition !== undefined) updateData.currencyPosition = currencyPosition;
        if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
        if (timeFormat !== undefined) updateData.timeFormat = timeFormat;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (language !== undefined) updateData.language = language;
        if (supportEmail !== undefined) updateData.supportEmail = supportEmail;
        if (companyName !== undefined) updateData.companyName = companyName;
        if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
        if (companyPhone !== undefined) updateData.companyPhone = companyPhone;
        if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;

        const settings = await Settings.updateSettings(updateData);

        res.json({
            success: true,
            message: "Settings updated successfully",
            data: settings
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// PUT /api/v1/settings - Update specific settings (Admin only)
router.put('/', verifyJWT, asyncHandler(async (req, res) => {
    try {
        const settings = await Settings.updateSettings(req.body);

        res.json({
            success: true,
            message: "Settings updated successfully",
            data: settings
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// GET /api/v1/settings/public - Fetch public settings (no auth required)
router.get('/public', asyncHandler(async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Return only public settings (exclude sensitive information)
        const publicSettings = {
            appName: settings.appName,
            appDescription: settings.appDescription,
            appLogo: settings.appLogo,
            favicon: settings.favicon,
            currency: settings.currency,
            currencySymbol: settings.currencySymbol,
            currencyPosition: settings.currencyPosition,
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat,
            timezone: settings.timezone,
            language: settings.language,
            companyName: settings.companyName,
            companyWebsite: settings.companyWebsite
        };
        
        res.json({
            success: true,
            message: "Public settings retrieved successfully",
            data: publicSettings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// GET /api/v1/settings/currency - Get currency formatting info
router.get('/currency', asyncHandler(async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        const currencyInfo = {
            currency: settings.currency,
            currencySymbol: settings.currencySymbol,
            currencyPosition: settings.currencyPosition,
            formatCurrency: (amount) => settings.formatCurrency(amount)
        };
        
        res.json({
            success: true,
            message: "Currency settings retrieved successfully",
            data: currencyInfo
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// GET /api/v1/settings/branding - Get app branding info
router.get('/branding', asyncHandler(async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        const brandingInfo = {
            appName: settings.appName,
            appDescription: settings.appDescription,
            appLogo: settings.appLogo,
            favicon: settings.favicon,
            companyName: settings.companyName
        };
        
        res.json({
            success: true,
            message: "Branding settings retrieved successfully",
            data: brandingInfo
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// POST /api/v1/settings/reset - Reset to default settings (Admin only)
router.post('/reset', verifyJWT, asyncHandler(async (req, res) => {
    try {
        // Delete existing settings and create new default ones
        await Settings.deleteMany({});
        const settings = await Settings.getSettings();

        res.json({
            success: true,
            message: "Settings reset to defaults successfully",
            data: settings
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

// GET /api/v1/settings/test-currency/:amount - Test currency formatting
router.get('/test-currency/:amount', asyncHandler(async (req, res) => {
    try {
        const amount = parseFloat(req.params.amount);
        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount provided"
            });
        }

        const settings = await Settings.getSettings();
        const formattedAmount = settings.formatCurrency(amount);
        
        res.json({
            success: true,
            message: "Currency formatting test completed",
            data: {
                originalAmount: amount,
                formattedAmount: formattedAmount,
                currency: settings.currency,
                currencySymbol: settings.currencySymbol,
                currencyPosition: settings.currencyPosition
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}));

module.exports = router;
