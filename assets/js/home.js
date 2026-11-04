/* ==========================================================================
   GAMEBROS — Home: hero slider + estanterías de productos + carrusel
   ========================================================================== */
(function () {
  'use strict';

  var products = window.GAMEBROS_PRODUCTS || [];
  var GB = window.GameBros || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------- Render shelves --------------------------- */
  function renderShelf(selector, list) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = list.map(function (p) { return GB.productCard(p); }).join('');
  }

  var featured = products.filter(function (p) { return p.featured; }).slice(0, 8);
  var recent = products.filter(function (p) { return p.recent; }).slice(0, 8);

  renderShelf('#bestSellersGrid', featured);
  renderShelf('#trendingTrack', recent);

  /* ----------------------------- Hero slider ---------------------------- */
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;

  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero__slide'));
  var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero__dot'));
  var prev = hero.querySelector('[data-hero-prev]');
  var next = hero.querySelector('[data-hero-next]');
  var progress = hero.querySelector('.hero__progress span');
  var current = -1;
  var timer = null;
  var paused = false;

  function restartProgress() {
    if (!progress) return;
    progress.style.animation = 'none';
    /* force reflow so the animation restarts */
    void progress.offsetWidth;
    progress.style.animation = reduceMotion ? 'none' : 'heroProgress 5s linear forwards';
  }

  function go(index, fromUser) {
    var target = (index + slides.length) % slides.length;
    if (target === current && slides[current].classList.contains('is-active')) {
      if (fromUser) restartTimer();
      return;
    }
    slides.forEach(function (slide, i) {
      var active = i === target;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach(function (dot, i) {
      var active = i === target;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      dot.setAttribute('tabindex', active ? '0' : '-1');
    });
    current = target;
    restartProgress();
    if (fromUser) restartTimer();
  }

  function nextSlide() { go(current + 1); }
  function prevSlide() { go(current - 1); }

  function startTimer() {
    stopTimer();
    if (reduceMotion) return;
    timer = window.setInterval(function () {
      if (!paused && !document.hidden) nextSlide();
    }, 5000);
  }

  function stopTimer() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  function pause() {
    paused = true;
    hero.classList.add('is-paused');
  }

  function resume() {
    paused = false;
    hero.classList.remove('is-paused');
  }

  if (next) next.addEventListener('click', function () { go(current + 1, true); });
  if (prev) prev.addEventListener('click', function () { go(current - 1, true); });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      go(Number(dot.getAttribute('data-slide')) || 0, true);
    });
  });

  hero.addEventListener('mouseenter', pause);
  hero.addEventListener('mouseleave', resume);
  hero.addEventListener('focusin', pause);
  hero.addEventListener('focusout', function (e) {
    if (!hero.contains(e.relatedTarget)) resume();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause(); else resume();
  });

  hero.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); restartTimer(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); restartTimer(); }
  });

  /* Touch / pointer swipe */
  var startX = null;
  var startY = null;
  hero.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX;
    startY = e.clientY;
  }, { passive: true });
  hero.addEventListener('pointerup', function (e) {
    if (startX == null) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    startX = null;
    startY = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide(); else prevSlide();
      restartTimer();
    }
  }, { passive: true });

  /* Inicializa */
  go(0);
  startTimer();

  /* -------------------------- Trending carousel ------------------------- */
  var track = document.querySelector('#trendingTrack');
  var prevBtn = document.querySelector('[data-carousel-prev]');
  var nextBtn = document.querySelector('[data-carousel-next]');

  if (track && prevBtn && nextBtn) {
    function step() {
      var card = track.querySelector('.product-card');
      if (!card) return track.clientWidth * 0.8;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || 18) || 18;
      return card.getBoundingClientRect().width + gap;
    }

    function updateButtons() {
      var maxScroll = track.scrollWidth - track.clientWidth - 2;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  }
})();
