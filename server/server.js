const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const http = require('http')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const { Server } = require('socket.io')
const { getAllowedOrigins } = require('./src/config/corsOrigins')
const { attachRedisAdapter } = require('./src/config/socketAdapter')

// Bootstrap background queue workers
require('./src/queues/workers')

const PORT = process.env.PORT || 5050

// Initialize MongoDB Connection
connectDB()

// Create HTTP Server
const server = http.createServer(app)

// Initialize Socket.io Server with CORS matching the Express CLIENT_URL configuration
// (single source of truth using getAllowedOrigins helper)
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Attach Redis adapter for Socket.IO horizontal scaling ONLY if REDIS_URL is configured
if (process.env.REDIS_URL) {
  attachRedisAdapter(io)
}

app.set('io', io)

// Setup base socket connections
io.on('connection', (socket) => {
  // Subscribing users to role-specific namespaces/rooms scoped by tenantId
  socket.on('join_room', (payload) => {
    let roomName = ''
    let tenantId = socket.handshake?.auth?.tenantId || socket.handshake?.query?.tenantId || ''

    if (typeof payload === 'object' && payload !== null) {
      roomName = payload.room || payload.roomName || payload.roomId || ''
      if (payload.tenantId) tenantId = payload.tenantId
    } else if (typeof payload === 'string') {
      roomName = payload
    }

    if (roomName && tenantId && !roomName.startsWith(`${tenantId}:`)) {
      socket.join(`${tenantId}:${roomName}`)
    } else if (roomName) {
      socket.join(roomName)
    }
  })
})

// Bind server port across all network interfaces (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (Accessible on local Wi-Fi IP)`)
})
// Env reloaded with strict admin credential auto-sync


