/**
 * Pagination utility functions for standardizing pagination across all API endpoints
 */

/**
 * Parse and validate pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {number} defaultLimit - Default items per page (default: 10)
 * @param {number} maxLimit - Maximum items per page (default: 100)
 * @returns {Object} Parsed pagination parameters
 */
const parsePaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || defaultLimit, 1), maxLimit);
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
};

/**
 * Parse search parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Parsed search parameters
 */
const parseSearchParams = (query) => {
    const search = query.search?.trim() || '';
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    
    return { search, sortBy, sortOrder };
};

/**
 * Build pagination response object
 * @param {number} currentPage - Current page number
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination response object
 */
const buildPaginationResponse = (currentPage, totalItems, itemsPerPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
};

/**
 * Complete pagination handler for MongoDB queries
 * @param {Object} model - Mongoose model
 * @param {Object} query - Request query object
 * @param {Object} searchQuery - MongoDB search query object
 * @param {Object} options - Additional options
 * @returns {Object} Paginated results with pagination info
 */
const paginateQuery = async (model, query, searchQuery = {}, options = {}) => {
    const { defaultLimit = 10, maxLimit = 100, populate = [] } = options;
    
    // Parse parameters
    const { page, limit, skip } = parsePaginationParams(query, defaultLimit, maxLimit);
    const { sortBy, sortOrder } = parseSearchParams(query);
    
    // Get total count
    const totalItems = await model.countDocuments(searchQuery);
    
    // Build query
    let mongoQuery = model.find(searchQuery)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    
    // Apply population if specified
    if (populate.length > 0) {
        populate.forEach(pop => {
            mongoQuery = mongoQuery.populate(pop.path, pop.select);
        });
    }
    
    // Execute query
    const data = await mongoQuery;
    
    // Build pagination response
    const pagination = buildPaginationResponse(page, totalItems, limit);
    
    return { data, pagination };
};

/**
 * Build search query for text fields
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Array of field names to search in
 * @returns {Object} MongoDB search query
 */
const buildTextSearchQuery = (searchTerm, fields) => {
    if (!searchTerm) return {};
    
    return {
        $or: fields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
        }))
    };
};

/**
 * Standard success response with pagination
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Response data
 * @param {Object} pagination - Pagination info
 */
const sendPaginatedResponse = (res, message, data, pagination) => {
    res.json({
        success: true,
        message,
        data,
        pagination
    });
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const sendErrorResponse = (res, message, statusCode = 500) => {
    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = {
    parsePaginationParams,
    parseSearchParams,
    buildPaginationResponse,
    paginateQuery,
    buildTextSearchQuery,
    sendPaginatedResponse,
    sendErrorResponse
};
