
(function () {
  'use strict';

  // --- Loading Intro ---
  const MIN_LOADER_TIME = 1900; // keep the intro on screen long enough to breathe
  const BLOB_RETURN_MS = 1500;
  const BLOB_RETURN_STAGGER_MS = 70;
  const loaderStart = performance.now();
  let revealed = false;
  let blobsLive = false;

  document.body.classList.add('is-loading');

  function revealSite() {
    if (revealed) return;
    revealed = true;

    // Browsers won't start a CSS transition from a running animation's current
    // value, so capture each blob's pose in the cluster and animate it home.
    const lavaBlobs = Array.from(document.querySelectorAll('.lava-blob'));
    const gathered = lavaBlobs.map(blob => getComputedStyle(blob).transform);

    document.body.classList.remove('is-loading');
    document.body.classList.add('site-revealed', 'blobs-return');
    startReveals();

    const glides = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? [] :
      lavaBlobs.map((blob, i) => blob.animate(
        [{ transform: gathered[i] }, { transform: 'translate(0, 0) scale(1)' }],
        {
          duration: BLOB_RETURN_MS,
          delay: i * BLOB_RETURN_STAGGER_MS,
          easing: 'cubic-bezier(0.45, 0, 0.2, 1)',
          fill: 'backwards'
        }
      ).finished);

    // The float animations start from translate(0, 0) scale(1), exactly where the glide ends
    Promise.all(glides).catch(() => {}).then(() => {
      document.body.classList.remove('blobs-return');
      blobsLive = true;
    });
  }

  window.addEventListener('load', () => {
    const elapsed = performance.now() - loaderStart;
    setTimeout(revealSite, Math.max(0, MIN_LOADER_TIME - elapsed));
  });

  // Fallback in case the load event stalls (e.g. a hanging image request)
  setTimeout(revealSite, 7000);

  // --- Custom Cursor Follower ---
  const cursor = document.getElementById('cursor-follower');
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    const dx = mouseX - cursorX;
    const dy = mouseY - cursorY;
    cursorX += dx * 0.15;
    cursorY += dy * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Cursor states
  document.addEventListener('mousedown', () => cursor.classList.add('clicked'));
  document.addEventListener('mouseup', () => cursor.classList.remove('clicked'));

  const interactiveElements = document.querySelectorAll('a, button, .theme-switch, .menu-toggle, .portfolio-item, .skill-tag, .contact-link');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('pointer'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('pointer'));
  });

  // --- Lava Blobs Follow Mouse (subtle) ---
  const blobs = document.querySelectorAll('.lava-blob');

  document.addEventListener('mousemove', (e) => {
    if (!blobsLive) return;
    const x = e.clientX;
    const y = e.clientY;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const offsetX = (x - centerX) / centerX;
    const offsetY = (y - centerY) / centerY;

    blobs.forEach((blob, i) => {
      const factor = (i + 1) * 15;
      blob.style.transform = `translate(${offsetX * factor}px, ${offsetY * factor}px)`;
    });
  });

  // --- Theme Toggle ---
  const themeSwitch = document.getElementById('theme-switch');
  const html = document.documentElement;

  // Check saved preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
  }

  themeSwitch.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // --- Menu Toggle ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // --- Scroll Reveals ---
  function splitWords(heading) {
    const text = heading.textContent.trim();
    heading.setAttribute('aria-label', text);
    heading.textContent = '';
    text.split(/\s+/).forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      outer.appendChild(inner);
      heading.append(outer, ' ');
    });
  }

  function tag(selector, type, staggerBy) {
    document.querySelectorAll(selector).forEach(el => {
      el.dataset.reveal = type;
      if (staggerBy === 'sibling') {
        el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentElement.children, el));
      }
    });
  }

  let revealObserver = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.querySelectorAll('.section-heading').forEach(splitWords);
    tag('.section-heading', 'words');
    tag('.about-text p', 'text', 'sibling');
    tag('.experience-intro, .contact-content .text-large', 'text');
    tag('.photo-frame, .portfolio-item', 'image');
    tag('.exp-item', 'card');
    tag('.skills-grid, .contact-links', 'stagger');
    document.querySelectorAll('.skills-grid > *, .contact-links > *').forEach(el => {
      el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentElement.children, el));
    });
    document.documentElement.classList.add('reveal-ready');

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // Photos in the same grid row enter together; stagger them left to right
        if (el.classList.contains('portfolio-item')) {
          el.style.setProperty('--i', Math.round(el.offsetLeft / (el.offsetWidth || 1)));
        }
        el.classList.add('in-view');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  }

  // Called once the loading intro has cleared, so nothing animates behind it
  function startReveals() {
    if (!revealObserver) return;
    document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
  }

  // --- Smooth Scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
