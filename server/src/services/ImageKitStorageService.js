const imagekit = require('../config/imagekit')
const path = require('path')

class ImageKitStorageService {
  /**
   * Upload file to ImageKit or Cloudinary
   * @param {Object} file Express Multer file object
   * @param {String} folder Directory path in cloud storage (e.g. "ck-classes/homework/Class-8/")
   * @returns {Promise<Object>} File metadata including paths and urls
   */
  async uploadDocument(file, folder) {
    const filename = file.originalname
    const mime = file.mimetype
    const size = file.size

    // 1. Try ImageKit if initialized
    if (imagekit) {
      const response = await imagekit.upload({
        file: file.buffer,
        fileName: filename,
        folder: folder
      })

      return {
        fileId: response.fileId,
        name: response.name,
        url: response.url,
        thumbnailUrl: response.thumbnailUrl || '',
        filePath: response.filePath,
        size: response.size || size,
        mimeType: mime
      }
    }

    // 2. Fallback to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const cloudinary = require('../config/cloudinary')
      return new Promise((resolve, reject) => {
        const isImage = mime.startsWith('image/')
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: isImage ? 'image' : 'raw',
            public_id: path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, '') + '-' + Date.now()
          },
          (error, result) => {
            if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`))
            resolve({
              fileId: result.public_id,
              name: filename,
              url: result.secure_url,
              thumbnailUrl: isImage ? result.secure_url : '',
              filePath: result.public_id,
              size: result.bytes || size,
              mimeType: mime
            })
          }
        )
        uploadStream.end(file.buffer)
      })
    }

    throw new Error('Cloud storage is not configured. Please set ImageKit or Cloudinary credentials.')
  }

  /**
   * Delete file from ImageKit or Cloudinary
   * @param {String} fileId Cloud storage file unique identifier
   * @returns {Promise<void>}
   */
  async deleteDocument(fileId) {
    if (!fileId) return

    if (imagekit) {
      try {
        await imagekit.deleteFile(fileId)
      } catch (err) {
        // Catch silently
      }
      return
    }

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const cloudinary = require('../config/cloudinary')
        await cloudinary.uploader.destroy(fileId)
      } catch (err) {
        // Catch silently
      }
    }
  }
}

module.exports = new ImageKitStorageService()

