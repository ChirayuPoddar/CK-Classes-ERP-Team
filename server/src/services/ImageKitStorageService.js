const imagekit = require('../config/imagekit')

class ImageKitStorageService {
  /**
   * Upload file to ImageKit
   * @param {Object} file Express Multer file object
   * @param {String} folder Directory path in ImageKit (e.g. "ck-classes/homework/Class-8/")
   * @returns {Promise<Object>} File metadata including paths and urls
   */
  async uploadDocument(file, folder) {
    if (!imagekit) {
      throw new Error('ImageKit client is not initialized. Please verify environment credentials.')
    }

    const filename = file.originalname
    const mime = file.mimetype
    const size = file.size

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

  /**
   * Delete file from ImageKit
   * @param {String} fileId ImageKit file unique identifier
   * @returns {Promise<void>}
   */
  async deleteDocument(fileId) {
    if (!imagekit) {
      throw new Error('ImageKit client is not initialized.')
    }
    if (!fileId) return

    try {
      await imagekit.deleteFile(fileId)
    } catch (err) {
      // Catch exceptions silently or let caller handle
    }
  }
}

module.exports = new ImageKitStorageService()
