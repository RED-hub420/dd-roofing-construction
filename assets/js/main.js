/* ============================================================
   D&D Roofing & Construction — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Footer year
     ---------------------------------------------------------- */
  var yearEls = document.querySelectorAll('#footer-year');
  yearEls.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ----------------------------------------------------------
     Sticky header scroll class
     ---------------------------------------------------------- */
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     Mobile nav toggle
     ---------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav   = document.getElementById('main-nav');

  function closeNav() {
    if (!mainNav) return;
    mainNav.classList.remove('open');
    if (navToggle) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('click', function (e) {
      if (
        mainNav.classList.contains('open') &&
        !mainNav.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeNav();
      }
    });
  }

  /* ----------------------------------------------------------
     Gallery filter
     ---------------------------------------------------------- */
  var filterBtns   = document.querySelectorAll('.filter-btn');
  var galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        galleryItems.forEach(function (item) {
          if (filter === 'all' || item.getAttribute('data-category') === filter) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Lightbox
     ---------------------------------------------------------- */
  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lightbox-img');
  var lbCaption = document.getElementById('lightbox-caption');
  var lbClose   = document.getElementById('lightbox-close');
  var lbPrev    = document.getElementById('lightbox-prev');
  var lbNext    = document.getElementById('lightbox-next');

  var openItems    = [];
  var currentIndex = 0;

  function getVisibleItems() {
    return Array.from(galleryItems).filter(function (item) {
      return !item.classList.contains('hidden');
    });
  }

  function showSlide(idx) {
    var item    = openItems[idx];
    if (!item) return;
    var img     = item.querySelector('img');
    var caption = item.querySelector('.gallery-item-caption');
    var cat     = item.querySelector('.gallery-item-cat');

    if (lbImg && img) {
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
    }
    if (lbCaption) {
      var catText     = cat     ? cat.textContent.trim()     : '';
      var captionText = caption ? caption.textContent.trim() : '';
      lbCaption.textContent = catText && captionText
        ? catText + ' \u2014 ' + captionText
        : captionText || catText;
    }
  }

  function openLightbox(visibleIndex) {
    openItems    = getVisibleItems();
    if (!openItems.length) return;
    currentIndex = visibleIndex;
    showSlide(currentIndex);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    if (lbImg) { lbImg.src = ''; }
  }

  if (lightbox && lbImg) {
    galleryItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var visible = getVisibleItems();
        var idx     = visible.indexOf(item);
        if (idx !== -1) openLightbox(idx);
      });
    });

    if (lbClose) {
      lbClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    if (lbPrev) {
      lbPrev.addEventListener('click', function () {
        currentIndex = (currentIndex - 1 + openItems.length) % openItems.length;
        showSlide(currentIndex);
      });
    }

    if (lbNext) {
      lbNext.addEventListener('click', function () {
        currentIndex = (currentIndex + 1) % openItems.length;
        showSlide(currentIndex);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + openItems.length) % openItems.length;
        showSlide(currentIndex);
      } else if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % openItems.length;
        showSlide(currentIndex);
      }
    });
  }

  /* ----------------------------------------------------------
     Active nav link — highlight current page
     ---------------------------------------------------------- */
  var navLinks    = document.querySelectorAll('.main-nav a');
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    var href = (link.getAttribute('href') || '').split('#')[0];
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

})();
