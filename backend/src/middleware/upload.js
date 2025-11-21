const multer = require('multer');
const path = require('path');
const { generateUniqueFilename, validateFileType, getFileType } = require('../utils/fileProcessor');
const uploadConfig = require('../config/upload.config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const fileType = getFileType(file.originalname);
  
  if (validateFileType(fileType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${fileType}' is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: uploadConfig.maxFileSize,
    files: uploadConfig.maxFiles
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files per upload.'
      });
    }
  }
  
  if (error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = { upload, handleUploadError };