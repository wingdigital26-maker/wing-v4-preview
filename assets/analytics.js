/* Wing Digital tracking layer -- tier 1 (free, no call-tracking numbers).
 *
 * ONE THING TO DO: paste the GA4 measurement id on the next line.
 * Until it is filled in, nothing loads and nothing is sent. No errors either.
 *
 * What it records:
 *   call_click   -- someone tapped a tel: link (which number, which page, which control)
 *   form_submit  -- the contact form was submitted
 *   email_click  -- someone tapped a mailto: link
 *
 * What it CANNOT tell you: whether the call connected or how long it lasted.
 * That needs a tracking number (CallRail or similar) and a monthly fee.
 */
(function () {
  'use strict';

  var GA4_ID = ''; // <-- e.g. 'G-XXXXXXXXXX'

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (GA4_ID) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA4_ID);
  }

  function send(name, params) {
    if (GA4_ID) gtag('event', name, params);
  }

  // Delegated so it covers links added later, and every page shape.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var where = a.closest('header') ? 'header'
      : a.closest('footer') ? 'footer'
      : a.closest('.callbar, .sticky-call') ? 'sticky'
      : 'body';

    if (href.indexOf('tel:') === 0) {
      send('call_click', {
        phone_number: href.slice(4),
        page_path: location.pathname,
        link_location: where
      });
    } else {
      send('email_click', {
        page_path: location.pathname,
        link_location: where
      });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    send('form_submit', {
      form_id: f.id || f.getAttribute('name') || 'unnamed',
      page_path: location.pathname
    });
  }, true);
})();
