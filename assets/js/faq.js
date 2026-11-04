/* ==========================================================================
   GAMEBROS — FAQ: acordeones, búsqueda y navegación interna
   ========================================================================== */
(function () {
  'use strict';

  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  var search = document.querySelector('#faqSearch');
  var empty = document.querySelector('#faqEmpty');
  var groups = Array.prototype.slice.call(document.querySelectorAll('.faq-group'));

  /* Un solo acordeón abierto por grupo (sin romper el modo no-JS). */
  items.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      var group = item.closest('.faq-group');
      if (!group) return;
      Array.prototype.slice.call(group.querySelectorAll('.faq-item')).forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* Búsqueda instantánea de preguntas. */
  function normalize(str) {
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function filterFaq() {
    var q = normalize(search ? search.value.trim() : '');
    var totalVisible = 0;

    groups.forEach(function (group) {
      var groupItems = Array.prototype.slice.call(group.querySelectorAll('.faq-item'));
      var visible = 0;
      groupItems.forEach(function (item) {
        var text = normalize(item.textContent);
        var show = !q || text.indexOf(q) !== -1;
        item.hidden = !show;
        if (show) visible++;
      });
      group.hidden = visible === 0;
      totalVisible += visible;
    });

    if (empty) empty.classList.toggle('is-visible', totalVisible === 0);
  }

  if (search) {
    search.addEventListener('input', filterFaq);
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { search.value = ''; filterFaq(); }
    });
  }

  /* Cierra el resto al abrir uno desde el índice lateral. */
  document.querySelectorAll('.faq-nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
