const jwt = require("jsonwebtoken");
const User = require("../model/user.js");
const asyncHandler = require("express-async-handler");

const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            res.status(401).json({ success: false, message: error.message });

        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            res.status(403).json({ success: false, message: "Invalid Access Token " });

        }
    
        req.user = user
        next()
    }catch(err) {
        res.status(500).json({ success: false, message: err.message });

    }
    
})

exports.verifyJWT = verifyJWT;