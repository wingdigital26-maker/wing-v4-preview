/* contact.html page-specific behaviour.
   Never touches assets/site.js or assets/piece-engine.js.
   assets/site.js already wires the generic .leadform validation
   (aria-invalid, aria-describedby, text error messages, focus to the
   first invalid field) for every form with class "leadform" on the site,
   so this file only adds what is specific to this page: v3's ?sent=1
   success handling, reproduced as a real on-page confirmation instead of
   v3's silent mascot-only pulse. */
(function () {
  'use strict';

  if (location.search.indexOf('sent=1') === -1) return;

  var banner = document.getElementById('sent-banner');
  if (!banner) return;

  banner.hidden = false;
  banner.tabIndex = -1;
  banner.focus();

  // clean the query string so a refresh does not re-show the banner
  if (window.history && window.history.replaceState) {
    var url = location.pathname + location.hash;
    window.history.replaceState(null, '', url);
  }
})();
