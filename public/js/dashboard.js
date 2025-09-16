// Dashboard Application Controller
class DashboardApp {
  constructor() {
    this.authManager = new AuthManager();
    this.dataManager = new DataManager();
    this.currentUser = null;
    this.currentChatTenant = null;
    
    this.init();
  }

  init() {
    // Check authentication
    if (!this.authManager.isLoggedIn()) {
      window.location.href = '/';
      return;
    }

    this.currentUser = this.authManager.getCurrentUser();
    this.setupUI();
    this.bindEvents();
    this.loadDashboard();
    
    // Hide admin-only tabs for tenants
    if (this.currentUser.role === 'Tenant') {
      this.hideAdminTabs();
      this.switchTab('dashboard');
    }
  }

  hideAdminTabs() {
    document.getElementById('propertiesTab').style.display = 'none';
    document.getElementById('tenantsTab').style.display = 'none';
    document.getElementById('billsTab').style.display = 'none';
  }

  setupUI() {
    // Set user info
    document.getElementById('userName').textContent = this.currentUser.name;
    document.getElementById('userRole').textContent = this.currentUser.role;
    
    // Set profile form
    document.getElementById('profileName').value = this.currentUser.name;
    document.getElementById('profileEmail').value = this.currentUser.email;
  }

  bindEvents() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.authManager.logout();
      window.location.href = '/';
    });

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Property form
    document.getElementById('propertyForm').addEventListener('submit', (e) => {
      this.handlePropertySubmit(e);
    });
    document.getElementById('cancelPropertyEdit').addEventListener('click', () => {
      this.resetPropertyForm();
    });

    // Tenant form
    document.getElementById('tenantForm').addEventListener('submit', (e) => {
      this.handleTenantSubmit(e);
    });
    document.getElementById('cancelTenantEdit').addEventListener('click', () => {
      this.resetTenantForm();
    });

    // Bill form
    document.getElementById('billForm').addEventListener('submit', (e) => {
      this.handleBillSubmit(e);
    });
    document.getElementById('cancelBillEdit').addEventListener('click', () => {
      this.resetBillForm();
    });

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      this.handleProfileSubmit(e);
    });

    // Chat
    document.getElementById('chatTenant').addEventListener('change', (e) => {
      this.selectChatTenant(e.target.value);
    });
    document.getElementById('sendMessage').addEventListener('click', () => {
      this.sendMessage();
    });
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Table actions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-btn')) {
        this.handleEdit(e.target.dataset.type, e.target.dataset.id);
      } else if (e.target.classList.contains('delete-btn')) {
        this.handleDelete(e.target.dataset.type, e.target.dataset.id);
      } else if (e.target.classList.contains('pay-btn')) {
        this.handlePayment(e.target.dataset.id);
      }
    });
  }

  switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific data
    switch (tabName) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'properties':
        this.loadProperties();
        break;
      case 'tenants':
        this.loadTenants();
        this.loadPropertyOptions();
        break;
      case 'bills':
        this.loadBills();
        this.loadTenantOptions();
        break;
      case 'chat':
        this.loadChatTenants();
        break;
    }
  }

  // Dashboard Methods
  loadDashboard() {
    const stats = this.dataManager.getStats();
    
    if (this.currentUser.role === 'Admin') {
      document.getElementById('totalProperties').textContent = stats.totalProperties;
      document.getElementById('occupiedProperties').textContent = stats.occupiedProperties;
      document.getElementById('totalTenants').textContent = stats.totalTenants;
      document.getElementById('pendingBills').textContent = stats.pendingBills;
      document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
    } else {
      // Tenant dashboard - show personal stats
      const tenant = this.dataManager.getTenantByEmail(this.currentUser.email);
      if (tenant) {
        const tenantBills = this.dataManager.getBillsByTenant(tenant.id);
        const pendingBills = tenantBills.filter(b => b.status === 'Pending').length;
        const totalPaid = tenantBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0);
        
        document.getElementById('totalProperties').textContent = tenant.propertyId ? '1' : '0';
        document.getElementById('occupiedProperties').textContent = tenant.status === 'Active' ? '1' : '0';
        document.getElementById('totalTenants').textContent = '1';
        document.getElementById('pendingBills').textContent = pendingBills;
        document.getElementById('totalRevenue').textContent = `$${totalPaid.toFixed(2)}`;
      }
    }

    this.loadRecentActivity();
  }

  loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    const activities = [];

    // Get recent bills
    const bills = this.dataManager.getBills()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    bills.forEach(bill => {
      const tenant = this.dataManager.getTenant(bill.tenantId);
      activities.push({
        type: 'bill',
        message: `Bill generated for ${tenant?.name || 'Unknown'} - $${bill.amount}`,
        time: new Date(bill.createdAt).toLocaleDateString()
      });
    });

    if (activities.length === 0) {
      activityContainer.innerHTML = '<p class="text-center">No recent activity</p>';
    } else {
      activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item" style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
          <p style="margin: 0; font-size: 0.875rem;">${activity.message}</p>
          <small style="color: var(--muted-foreground);">${activity.time}</small>
        </div>
      `).join('');
    }
  }

  // Property Methods
  loadProperties() {
    const properties = this.dataManager.getProperties();
    const tbody = document.getElementById('propertiesTableBody');
    
    if (properties.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No properties found</td></tr>';
      return;
    }

    tbody.innerHTML = properties.map(property => `
      <tr>
        <td>${property.name}</td>
        <td>${property.type}</td>
        <td>${property.address}</td>
        <td>$${property.rentAmount}</td>
        <td><span class="badge badge-${property.status === 'Available' ? 'success' : property.status === 'Occupied' ? 'warning' : 'danger'}">${property.status}</span></td>
        <td>
          <button class="button button-sm button-secondary edit-btn" data-type="property" data-id="${property.id}">
            <span class="material-icons">edit</span>
          </button>
          <button class="button button-sm button-danger delete-btn" data-type="property" data-id="${property.id}">
            <span class="material-icons">delete</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  handlePropertySubmit(e) {
    e.preventDefault();
    
    const propertyData = {
      name: document.getElementById('propertyName').value,
      type: document.getElementById('propertyType').value,
      address: document.getElementById('propertyAddress').value,
      rentAmount: parseFloat(document.getElementById('rentAmount').value),
      deposit: parseFloat(document.getElementById('deposit').value),
      status: document.getElementById('propertyStatus').value
    };

    try {
      const propertyId = document.getElementById('propertyId').value;
      
      if (propertyId) {
        this.dataManager.updateProperty(propertyId, propertyData);
        this.showMessage('propertyMessage', 'Property updated successfully!', false);
      } else {
        this.dataManager.createProperty(propertyData);
        this.showMessage('propertyMessage', 'Property created successfully!', false);
      }
      
      this.resetPropertyForm();
      this.loadProperties();
      this.loadDashboard();
    } catch (error) {
      this.showMessage('propertyMessage', error.message, true);
    }
  }

  resetPropertyForm() {
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('propertyMessage').classList.add('hidden');
  }

  // Tenant Methods
  loadTenants() {
    const tenants = this.dataManager.getTenants();
    const tbody = document.getElementById('tenantsTableBody');
    
    if (tenants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No tenants found</td></tr>';
      return;
    }

    tbody.innerHTML = tenants.map(tenant => {
      const property = this.dataManager.getProperty(tenant.propertyId);
      return `
        <tr>
          <td>${tenant.name}</td>
          <td>${tenant.email}</td>
          <td>${tenant.phone}</td>
          <td>${property ? property.name : 'Not Assigned'}</td>
          <td><span class="badge badge-${tenant.status === 'Active' ? 'success' : 'danger'}">${tenant.status}</span></td>
          <td>
            <button class="button button-sm button-secondary edit-btn" data-type="tenant" data-id="${tenant.id}">
              <span class="material-icons">edit</span>
            </button>
            <button class="button button-sm button-danger delete-btn" data-type="tenant" data-id="${tenant.id}">
              <span class="material-icons">delete</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  loadPropertyOptions() {
    const properties = this.dataManager.getProperties().filter(p => p.status === 'Available');
    const select = document.getElementById('assignedProperty');
    
    select.innerHTML = '<option value="">Select Property</option>' +
      properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  handleTenantSubmit(e) {
    e.preventDefault();
    
    const tenantData = {
      name: document.getElementById('tenantName').value,
      email: document.getElementById('tenantEmail').value,
      phone: document.getElementById('tenantPhone').value,
      propertyId: document.getElementById('assignedProperty').value || null,
      leaseStart: document.getElementById('leaseStart').value,
      leaseEnd: document.getElementById('leaseEnd').value,
      status: document.getElementById('tenantStatus').value
    };

    try {
      const tenantId = document.getElementById('tenantId').value;
      
      if (tenantId) {
        this.dataManager.updateTenant(tenantId, tenantData);
        this.showMessage('tenantMessage', 'Tenant updated successfully!', false);
      } else {
        // Create user account for tenant
        try {
          this.authManager.createUser({
            name: tenantData.name,
            email: tenantData.email,
            password: 'tenant123', // Default password
            role: 'Tenant'
          });
        } catch (userError) {
          // User might already exist, continue with tenant creation
        }
        
        this.dataManager.createTenant(tenantData);
        this.showMessage('tenantMessage', 'Tenant created successfully! Default password: tenant123', false);
      }
      
      // Update property status if assigned
      if (tenantData.propertyId) {
        this.dataManager.updateProperty(tenantData.propertyId, { status: 'Occupied' });
      }
      
      this.resetTenantForm();
      this.loadTenants();
      this.loadDashboard();
    } catch (error) {
      this.showMessage('tenantMessage', error.message, true);
    }
  }

  resetTenantForm() {
    document.getElementById('tenantForm').reset();
    document.getElementById('tenantId').value = '';
    document.getElementById('tenantMessage').classList.add('hidden');
  }

  // Bill Methods
  loadBills() {
    const bills = this.dataManager.getBills();
    const tbody = document.getElementById('billsTableBody');
    
    // Filter bills for tenants
    const filteredBills = this.currentUser.role === 'Tenant' 
      ? bills.filter(bill => {
          const tenant = this.dataManager.getTenantByEmail(this.currentUser.email);
          return tenant && bill.tenantId === tenant.id;
        })
      : bills;
    
    if (filteredBills.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bills found</td></tr>';
      return;
    }

    tbody.innerHTML = filteredBills.map(bill => {
      const tenant = this.dataManager.getTenant(bill.tenantId);
      return `
        <tr>
          <td>${tenant ? tenant.name : 'Unknown'}</td>
          <td>${bill.type}</td>
          <td>$${bill.amount}</td>
          <td>${new Date(bill.dueDate).toLocaleDateString()}</td>
          <td><span class="badge badge-${bill.status === 'Paid' ? 'success' : bill.status === 'Pending' ? 'warning' : 'danger'}">${bill.status}</span></td>
          <td>
            ${this.currentUser.role === 'Admin' ? `
              <button class="button button-sm button-secondary edit-btn" data-type="bill" data-id="${bill.id}">
                <span class="material-icons">edit</span>
              </button>
              <button class="button button-sm button-danger delete-btn" data-type="bill" data-id="${bill.id}">
                <span class="material-icons">delete</span>
              </button>
            ` : bill.status === 'Pending' ? `
              <button class="button button-sm button-primary pay-btn" data-id="${bill.id}">
                <span class="material-icons">payment</span>
                Pay
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  loadTenantOptions() {
    const tenants = this.dataManager.getTenants();
    const select = document.getElementById('billTenant');
    
    select.innerHTML = '<option value="">Select Tenant</option>' +
      tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  handleBillSubmit(e) {
    e.preventDefault();
    
    const billData = {
      tenantId: document.getElementById('billTenant').value,
      type: document.getElementById('billType').value,
      amount: parseFloat(document.getElementById('billAmount').value),
      dueDate: document.getElementById('billDueDate').value,
      description: document.getElementById('billDescription').value,
      status: 'Pending'
    };

    // Get tenant's property
    const tenant = this.dataManager.getTenant(billData.tenantId);
    if (tenant && tenant.propertyId) {
      billData.propertyId = tenant.propertyId;
    }

    try {
      const billId = document.getElementById('billId').value;
      
      if (billId) {
        this.dataManager.updateBill(billId, billData);
        this.showMessage('billMessage', 'Bill updated successfully!', false);
      } else {
        this.dataManager.createBill(billData);
        this.showMessage('billMessage', 'Bill generated successfully!', false);
      }
      
      this.resetBillForm();
      this.loadBills();
      this.loadDashboard();
    } catch (error) {
      this.showMessage('billMessage', error.message, true);
    }
  }

  resetBillForm() {
    document.getElementById('billForm').reset();
    document.getElementById('billId').value = '';
    document.getElementById('billMessage').classList.add('hidden');
  }

  handlePayment(billId) {
    if (confirm('Mark this bill as paid?')) {
      try {
        this.dataManager.updateBill(billId, { status: 'Paid' });
        this.loadBills();
        this.loadDashboard();
        alert('Payment recorded successfully!');
      } catch (error) {
        alert('Error processing payment: ' + error.message);
      }
    }
  }

  // Chat Methods
  loadChatTenants() {
    const tenants = this.dataManager.getTenants();
    const select = document.getElementById('chatTenant');
    
    if (this.currentUser.role === 'Admin') {
      select.innerHTML = '<option value="">Choose a tenant...</option>' +
        tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    } else {
      // For tenants, show admin as chat option
      const adminUsers = this.authManager.getAllUsers().filter(u => u.role === 'Admin');
      select.innerHTML = '<option value="">Choose admin...</option>' +
        adminUsers.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }
  }

  selectChatTenant(tenantId) {
    if (!tenantId) {
      document.getElementById('chatContainer').style.display = 'none';
      return;
    }

    this.currentChatTenant = tenantId;
    document.getElementById('chatContainer').style.display = 'block';
    this.loadChatMessages();
  }

  loadChatMessages() {
    if (!this.currentChatTenant) return;

    const messages = this.dataManager.getMessages(this.currentUser.id, this.currentChatTenant);
    const container = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
      container.innerHTML = '<p class="text-center">No messages yet. Start the conversation!</p>';
      return;
    }

    container.innerHTML = messages.map(msg => {
      const isFromCurrentUser = msg.fromUserId === this.currentUser.id;
      return `
        <div class="message ${isFromCurrentUser ? 'sent' : 'received'}">
          <p style="margin: 0;">${msg.message}</p>
          <div class="message-time">${new Date(msg.timestamp).toLocaleString()}</div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    // Mark messages as read
    this.dataManager.markMessagesAsRead(this.currentChatTenant, this.currentUser.id);
  }

  sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !this.currentChatTenant) return;

    try {
      this.dataManager.sendMessage(this.currentUser.id, this.currentChatTenant, message);
      input.value = '';
      this.loadChatMessages();
    } catch (error) {
      alert('Error sending message: ' + error.message);
    }
  }

  // Profile Methods
  handleProfileSubmit(e) {
    e.preventDefault();
    
    const profileData = {
      name: document.getElementById('profileName').value,
      email: document.getElementById('profileEmail').value
    };

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
      // Verify current password if changing password
      if (newPassword) {
        if (!currentPassword) {
          throw new Error('Current password is required to change password');
        }
        if (currentPassword !== this.currentUser.password) {
          throw new Error('Current password is incorrect');
        }
        profileData.password = newPassword;
      }

      this.authManager.updateProfile(profileData);
      this.currentUser = this.authManager.getCurrentUser();
      this.setupUI();
      
      // Clear password fields
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      
      this.showMessage('profileMessage', 'Profile updated successfully!', false);
    } catch (error) {
      this.showMessage('profileMessage', error.message, true);
    }
  }

  // Generic Methods
  handleEdit(type, id) {
    try {
      switch (type) {
        case 'property':
          const property = this.dataManager.getProperty(id);
          if (property) {
            document.getElementById('propertyId').value = property.id;
            document.getElementById('propertyName').value = property.name;
            document.getElementById('propertyType').value = property.type;
            document.getElementById('propertyAddress').value = property.address;
            document.getElementById('rentAmount').value = property.rentAmount;
            document.getElementById('deposit').value = property.deposit;
            document.getElementById('propertyStatus').value = property.status;
            this.switchTab('properties');
          }
          break;
          
        case 'tenant':
          const tenant = this.dataManager.getTenant(id);
          if (tenant) {
            document.getElementById('tenantId').value = tenant.id;
            document.getElementById('tenantName').value = tenant.name;
            document.getElementById('tenantEmail').value = tenant.email;
            document.getElementById('tenantPhone').value = tenant.phone;
            document.getElementById('assignedProperty').value = tenant.propertyId || '';
            document.getElementById('leaseStart').value = tenant.leaseStart;
            document.getElementById('leaseEnd').value = tenant.leaseEnd;
            document.getElementById('tenantStatus').value = tenant.status;
            this.switchTab('tenants');
          }
          break;
          
        case 'bill':
          const bill = this.dataManager.getBills().find(b => b.id === id);
          if (bill) {
            document.getElementById('billId').value = bill.id;
            document.getElementById('billTenant').value = bill.tenantId;
            document.getElementById('billType').value = bill.type;
            document.getElementById('billAmount').value = bill.amount;
            document.getElementById('billDueDate').value = bill.dueDate;
            document.getElementById('billDescription').value = bill.description;
            this.switchTab('bills');
          }
          break;
      }
    } catch (error) {
      alert('Error loading item for edit: ' + error.message);
    }
  }

  handleDelete(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      switch (type) {
        case 'property':
          this.dataManager.deleteProperty(id);
          this.loadProperties();
          break;
        case 'tenant':
          this.dataManager.deleteTenant(id);
          this.loadTenants();
          break;
        case 'bill':
          this.dataManager.deleteBill(id);
          this.loadBills();
          break;
      }
      this.loadDashboard();
      alert('Item deleted successfully!');
    } catch (error) {
      alert('Error deleting item: ' + error.message);
    }
  }

  showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = isError ? 'alert alert-error' : 'alert alert-success';
    element.classList.remove('hidden');
    
    setTimeout(() => {
      element.classList.add('hidden');
    }, 5000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardApp();
});