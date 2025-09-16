// Uses your GET /api/properties which returns an ARRAY.
// Fields per your schema: title, address.line1/city/state/postcode, rent, bedrooms, bathrooms,
// parking (boolean), images [String], status ('AVAILABLE'|'OCCUPIED'), description.

(function () {
  const API_BASE = '/api/properties';
  const GRID = document.getElementById('properties');
  const EMPTY = document.getElementById('emptyState');
  const SEARCH = document.getElementById('searchBox');
  const STATUS = document.getElementById('statusFilter');
  const LOGOUT = document.getElementById('logoutBtn');

  // If you store JWT locally and protect the API, wire it here.
  const tokenKey = 'authToken';
  const token = localStorage.getItem(tokenKey);

  LOGOUT.addEventListener('click', () => {
    localStorage.removeItem(tokenKey);
    window.location.href = '/';
  });

  async function fetchAndRender() {
    try {
      const q = encodeURIComponent(SEARCH.value.trim());
      const s = encodeURIComponent(STATUS.value || '');
      const url = `${API_BASE}?${s ? `status=${s}&` : ''}${q ? `q=${q}` : ''}`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // uncomment if your API requires auth
        }
      });
      if (!res.ok) throw new Error('Failed to load properties');
      const items = await res.json(); // ARRAY per your controller

      render(items);
    } catch (err) {
      console.error(err);
      GRID.innerHTML = '';
      EMPTY.style.display = 'block';
      EMPTY.textContent = 'Failed to load properties.';
    }
  }

  function render(items) {
    GRID.innerHTML = '';
    if (!Array.isArray(items) || items.length === 0) {
      EMPTY.style.display = 'block';
      return;
    }
    EMPTY.style.display = 'none';

    for (const p of items) {
      const title = p.title || p?.address?.line1 || 'Property';
      const addr = [
        p?.address?.line1, p?.address?.city, p?.address?.state, p?.address?.postcode
      ].filter(Boolean).join(', ');

      const stats = [
        (p.bedrooms ? `${p.bedrooms} bed` : ''),
        (p.bathrooms ? `${p.bathrooms} bath` : ''),
        (p.parking ? 'parking' : '')
      ].filter(Boolean).join(' · ');

      const price = (typeof p.rent === 'number' && !Number.isNaN(p.rent)) ? `$${p.rent}` : '';
      const imgSrc = Array.isArray(p.images) && p.images.length ? p.images[0] : null;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="imgwrap">${imgSrc ? `<img src="${escapeHtml(imgSrc)}" alt="">` : `<span class="muted">No Image</span>`}</div>
        <h3>${escapeHtml(title)}</h3>
        <div class="muted">${escapeHtml(addr)}</div>
        ${stats ? `<div class="muted" style="margin-top:6px;">${escapeHtml(stats)}</div>` : ''}
        ${price ? `<div class="price">${escapeHtml(price)}${p.status ? ` · ${escapeHtml(p.status)}` : ''}</div>`
                : (p.status ? `<div class="muted">${escapeHtml(p.status)}</div>` : '')}
        ${p.description ? `<p style="margin-top:6px;">${escapeHtml(String(p.description)).slice(0,180)}${String(p.description).length>180?'…':''}</p>` : ''}
      `;
      GRID.appendChild(card);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[s]
    ));
  }

  // Load AVAILABLE by default
  STATUS.value = 'AVAILABLE';
  fetchAndRender();

  SEARCH.addEventListener('input', debounce(fetchAndRender, 300));
  STATUS.addEventListener('change', fetchAndRender);

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }
})();
 