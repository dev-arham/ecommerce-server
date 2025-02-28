const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const bcrypt = require ("bcrypt") ;

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

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function (value) {
        return /^(?:\+92|0092|92|0)?3[0-9]{2}[0-9]{7}$/.test(value);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },

  firstName: {
    type: String,
    required: true,
    index : true,
  },

  lastName: {
    type: String,
    required: true,
    index : true,
  },

  profilePicture: {
    type : String,
    default : 'https://ecom.theprimedesigns.com/image/users/dummy.png',
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
  },

  accessToken:{
    type : String,
  }
},
{
  timestamps:true
}
);


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
