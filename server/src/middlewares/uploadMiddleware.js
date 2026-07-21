const multer = require('multer')

const storage = multer.memoryStorage()

// Photo upload configuration
const photoFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid image type. Allowed formats: jpg, jpeg, png, webp'), false)
  }
}

const uploadPhoto = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: photoFilter
})

// Document upload configuration
const documentFilter = (req, file, cb) => {
  const allowedMimetypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ]
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid document type. Allowed formats: pdf, doc, docx, ppt, pptx, xls, xlsx, txt, png, jpg, jpeg, zip'), false)
  }
}

const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: documentFilter
})

const resourceFilter = (req, file, cb) => {
  const isExecutable = /\.(exe|bat|cmd|sh|js|com|scr|vbs|bin)$/i.test(file.originalname)
  if (isExecutable) {
    return cb(new Error('Executable file uploads are prohibited for security.'), false)
  }

  const allowedMimetypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/zip',
    'application/x-zip-compressed'
  ]
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid resource file type.'), false)
  }
}

const uploadResource = multer({
  storage: storage,
  limits: {
    fileSize: 4 * 1024 * 1024 // 4MB (fits Vercel serverless request body limit of 4.5MB)
  },
  fileFilter: resourceFilter
})

const handleUploadResource = (req, res, next) => {
  uploadResource.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum supported upload limit of 4MB.'
          })
        }
        return res.status(400).json({
          success: false,
          code: 'UPLOAD_ERROR',
          message: err.message
        })
      }
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE',
        message: err.message || 'File upload failed'
      })
    }
    next()
  })
}

module.exports = {
  uploadPhoto,
  uploadDocument,
  uploadResource,
  handleUploadResource
}

