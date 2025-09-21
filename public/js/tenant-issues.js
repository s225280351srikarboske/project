(function () {
  const tokenKey = 'authToken';
  const token = localStorage.getItem(tokenKey);

  const $prop = document.getElementById('propSelect');
  const $category = document.getElementById('category');
  const $severity = document.getElementById('severity');
  const $description = document.getElementById('description');
  const $submit = document.getElementById('submitBtn');
  const $msg = document.getElementById('msg');
  const $tbody = document.querySelector('#issuesTable tbody');

  async function loadProperties() {
    const res = await fetch('/api/properties?status=AVAILABLE', { headers: { 'Content-Type':'application/json' } });
    const items = res.ok ? await res.json() : [];
    $prop.innerHTML = `<option value="">-- None --</option>` + items.map(p => `<option value="${p._id}">${escapeHtml(p.title || p?.address?.line1 || 'Property')}</option>`).join('');
  }

  async function loadIssues() {
    const res = await fetch('/api/issues', { headers: { 'Content-Type':'application/json' } });
    const json = res.ok ? await res.json() : null;
    const items = (json && json.ok) ? json.data : [];
    $tbody.innerHTML = '';
    for (const it of items) {
      const tr = document.createElement('tr');
      const created = it.createdAt ? new Date(it.createdAt).toLocaleString() : '';
      tr.innerHTML = `
        <td>${escapeHtml(created)}</td>
      <td>${escapeHtml(it.property?.title || it.property?.address?.line1 || it.property || '')}</td>
        <td>${escapeHtml(it.category)}</td>
        <td>${escapeHtml(it.severity)}</td>
        <td>${escapeHtml(it.status)}</td>
        <td>${escapeHtml(it.description)}</td>
      `;
      $tbody.appendChild(tr);
    }
  }

  async function submitIssue() {
    const payload = {
      property: $prop.value || undefined,
      category: $category.value,
      severity: $severity.value,
      description: $description.value.trim()
    };
    if (!payload.description) {
      $msg.textContent = 'Description is required.';
      return;
    }
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      $msg.textContent = 'Issue submitted ✅';
      $description.value = '';
      await loadIssues();
    } else {
      const e = await res.json().catch(() => ({}));
      $msg.textContent = e.message || 'Failed to submit issue';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  $submit.addEventListener('click', submitIssue);

  loadProperties();
  loadIssues();
})();
