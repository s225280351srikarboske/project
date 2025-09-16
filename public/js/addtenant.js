// /public/js/tenants.js

document.addEventListener('DOMContentLoaded', function () {
  loadTenants();

  document.getElementById('addNewTenantBtn').addEventListener('click', openTenantModal);
  document.getElementById('tenantForm').addEventListener('submit', handleTenantSubmit);

  document.querySelectorAll('.close-btn').forEach((btn) => btn.addEventListener('click', closeModals));
  document.getElementById('tenantModal').addEventListener('click', function (e) {
    if (e.target === this) closeModals();
  });
});

/** ---------------- API helper ---------------- */
async function api(url, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** ---------------- Load & render ---------------- */
async function loadTenants() {
  try {
    const tenants = await api('/api/addtenants'); // match backend route
    renderTenants(tenants || []);
  } catch (error) {
    console.error('Error loading tenants:', error);
    alert('Error loading tenants: ' + error.message);
  }
}

function renderTenants(tenants) {
  const tbody = document.getElementById('tenantsTableBody');

  if (!tenants.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No tenants found</td></tr>';
    return;
  }

  tbody.innerHTML = tenants
    .map((t) => {
      return `
        <tr>
          <td>${t.name || ''}</td>
          <td>${t.email || ''}</td>
          <td>${t.phone || ''}</td>
          <td>${t.unit || ''}</td>
          <td>
            <button class="edit-btn" data-id="${t._id}">Edit</button>
            <button class="delete-btn" data-id="${t._id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const tenantId = this.getAttribute('data-id');
      editTenant(tenantId);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const tenantId = this.getAttribute('data-id');
      deleteTenant(tenantId);
    });
  });
}

/** ---------------- Modal open/close ---------------- */
function openTenantModal() {
  document.getElementById('tenantModalTitle').textContent = 'Add New Tenant';
  document.getElementById('tenantForm').reset();
  document.getElementById('tenantId').value = '';
  document.getElementById('tenantModal').classList.add('active');
}

function closeModals() {
  document.getElementById('tenantModal').classList.remove('active');
}

/** ---------------- Edit / Create ---------------- */
async function editTenant(tenantId) {
  try {
    const t = await api(`/api/addtenants/${tenantId}`);

    document.getElementById('tenantModalTitle').textContent = 'Edit Tenant';
    document.getElementById('tenantId').value = t._id;
    document.getElementById('tenantName').value = t.name || '';
    document.getElementById('tenantEmail').value = t.email || '';
    document.getElementById('tenantPhone').value = t.phone || '';
    document.getElementById('tenantUnit').value = t.unit || '';

    document.getElementById('tenantModal').classList.add('active');
  } catch (error) {
    console.error('Error loading tenant:', error);
    alert('Error loading tenant: ' + error.message);
  }
}

async function handleTenantSubmit(e) {
  e.preventDefault();

  const tenantId = document.getElementById('tenantId').value.trim();
  const name = document.getElementById('tenantName').value.trim();
  const email = document.getElementById('tenantEmail').value.trim();
  const phone = document.getElementById('tenantPhone').value.trim();
  const unit = document.getElementById('tenantUnit').value.trim();

  if (!name) return alert('Name is required.');

  const payload = { name, email, phone, unit };

  try {
    if (tenantId) {
      await api(`/api/addtenants/${tenantId}`, 'PUT', payload);
    } else {
      await api('/api/addtenants', 'POST', payload);
    }
    closeModals();
    loadTenants();
  } catch (error) {
    console.error('Error saving tenant:', error);
    alert('Error saving tenant: ' + error.message);
  }
}

/** ---------------- Delete ---------------- */
async function deleteTenant(tenantId) {
  if (!confirm('Are you sure you want to delete this tenant?')) return;
  try {
    await api(`/api/addtenants/${tenantId}`, 'DELETE');
    loadTenants();
  } catch (error) {
    console.error('Error deleting tenant:', error);
    alert('Error deleting tenant: ' + error.message);
  }
}
