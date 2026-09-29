(() => {
  'use strict';
  const config = window.DINEAGAIN_CONFIG || {};
  let destination = '';
  let usesEmail = false;
  try {
    const url = new URL(config.bookingUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) destination = url.href;
  } catch { /* An empty or invalid URL leaves the fallback available. */ }
  if (!destination && typeof config.contactEmail === 'string' && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(config.contactEmail)) {
    destination = `mailto:${config.contactEmail}?subject=${encodeURIComponent('DineAgain consultation')}`;
    usesEmail = true;
  }
  if (destination) {
    document.querySelectorAll('[data-consultation]').forEach(link => { link.href = destination; });
    document.getElementById('booking-status').textContent = usesEmail
      ? 'Email us to arrange a time that works for you.'
      : 'Choose a time that works for you.';
  }
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
