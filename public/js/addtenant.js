// /public/js/tenants.js
// Tenants CRUD + populate property <select> from /api/properties

document.addEventListener('DOMContentLoaded', function () {
  loadTenants();

  document.getElementById('addNewTenantBtn')?.addEventListener('click', async () => {
    openTenantModal();
    await loadPropertiesIntoSelect(); // populate on open
  });

  document.getElementById('tenantForm')?.addEventListener('submit', handleTenantSubmit);

  // close buttons & backdrop
  document.querySelectorAll('.close-btn').forEach((btn) => btn.addEventListener('click', closeTenantModal));
  document.getElementById('tenantModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeTenantModal();
  });
});

/** ---------------- API helper (same style as properties.js) ---------------- */
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

/** ---------------- Load & render tenants ---------------- */
async function loadTenants() {
  try {
    const tenants = await api('/api/addtenants'); // expects [] or list
    renderTenants(tenants || []);
  } catch (error) {
    console.error('Error loading tenants:', error);
    alert('Error loading tenants: ' + error.message);
  }
}

function renderTenants(tenants) {
  const tbody = document.getElementById('tenantsTableBody');
  if (!tbody) return;

  if (!tenants.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No tenants found</td></tr>';
    return;
  }

  tbody.innerHTML = tenants
    .map((t) => {
      const prop = t.property || t.assignedProperty || null; // populated object or null
      const propLabel =
        (prop && (prop.name || prop.title || prop.address || prop.line1)) ||
        t.propertyName ||
        t.propertyId ||
        t.property ||
        '—';

      const rent = Number(t.rent || 0);
      const status = (t.status || '').toString().toLowerCase(); // 'paid' | 'overdue'

      return `
        <tr>
          <td>${escapeHtml(t.name || t.fullName || '')}</td>
          <td>${escapeHtml(t.email || '')}</td>
          <td>${escapeHtml(t.phone || t.phoneNumber || '')}</td>
          <td>${escapeHtml(String(propLabel))}</td>
          <td>$${rent.toLocaleString()}</td>
          <td><span class="status-badge ${status || 'paid'}">${status || 'paid'}</span></td>
          <td class="action-buttons">
            <button class="edit-btn" data-id="${t._id || t.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-btn" data-id="${t._id || t.id}"><i class="fas fa-trash"></i> Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  // hook up edit/delete
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      editTenant(id);
    });
  });
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      deleteTenant(id);
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** ---------------- Modal open/close ---------------- */
function openTenantModal() {
  document.getElementById('tenantModalTitle').textContent = 'Add New Tenant';
  document.getElementById('tenantForm').reset();
  document.getElementById('tenantId').value = '';
  document.getElementById('tenantModal').classList.add('active'); // matches your CSS pattern
}

function closeTenantModal() {
  document.getElementById('tenantModal').classList.remove('active');
}

/** ---------------- Populate property <select> from DB ---------------- */
async function loadPropertiesIntoSelect(selectedId = '') {
  const select = document.getElementById('tenantProperty');
  if (!select) return;

  // show loading state
  select.innerHTML = '<option value="">Loading properties…</option>';

  try {
    const data = await api('/api/properties', 'GET');
    const list = Array.isArray(data) ? data : (data.properties || data.data || []);

    if (!list.length) {
      select.innerHTML = '<option value="">No properties found</option>';
      return;
    }

    // Build options
    const opts = ['<option value="">Select a property</option>'];
    for (const p of list) {
      const id = p._id || p.id;
      const label = p.title || p.name || p.address?.line1 || id;
      const sel = String(selectedId) === String(id) ? ' selected' : '';
      opts.push(`<option value="${escapeHtml(String(id))}"${sel}>${escapeHtml(String(label))}</option>`);
    }
    select.innerHTML = opts.join('');
  } catch (err) {
    console.error('Failed to load properties:', err);
    select.innerHTML = '<option value="">Failed to load properties</option>';
    alert('Could not load properties: ' + err.message);
  }
}

/** ---------------- Edit / Create ---------------- */
async function editTenant(tenantId) {
  try {
    const t = await api(`/api/addtenants/${tenantId}`);

    document.getElementById('tenantModalTitle').textContent = 'Edit Tenant';
    document.getElementById('tenantId').value = t._id || t.id || '';
    document.getElementById('tenantName').value = t.name || t.fullName || '';
    document.getElementById('tenantEmail').value = t.email || '';
    document.getElementById('tenantPhone').value = t.phone || t.phoneNumber || '';
    document.getElementById('tenantRent').value = t.rent ?? '';
    document.getElementById('tenantStatus').value = (t.status || 'paid').toLowerCase();

    // Determine propertyId from populated object or raw field
    const propertyId =
      (t.property && (t.property._id || t.property.id)) ||
      t.propertyId ||
      t.property ||
      '';

    // Populate select with all properties and select this one
    await loadPropertiesIntoSelect(propertyId);

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
  const rent = Number(document.getElementById('tenantRent').value || 0);
  const status = document.getElementById('tenantStatus').value; // 'paid' | 'overdue'
  const propertyId = document.getElementById('tenantProperty').value;

  if (!name) return alert('Full name is required.');
  if (!email) return alert('Email is required.');
  if (!phone) return alert('Phone is required.');
  if (!propertyId) return alert('Please select a property.');
  if (!(rent >= 0)) return alert('Rent must be a number.');

  // If your backend expects "property" instead of "propertyId", rename the key below
  const payload = {
    name,
    email,
    phone,
    rent,
    status,
    propertyId,
  };

  try {
    if (tenantId) {
      await api(`/api/addtenants/${tenantId}`, 'PUT', payload);
    } else {
      await api('/api/addtenants', 'POST', payload);
    }
    closeTenantModal();
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
