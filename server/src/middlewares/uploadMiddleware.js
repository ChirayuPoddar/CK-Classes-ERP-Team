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
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: resourceFilter
})

module.exports = {
  uploadPhoto,
  uploadDocument,
  uploadResource
}
