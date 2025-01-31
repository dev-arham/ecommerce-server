const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storageCategory = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = './public/category';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Check file type based on its extension
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      cb(null, Date.now() + "_" + Math.floor(Math.random() * 1000) + path.extname(file.originalname));
    } else {
      cb("Error: only .jpeg, .jpg, .png files are allowed!");
    }
  }
});

const uploadCategory = multer({
  storage: storageCategory,
  limits: {
    fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
  },
});

const storageProduct = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = './public/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (_, file, cb) {
    // Check file type based on its extension
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      cb(null, Date.now() + "_" + file.originalname);
    } else {
      cb("Error: only .jpeg, .jpg, .png files are allowed!");
    }
  }
});

const uploadProduct = multer({
  storage: storageProduct,
  limits: {
    fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
  },
});


const storagePoster = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = './public/posters';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (_, file, cb) {
    // Check file type based on its extension
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      cb(null, Date.now() + "_" + file.originalname);
    } else {
      cb("Error: only .jpeg, .jpg, .png files are allowed!");
    }
  }
});

const uploadPosters = multer({
  storage: storagePoster,
  limits: {
    fileSize: 1024 * 1024 * 5 // limit filesize to 5MB
  },
});

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters,
};
