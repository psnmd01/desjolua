/* site.js — vanilla JS: nav toggle, lightbox, reveal observer, form validation */

(function () {
  'use strict';

  /* ===== HEADER SCROLL ===== */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.setAttribute('data-scrolled', window.scrollY > 0 ? 'true' : 'false');
    }, { passive: true });
  }

  /* ===== MOBILE NAV ===== */
  var toggles = document.querySelectorAll('.nav-toggle');
  var drawer = document.querySelector('.nav-mobile');
  if (toggles.length && drawer) {
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var open = drawer.classList.contains('is-open');
        toggles.forEach(function (t) { t.setAttribute('aria-expanded', !open); });
        drawer.classList.toggle('is-open', !open);
        document.body.style.overflow = open ? '' : 'hidden';
      });
    });
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ===== REVEAL ON SCROLL ===== */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && window.IntersectionObserver) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { obs.observe(el); });
  }

  /* ===== LIGHTBOX ===== */
  var lb = document.querySelector('.lightbox');
  if (lb) {

    var lbImg = lb.querySelector('.lightbox__media');
    var lbTitle = lb.querySelector('.lightbox__caption-title');
    var lbMeta = lb.querySelector('.lightbox__caption-meta');
    var lbClose = lb.querySelector('.lightbox__close');
    var lbPrev = lb.querySelector('.lightbox__prev');
    var lbNext = lb.querySelector('.lightbox__next');

    var artworks = [];
    var currentIdx = -1;

    function collectArtworks() {
      artworks = [];
      var links = document.querySelectorAll('.artwork-card__link[data-lightbox]');
      links.forEach(function (link, i) {
        artworks.push({
          index: i,
          src: link.getAttribute('data-full') || link.getAttribute('href'),
          title: link.getAttribute('data-title') || '',
          meta: link.getAttribute('data-meta') || '',
          element: link
        });
      });
    }

    function openLightbox(idx) {
      collectArtworks();
      if (idx < 0 || idx >= artworks.length) return;
      currentIdx = idx;
      var a = artworks[idx];
      lbImg.src = a.src;
      lbImg.alt = a.title;
      lbTitle.textContent = a.title;
      lbMeta.textContent = a.meta;
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lb.setAttribute('aria-hidden', 'false');
      lbClose.focus();
      try { history.pushState({ lightbox: idx }, '', '?oeuvre=' + (a.src.match(/img-\d+|ig-\d+/)?.[0] || idx)); } catch(e) {}
    }

    function closeLightbox() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      lb.setAttribute('aria-hidden', 'true');
      if (currentIdx >= 0 && artworks[currentIdx]) {
        artworks[currentIdx].element.focus();
      }
      currentIdx = -1;
      try { history.pushState(null, '', window.location.pathname); } catch(e) {}
    }

    function navigate(delta) {
      if (!artworks.length) collectArtworks();
      if (!artworks.length) return;
      var next = (currentIdx + delta + artworks.length) % artworks.length;
      openLightbox(next);
    }

    /* Delegate: click on artwork-card__link */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.artwork-card__link[data-lightbox]');
      if (!link) return;
      e.preventDefault();
      collectArtworks();
      var idx = artworks.findIndex(function (a) { return a.element === link; });
      openLightbox(idx >= 0 ? idx : 0);
    });

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { navigate(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { navigate(1); });

    /* Click overlay backdrop to close */
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });

    /* Keyboard nav */
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeLightbox(); }
      if (e.key === 'ArrowLeft') { navigate(-1); }
      if (e.key === 'ArrowRight') { navigate(1); }
      /* Focus trap */
      if (e.key === 'Tab') {
        var focusable = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

  }

  /* ===== FILTER CHIPS (galerie) ===== */
  var filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.filter-chip');
      if (!chip) return;
      e.preventDefault();
      var filter = chip.getAttribute('data-filter');
      /* Update active chip */
      filterBar.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      /* Filter cards */
      document.querySelectorAll('.artwork-card').forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-category').split(' ').includes(filter)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  /* ===== HELPERS: show/hide field error ===== */
  function showFieldError(field) {
    var ff = field.closest('.form-field');
    if (ff) {
      var err = ff.querySelector('.field-error');
      if (err) err.style.display = 'block';
    }
  }

  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    var ff = field.closest('.form-field');
    if (ff) {
      var err = ff.querySelector('.field-error');
      if (err) err.style.display = '';
    }
  }

  /* ===== FORM VALIDATION ===== */
  document.querySelectorAll('.form').forEach(function (form) {
    form.setAttribute('novalidate', '');
    /* Error summary div — inject if missing */
    var summary = form.querySelector('.form-error-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'form-error-summary';
      summary.setAttribute('role', 'alert');
      summary.textContent = 'Veuillez corriger les champs indiqués.';
      form.insertBefore(summary, form.firstChild);
    }

    form.addEventListener('submit', function (e) {
      var valid = true;
      /* Reset all errors first */
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
      form.querySelectorAll('.field-error').forEach(function (er) { er.style.display = ''; });

      var processedRadios = [];
      form.querySelectorAll('[required]').forEach(function (field) {
        var value = field.value.trim();

        if (field.type === 'radio') {
          var rname = field.name;
          if (processedRadios.indexOf(rname) !== -1) return;
          processedRadios.push(rname);
          var anyChecked = false;
          form.querySelectorAll('input[type=radio][name="' + rname + '"]').forEach(function (r) {
            if (r.checked) anyChecked = true;
          });
          if (!anyChecked) {
            field.setAttribute('aria-invalid', 'true');
            showFieldError(field);
            valid = false;
          }
          return;
        }

        if (field.type === 'checkbox') {
          if (!field.checked) {
            field.setAttribute('aria-invalid', 'true');
            showFieldError(field);
            valid = false;
          }
          return;
        }

        if (!value) {
          field.setAttribute('aria-invalid', 'true');
          showFieldError(field);
          valid = false;
        }
        /* Email validation */
        if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          field.setAttribute('aria-invalid', 'true');
          showFieldError(field);
          valid = false;
        }
      });

      if (!valid) {
        e.preventDefault();
        summary.style.display = 'block';
        var firstError = form.querySelector('[aria-invalid="true"]');
        if (firstError) firstError.focus();
        return;
      }

      summary.style.display = '';
      e.preventDefault();
      /* Build mailto */
      var fields = form.querySelectorAll('[name]');
      var bodyParts = [];
      var subject = '';
      fields.forEach(function (f) {
        var name = f.getAttribute('name');
        var val = '';
        if (f.type === 'radio') {
          if (f.checked) val = f.value;
        } else if (f.type === 'checkbox') {
          return;
        } else if (f.type === 'file') {
          return;
        } else if (f.tagName === 'SELECT') {
          val = f.options[f.selectedIndex].text;
        } else {
          val = f.value.trim();
        }
        if (!val) return;
        bodyParts.push(name.charAt(0).toUpperCase() + name.slice(1) + ': ' + val);
        if (!subject && (name === 'sujet' || name === 'oeuvre' || name === 'type-projet')) {
          subject = val;
        }
      });
      var body = bodyParts.join('\n');
      if (!subject) subject = document.title.split(' — ')[0].trim();
      var mailto = 'mailto:mounadakkakart@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      /* Show confirmation */
      var confirmDiv = form.querySelector('.form-confirmation');
      if (!confirmDiv) {
        confirmDiv = document.createElement('div');
        confirmDiv.className = 'form-confirmation';
        form.appendChild(confirmDiv);
      }
      confirmDiv.textContent = 'Message prêt à envoyer via votre client mail.';
      confirmDiv.style.display = 'block';
      window.location.href = mailto;
    });

    /* Clear errors on input */
    form.addEventListener('input', function (e) {
      var field = e.target;
      if (field.hasAttribute('aria-invalid')) {
        clearFieldError(field);
      }
      /* Hide summary if no field-level errors remain */
      if (!form.querySelector('[aria-invalid="true"]')) {
        summary.style.display = '';
      }
    });
  });
})();
