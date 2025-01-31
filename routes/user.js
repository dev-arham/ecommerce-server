const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const { verifyJWT } = require('../middlewares/auth.middleware');
const jwt = require("jsonwebtoken");
const upload = require("../middlewares/multer.middleware.js").upload;



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

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, message: "Users retrieved successfully.", data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// login
router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ name });


        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }
        // Check if the password is correct
        const isPasswordValid = await user.isPasswordCorrect(password)
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid name or password." });
        }

        // Authentication successful
        res.status(200).json({ success: true, message: "Login successful.",data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    const user = await User.findOne({ name });

    // GENERATE REFRESH TOKEN 
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    // JUST FOR NOT RETURN PASSWORD AND TOKEN TO THE USER
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
       data: "",
    })
   
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
    
})

router.route('/logout').post(verifyJWT, logoutUser)


//REFRESH TOKEN 
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        
        res.status(401).json({ success: false, message:"unauthorized request"  });

    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
        res.status(401).json({ success: false, message:"Invalid refresh token"  });

        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            res.status(401).json({ success: false, message:"Refresh token is expired or used"  });
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
router.route("/refresh-token").post(refreshAccessToken)


//change current password 

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        res.status(400).json({ success: false, message:"Invalid old password"  });

    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(400).json({ success: true, message:"Password Changed Successfully"  });

})
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

//current user 

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({ success: true, message:"User fetched successfully"  });

})
router.route("/current-user").get(verifyJWT, getCurrentUser)

//update user 

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res.json({ success: true, message: "Account details updated successfully", data: user });
   
});
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

//update profile 


const updateUserProfile = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!profileLocalPath) {
        res.json({ success: false, message: "Profile is missing " });
    }

    

    const avatar = await uploadOnCloudinary(profileLocalPath)

    if (!profile.url) {
        
        res.json({ success: false, message: "Error while Uploading " });
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                profile: profile.url
            }
        },
        {new: true}
    ).select("-password")

    return res.json({ success: true, message: "Profile image updated successfully", data: user });
})
router.route("/profile").patch(verifyJWT, upload.single("profile"), updateUserProfile)


// Get a user by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
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
    const { name, password } = req.body;
    if (!name || !password) {
        return res.status(400).json({ success: false, message: "Name, and password are required." });
    }

    try {
        const user = new User({ name, password });
        const newUser = await user.save();
        res.json({ success: true, message: "User created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a user
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const { name, password } = req.body;
        if (!name || !password) {
            return res.status(400).json({ success: false, message: "Name,  and password are required." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            { name, password },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User updated successfully.", data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
