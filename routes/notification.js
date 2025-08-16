const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../model/notification');
const OneSignal = require('onesignal-node');
const dotenv = require('dotenv');
dotenv.config();


const client = new OneSignal.Client(process.env.ONE_SIGNAL_APP_ID, process.env.ONE_SIGNAL_REST_API_KEY);

router.post('/send-notification', asyncHandler(async (req, res) => {
    const { title, description, imageUrl } = req.body;

    const notificationBody = {
        contents: {
            'en': description
        },
        headings: {
            'en': title
        },
        included_segments: ['All'],
        ...(imageUrl && { big_picture: imageUrl })
    };

    const response = await client.createNotification(notificationBody);
    const notificationId = response.body.id;
    const notification = new Notification({ notificationId, title,description,imageUrl });
    const newNotification = await notification.save();
    res.json({ success: true, message: 'Notification sent successfully', data: null });
}));

router.get('/track-notification/:id', asyncHandler(async (req, res) => {
    const  notificationId  =req.params.id;

    const response = await client.viewNotification(notificationId);
    const androidStats = response.body.platform_delivery_stats;

    const result = {
        platform: 'Android',
        success_delivery: androidStats.android.successful,
        failed_delivery: androidStats.android.failed,
        errored_delivery: androidStats.android.errored,
        opened_notification: androidStats.android.converted
    };
    res.json({ success: true, message: 'success', data: result });
}));


router.get('/all-notification', asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || '_id';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const totalItems = await Notification.countDocuments(searchQuery);
        
        const notifications = await Notification.find(searchQuery)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Notifications retrieved successfully",
            data: notifications,
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


router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
    const notificationID = req.params.id;
    try {
        const notification = await Notification.findByIdAndDelete(notificationID);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }
        res.json({ success: true, message: "Notification deleted successfully.",data:null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


module.exports = router;
