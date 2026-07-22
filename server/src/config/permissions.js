/**
 * Centralized Granular Permissions & Role Mappings
 * Format: resource:action
 */

const PERMISSIONS = {
  // DASHBOARD
  DASHBOARD_VIEW: 'dashboard:view',

  // STUDENTS
  STUDENTS_VIEW: 'students:view',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_DELETE: 'students:delete',

  // TEACHERS
  TEACHERS_VIEW: 'teachers:view',
  TEACHERS_CREATE: 'teachers:create',
  TEACHERS_UPDATE: 'teachers:update',
  TEACHERS_DELETE: 'teachers:delete',

  // SUBJECTS
  SUBJECTS_VIEW: 'subjects:view',
  SUBJECTS_MANAGE: 'subjects:manage',

  // ATTENDANCE
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_UPDATE: 'attendance:update',
  ATTENDANCE_REPORTS: 'attendance:reports',

  // HOMEWORK
  HOMEWORK_VIEW: 'homework:view',
  HOMEWORK_CREATE: 'homework:create',
  HOMEWORK_UPDATE: 'homework:update',
  HOMEWORK_DELETE: 'homework:delete',

  // EXAMS
  EXAMS_VIEW: 'exams:view',
  EXAMS_CREATE: 'exams:create',
  EXAMS_UPDATE: 'exams:update',
  EXAMS_MARKS: 'exams:marks',

  // TIMETABLE
  TIMETABLE_VIEW: 'timetable:view',
  TIMETABLE_MANAGE: 'timetable:manage',

  // ROOMS & HOLIDAYS
  ROOMS_VIEW: 'rooms:view',
  ROOMS_MANAGE: 'rooms:manage',
  HOLIDAYS_VIEW: 'holidays:view',
  HOLIDAYS_MANAGE: 'holidays:manage',

  // ANNOUNCEMENTS
  ANNOUNCEMENTS_VIEW: 'announcements:view',
  ANNOUNCEMENTS_CREATE: 'announcements:create',
  ANNOUNCEMENTS_UPDATE: 'announcements:update',
  ANNOUNCEMENTS_DELETE: 'announcements:delete',

  // RESOURCES
  RESOURCES_VIEW: 'resources:view',
  RESOURCES_CREATE: 'resources:create',
  RESOURCES_UPDATE: 'resources:update',
  RESOURCES_DELETE: 'resources:delete',

  // FEES
  FEES_VIEW: 'fees:view',
  FEES_COLLECT: 'fees:collect',
  FEES_UPDATE: 'fees:update',
  FEES_REFUND: 'fees:refund',
  FEES_REPORTS: 'fees:reports',

  // USERS & SESSIONS
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_BLOCK: 'users:block',
  USERS_DELETE: 'users:delete',
  USERS_SESSIONS: 'users:sessions',

  // REPORTS
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // SETTINGS
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update'
}

/**
 * Role Permission Matrix for all 6 roles
 */
const ROLE_PERMISSIONS = {
  admin: ['*'], // Admin has full unrestricted access

  teacher: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TIMETABLE_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ATTENDANCE_REPORTS,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.HOMEWORK_CREATE,
    PERMISSIONS.HOMEWORK_UPDATE,
    PERMISSIONS.HOMEWORK_DELETE,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.EXAMS_MARKS,
    PERMISSIONS.ANNOUNCEMENTS_VIEW,
    PERMISSIONS.RESOURCES_VIEW,
    PERMISSIONS.RESOURCES_CREATE,
    PERMISSIONS.RESOURCES_UPDATE,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],

  student: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TIMETABLE_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.ANNOUNCEMENTS_VIEW,
    PERMISSIONS.RESOURCES_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],

  parent: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.TIMETABLE_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.ANNOUNCEMENTS_VIEW,
    PERMISSIONS.RESOURCES_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ],

  receptionist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.TEACHERS_VIEW,
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.TIMETABLE_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ANNOUNCEMENTS_VIEW,
    PERMISSIONS.RESOURCES_VIEW,
    PERMISSIONS.FEES_VIEW
  ],

  accountant: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.FEES_COLLECT,
    PERMISSIONS.FEES_UPDATE,
    PERMISSIONS.FEES_REFUND,
    PERMISSIONS.FEES_REPORTS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.ANNOUNCEMENTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW
  ]
}

/**
 * Centralized Role Maximum Sessions Configuration
 */
const ROLE_MAX_SESSIONS = {
  admin: 5,
  teacher: 2,
  parent: 2,
  student: 1,
  receptionist: 2,
  accountant: 2
}

/**
 * Gets default max sessions limit for a role
 */
const getMaxSessionsForRole = (role) => {
  if (!role || typeof role !== 'string') return 2
  const normRole = role.toLowerCase().trim()
  return ROLE_MAX_SESSIONS[normRole] || 2
}

/**
 * Checks if a given role possesses a required permission
 */
const hasPermission = (role, permission) => {
  if (!role || typeof role !== 'string') return false
  const normRole = role.toLowerCase().trim()
  const userPerms = ROLE_PERMISSIONS[normRole] || []
  
  if (userPerms.includes('*')) return true
  return userPerms.includes(permission)
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_MAX_SESSIONS,
  getMaxSessionsForRole,
  hasPermission
}

