
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Story Panels ---
  // Each labelled section moves into a full-screen dialog that grows out of its
  // blob. Runs first so everything below sees the final DOM.
  const cursor = document.getElementById('cursor-follower');
  const panels = {};
  const panelList = [];

  if (typeof HTMLDialogElement === 'function') {
    document.querySelectorAll('.blob-label').forEach((label, i) => {
      const id = label.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      const blob = document.querySelector('.blob-' + label.dataset.blob);
      if (!section || !blob) return;

      const dialog = document.createElement('dialog');
      dialog.className = 'panel';
      dialog.setAttribute('aria-label', label.textContent.trim());
      dialog.innerHTML =
        '<div class="panel-wash"></div>' +
        '<div class="panel-surface"></div>' +
        '<button type="button" class="panel-close" aria-label="Close">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<div class="panel-scroll"></div>';
      dialog.querySelector('.panel-scroll').appendChild(section);
      document.body.appendChild(dialog);

      label.style.setProperty('--i', i);
      const panel = {
        id, label, blob, section, dialog,
        wash: dialog.querySelector('.panel-wash'),
        surface: dialog.querySelector('.panel-surface'),
        scroller: dialog.querySelector('.panel-scroll')
      };
      panels[id] = panel;
      panelList.push(panel);
    });

    const footer = document.querySelector('.site-footer');
    if (footer && panels.contact) panels.contact.scroller.appendChild(footer);

    if (panelList.length) document.documentElement.classList.add('panels-ready');
  }

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

    const glides = reduceMotion ? [] :
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
      document.body.classList.add('labels-live');
      blobsLive = true;
      const linked = panels[location.hash.slice(1)];
      if (linked) openPanel(linked.id, { pushHistory: false });
    });
  }

  window.addEventListener('load', () => {
    const elapsed = performance.now() - loaderStart;
    setTimeout(revealSite, Math.max(0, MIN_LOADER_TIME - elapsed));
  });

  // Fallback in case the load event stalls (e.g. a hanging image request)
  setTimeout(revealSite, 7000);

  // --- Custom Cursor Follower ---
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

  const POINTER_TARGETS = 'a, button, .theme-switch, .portfolio-item, .skill-tag';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest && e.target.closest(POINTER_TARGETS)) cursor.classList.add('pointer');
  });
  document.addEventListener('pointerout', (e) => {
    const target = e.target.closest && e.target.closest(POINTER_TARGETS);
    if (target && !target.contains(e.relatedTarget)) cursor.classList.remove('pointer');
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

  function closeMenu() {
    menuToggle.classList.remove('active');
    navMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
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

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.querySelectorAll('.section-heading').forEach(splitWords);
    tag('.section-heading', 'words');
    tag('.about-text p', 'text', 'sibling');
    tag('.contact-content .text-large', 'text');
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

  // Called once the loading intro has cleared, so nothing animates behind it.
  // Panel content is observed separately, each time its panel opens.
  function startReveals() {
    if (!revealObserver) return;
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (!el.closest('dialog.panel')) revealObserver.observe(el);
    });
  }

  function revealPanelContent(panel) {
    if (!revealObserver) return;
    panel.section.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
  }

  function resetPanelContent(panel) {
    if (!revealObserver) return;
    panel.section.querySelectorAll('[data-reveal]').forEach(el => {
      revealObserver.unobserve(el);
      el.classList.remove('in-view');
    });
  }

  // --- Blob Labels ---
  // Labels can't live inside the blobs (the gooey filter would melt the text),
  // so each frame they're moved to their blob's current center. This keeps
  // running while a panel is open: the blobs keep drifting underneath, and the
  // closing wave uncovers the labels before it finishes.
  function trackLabels() {
    for (const panel of panelList) {
      const r = panel.blob.getBoundingClientRect();
      panel.label.style.transform =
        `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(trackLabels);
  }

  panelList.forEach(({ label, blob }) => {
    const hold = () => blob.classList.add('is-hovered');
    const release = () => blob.classList.remove('is-hovered');
    label.addEventListener('pointerenter', hold);
    label.addEventListener('pointerleave', release);
    label.addEventListener('focus', hold);
    label.addEventListener('blur', release);
  });

  // --- Opening & Closing Panels ---
  const OPEN_MS = 800;
  const SURFACE_LAG_MS = 180;
  const CONTENT_IN_MS = 700;
  const CLOSE_MS = 700;
  const EASE_IN_OUT = 'cubic-bezier(0.7, 0, 0.2, 1)';
  const BLOB_OPACITY = 0.6;

  let activePanel = null;
  let busy = false;
  let closeQueued = false;

  function blobCircle(blob) {
    const r = blob.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  }

  function circle(radius, c) {
    return `circle(${radius}px at ${c.x}px ${c.y}px)`;
  }

  // Radius that reaches the farthest corner of the screen from the blob
  function coverRadius(c) {
    return Math.hypot(Math.max(c.x, innerWidth - c.x), Math.max(c.y, innerHeight - c.y));
  }

  function stopPanelAnimations(panel) {
    panel.wash.getAnimations().forEach(a => a.cancel());
    panel.surface.getAnimations().forEach(a => a.cancel());
  }

  function openPanel(id, { pushHistory = true } = {}) {
    const panel = panels[id];
    if (!panel || busy || activePanel === panel || !revealed) return;
    if (activePanel) {
      // Switching sections: shrink the current one into its blob, then grow the next
      if (pushHistory) history.pushState({ panel: id }, '', '#' + id);
      closePanel({ then: () => openPanel(id, { pushHistory: false }) });
      return;
    }

    busy = true;
    activePanel = panel;
    const c = blobCircle(panel.blob);
    const cover = circle(coverRadius(c), c);

    panel.dialog.style.setProperty('--panel-wash', getComputedStyle(panel.blob).backgroundColor);
    panel.dialog.appendChild(cursor);
    panel.dialog.showModal();
    panel.scroller.scrollTop = 0;
    if (pushHistory) history.pushState({ panel: id }, '', '#' + id);

    const showContent = () => {
      panel.dialog.classList.add('content-in');
      revealPanelContent(panel);
    };
    const settle = () => {
      stopPanelAnimations(panel); // no clip-path at rest, so resizing can't expose gaps
      busy = false;
      if (closeQueued) {
        closeQueued = false;
        closePanel();
      } else {
        catchUpWithUrl();
      }
    };

    if (reduceMotion) {
      showContent();
      settle();
      return;
    }

    panel.wash.animate(
      { clipPath: [circle(c.r, c), cover], opacity: [BLOB_OPACITY, 1] },
      { duration: OPEN_MS, easing: EASE_IN_OUT, fill: 'both' }
    );
    panel.surface.animate(
      { clipPath: [circle(0, c), cover] },
      { duration: OPEN_MS, delay: SURFACE_LAG_MS, easing: EASE_IN_OUT, fill: 'both' }
    ).finished.then(settle, () => {});
    setTimeout(showContent, CONTENT_IN_MS);
  }

  function closePanel({ instant = false, then = null } = {}) {
    const panel = activePanel;
    if (!panel) return;
    if (busy && !instant) {
      closeQueued = true;
      return;
    }

    const finish = () => {
      stopPanelAnimations(panel);
      panel.dialog.classList.remove('content-in');
      panel.dialog.close();
      document.body.appendChild(cursor);
      resetPanelContent(panel);
      panel.blob.classList.remove('is-hovered');
      activePanel = null;
      busy = false;
      if (then) then();
      else catchUpWithUrl();
    };

    if (instant || reduceMotion) {
      finish();
      return;
    }

    // Shrink back into wherever the blob has drifted to by now
    busy = true;
    const c = blobCircle(panel.blob);
    const cover = circle(coverRadius(c), c);
    panel.dialog.classList.remove('content-in');
    stopPanelAnimations(panel);

    panel.surface.animate(
      { clipPath: [cover, circle(0, c)] },
      { duration: CLOSE_MS - SURFACE_LAG_MS, delay: 150, easing: EASE_IN_OUT, fill: 'both' }
    );
    panel.wash.animate(
      { clipPath: [cover, circle(c.r, c)], opacity: [1, BLOB_OPACITY] },
      { duration: CLOSE_MS, delay: 150 + SURFACE_LAG_MS / 2, easing: EASE_IN_OUT, fill: 'both' }
    ).finished.then(finish, finish);
  }

  // Closing goes through history when the panel added an entry, so the
  // browser's back button and the close button behave the same way.
  function requestClose() {
    if (!activePanel) return;
    if (history.state && history.state.panel === activePanel.id) {
      history.back();
    } else {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      closePanel();
    }
  }

  panelList.forEach(panel => {
    panel.dialog.querySelector('.panel-close').addEventListener('click', requestClose);
    panel.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      requestClose();
    });
  });

  // Make the open panel match the address bar. Back/forward presses that land
  // mid-animation are caught up once the animation settles.
  let urlChangedWhileBusy = false;

  function syncWithUrl() {
    const target = panels[location.hash.slice(1)];
    if (target) {
      if (activePanel !== target) openPanel(target.id, { pushHistory: false });
    } else if (activePanel) {
      closePanel();
    }
  }

  function catchUpWithUrl() {
    if (!urlChangedWhileBusy) return;
    urlChangedWhileBusy = false;
    syncWithUrl();
  }

  window.addEventListener('popstate', () => {
    if (busy) urlChangedWhileBusy = true;
    else syncWithUrl();
  });

  if (panelList.length) requestAnimationFrame(trackLabels);

  // --- In-page Links ---
  // Links to a panel open it; other hash links scroll smoothly as before.
  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    e.preventDefault();
    closeMenu();

    if (panels[id]) {
      openPanel(id);
    } else if (activePanel) {
      requestClose();
    } else {
      const target = document.getElementById(id);
      if (target) {
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });

})();
