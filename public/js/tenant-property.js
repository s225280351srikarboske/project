(function () {
  const tokenKey = 'authToken'; // if you use JWT
  const token = localStorage.getItem(tokenKey);

  const pid = location.pathname.split('/').pop(); // /tenant/property/:id
  const $title = document.getElementById('title');
  const $addr = document.getElementById('addr');
  const $stats = document.getElementById('stats');
  const $price = document.getElementById('price');
  const $desc = document.getElementById('desc');
  const $gallery = document.getElementById('gallery');

  const $chatlog = document.getElementById('chatlog');
  const $msg = document.getElementById('msg');
  const $send = document.getElementById('sendBtn');

  // ---- Property details ----
  async function loadProperty() {
    const res = await fetch(`/api/properties/${pid}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return;
    const p = await res.json();

    const addr = [p?.address?.line1, p?.address?.city, p?.address?.state, p?.address?.postcode].filter(Boolean).join(', ');
    const stats = [
      (p.bedrooms ? `${p.bedrooms} bed` : ''),
      (p.bathrooms ? `${p.bathrooms} bath` : ''),
      (p.parking ? 'parking' : '')
    ].filter(Boolean).join(' · ');

    $title.textContent = p.title || 'Property';
    $addr.textContent = addr;
    $stats.textContent = stats;
    $price.textContent = (typeof p.rent === 'number') ? `$${p.rent} · ${p.status || ''}` : (p.status || '');
    $desc.textContent = p.description || '';

    $gallery.innerHTML = '';
    if (Array.isArray(p.images)) {
      for (const src of p.images) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        $gallery.appendChild(img);
      }
    }
  }

  // ---- Chat ----
  let lastSeenISO = null;
  async function loadChat() {
    const url = lastSeenISO ? `/api/chat/${pid}?since=${encodeURIComponent(lastSeenISO)}` : `/api/chat/${pid}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return;
    const json = await res.json();
    if (!json || !json.ok) return;

    const msgs = json.data || [];
    if (msgs.length) {
      for (const m of msgs) appendBubble(m);
      lastSeenISO = msgs[msgs.length - 1].createdAt;
      $chatlog.scrollTop = $chatlog.scrollHeight;
    }
  }

  function appendBubble(m) {
    const div = document.createElement('div');
    div.className = `bubble ${m.fromRole === 'Tenant' ? 'tenant' : 'admin'}`;
    const ts = new Date(m.createdAt);
    const time = isNaN(ts) ? '' : `  ·  ${ts.toLocaleString()}`;
    div.textContent = `${m.text}${time}`;
    $chatlog.appendChild(div);
  }

  async function sendMessage() {
    const text = $msg.value.trim();
    if (!text) return;
    const res = await fetch(`/api/chat/${pid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      $msg.value = '';
      lastSeenISO = null; // reload all to include our own message ordered by server time
      await loadChat();
    }
  }

  $send.addEventListener('click', sendMessage);
  $msg.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  // init
  loadProperty();
  loadChat();
  setInterval(loadChat, 4000); // simple polling
})();
