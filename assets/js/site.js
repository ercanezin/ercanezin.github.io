/* ercanezin.com: tab navigation with shareable URLs (#about, #publications, ...). */
(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var main = document.getElementById('main');
  var ids = tabs.map(function (t) { return t.id; });
  var baseTitle = document.title;
  var DEFAULT = 'about';

  // Old one-page anchors and alternative names still land on the right tab.
  var aliases = { publication: 'publications', papers: 'publications', news: 'publications',
                  activities: 'experience', contact: 'about', resume: 'experience' };

  function resolve(hash) {
    var id = (hash || '').replace(/^#/, '').toLowerCase();
    id = aliases[id] || id;
    return ids.indexOf(id) !== -1 ? id : DEFAULT;
  }

  // Where the content card starts; 0 when it already sits near the top (desktop layout).
  function mainTop() {
    var top = main.getBoundingClientRect().top + window.pageYOffset - 16;
    return top < window.innerHeight / 3 ? 0 : top;
  }

  function show(id, opts) {
    opts = opts || {};
    tabs.forEach(function (t) { t.classList.toggle('is-active', t.id === id); });
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      if (on) {
        a.setAttribute('aria-current', 'page');
        // Keep the active item visible in the horizontally scrolling mobile nav.
        var ul = a.closest('ul');
        if (ul && ul.scrollWidth > ul.clientWidth) {
          ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
        }
      } else {
        a.removeAttribute('aria-current');
      }
    });

    var label = links.filter(function (a) { return a.getAttribute('href') === '#' + id; })[0];
    document.title = id === DEFAULT ? baseTitle : label.textContent.trim() + ' · ' + baseTitle;

    if (opts.scroll) {
      // Bring the top of the content card into view only if we've scrolled past it.
      var top = mainTop();
      if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    if (opts.focus) {
      var panel = document.getElementById(id);
      panel.focus({ preventScroll: true });
    }
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      var id = resolve(a.getAttribute('href'));
      if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
      show(id, { scroll: true, focus: true });
    });
  });

  window.addEventListener('popstate', function () { show(resolve(location.hash), { scroll: true }); });
  window.addEventListener('hashchange', function () { show(resolve(location.hash), { scroll: true }); });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var initial = resolve(location.hash);
  if (location.hash && location.hash !== '#' + initial) history.replaceState(null, '', '#' + initial);
  show(initial);

  // A deep link (e.g. /#publications) opens with the content card in view; otherwise start at the top.
  // The browser's own jump to the #fragment can land after this script runs, so settle again on load
  // unless the visitor has already started scrolling.
  var moved = false;
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { moved = true; }, { once: true, passive: true });
  });
  function settle() { if (!moved) window.scrollTo(0, location.hash ? mainTop() : 0); }
  settle();
  window.addEventListener('load', function () { setTimeout(settle, 0); });

  // Mobile: collapse contacts and profiles behind a button.
  var sidebar = document.querySelector('[data-sidebar]');
  var toggle = document.querySelector('[data-sidebar-toggle]');
  if (sidebar && toggle) {
    toggle.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('[data-label]').textContent = open ? 'Hide contacts' : 'Contacts & profiles';
    });
  }

  // Email addresses are stored as data-u / data-d with no "@" in the HTML.
  // The mailto: link is only built when a visitor points at, taps or focuses one.
  Array.prototype.forEach.call(document.querySelectorAll('a.email[data-u]'), function (a) {
    function arm() {
      if (!a.getAttribute('href')) a.setAttribute('href', 'mailto:' + a.getAttribute('data-u') + '@' + a.getAttribute('data-d'));
    }
    ['pointerenter', 'pointerdown', 'touchstart', 'focus'].forEach(function (ev) {
      a.addEventListener(ev, arm, { passive: true });
    });
  });

  // Desktop: pin the profile card only while all of it fits in the window (no inner scrollbar).
  if (sidebar) {
    var fit = function () {
      sidebar.classList.toggle('is-sticky', sidebar.offsetHeight + 80 <= window.innerHeight);
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
