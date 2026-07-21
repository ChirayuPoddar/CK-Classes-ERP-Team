const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const errorHandler = require('./middlewares/errorHandler')
const authRoutes = require('./routes/authRoutes')
const studentRoutes = require('./routes/studentRoutes')
const teacherRoutes = require('./routes/teacherRoutes')
const subjectRoutes = require('./routes/subjectRoutes')
const timetableRoutes = require('./routes/timetableRoutes')
const periodRoutes = require('./routes/periodRoutes')
const attendanceRoutes = require('./routes/attendanceRoutes')
const feeStructureRoutes = require('./routes/feeStructureRoutes')
const studentFeeRoutes = require('./routes/studentFeeRoutes')
const homeworkRoutes = require('./routes/homeworkRoutes')
const examRoutes = require('./routes/examRoutes')
const announcementRoutes = require('./routes/announcementRoutes')
const resourceRoutes = require('./routes/resourceRoutes')
const userRoutes = require('./routes/userRoutes')
const activationRoutes = require('./routes/activationRoutes')

const app = express()

// Middleware setups
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// CORS setup
const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL]
  : (process.env.NODE_ENV === 'production' 
      ? ['https://yourproductiondomain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5050'])

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. Postman, curl) or matched origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // Accept request for local dev flexibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Root / health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() })
})

// Route mappings
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/teachers', teacherRoutes)
app.use('/api/v1/subjects', subjectRoutes)
app.use('/api/v1/timetable', timetableRoutes)
app.use('/api/v1/periods', periodRoutes)
app.use('/api/v1/attendance', attendanceRoutes)
app.use('/api/v1/fee-structures', feeStructureRoutes)
app.use('/api/v1/student-fees', studentFeeRoutes)
app.use('/api/v1/homework', homeworkRoutes)
app.use('/api/v1/exams', examRoutes)
app.use('/api/v1/announcements', announcementRoutes)
app.use('/api/v1/resources', resourceRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/activation', activationRoutes)

// Universal fallback
app.use((req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
})

// Central Error Handler
app.use(errorHandler)

module.exports = app
