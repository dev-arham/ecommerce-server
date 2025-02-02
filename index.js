const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
//?Middle wair
app.use(cors({ origin: '*' }))
app.use(bodyParser.json());
app.use(cookieParser())
//? setting static folder path
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));
app.use('/image/users', express.static('public/users'));

const hostUrl = process.env.SERVER_URL;
const port = process.env.PORT;
const apiEnd = process.env.API_URL_ENDPOINT;
const DB_URL = process.env.MONGO_URL;

mongoose.connect(DB_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

// Routes
app.use(`${apiEnd}/categories`, require('./routes/category'));
app.use(`${apiEnd}/subCategories`, require('./routes/subCategory'));
app.use(`${apiEnd}/brands`, require('./routes/brand'));
app.use(`${apiEnd}/variantTypes`, require('./routes/variantType'));
app.use(`${apiEnd}/variants`, require('./routes/variant'));
app.use(`${apiEnd}/couponCodes`, require('./routes/couponCode'));
app.use(`${apiEnd}/products`, require('./routes/product'));
app.use(`${apiEnd}/posters`, require('./routes/poster'));
app.use(`${apiEnd}/users`, require('./routes/user'));
app.use(`${apiEnd}/orders`, require('./routes/order'));
app.use(`${apiEnd}/payment`, require('./routes/payment'));
app.use(`${apiEnd}/notification`, require('./routes/notification'));


// Example route using asyncHandler directly in app.js
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'API working successfully', data: null });
}));

// Global error handler
app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
});


app.listen(port, hostUrl, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});


