// Data Management for Properties, Tenants, and Bills
class DataManager {
  constructor() {
    this.properties = this.loadProperties();
    this.tenants = this.loadTenants();
    this.bills = this.loadBills();
    this.chatMessages = this.loadChatMessages();
  }

  // Properties Management
  loadProperties() {
    const properties = localStorage.getItem('properties');
    if (!properties) {
      const defaultProperties = [
        {
          id: 'prop-1',
          name: 'Sunset Apartments',
          address: '123 Main St, City, State 12345',
          type: 'Apartment',
          rentAmount: 1200,
          deposit: 2400,
          status: 'Occupied',
          tenantId: 'tenant-1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prop-2',
          name: 'Downtown Loft',
          address: '456 Oak Ave, City, State 12345',
          type: 'Loft',
          rentAmount: 1800,
          deposit: 3600,
          status: 'Available',
          tenantId: null,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('properties', JSON.stringify(defaultProperties));
      return defaultProperties;
    }
    return JSON.parse(properties);
  }

  saveProperties() {
    localStorage.setItem('properties', JSON.stringify(this.properties));
  }

  createProperty(propertyData) {
    const newProperty = {
      id: 'prop-' + Date.now(),
      ...propertyData,
      createdAt: new Date().toISOString()
    };
    this.properties.push(newProperty);
    this.saveProperties();
    return newProperty;
  }

  updateProperty(propertyId, propertyData) {
    const index = this.properties.findIndex(p => p.id === propertyId);
    if (index === -1) throw new Error('Property not found');
    
    this.properties[index] = { ...this.properties[index], ...propertyData };
    this.saveProperties();
    return this.properties[index];
  }

  deleteProperty(propertyId) {
    const index = this.properties.findIndex(p => p.id === propertyId);
    if (index === -1) throw new Error('Property not found');
    
    this.properties.splice(index, 1);
    this.saveProperties();
  }

  getProperties() {
    return this.properties;
  }

  getProperty(propertyId) {
    return this.properties.find(p => p.id === propertyId);
  }

  // Tenants Management
  loadTenants() {
    const tenants = localStorage.getItem('tenants');
    if (!tenants) {
      const defaultTenants = [
        {
          id: 'tenant-1',
          name: 'John Doe',
          email: 'john@email.com',
          phone: '+1-555-0123',
          propertyId: 'prop-1',
          leaseStart: '2024-01-01',
          leaseEnd: '2024-12-31',
          rentAmount: 1200,
          status: 'Active',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('tenants', JSON.stringify(defaultTenants));
      return defaultTenants;
    }
    return JSON.parse(tenants);
  }

  saveTenants() {
    localStorage.setItem('tenants', JSON.stringify(this.tenants));
  }

  createTenant(tenantData) {
    const newTenant = {
      id: 'tenant-' + Date.now(),
      ...tenantData,
      createdAt: new Date().toISOString()
    };
    this.tenants.push(newTenant);
    this.saveTenants();
    return newTenant;
  }

  updateTenant(tenantId, tenantData) {
    const index = this.tenants.findIndex(t => t.id === tenantId);
    if (index === -1) throw new Error('Tenant not found');
    
    this.tenants[index] = { ...this.tenants[index], ...tenantData };
    this.saveTenants();
    return this.tenants[index];
  }

  deleteTenant(tenantId) {
    const index = this.tenants.findIndex(t => t.id === tenantId);
    if (index === -1) throw new Error('Tenant not found');
    
    this.tenants.splice(index, 1);
    this.saveTenants();
  }

  getTenants() {
    return this.tenants;
  }

  getTenant(tenantId) {
    return this.tenants.find(t => t.id === tenantId);
  }

  getTenantByEmail(email) {
    return this.tenants.find(t => t.email === email);
  }

  // Bills Management
  loadBills() {
    const bills = localStorage.getItem('bills');
    if (!bills) {
      const defaultBills = [
        {
          id: 'bill-1',
          tenantId: 'tenant-1',
          propertyId: 'prop-1',
          amount: 1200,
          dueDate: '2024-02-01',
          status: 'Pending',
          type: 'Rent',
          description: 'Monthly rent for February 2024',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('bills', JSON.stringify(defaultBills));
      return defaultBills;
    }
    return JSON.parse(bills);
  }

  saveBills() {
    localStorage.setItem('bills', JSON.stringify(this.bills));
  }

  createBill(billData) {
    const newBill = {
      id: 'bill-' + Date.now(),
      ...billData,
      createdAt: new Date().toISOString()
    };
    this.bills.push(newBill);
    this.saveBills();
    return newBill;
  }

  updateBill(billId, billData) {
    const index = this.bills.findIndex(b => b.id === billId);
    if (index === -1) throw new Error('Bill not found');
    
    this.bills[index] = { ...this.bills[index], ...billData };
    this.saveBills();
    return this.bills[index];
  }

  deleteBill(billId) {
    const index = this.bills.findIndex(b => b.id === billId);
    if (index === -1) throw new Error('Bill not found');
    
    this.bills.splice(index, 1);
    this.saveBills();
  }

  getBills() {
    return this.bills;
  }

  getBillsByTenant(tenantId) {
    return this.bills.filter(b => b.tenantId === tenantId);
  }

  getBillsByProperty(propertyId) {
    return this.bills.filter(b => b.propertyId === propertyId);
  }

  // Chat Messages Management
  loadChatMessages() {
    const messages = localStorage.getItem('chatMessages');
    return messages ? JSON.parse(messages) : [];
  }

  saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(this.chatMessages));
  }

  sendMessage(fromUserId, toUserId, message) {
    const newMessage = {
      id: 'msg-' + Date.now(),
      fromUserId,
      toUserId,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.chatMessages.push(newMessage);
    this.saveChatMessages();
    return newMessage;
  }

  getMessages(userId1, userId2) {
    return this.chatMessages.filter(m => 
      (m.fromUserId === userId1 && m.toUserId === userId2) ||
      (m.fromUserId === userId2 && m.toUserId === userId1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  markMessagesAsRead(fromUserId, toUserId) {
    this.chatMessages.forEach(m => {
      if (m.fromUserId === fromUserId && m.toUserId === toUserId) {
        m.read = true;
      }
    });
    this.saveChatMessages();
  }

  // Statistics
  getStats() {
    const totalProperties = this.properties.length;
    const occupiedProperties = this.properties.filter(p => p.status === 'Occupied').length;
    const totalTenants = this.tenants.length;
    const activeTenants = this.tenants.filter(t => t.status === 'Active').length;
    const pendingBills = this.bills.filter(b => b.status === 'Pending').length;
    const totalRevenue = this.bills
      .filter(b => b.status === 'Paid')
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      totalProperties,
      occupiedProperties,
      availableProperties: totalProperties - occupiedProperties,
      totalTenants,
      activeTenants,
      pendingBills,
      totalRevenue
    };
  }
}

// Export for use in other files
window.DataManager = DataManager;