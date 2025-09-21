document.addEventListener('DOMContentLoaded', () => {
  // Adjust this selector if your sign-out link/button has a different structure
  const signOutLink = document.querySelector('.sign-out a, a#signout, button#signout');

  if (!signOutLink) return;

  signOutLink.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      // 1) Clear client-side auth state (JWT in storage, any user info caches)
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      // 2) (Optional) Tell server to clear cookie session if you use cookie auth
      // If you don't have this endpoint, it's safe to leave commented out.
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

      // 3) Replace current history entry so Back won't return to dashboard
      window.location.replace('index.html');
    } catch (err) {
      // Even if the request fails, still redirect after clearing local state
      window.location.replace('index.html');
    }
  });
});