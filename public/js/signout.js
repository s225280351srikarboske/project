// /js/signout.js

document.addEventListener('DOMContentLoaded', () => {
  const signOutLink = document.querySelector('.sign-out a');

  if (signOutLink) {
    signOutLink.addEventListener('click', (e) => {
      e.preventDefault(); // prevent normal navigation

      // 1. Clear tokens or session data
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      // 2. Optionally notify server (only if you have a backend logout route)
      // fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});

      // 3. Redirect back to login
      window.location.href = 'index.html';
    });
  }
});
