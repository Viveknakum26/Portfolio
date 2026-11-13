/* ============================================
   CODE & CANVAS — Portfolio Interactions
   ============================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Header scroll state ---- */
  var header = document.querySelector('[data-header]');
  function updateHeader() {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ---- Mobile menu ---- */
  var menuToggle = document.querySelector('.menu-toggle');
  var siteNav = document.querySelector('.site-nav');

  function closeMenu() {
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    siteNav.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
  menuToggle.addEventListener('click', function () {
    if (siteNav.classList.contains('is-open')) closeMenu();
    else openMenu();
  });
  document.querySelectorAll('.site-nav a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('click', function (e) {
    if (siteNav.classList.contains('is-open') && !siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  /* ---- Reveal on scroll ---- */
  var revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---- Gallery filtering ---- */
  var filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;
      filterButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      document.querySelector('.gallery-grid').classList.toggle('is-filtered', filter !== 'all');
      document.querySelectorAll('.gallery-tile').forEach(function (item) {
        var show = filter === 'all' || item.dataset.category === filter;
        item.hidden = !show;
        if (show) {
          item.style.opacity = '0';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { item.style.opacity = '1'; });
          });
        }
      });
      document.querySelectorAll('.gallery-showcase, .gallery-side-grid, .gallery-bottom-grid').forEach(function (group) {
        group.hidden = !group.querySelector('.gallery-tile:not([hidden])');
      });
    });
  });

  /* ---- Lightbox ---- */
  var lightbox = document.querySelector('.lightbox');
  var lightboxCaption = document.querySelector('[data-lightbox-caption]');
  var lightboxTitle = document.querySelector('#lightbox-title');
  var lightboxStatus = document.querySelector('.lightbox-status');
  var lightboxArt = document.querySelector('.lightbox-art');
  var lightboxNote = document.querySelector('.lightbox-note');
  var lastFocused = null;

  function openLightbox(trigger) {
    lastFocused = trigger;
    var label = trigger.dataset.label || 'Image preview';
    lightboxCaption.textContent = label;
    lightboxTitle.textContent = label;
    lightboxArt.querySelectorAll('.lightbox-image').forEach(function (image) { image.remove(); });
    if (trigger.dataset.image) {
      var image = document.createElement('img');
      image.className = 'lightbox-image';
      image.src = trigger.dataset.image;
      image.alt = label;
      image.addEventListener('error', function () {
        lightboxStatus.textContent = 'Image could not be loaded from this path.';
      });
      lightboxArt.appendChild(image);
      lightboxNote.hidden = true;
      lightboxStatus.textContent = 'Image preview shown';
    } else {
      lightboxNote.hidden = false;
      lightboxStatus.textContent = 'Asset not locally available';
    }
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    lightboxArt.querySelectorAll('.lightbox-image').forEach(function (image) { image.remove(); });
    lightboxNote.hidden = false;
    if (lastFocused) lastFocused.focus();
  }

  function bindLightbox(item) {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', function () { openLightbox(item); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item);
      }
    });
  }
  document.querySelectorAll('[data-lightbox]').forEach(bindLightbox);

  document.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
    el.addEventListener('click', closeLightbox);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* Focus trap in lightbox */
  lightbox.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || lightbox.hidden) return;
    var focusable = lightbox.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---- Active nav link via IntersectionObserver ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[data-nav]'));
  var navSections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) { link.removeAttribute('aria-current'); });
          var active = navLinks.find(function (link) {
            return link.getAttribute('href') === '#' + entry.target.id;
          });
          if (active) active.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    navSections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---- Custom cursor (desktop only, no reduced motion) ---- */
  if (canHover && !reducedMotion) {
    var cursor = document.querySelector('.cursor');
    if (cursor) {
      var mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.classList.add('is-visible');
      });
      document.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-visible');
      });
      (function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.18;
        cursorY += (mouseY - cursorY) * 0.18;
        cursor.style.transform = 'translate(' + cursorX + 'px, ' + cursorY + 'px) translate(-50%, -50%)';
        requestAnimationFrame(animateCursor);
      })();

      var hoverSelectors = 'a, button, [data-lightbox], .gallery-tile, .filter-btn, .skill-list li';
      document.querySelectorAll(hoverSelectors).forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
      });
    }
  }

  /* ---- Smooth anchor scroll with header offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var headerHeight = header.offsetHeight;
      var targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;
      window.scrollTo({ top: targetPos, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

})();