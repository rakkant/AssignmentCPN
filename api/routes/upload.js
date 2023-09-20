const express = require('express');
const multer = require('multer');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { bucket } = require('../firebase');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;

const router = express.Router();

// Apply security middleware
router.use(helmet());
router.use(express.json());

// Limit each IP to 100 requests per windowMs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.use('/api/', apiLimiter);

// store file to local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/files');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// upload file to local
const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

// use third-party email service to send a notification via email
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'daija.schaefer@ethereal.email',
    pass: '7eNMFHDuEAPhFh9rFK',
  },
});

const sendEmail = async (subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: 'rakkan@gmail.com',
      to: 'rakkan@gmail.com',
      subject,
      text,
    });

    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendFileUploadedEmail = async (uploadedFile) => {
  await sendEmail('File Uploaded', 'A file has been uploaded successfully.');
};

const sendFileDeletedEmail = async (fileName) => {
  await sendEmail('File Deleted', `The file ${fileName} has been deleted.`);
};

const handleFileUpload = (file) => {
  return new Promise((resolve, reject) => {
    const fileUpload = bucket.file(file.originalname);
    const stream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    stream.on('error', (error) => {
      console.error('Error uploading file to Firebase:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      console.log("TEST: ", fileSize);
      await sendFileUploadedEmail(file);
      resolve();
    });

    stream.end(file.buffer);
  });
};

// Error handling middleware
const handleErrors = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};

// RESTFUL API Calling
// POST - upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await handleFileUpload(req.file);
    await sendFileUploadedEmail(req.file);

    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    next(error);
  }
});

// GET - get all files
router.get('/files', async (req, res, next) => {
  try {
    const files = await bucket.getFiles();
    const fileDetails = await Promise.all(
      files[0].map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          fileName: metadata.name,
          mimeType: metadata.contentType || 'application/octet-stream',
          sizeInKB: calculateFileSizeInKB(metadata.size), 
        };
      })
    );

    res.status(200).json({ files: fileDetails });
  } catch (error) {
    next(error);
  }
});

function calculateFileSizeInKB(fileSizeInBytes) {
  console.log("File size in bytes:", fileSizeInBytes);
  const sizeInKB = (fileSizeInBytes / 1024).toFixed(2);
  console.log("Size in KB:", sizeInKB);
  return parseFloat(sizeInKB); 
}

// DELETE - delete a file
router.delete('/files/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const fileBlob = bucket.file(filename);
    const [fileExists] = await fileBlob.exists();

    if (!fileExists) {
      return res.status(404).json({ error: 'File not found' });
    }

    await fileBlob.delete();
    await sendFileDeletedEmail(filename);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.use(handleErrors);

module.exports = router;
