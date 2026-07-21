# C.K. Classes ERP — Coaching Institute Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6%2B-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v4-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

**C.K. Classes ERP** is a full-stack MERN (MongoDB, Express, React, Node.js) Enterprise Resource Planning platform tailored for coaching institutes and educational centers. It provides end-to-end administration for student enrollments, teacher assignments, attendance logging, timetables, fee tracking, homework distribution, examination grading, announcements, learning resources, and role-based access control.

---

## 1. Key Modules & Features

* **Secure Authentication & Session Security**: Dual-JWT cookie transport (`HttpOnly`), separate access/refresh secrets, DB-backed active session tracking, automatic oldest-session replacement, and remote session revocation.
* **Institutional Account Activation**: Passwordless onboarding using unique permanent Institution IDs (Student ID / Teacher ID) + 6-digit email OTP verification.
* **OTP Password Recovery**: Enumeration-safe 4-step Forgot Password flow with cryptographically random password reset authorization tokens.
* **Role-Based Access Control (RBAC)**: Granular permission checks and IDOR scope guards supporting `admin`, `teacher`, `student`, `parent`, `receptionist`, and `accountant` roles.
* **Student & Teacher Management**: Comprehensive student/teacher profiles, automated business ID generation (`CK20260001`, `TCH0001`), ID card PDF generation, and CSV/Excel import/export.
* **Attendance Management**: Lecture slot scheduling, daily session marking (`Present`, `Absent`, `Late`, `Excused`), audit logs, override tracking, and real-time analytics.
* **Timetable & Period Scheduling**: Interactive weekly class schedules, lecture period definitions, and teacher assignment conflict prevention.
* **Fee Structure & Collections**: Installment plans, due-date tracking, fee collections, payment receipts, and balance status tracking.
* **Homework & Assignments**: Homework creation, class targeting, file attachment management, and automated overdue tracking.
* **Exams & Mark Sheets**: Exam creation, subject marks entry, grade calculation, and student performance reports.
* **Announcements & Digital Resources**: Targeted institutional announcements and subject learning resource distribution.
* **Parent Multi-Child Access**: Unified parent accounts linking multiple enrolled children through `linkedChildren` array without password duplication.

---

## 2. Technology Stack

### Frontend Client (`client/`)
* **Framework**: React 18, Vite
* **Routing**: React Router DOM v6
* **Styling**: Tailwind CSS, CSS Custom Tokens
* **UI & Animation**: Lucide React Icons, Framer Motion
* **HTTP Client**: Axios (configured with `withCredentials: true`)

### Backend API (`server/`)
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database Driver**: Mongoose ODM (MongoDB v6+)
* **Security & Auth**: `jsonwebtoken`, `bcryptjs`, `cookie-parser`
* **Email & Delivery**: Nodemailer (SMTP wrapper)
* **Media Handling**: Cloudinary / ImageKit / Multer

---

## 3. High-Level Architecture

The repository follows a clean, modular structure:

```
CK-Classes/
├── client/                 # React 18 Single Page Application
│   ├── src/
│   │   ├── components/     # Reusable UI & Layout components
│   │   ├── contexts/       # React Auth & Global State Contexts
│   │   ├── pages/          # Admin, Auth, Student, & Public pages
│   │   ├── router/         # AppRoutes, ProtectedRoute, & RoleRoute
│   │   └── services/       # Axios API client wrapper
├── server/                 # Express 4 REST API Application
│   ├── src/
│   │   ├── config/         # System permissions & DB configuration
│   │   ├── controllers/    # Request handlers & response mapping
│   │   ├── middlewares/    # Auth, RBAC, Scope, & Error handling
│   │   ├── models/         # Mongoose database models
│   │   ├── routes/         # Express router mount points
│   │   ├── services/       # Core business logic & database queries
│   │   ├── utils/          # ApiError, token hashing, & helpers
│   │   └── validators/     # Zod input validation schemas
└── docs/                   # Group project documentation
    ├── ARCHITECTURE.md     # Layer design & security architecture
    ├── DATABASE.md         # ER diagram & collection specifications
    └── CONTRIBUTING.md     # Team workflow, Git branching & PR rules
```

---

## 4. Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB instance (v6.0+) running at `mongodb://127.0.0.1:27017/ck_classes` or MongoDB Atlas URI

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ChirayuPoddar/CK-Classes-ERP-Team.git
   cd CK-Classes-ERP-Team
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   *Edit `server/.env` with your local configuration (never commit `.env`).*

3. **Frontend Setup**:
   ```bash
   cd ../client
   npm install
   ```

---

## 5. Environment Variables Documentation

Documentation of required environment variables (`server/.env.example`):

| Variable | Description | Example Placeholder |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend client origin URL | `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/ck_classes` |
| `JWT_ACCESS_SECRET` | Secret key for signing 15m access tokens | `min_32_chars_secret` |
| `JWT_REFRESH_SECRET` | Secret key for signing 7d refresh tokens | `min_32_chars_secret` |
| `SMTP_HOST` | Nodemailer SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | Nodemailer SMTP port | `587` |
| `SMTP_USER` | SMTP login username | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP App Password | `your_app_password` |
| `SMTP_FROM` | Sender email address | `noreply@ckclasses.com` |

---

## 6. Running Development Servers

From the root directory or individual workspace folders:

### Backend Development Server
```bash
cd server
npm run dev
```
*Server runs on `http://localhost:5000` with health check at `http://localhost:5000/health`.*

### Frontend Development Server
```bash
cd client
npm run dev
```
*Client runs on `http://localhost:5173`.*

---

## 7. Group Project Work Streams

* **Web ERP & Core Backend**: Express API endpoints, business services, database relationships, and React Admin dashboard.
* **Mobile Application**: Cross-platform client application integration.
* **AI Integration**: Predictive student performance analytics and automated tools.
* **DevOps & Deployment**: Docker containerization, CI/CD pipelines, and cloud hosting.

For branching rules and commit conventions, see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

---

## 8. Security Highlights

* **Bcrypt Password Hashing**: Passwords stored as bcrypt hashes with salt factor 10.
* **Hashed Token Storage**: OTPs, refresh tokens, and password reset tokens stored strictly as SHA-256 hashes in MongoDB.
* **HttpOnly Cookie Protection**: Shields access and refresh tokens from XSS vectors.
* **Rate Limiting & Cooldowns**: 60s resend cooldowns and attempt counters defend against brute-force attacks.
* **Account Enumeration Defense**: Generic responses prevent attackers from mapping active accounts.

---

## 9. Documentation Directory

Detailed technical documentation is available in the [`docs/`](docs/) directory:
* [Architecture Documentation](docs/ARCHITECTURE.md)
* [Database Schema & ER Diagram](docs/DATABASE.md)
* [Group Contributing Guide](docs/CONTRIBUTING.md)

---

## 10. License

This repository is proprietary software for C.K. Classes ERP project development.
