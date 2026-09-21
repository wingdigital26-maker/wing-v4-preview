/* Wing Digital v4 -- nav, FAQ accordion, form validation, one quiet rise-in.
   Never touches assets/piece-engine.js or the stage. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js'); /* also set inline in <head> */

  /* ---------- first-load intro: nav + split-head + hero-line stay hidden (class set
     synchronously in <head>, homepage only) until the piece finishes assembling.
     Belt and suspenders: reveal fires no matter what the engine does. */
  (function () {
    var docEl = document.documentElement;
    if (!docEl.classList.contains('intro-active')) return;

    var settled = false;
    var started = false;

    function reveal() {
      if (settled) return;
      settled = true;
      docEl.classList.remove('intro-active');
      try { sessionStorage.setItem('wingIntroSeen', '1'); } catch (e) {}
    }

    setTimeout(reveal, 6500); /* suspenders: onDone never called (must exceed the intro length, ~4.8s) */

    function start() {
      if (started) return;
      started = true;
      if (window.WingPiece && typeof window.WingPiece.playIntro === 'function') {
        try { window.WingPiece.playIntro({ reducedMotion: reduced, onDone: reveal }); }
        catch (e) { reveal(); }
      } else {
        reveal(); /* no engine API at all */
      }
    }

    if (window.WingPiece && window.WingPiece.ready) {
      start();
    } else {
      window.addEventListener('wingpiece:ready', start, { once: true });
      setTimeout(start, 1200); /* suspenders: ready never fires */
    }
  })();

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('solid', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var burger = nav.querySelector('.burger');
    if (burger) {
      var outside = function () {
        return [].slice.call(document.querySelectorAll('body > main, body > footer, body > .skip, body > #rail'));
      };
      var focusables = function () {
        return [].slice.call(nav.querySelectorAll('a[href], button')).filter(function (el) {
          return el.offsetWidth > 0 && el.offsetHeight > 0;
        });
      };
      var setMenu = function (open, returnFocus) {
        nav.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('menu-locked', open);
        outside().forEach(function (el) { el.inert = open; });
        if (open) {
          var first = nav.querySelector('.navlinks a');
          if (first) first.focus();
        } else if (returnFocus) {
          burger.focus();
        }
      };
      burger.addEventListener('click', function () {
        setMenu(!nav.classList.contains('menu-open'), true);
      });
      document.addEventListener('keydown', function (e) {
        if (!nav.classList.contains('menu-open')) return;
        if (e.key === 'Escape') { e.preventDefault(); setMenu(false, true); return; }
        if (e.key !== 'Tab') return;
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1], act = document.activeElement;
        if (e.shiftKey && (act === first || !nav.contains(act))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (act === last || !nav.contains(act))) { e.preventDefault(); first.focus(); }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && nav.classList.contains('menu-open')) setMenu(false, false);
      });
    }
  }

  /* ---------- chapter progress rail ---------- */
  var rail = document.getElementById('rail');
  var chapters = [].slice.call(document.querySelectorAll('[data-piece-state]'));
  if (rail && chapters.length) {
    var states = [];
    chapters.forEach(function (c) {
      var s = c.getAttribute('data-piece-state');
      if (states.indexOf(s) === -1 && s !== 'frame') states.push(s);
    });
    states.slice(0, 6).forEach(function (s) {
      var t = document.createElement('span');
      t.className = 'tick';
      t.dataset.state = s;
      rail.appendChild(t);
    });
    var ticks = [].slice.call(rail.querySelectorAll('.tick'));
    var updateRail = function () {
      var mid = window.scrollY + window.innerHeight / 2;
      var current = null;
      chapters.forEach(function (c) {
        var s = c.getAttribute('data-piece-state');
        if (s === 'frame') return;
        var top = c.offsetTop, bottom = top + c.offsetHeight;
        if (mid >= top && mid <= bottom) current = s;
      });
      ticks.forEach(function (t) { t.classList.toggle('on', t.dataset.state === current); });
    };
    updateRail();
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
  }

  /* ---------- process: the caption for the step under the viewport centre shows in the bottom band ---------- */
  var caps = [].slice.call(document.querySelectorAll('[data-step-cap]'));
  var spacers = [].slice.call(document.querySelectorAll('.step-spacer'));
  if (caps.length && spacers.length) {
    var lastCap = -1;
    var updateCaps = function () {
      var mid = window.innerHeight / 2, idx = 0;
      spacers.forEach(function (sp, i) { if (sp.getBoundingClientRect().top <= mid) idx = i; });
      if (idx === lastCap) return;
      lastCap = idx;
      caps.forEach(function (c, i) {
        c.classList.toggle('on', i === idx);
        c.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
    };
    updateCaps();
    window.addEventListener('scroll', updateCaps, { passive: true });
    window.addEventListener('resize', updateCaps);
  }

  /* ---------- FAQ: real disclosure semantics ---------- */
  document.querySelectorAll('.qa').forEach(function (qa) {
    var btn = qa.querySelector('button');
    var ans = qa.querySelector('.ans');
    if (!btn || !ans) return;

    if (!ans.id) ans.id = 'ans-' + Math.random().toString(36).slice(2, 9);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', ans.id);
    ans.hidden = true;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.qa').forEach(function (o) {
        var b = o.querySelector('button'), a = o.querySelector('.ans');
        if (b && a) { b.setAttribute('aria-expanded', 'false'); a.hidden = true; }
      });
      if (!open) { btn.setAttribute('aria-expanded', 'true'); ans.hidden = false; }
    });
  });

  /* ---------- lead form validation (client-side, does not block a real submit) ---------- */
  document.querySelectorAll('.leadform').forEach(function (form) {
    var messages = {
      name: 'Enter your full name.',
      email: 'Enter a valid email address.',
      phone: 'Enter a phone number with at least 10 digits.',
      message: 'Tell us a little about your business.'
    };
    var fields = ['name', 'email', 'phone', 'message'];

    var errFor = function (input) { return document.getElementById(input.id + '-err'); };
    var showError = function (input, msg) {
      var err = errFor(input);
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      if (err) {
        err.textContent = msg;
        err.hidden = false;
        input.setAttribute('aria-describedby', err.id);
      }
    };
    var clearError = function (input) {
      var err = errFor(input);
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      if (err) { err.textContent = ''; err.hidden = true; }
    };
    var check = function (name, input) {
      var v = input.value.trim();
      var ok = v.length > 0;
      if (ok && name === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (ok && name === 'phone') ok = v.replace(/\D/g, '').length >= 10;
      return ok;
    };

    fields.forEach(function (name) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      input.addEventListener('input', function () { if (input.classList.contains('invalid') && check(name, input)) clearError(input); });
    });

    form.addEventListener('submit', function (e) {
      var valid = true;
      fields.forEach(function (name) {
        var input = form.querySelector('[name="' + name + '"]');
        if (!input) return;
        var ok = check(name, input);
        if (!ok) { showError(input, messages[name]); valid = false; }
        else clearError(input);
      });
      if (!valid) {
        e.preventDefault();
        var firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  });

  /* ---------- ONE quiet rise-in for copy ---------- */
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if (reduced || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    // threshold 0 with a bottom inset: a block taller than the viewport can never show 16% of itself at once
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });

    // failsafe: the observer is tied to rendering and can miss (hidden tab, anchor jumps, fast flings).
    // Anything whose top has passed the lower edge of the viewport is revealed; copy must never stay invisible.
    var sweepQueued = false;
    function sweep() {
      sweepQueued = false;
      var edge = window.innerHeight * 0.96;
      for (var i = rv.length - 1; i >= 0; i--) {
        var el = rv[i];
        if (el.classList.contains('in')) { rv.splice(i, 1); continue; }
        if (el.getBoundingClientRect().top < edge) { el.classList.add('in'); io.unobserve(el); rv.splice(i, 1); }
      }
      if (!rv.length) {
        window.removeEventListener('scroll', queueSweep);
        window.removeEventListener('resize', queueSweep);
      }
    }
    function queueSweep() { if (!sweepQueued) { sweepQueued = true; setTimeout(sweep, 80); } }
    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep);
    window.addEventListener('load', queueSweep);
    document.addEventListener('visibilitychange', queueSweep);
    window.addEventListener('hashchange', queueSweep);
    queueSweep();
  }
})();
