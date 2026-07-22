const STORAGE_KEY_USERS = 'mock_iam_users';
const STORAGE_KEY_ROLES = 'mock_iam_roles';
const STORAGE_KEY_LOGS = 'mock_iam_logs';

const generateMockUsers = () => {
  const users = [];
  const roles = ['Administrator', 'Principal', 'Vice Principal', 'HOD', 'Teacher', 'Class Teacher', 'Student', 'Parent', 'Librarian'];
  const depts = ['Mathematics', 'Science', 'English', 'Administration', 'Sports', 'Library'];
  const statuses = ['Active', 'Active', 'Active', 'Inactive', 'Suspended', 'Pending Verification'];
  
  for (let i = 1; i <= 45; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const dept = role === 'Student' || role === 'Parent' ? 'N/A' : depts[Math.floor(Math.random() * depts.length)];
    users.push({
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      firstName: `User${i}`,
      lastName: `Smith${i}`,
      email: `user${i}@school.edu`,
      phone: `+1555010${i.toString().padStart(2, '0')}`,
      role: role,
      department: dept,
      employeeId: role !== 'Student' && role !== 'Parent' ? `EMP-2024-${100+i}` : null,
      studentId: role === 'Student' ? `STU-2024-${100+i}` : null,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      createdAt: new Date(Date.now() - 30000000000 - Math.random() * 10000000000).toISOString()
    });
  }
  return users;
};

const INITIAL_ROLES = [
  { id: 'role_admin', name: 'Administrator', description: 'Full system access', usersCount: 2, createdBy: 'System', permissions: {} },
  { id: 'role_prin', name: 'Principal', description: 'Academic head access', usersCount: 1, createdBy: 'System', permissions: {} },
  { id: 'role_hod', name: 'HOD', description: 'Department head access', usersCount: 6, createdBy: 'System', permissions: {} },
  { id: 'role_tch', name: 'Teacher', description: 'Standard teaching access', usersCount: 42, createdBy: 'System', permissions: {} }
];

const INITIAL_LOGS = [
  { id: 'log_1', user: 'Admin User', action: 'Login', ip: '192.168.1.45', os: 'macOS', browser: 'Chrome', time: new Date().toISOString() },
  { id: 'log_2', user: 'Admin User', action: 'Changed Permissions for HOD', ip: '192.168.1.45', os: 'macOS', browser: 'Chrome', time: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log_3', user: 'Teacher John', action: 'Failed Login', ip: '10.0.0.12', os: 'Windows 11', browser: 'Edge', time: new Date(Date.now() - 7200000).toISOString() }
];

const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(generateMockUsers()));
  }
  if (!localStorage.getItem(STORAGE_KEY_ROLES)) {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(INITIAL_ROLES));
  }
  if (!localStorage.getItem(STORAGE_KEY_LOGS)) {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_LOGS));
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getUsers = async () => {
  await delay(600);
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
};

const getRoles = async () => {
  await delay(400);
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_ROLES));
};

const getLogs = async () => {
  await delay(400);
  initializeData();
  return JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS));
};

const updateUserStatus = async (userIds, status) => {
  await delay(800);
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
  const updated = users.map(u => userIds.includes(u.id) ? { ...u, status } : u);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
  return updated;
};

const createUser = async (userData) => {
  await delay(800);
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
  const newUser = {
    ...userData,
    id: `usr_${Math.random().toString(36).substr(2, 9)}`,
    status: userData.status || 'Active',
    lastLogin: null,
    createdAt: new Date().toISOString()
  };
  users.unshift(newUser);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  return newUser;
};

const deleteUsers = async (userIds) => {
  await delay(800);
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS));
  const updated = users.filter(u => !userIds.includes(u.id));
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
  return updated;
};

export const iamService = {
  getUsers,
  getRoles,
  getLogs,
  updateUserStatus,
  createUser,
  deleteUsers
};
