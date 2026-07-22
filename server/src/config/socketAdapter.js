const { createClient } = require('redis')
const { createAdapter } = require('@socket.io/redis-adapter')

/**
 * Attaches the Redis adapter to a Socket.IO instance if REDIS_URL is configured.
 * Creates pub/sub client pair, connects them, and configures io.adapter.
 * Logs success/failure gracefully without crashing the server.
 */
async function attachRedisAdapter(io) {
  if (!process.env.REDIS_URL) {
    return
  }

  try {
    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()

    pubClient.on('error', (err) => console.error('[Socket.IO Redis PubClient Error]:', err.message))
    subClient.on('error', (err) => console.error('[Socket.IO Redis SubClient Error]:', err.message))

    await Promise.all([pubClient.connect(), subClient.connect()])

    io.adapter(createAdapter(pubClient, subClient))
    console.log('[Socket.IO] Successfully attached Redis adapter for horizontal scaling.')
  } catch (error) {
    console.error('[Socket.IO] Failed to attach Redis adapter:', error.message)
    // Do not rethrow or crash the server if Redis connection/adapter setup fails
  }
}

module.exports = { attachRedisAdapter }
