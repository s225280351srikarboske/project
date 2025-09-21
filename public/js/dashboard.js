// /js/admin.js
const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

const els = {
  alert: document.getElementById('dashboard-alert'),
  totalProps: document.getElementById('total-properties'),
  activeTenants: document.getElementById('active-tenants'),
  monthRevenue: document.getElementById('month-revenue'),
  outstandingDues: document.getElementById('outstanding-dues'),
  tbody: document.getElementById('properties-tbody'),
};

// Helpers
function showAlert(type, message) {
  if (!els.alert) return;
  els.alert.className = `alert alert-${type}`;
  els.alert.textContent = message;
  els.alert.classList.remove('d-none');
}

function hideAlert() {
  if (!els.alert) return;
  els.alert.classList.add('d-none');
}

function statusBadgeClass(status) {
  // Maps property status to the CSS class we defined in <style>
  if (!status) return 'status-PENDING';
  return `status-${String(status).toUpperCase()}`;
}

function firstImageOrPlaceholder(images) {
  const img = Array.isArray(images) && images.length ? images[0] : null;
  return img || 'https://via.placeholder.com/120x80?text=No+Image';
}

function asNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

// API calls
async function fetchProperties() {
  const res = await fetch('/api/properties');
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json(); // array of properties
}

async function fetchTenants() {
  // Based on your controller naming, GET /api/addtenants returns an array
  const res = await fetch('/api/addtenants');
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json(); // array of tenants
}

// Renderers
function renderMetrics({ properties, tenants }) {
  // Total properties
  els.totalProps.textContent = properties.length;

  // Active tenants: if you store status, count those considered "active". Fallback to all tenants length.
  // Your AddTenant schema has "status" (default 'paid'). If you track "active" differently, adjust here.
  const activeCount = tenants.length; // tweak if you have tenant.active flag
  els.activeTenants.textContent = activeCount;

  // Revenue = sum of rent for tenants where status === 'paid'
  const revenue = tenants
    .filter(t => String(t.status || '').toLowerCase() === 'paid')
    .reduce((sum, t) => sum + asNumber(t.rent), 0);
  els.monthRevenue.textContent = AUD.format(revenue);

  // Outstanding dues = sum of rent for tenants where status !== 'paid'
  const dues = tenants
    .filter(t => String(t.status || '').toLowerCase() !== 'paid')
    .reduce((sum, t) => sum + asNumber(t.rent), 0);
  els.outstandingDues.textContent = AUD.format(dues);
}

function renderPropertiesTable(properties) {
  if (!els.tbody) return;

  if (!properties.length) {
    els.tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No properties found.</td></tr>`;
    return;
  }

  const rows = properties.slice(0, 5).map(p => {
    const imgSrc = firstImageOrPlaceholder(p.images);
    const price = AUD.format(asNumber(p.rent));
    const status = p.status || 'PENDING';

    return `
      <tr>
        <td><img src="${imgSrc}" alt="Property" class="property-image"/></td>
        <td class="property-title">${escapeHtml(p.title || 'Untitled')}</td>
        <td class="property-price">${price}</td>
        <td>
          <span class="status-badge ${statusBadgeClass(status)}">${escapeHtml(status)}</span>
        </td>
      </tr>
    `;
  }).join('');

  els.tbody.innerHTML = rows;
}

// Basic HTML escape to prevent XSS from any untrusted strings
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Init
(async function initDashboard() {
  try {
    hideAlert();
    const [properties, tenants] = await Promise.all([fetchProperties(), fetchTenants()]);
    renderMetrics({ properties, tenants });
    renderPropertiesTable(properties);
  } catch (err) {
    console.error(err);
    showAlert('danger', err.message || 'Failed to load dashboard');
    // keep placeholder row if table failed
  }
})();

// Stubs for your quick-action buttons (optional)
window.showAddPropertyModal = function () {
  showAlert('info', 'Open your Add Property modal here.');
};
window.showAddTenantModal = function () {
  showAlert('info', 'Open your Add Tenant modal here.');
};
