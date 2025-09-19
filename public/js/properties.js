// /public/js/properties.js

document.addEventListener('DOMContentLoaded', function () {
  loadProperties();

  document.getElementById('addNewPropertyBtn').addEventListener('click', openPropertyModal);
  document.getElementById('propertyForm').addEventListener('submit', handlePropertySubmit);

  document.querySelectorAll('.close-btn').forEach((btn) => btn.addEventListener('click', closeModals));
  document.getElementById('propertyModal').addEventListener('click', function (e) {
    if (e.target === this) closeModals();
  });
});

/** ---------------- API helpers ---------------- */
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

// Separate helper for file uploads (FormData)
async function uploadImages(propertyId, files) {
  if (!files || !files.length) return { images: [] };

  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('images', f)); // field name must be 'images'

  const res = await fetch(`/api/properties/${propertyId}/images`, {
    method: 'POST',
    body: fd, // do NOT set Content-Type manually
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/** --------------- Status mapping --------------- */
const uiToSchemaStatus = (ui) => (ui === 'occupied' ? 'OCCUPIED' : 'AVAILABLE');
// UI uses: occupied | vacant | pending. Both vacant and pending map to AVAILABLE.
const schemaToUiStatus = (schema) => (schema === 'OCCUPIED' ? 'occupied' : 'vacant');

/** ---------------- Load & render ---------------- */
async function loadProperties() {
  try {
    const properties = await api('/api/properties');
    renderProperties(properties || []);
  } catch (error) {
    console.error('Error loading properties:', error);
    alert('Error loading properties: ' + error.message);
  }
}

function renderProperties(properties) {
  const tbody = document.getElementById('propertiesTableBody');

  if (!properties.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No properties found</td></tr>';
    return;
  }

  tbody.innerHTML = properties
    .map((p) => {
      const img =
        Array.isArray(p.images) && p.images.length
          ? p.images[0]
          : 'https://via.placeholder.com/60x40?text=No+Image';
      const addr = [p?.address?.line1, p?.address?.city, p?.address?.state, p?.address?.postcode]
        .filter(Boolean)
        .join(', ');
      const statusUi = schemaToUiStatus(p.status);

      return `
        <tr>
          <td><img src="${escapeHtml(img)}" alt="Property" class="property-image" style="width:60px;height:40px;object-fit:cover;border-radius:6px"></td>
          <td class="property-title">${escapeHtml(p.title || '')}</td>
          <td>${escapeHtml(addr)}</td>
          <td class="property-price">$${Number(p.rent || 0).toLocaleString()}</td>
          <td><span class="status-badge ${statusUi}">${statusUi}</span></td>
          <td class="action-buttons">
            <button class="edit-btn" data-id="${p._id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-btn" data-id="${p._id}"><i class="fas fa-trash"></i> Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const propertyId = this.getAttribute('data-id');
      editProperty(propertyId);
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const propertyId = this.getAttribute('data-id');
      deleteProperty(propertyId);
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
function openPropertyModal() {
  document.getElementById('propertyModalTitle').textContent = 'Add New Property';
  document.getElementById('propertyForm').reset();
  document.getElementById('propertyId').value = '';

  // clear file input and hide current images block
  const fileInput = document.getElementById('propertyImages');
  if (fileInput) fileInput.value = '';
  const group = document.getElementById('currentImagesGroup');
  const preview = document.getElementById('currentImagesPreview');
  if (group) group.style.display = 'none';
  if (preview) preview.innerHTML = '';

  document.getElementById('propertyModal').classList.add('active');
}

function closeModals() {
  document.getElementById('propertyModal').classList.remove('active');
}

/** ---------------- Edit / Create ---------------- */
async function editProperty(propertyId) {
  try {
    const p = await api(`/api/properties/${propertyId}`);

    document.getElementById('propertyModalTitle').textContent = 'Edit Property';
    document.getElementById('propertyId').value = p._id;
    document.getElementById('propertyTitle').value = p.title || '';
    document.getElementById('propertyAddress').value = p?.address?.line1 || '';
    document.getElementById('propertyPrice').value = p.rent ?? '';
    document.getElementById('propertyStatus').value = schemaToUiStatus(p.status || 'AVAILABLE');

    // clear new-file input (we only append new files on save)
    const fileInput = document.getElementById('propertyImages');
    if (fileInput) fileInput.value = '';

    // show current images preview (read-only)
    const imgs = Array.isArray(p.images) ? p.images : [];
    const group = document.getElementById('currentImagesGroup');
    const preview = document.getElementById('currentImagesPreview');
    if (imgs.length) {
      group.style.display = 'block';
      preview.innerHTML = imgs
        .map(
          (u) =>
            `<img src="${escapeHtml(
              u
            )}" style="max-width:90px;max-height:70px;border-radius:6px;object-fit:cover">`
        )
        .join('');
    } else {
      group.style.display = 'none';
      preview.innerHTML = '';
    }

    document.getElementById('propertyModal').classList.add('active');
  } catch (error) {
    console.error('Error loading property:', error);
    alert('Error loading property: ' + error.message);
  }
}

async function handlePropertySubmit(e) {
  e.preventDefault();

  const propertyId = document.getElementById('propertyId').value.trim();
  const title = document.getElementById('propertyTitle').value.trim();
  const line1 = document.getElementById('propertyAddress').value.trim();
  const rent = Number(document.getElementById('propertyPrice').value || 0);
  const uiStatus = document.getElementById('propertyStatus').value;
  const files = document.getElementById('propertyImages').files;

  if (!title) return alert('Title is required.');
  if (!line1) return alert('Address is required.');
  if (!(rent >= 0)) return alert('Rent must be a number.');

  // Build JSON payload for property core fields
  const payload = {
    title,
    address: { line1, city: '', state: '', postcode: '' },
    rent,
    status: uiToSchemaStatus(uiStatus),
    // We won't post images via JSON; we upload files after create/update
    images: [],
    bedrooms: 0,
    bathrooms: 0,
    parking: false,
    description: '',
  };

  try {
    let id = propertyId;

    // Step 1: create or update
    if (id) {
      await api(`/api/properties/${id}`, 'PUT', payload);
    } else {
      const created = await api('/api/properties', 'POST', payload);
      id = created._id;
    }

    // Step 2: upload files if any
    if (files && files.length) {
      await uploadImages(id, files);
    }

    closeModals();
    loadProperties();
  } catch (error) {
    console.error('Error saving property:', error);
    alert('Error saving property: ' + error.message);
  }
}

/** ---------------- Delete ---------------- */
async function deleteProperty(propertyId) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  try {
    await api(`/api/properties/${propertyId}`, 'DELETE');
    loadProperties();
  } catch (error) {
    console.error('Error deleting property:', error);
    alert('Error deleting property: ' + error.message);
  }
}
