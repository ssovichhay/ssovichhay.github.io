
(function () {
  'use strict';

  // --- Loading Intro ---
  const MIN_LOADER_TIME = 1900; // keep the intro on screen long enough to breathe
  const BLOB_RETURN_TIME = 1600; // slightly longer than the blobs-return transition in CSS
  const loaderStart = performance.now();
  let revealed = false;
  let blobsLive = false;

  document.body.classList.add('is-loading');

  function revealSite() {
    if (revealed) return;
    revealed = true;
    document.body.classList.remove('is-loading');
    document.body.classList.add('site-revealed', 'blobs-return');
    setTimeout(() => {
      document.body.classList.remove('blobs-return');
      blobsLive = true;
    }, BLOB_RETURN_TIME);
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

  // --- Scroll Animations (Intersection Observer) ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe experience items, portfolio items
  document.querySelectorAll('.exp-item, .portfolio-item').forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.08 + 's';
    observer.observe(el);
  });

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
