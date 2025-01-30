const mongoose = require('mongoose');
import jwt  from "jsonwebtoken";
import bcrypt from 'bcrypt';

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  country: {
    type: String,
    default: 'Pakistan'
  },
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase:true,
    trim : true,
    index : true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase:true,
    trim : true,
  },

  fullName: {
    type: String,
    required: true,
    index : true,
  },
  profile :{
    type:String,   //cloudinary url
    required : true,
  },
  password: {
    type: String,
    required: [true , 'Password is required'],
  },
  address :{
    type : [AddressSchema],
  },
  refreshToken:{
    type : String,
  }
  
},
{
  timestamps:true
}
);

userSchema.pre("save" , async function (next) {
  if (!this.isModified("password")) return next()  ;
    
  this.password = bcrypt.hash(this.password, 10)
  next()
} )


userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)  
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id : this._id,
      email : this.email,
      username : this.username,
      fullName : this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }

  )
  
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

const User = mongoose.model('User', userSchema);

module.exports = User;
