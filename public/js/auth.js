// Authentication and User Management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.users = this.loadUsers();
    this.init();
  }

  init() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  register(userData) {
    if (this.users.find(user => user.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: 'user-' + Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  updateProfile(userData) {
    if (!this.currentUser) throw new Error('Not logged in');
    
    const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex === -1) throw new Error('User not found');

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    this.currentUser = this.users[userIndex];
    
    this.saveUsers();
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  getAllUsers() {
    return this.users;
  }

  createUser(userData) {
    return this.register(userData);
  }

  updateUser(userId, userData) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    this.saveUsers();
    return this.users[userIndex];
  }

  deleteUser(userId) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    this.users.splice(userIndex, 1);
    this.saveUsers();
  }
}

window.AuthManager = AuthManager;