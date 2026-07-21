# C.K. Classes ERP — Group Project Contributing Guide

Welcome to the **C.K. Classes MERN ERP** group repository. This guide establishes workflow conventions, branching strategies, environment safety rules, and code quality standards for team collaboration.

---

## 1. Work Streams & Sub-Teams

The project is structured into four primary work streams:

1. **Web ERP & Core Backend**: Managing Express REST APIs, Mongoose models, RBAC, and React Admin dashboard features.
2. **Mobile Application**: Developing cross-platform mobile client interfaces (Flutter / React Native).
3. **AI Integration**: Implementing smart analytics, automated grading assistants, and student performance insights.
4. **DevOps & Deployment**: Containerization (Docker), CI/CD pipelines, SSL/HTTPS configuration, and cloud deployment.

---

## 2. Git Branching Strategy

To maintain a clean and stable `main` branch, follow a strict feature-branch workflow:

```
main (Stable Production Code)
  │
  ├── feature/mobile-app-auth
  ├── feature/ai-performance-insights
  ├── feature/devops-docker-setup
  └── feature/student-portal-ui
```

### Branch Naming Conventions
* **Feature Branches**: `feature/<module-name>` (e.g., `feature/ai-analytics`, `feature/student-portal`)
* **Bug Fix Branches**: `bugfix/<issue-name>` (e.g., `bugfix/attendance-filter-fix`)
* **Refactor Branches**: `refactor/<target-module>` (e.g., `refactor/exam-service`)

### Workflow Steps
1. Switch to `main` and pull the latest code:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(auth): implement student activation OTP flow"
   ```
4. Push your branch and open a Pull Request (PR) on GitHub:
   ```bash
   git push -u origin feature/your-feature-name
   ```

---

## 3. Environment Safety & Security Rules

### CRITICAL RULES
1. **NEVER Commit Real Secrets**: Never commit `.env` files containing real database passwords, JWT secrets, App Passwords, or API keys.
2. **Use `.env.example`**: When adding a new environment variable requirement, update `server/.env.example` with a safe placeholder name and placeholder value.
3. **No Secret Logging**: Do not output passwords, OTP values, JWT secrets, reset tokens, or private environment variables in `console.log` statements or API error responses.

---

## 4. Code Standards & Formatting

* **JavaScript / React**: Standard ES6+ syntax, camelCase variables, PascalCase components/models.
* **Component Styling**: Use Vanilla CSS / CSS custom variables and Tailwind CSS utility classes.
* **API Error Handling**: Throw instances of `ApiError(message, statusCode, code)` inside services; express error handler middleware handles responses automatically.
* **Linting & Build Verification**: Always run linter and production build before submitting PRs:
   ```bash
   cd client
   npm run lint
   npm run build
   ```

---

## 5. Coordinating Schema & API Changes

* **Database Schema Changes**: Notify the team before modifying shared Mongoose models (`User`, `Student`, `Teacher`, `Attendance`, `Fee`).
* **API Contract Changes**: Ensure changes to request parameters or response keys are updated in `docs/DATABASE.md` and `docs/ARCHITECTURE.md`.
