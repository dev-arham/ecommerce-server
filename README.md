# E-Commerce Backend Server

A comprehensive RESTful API backend for an e-commerce platform built with Node.js, Express.js, and MongoDB. This server provides all the essential features needed for a modern e-commerce application including user management, product catalog, order processing, payment integration, and more.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Product Management** - Complete CRUD operations for products with image uploads
- **Category & Brand Management** - Hierarchical category structure with subcategories
- **Shopping Cart & Orders** - Order management with status tracking
- **Payment Integration** - Stripe and Razorpay payment gateway support
- **File Upload Management** - Image upload for products, categories, brands, and user profiles
- **Notification System** - Push notifications using OneSignal
- **Settings Management** - Application-wide settings and configuration
- **Search & Pagination** - Advanced search and pagination across all entities
- **Error Handling** - Comprehensive error handling and validation

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Middleware](#middleware)
- [File Upload](#file-upload)
- [Authentication](#authentication)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)

## 🛠 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (>= 16.0.0)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/ecommerce-server.git
   cd ecommerce-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

5. **Start the server:**
   ```bash
   # Development mode
   npm start
   
   # Or with nodemon for auto-restart
   npm run dev
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
API_URL_ENDPOINT=/api/v1
SERVER_URL=http://localhost:5000

# Database
MONGO_URL=mongodb://localhost:27017/ecommerce

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PBLK_KET_TST=pk_test_your_stripe_publishable_key
RAZORPAY_KEY_TEST=your_razorpay_key

# OneSignal (Push Notifications)
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
```

## 📁 Project Structure

```
ecommerce-server/
├── index.js                 # Main application entry point
├── package.json             # Project dependencies and scripts
├── eslint.config.mjs        # ESLint configuration
├── uploadFile.js            # File upload configurations
│
├── middlewares/             # Custom middleware functions
│   ├── auth.middleware.js   # JWT authentication middleware
│   └── multer.middleware.js # File upload middleware
│
├── model/                   # Database models (Mongoose schemas)
│   ├── brand.js            # Brand model
│   ├── category.js         # Category model
│   ├── couponCode.js       # Coupon code model
│   ├── notification.js     # Notification model
│   ├── order.js            # Order model
│   ├── poster.js           # Poster/banner model
│   ├── product.js          # Product model
│   ├── settings.js         # Application settings model
│   ├── subCategory.js      # Sub-category model
│   ├── user.js             # User model with authentication
│   ├── variant.js          # Product variant model
│   └── variantType.js      # Variant type model
│
├── routes/                  # API route handlers
│   ├── brand.js            # Brand-related endpoints
│   ├── category.js         # Category-related endpoints
│   ├── couponCode.js       # Coupon code endpoints
│   ├── media.js            # Media/file endpoints
│   ├── notification.js     # Notification endpoints
│   ├── order.js            # Order management endpoints
│   ├── payment.js          # Payment processing endpoints
│   ├── poster.js           # Poster/banner endpoints
│   ├── product.js          # Product management endpoints
│   ├── settings.js         # Application settings endpoints
│   ├── subCategory.js      # Sub-category endpoints
│   ├── user.js             # User management & authentication
│   ├── variant.js          # Product variant endpoints
│   └── variantType.js      # Variant type endpoints
│
├── utils/                   # Utility functions
│   ├── asyncHandler.js     # Async error handling wrapper
│   └── pagination.js       # Pagination utility
│
└── public/                  # Static file storage
    ├── brands/             # Brand images
    ├── category/           # Category images
    ├── media/              # General media files
    ├── posters/            # Banner/poster images
    ├── products/           # Product images
    └── users/              # User profile images
```

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/register` | Register new user | No |
| POST | `/users/login` | User login | No |
| POST | `/users/logout` | User logout | Yes |
| POST | `/users/refresh-token` | Refresh access token | No |
| POST | `/users/change-password` | Change user password | Yes |
| GET | `/users/current-user` | Get current user info | Yes |
| GET | `/users/verify-user` | Verify current user | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/users` | Get all users (paginated) | Yes | Yes |
| GET | `/users/:id` | Get user by ID | Yes | Admin/Owner |
| PUT | `/users/:id` | Update user | Yes | Admin/Owner |
| DELETE | `/users/:id` | Delete user | Yes | Yes |
| PUT | `/users/admin/update/:id` | Admin update user | Yes | Yes |
| PATCH | `/users/admin/reset-password/:id` | Reset user password | Yes | Yes |

### Product Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with pagination, search, filters) | No |
| GET | `/products/:id` | Get product by ID | No |
| POST | `/products` | Create new product | Yes |
| PUT | `/products/:id` | Update product | Yes |
| DELETE | `/products/:id` | Delete product | Yes |

### Category Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | No |
| GET | `/categories/:id` | Get category by ID | No |
| POST | `/categories` | Create new category | Yes |
| PUT | `/categories/:id` | Update category | Yes |
| DELETE | `/categories/:id` | Delete category | Yes |

### Sub-Category Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/subCategories` | Get all sub-categories | No |
| GET | `/subCategories/:id` | Get sub-category by ID | No |
| POST | `/subCategories` | Create new sub-category | Yes |
| PUT | `/subCategories/:id` | Update sub-category | Yes |
| DELETE | `/subCategories/:id` | Delete sub-category | Yes |

### Brand Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/brands` | Get all brands | No |
| GET | `/brands/:id` | Get brand by ID | No |
| POST | `/brands` | Create new brand | Yes |
| PUT | `/brands/:id` | Update brand | Yes |
| DELETE | `/brands/:id` | Delete brand | Yes |

### Order Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | Get all orders | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |
| POST | `/orders` | Create new order | Yes |
| PUT | `/orders/:id` | Update order status | Yes |
| DELETE | `/orders/:id` | Delete order | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payment/stripe` | Process Stripe payment | Yes |
| POST | `/payment/razorpay` | Get Razorpay key | Yes |

### Other Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/settings` | Get application settings | No |
| POST | `/settings` | Update settings | Yes |
| GET | `/settings/branding` | Get branding info | No |
| POST | `/settings/reset` | Reset to default settings | Yes |
| GET | `/posters` | Get all posters/banners | No |
| GET | `/notifications` | Get notifications | Yes |
| GET | `/couponCodes` | Get coupon codes | Yes |
| GET | `/variants` | Get product variants | No |
| GET | `/variantTypes` | Get variant types | No |

## 🗄 Database Models

### User Model (`model/user.js`)
- **Fields:** username, email, password, firstName, lastName, phone, role, profilePicture, address, refreshToken
- **Features:** Password hashing with bcrypt, JWT token generation, role-based access (user/admin)
- **Validation:** Email format, phone number pattern (Pakistani format), required fields

### Product Model (`model/product.js`)
- **Fields:** name, description, quantity, price, offerPrice, categories, brand, images, variants
- **Relationships:** Many-to-many with categories, many-to-one with brand
- **Features:** Multiple image support, variant system, inventory management

### Category Model (`model/category.js`)
- **Fields:** name, image, description
- **Relationships:** One-to-many with subcategories and products

### Order Model (`model/order.js`)
- **Fields:** orderNumber, user, orderItems, totalAmount, orderStatus, paymentMethod, shippingAddress
- **Features:** Order status tracking, payment integration, shipping management

### Settings Model (`model/settings.js`)
- **Fields:** appName, appDescription, currency, dateFormat, serverUrl, supportEmail, companyInfo
- **Features:** Singleton pattern, default values, API URL generation

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication with a dual-token system:

### Access Token
- **Purpose:** Authorization for protected routes
- **Expiry:** Short-lived (15 minutes)
- **Storage:** HTTP-only cookies or Authorization header

### Refresh Token
- **Purpose:** Generate new access tokens
- **Expiry:** Long-lived (7 days)
- **Storage:** HTTP-only cookies and database

### Role-Based Access Control

- **User Role:** Basic user permissions (view products, manage own profile, create orders)
- **Admin Role:** Full access to all resources and administrative functions

### Authentication Middleware

```javascript
const verifyJWT = asyncHandler(async(req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    if (!token) {
        return res.status(401).json({ success: false, message: "Access token is required" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    if (!user) {
        return res.status(403).json({ success: false, message: "Invalid Access Token" });
    }

    req.user = user
    next()
})
```

## 📁 File Upload

The application supports file uploads for various entities using Multer middleware:

### Supported File Types
- **Images:** JPEG, JPG, PNG
- **Size Limit:** 5MB per file

### Upload Destinations
- **Products:** `./public/products/` (supports multiple images)
- **Categories:** `./public/category/`
- **Brands:** `./public/brands/`
- **Users:** `./public/users/`
- **Posters:** `./public/posters/`
- **Media:** `./public/media/`

### File Naming Convention
Files are renamed with timestamp and random number: `{timestamp}_{randomNumber}.{extension}`

### Static File Serving
All uploaded files are served statically:
- Products: `http://localhost:5000/image/products/{filename}`
- Categories: `http://localhost:5000/image/category/{filename}`
- Brands: `http://localhost:5000/image/brands/{filename}`
- Users: `http://localhost:5000/image/users/{filename}`
- Posters: `http://localhost:5000/image/posters/{filename}`

## 🔧 Middleware

### Authentication Middleware (`middlewares/auth.middleware.js`)
- **verifyJWT:** Validates JWT tokens and sets `req.user`
- **verifyAdmin:** Ensures user has admin role
- **verifyAdminOrOwner:** Allows admin or resource owner access

### File Upload Middleware (`middlewares/multer.middleware.js`)
- Configures Multer for different file types and destinations
- Implements file validation and error handling

### Error Handling
Global error handler catches and formats all errors:
```javascript
app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
});
```

### Async Handler Utility (`utils/asyncHandler.js`)
Wraps async route handlers to catch errors automatically:
```javascript
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
```

## 📊 Pagination & Search

All list endpoints support pagination and search:

### Query Parameters
- **page:** Page number (default: 1)
- **limit:** Items per page (default: 10, max: 100)
- **search:** Search term for text fields
- **sortBy:** Field to sort by (default: 'createdAt')
- **sortOrder:** 'asc' or 'desc' (default: 'desc')

### Response Format
```json
{
    "success": true,
    "message": "Data retrieved successfully",
    "data": [...],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 50,
        "itemsPerPage": 10,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}
```

## 🔄 CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)
- `http://127.0.0.1:5500` (Live Server)

Credentials are enabled for cookie-based authentication.

## 🚀 Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "03001234567"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

### Get Products with Pagination
```bash
curl "http://localhost:5000/api/v1/products?page=1&limit=10&search=glasses&sortBy=price&sortOrder=asc"
```

### Create a New Product (with Authentication)
```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "name=Ray-Ban Sunglasses" \
  -F "description=Premium sunglasses" \
  -F "price=299.99" \
  -F "quantity=50" \
  -F "image1=@product-image.jpg"
```

## 📝 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {...}
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description",
    "data": null
}
```

## 🛡 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Authentication:** Secure token-based authentication
- **HTTP-Only Cookies:** Prevents XSS attacks
- **CORS Protection:** Configured for specific origins
- **Input Validation:** Mongoose schema validation
- **File Upload Security:** File type and size restrictions
- **Role-Based Access:** Admin and user role separation

## 🔧 Development

### Code Style
- ESLint configuration included
- Consistent error handling patterns
- Modular route organization
- Clear separation of concerns

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- **Email:** [Your Email]
- **GitHub Issues:** [Repository Issues URL]

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Author:** Arham  
**Version:** 1.0.0  
**Node.js:** >= 16.0.0
