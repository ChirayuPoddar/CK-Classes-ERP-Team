require('dotenv').config()
const http = require('http')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const { Server } = require('socket.io')

const PORT = process.env.PORT || 5050

// Initialize MongoDB Connection
connectDB()

// Create HTTP Server
const server = http.createServer(app)

// Initialize Socket.io Server with CORS matching the Express CLIENT_URL configuration
// (single source of truth - see allowedOrigins in src/app.js)
const socketOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173'])

const io = new Server(server, {
  cors: {
    origin: socketOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Setup base socket connections
io.on('connection', (socket) => {
  // Subscribing users to role-specific namespaces/rooms
  socket.on('join_room', (roomName) => {
    socket.join(roomName)
  })
})

// Bind server port
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
// Env reloaded with primary data summary block

