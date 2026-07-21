const ImageKit = require('imagekit')

let imagekit = null

if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  try {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    })
  } catch (err) {
    // Keep startup connection throw as actual error handling
    console.error('ImageKit initialization failed:', err.message)
  }
}

module.exports = imagekit
