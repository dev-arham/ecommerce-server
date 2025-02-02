const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user.js');
const { verifyJWT } = require('../middlewares/auth.middleware.js');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const upload = require("../middlewares/multer.middleware.js").upload;
const { uploadUserImage } = require('../uploadFile');



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
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
    const user = await User.findOne({ $or: [{ username: username }, { email: email }] });

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
    
        if (incomingRefreshToken !== user.refreshToken) {
            res.status(401).json({ success: false, message:"Refresh token is expired or used"  });
            
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
        res.status(400).json({ success: false, message:"Invalid old password"  });

    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(400).json({ success: true, message:"Password Changed Successfully"  });

})
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

//current user 

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({ success: true, message:"User fetched successfully", data: req.user});

})
router.route("/current-user").get(verifyJWT, getCurrentUser)

//verify user
const verifyCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json({ success: true, message:"User verified successfully"});

})
router.route("/verify-user").get(verifyJWT, verifyCurrentUser)

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


const updateUserProfileImage = asyncHandler(async(req, res) => {
    
    try {
        const userID = req.params.id
        uploadUserImage.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB.';
                }
                console.log(`Update category: ${err.message}`);
                return res.json({ success: false, message: err.message });
            } else if (err) {
                console.log(`Update category: ${err.message}`);
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
