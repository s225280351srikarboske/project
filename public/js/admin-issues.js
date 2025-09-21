const $tbody = document.getElementById('adminIssuesTbody');
const $alert = document.getElementById('issues-alert');

function showAlert(msg, type='success') {
  $alert.textContent = msg;
  $alert.className = `alert alert-${type}`;
  $alert.classList.remove('d-none');
  setTimeout(() => $alert.classList.add('d-none'), 3000);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// Map schema → pretty for select, and vice-versa for sending back
const schemaToPretty = { OPEN:'Pending', IN_PROGRESS:'In Process', RESOLVED:'Completed' };
const prettyToApi = { 'Pending':'PENDING', 'In Process':'IN PROCESS', 'Completed':'COMPLETED' };

async function fetchIssues() {
  const res = await fetch('/api/issues', { headers:{'Content-Type':'application/json'} });
  const json = res.ok ? await res.json() : null;
  return (json && json.ok) ? json.data : [];
}

async function updateStatus(id, prettyVal, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`/api/issues/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status: prettyToApi[prettyVal] || prettyVal })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || 'Failed to update');

    showAlert('Status updated ✔');
  } catch (e) {
    showAlert(e.message, 'danger');
  } finally {
    btn.disabled = false;
  }
}

function renderRows(list) {
  if (!list.length) {
    $tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No issues found.</td></tr>`;
    return;
  }
  $tbody.innerHTML = '';
  for (const it of list) {
    const tr = document.createElement('tr');
    const created = it.createdAt ? new Date(it.createdAt).toLocaleString() : '';
    const pretty = schemaToPretty[it.status] || it.status;

    tr.innerHTML = `
      <td>${escapeHtml(created)}</td>
      <td>${escapeHtml(it.property?.title || it.property?.address?.line1 || it.property || '')}</td>
      <td>${escapeHtml(it.category)}</td>
      <td>${escapeHtml(it.severity)}</td>
      <td>${escapeHtml(it.description)}</td>
      <td>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm w-auto">
            <option ${pretty==='Pending'?'selected':''}>Pending</option>
            <option ${pretty==='In Process'?'selected':''}>In Process</option>
            <option ${pretty==='Completed'?'selected':''}>Completed</option>
          </select>
          <button class="btn btn-sm btn-primary">Save</button>
        </div>
      </td>
    `;

    const select = tr.querySelector('select');
    const btn = tr.querySelector('button');
    btn.addEventListener('click', async () => {
      await updateStatus(it._id, select.value, btn);
      // Optional: refresh row to reflect normalized server status
      const fresh = await fetchIssues();
      renderRows(fresh);
    });

    $tbody.appendChild(tr);
  }
}

(async function init() {
  const list = await fetchIssues().catch(() => []);
  renderRows(list);
})();
