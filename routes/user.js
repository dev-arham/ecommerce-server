const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user.js');
const { verifyJWT } = require('../middlewares/auth.middleware.js');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const upload = require("../middlewares/multer.middleware.js").upload;
const { uploadUserImage } = require('../uploadFile');

// Middleware to check if user is admin
const verifyAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }
    
    next();
});

// Middleware to check if user is admin or accessing their own data
const verifyAdminOrOwner = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();
    
    // Allow if user is admin or accessing their own data
    if (req.user.role === 'admin' || currentUserId === targetUserId) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. You can only access your own data." });
    }
});



const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ ValidateBeforeSave:false })

        return {accessToken, refreshToken}


    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all users with pagination (Admin only)
router.get('/', verifyJWT, verifyAdmin, asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const role = req.query.role || '';
        
        const skip = (page - 1) * limit;
        
        let searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            searchQuery.role = role;
        }
        
        const totalItems = await User.countDocuments(searchQuery);
        
        const users = await User.find(searchQuery)
            .select('-password -refreshToken') // Exclude sensitive fields
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        
        const totalPages = Math.ceil(totalItems / limit);
        
        res.json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
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

// login
router.post('/login', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ $or: [{ username: username }, { email: email }] });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Credentials." });
        }
        
        // Check if the password is correct
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid Credentials." });
        }

        // GENERATE REFRESH TOKEN 
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

        const loggedInUser = await User.findByIdAndUpdate(user._id, { $set: { refreshToken: refreshToken } }, { new: true }).select("-password -refreshToken");

        // JUST FOR NOT RETURN PASSWORD AND TOKEN TO THE USER

        //COOKIE
        const option = {
            httpOnly : true,
            secure:true
        }
        return res.status(200)
        .cookie("accessToken" , accessToken , option)
        .cookie("refreshToken" , refreshToken , option)
        .json({
           success:true,
           message :"Login Successful",
           data: loggedInUser,
           accessToken: accessToken,
           refreshToken: refreshToken,
        })
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

//LOGOUT USER 

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new : true
        }
    )

    const option = {
        httpOnly : true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken" , option)
    .clearCookie("refreshToken" , option)
    .json({success:true, message:"Logout Successful"})
    
})

router.route('/logout').post(verifyJWT, logoutUser)


//REFRESH TOKEN 
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return res.status(401).json({ success: false, message:"unauthorized request"  });
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            return res.status(401).json({ success: false, message:"Invalid refresh token"  });
        }
    
        if (incomingRefreshToken !== user.refreshToken) {
            return res.status(401).json({ success: false, message:"Refresh token is expired or used"  });
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const accessToken  = await user.generateAccessToken();
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json({success: true, accessToken: accessToken, message : "Access token refreshed"})
    } catch (error) {
        res.status(401).json({success : false, message : error?.message || "Invalid refresh token"})
    }

})
router.route("/refresh-token").post(refreshAccessToken)


//change current password 

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        return res.status(400).json({ success: false, message:"Invalid old password"  });
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json({ success: true, message:"Password Changed Successfully"  });

})
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

//current user 

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({ success: true, message:"User fetched successfully", data: req.user});

})
router.route("/current-user").get(verifyJWT, getCurrentUser)

//verify user
const verifyCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({ success: true, message:"User verified successfully", data: req.user});

})
router.route("/verify-user").get(verifyJWT, verifyCurrentUser)

//update user 

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {firstName, lastName, username, email, phone} = req.body

    if (!firstName || !lastName || !email || !username) {
        return res.status(400).json({ success: false, message: "firstName, lastName, username, and email are required" });
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                firstName,
                lastName,
                username,
                email: email,
                ...(phone && { phone })
            }
        },
        {new: true}
        
    ).select("-password -refreshToken")

    return res.json({ success: true, message: "Account details updated successfully", data: user });
   
});
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

//update profile 


const updateUserProfileImage = asyncHandler(async(req, res) => {
    
    try {
        const userID = req.params.id
        uploadUserImage.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB.';
                }
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            if (req.file) {
                const image = `${serverUrl}:${serverPort}/image/users/${req.file.filename}`;
                try {
                    const upadteProfile = await User.findByIdAndUpdate(userID, { $set:{profilePicture: image} }, { new: true }).select("-password");
                    if (!upadteProfile) {
                        return res.status(404).json({ success: false, message: "User not found." });
                    }
                    res.json({ success: true, message: "Profile image updated successfully.", data: upadteProfile });
                } catch (error) {
                    res.status(500).json({ success: false, message: error.message });
                }
            }else{
                return res.status(400).json({ success: false, message: "image is required." });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})
router.route("/profile-image/:id").patch(verifyJWT, updateUserProfileImage)


// Get a user by ID (Admin or owner only)
router.get('/:id', verifyJWT, verifyAdminOrOwner, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User retrieved successfully.", data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new user
router.post('/register', asyncHandler(async (req, res) => {
    const { firstName, lastName, username, phone, email, password } = req.body;
    if (!firstName || !lastName || !username || !email || !password || !phone) {
        return res.status(400).json({ success: false, message: "Please enter required fields!" });
    }

    try {
        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = new User({username: username, password: encryptedPassword, email: email, firstName: firstName, lastName: lastName, phone: phone});
        await user.save();
        res.json({ success: true, message: "User created successfully."});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a user (Admin or owner only)
router.put('/:id', verifyJWT, verifyAdminOrOwner, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { firstName, lastName, username, email, phone, role } = req.body;
        
        if (!firstName || !lastName || !username || !email) {
            return res.status(400).json({ success: false, message: "firstName, lastName, username, and email are required." });
        }

        // Only admin can change role
        const updateData = { firstName, lastName, username, email };
        if (phone) updateData.phone = phone;
        
        if (role && req.user.role === 'admin') {
            updateData.role = role;
        } else if (role && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Only admin can change user role." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { $set: updateData },
            { new: true }
        ).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Admin route to update any user's data including password
router.put('/admin/update/:id', verifyJWT, verifyAdmin, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { firstName, lastName, username, email, phone, role, password, profilePicture } = req.body;
        
        if (!firstName || !lastName || !username || !email) {
            return res.status(400).json({ success: false, message: "firstName, lastName, username, and email are required." });
        }

        const updateData = { firstName, lastName, username, email };
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (profilePicture) updateData.profilePicture = profilePicture;

        // Hash password if provided
        if (password) {
            const encryptedPassword = await bcrypt.hash(password, 10);
            updateData.password = encryptedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { $set: updateData },
            { new: true }
        ).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully by admin.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user (Admin only)
router.delete('/:id', verifyJWT, verifyAdmin, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        
        // Prevent admin from deleting themselves
        if (userID === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account." });
        }
        
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Admin route to change user role
router.patch('/admin/role/:id', verifyJWT, verifyAdmin, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: "Valid role (user or admin) is required." });
        }
        
        // Prevent admin from changing their own role
        if (userID === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot change your own role." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { $set: { role } },
            { new: true }
        ).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: `User role updated to ${role} successfully.`, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Admin route to reset user password
router.patch('/admin/reset-password/:id', verifyJWT, verifyAdmin, asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { $set: { password: encryptedPassword, refreshToken: undefined } },
            { new: true }
        ).select("-password -refreshToken");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User password reset successfully. User will need to login again." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
