/* ==========================================================================
   GAMEBROS — Catálogo unificado: subsecciones, filtros instantáneos y orden
   ========================================================================== */
(function () {
  'use strict';

  var products = window.GAMEBROS_PRODUCTS || [];
  var GB = window.GameBros || {};
  var categories = window.GAMEBROS_CATEGORIES || {};
  var MAX_PRICE = 4500000;
  var DEFAULT_STATE = {
    category: 'todos',
    q: '',
    min: 0,
    max: MAX_PRICE,
    types: [],
    states: [],
    sort: 'relevance'
  };
  var state = Object.assign({}, DEFAULT_STATE, { types: [], states: [] });

  var grid = document.querySelector('#catalogGrid');
  var countEl = document.querySelector('#catalogCount');
  var titleEl = document.querySelector('#catalogTitleSpan');
  var crumbEl = document.querySelector('#crumbActive');
  var chipsEl = document.querySelector('#activeFilters');
  var sortEl = document.querySelector('#catalogSort');
  var minEl = document.querySelector('#priceMin');
  var maxEl = document.querySelector('#priceMax');
  var rangeEl = document.querySelector('#priceRange');
  var emptyEl = document.querySelector('#catalogEmpty');
  var subnavEl = document.querySelector('#catalogSubnav');

  if (!grid) return;

  var categoryLabels = {
    todos: 'Todos',
    playstation: 'PlayStation',
    xbox: 'Xbox',
    switch: 'Switch',
    accesorios: 'Accesorios',
    combos: 'Combos'
  };

  function money(value) { return '$' + Math.round(Number(value) || 0).toLocaleString('es-CO'); }

  function readURL() {
    var params = new URLSearchParams(window.location.search);
    var cat = (params.get('categoria') || '').toLowerCase();
    if (categoryLabels[cat]) state.category = cat;
    state.q = (params.get('q') || '').trim();
    var estado = (params.get('estado') || '').toLowerCase();
    if (estado === 'promo') state.states = ['promo'];
    if (estado === 'stock') state.states = ['stock'];
  }

  function writeURL() {
    var params = new URLSearchParams();
    if (state.category !== 'todos') params.set('categoria', state.category);
    if (state.q) params.set('q', state.q);
    if (state.states.length === 1 && state.states[0] === 'promo') params.set('estado', 'promo');
    if (state.states.length === 1 && state.states[0] === 'stock') params.set('estado', 'stock');
    var qs = params.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '');
    try { window.history.replaceState(null, '', url); } catch (err) { /* file:// may block */ }
  }

  function matches(p) {
    if (state.category === 'combos') {
      if (p.type !== 'Combo') return false;
    } else if (state.category !== 'todos' && p.category !== state.category) {
      return false;
    }
    if (state.q) {
      var hay = (p.name + ' ' + p.sku + ' ' + p.type + ' ' + (categories[p.category] || '')).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    if (p.price < state.min || p.price > state.max) return false;
    if (state.types.length && state.types.indexOf(p.type) === -1) return false;
    if (state.states.indexOf('stock') !== -1 && !p.stock) return false;
    if (state.states.indexOf('promo') !== -1 && !p.oldPrice) return false;
    return true;
  }

  function sortList(list) {
    var copy = list.slice();
    switch (state.sort) {
      case 'price-asc': copy.sort(function (a, b) { return a.price - b.price; }); break;
      case 'price-desc': copy.sort(function (a, b) { return b.price - a.price; }); break;
      case 'name-asc': copy.sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); }); break;
      case 'discount-desc': copy.sort(function (a, b) { return b.discount - a.discount; }); break;
      default: break;
    }
    return copy;
  }

  function updateCounts() {
    var counts = { todos: products.length, playstation: 0, xbox: 0, switch: 0, accesorios: 0, combos: 0 };
    products.forEach(function (p) {
      counts[p.category] = (counts[p.category] || 0) + 1;
      if (p.type === 'Combo') counts.combos++;
    });
    document.querySelectorAll('[data-cat-count]').forEach(function (el) {
      var key = el.getAttribute('data-cat-count');
      el.textContent = counts[key] || 0;
    });
    document.querySelectorAll('[data-type-count]').forEach(function (el) {
      var type = el.getAttribute('data-type-count');
      el.textContent = products.filter(function (p) { return p.type === type; }).length;
    });
    document.querySelectorAll('[data-state-count]').forEach(function (el) {
      var key = el.getAttribute('data-state-count');
      el.textContent = products.filter(function (p) {
        if (key === 'stock') return p.stock;
        if (key === 'promo') return !!p.oldPrice;
        return false;
      }).length;
    });
  }

  function renderChips() {
    if (!chipsEl) return;
    var chips = [];
    if (state.category !== 'todos') {
      chips.push('<span class="filter-chip">Categoría: ' + categoryLabels[state.category] +
        '<button type="button" data-remove="category" aria-label="Quitar filtro de categoría"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></span>');
    }
    if (state.q) {
      chips.push('<span class="filter-chip">Búsqueda: ' + GB.escapeHtml(state.q) +
        '<button type="button" data-remove="q" aria-label="Quitar búsqueda"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></span>');
    }
    if (state.min > 0 || state.max < MAX_PRICE) {
      chips.push('<span class="filter-chip">Precio: ' + money(state.min) + ' – ' + money(state.max) +
        '<button type="button" data-remove="price" aria-label="Quitar filtro de precio"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></span>');
    }
    state.types.forEach(function (type) {
      chips.push('<span class="filter-chip">' + GB.escapeHtml(type) +
        '<button type="button" data-remove="type:' + GB.escapeHtml(type) + '" aria-label="Quitar filtro ' + GB.escapeHtml(type) + '"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></span>');
    });
    state.states.forEach(function (s) {
      var label = s === 'stock' ? 'En Stock' : 'En Promoción';
      chips.push('<span class="filter-chip">' + label +
        '<button type="button" data-remove="state:' + s + '" aria-label="Quitar filtro ' + label + '"><svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button></span>');
    });
    chipsEl.innerHTML = chips.join('');
    chipsEl.hidden = chips.length === 0;
  }

  function render() {
    var list = sortList(products.filter(matches));
    grid.innerHTML = list.map(function (p) { return GB.productCard(p); }).join('');

    var total = products.length;
    if (countEl) {
      countEl.innerHTML = 'Mostrando <strong>' + list.length + '</strong> de <strong>' + total + '</strong> productos';
    }
    if (emptyEl) {
      emptyEl.hidden = list.length !== 0;
    }

    var label = categoryLabels[state.category] || 'Todos';
    if (titleEl) titleEl.textContent = '> ' + label;
    if (crumbEl) crumbEl.textContent = label;
    document.title = 'Catálogo ' + label + ' | GameBros';

    document.querySelectorAll('[data-category]').forEach(function (el) {
      var active = el.getAttribute('data-category') === state.category;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (subnavEl) {
      var links = ['todos', 'playstation', 'xbox', 'switch', 'accesorios', 'combos'];
      subnavEl.innerHTML = '<strong>Catálogo &gt;</strong> ' + links.map(function (key) {
        if (key === state.category) return '<strong>' + categoryLabels[key] + '</strong>';
        return '<a href="catalogo.html' + (key === 'todos' ? '' : '?categoria=' + key) + '" data-category="' + key + '">' + categoryLabels[key] + '</a>';
      }).join(' <span>|</span> ');
    }

    renderChips();
    writeURL();
  }

  function syncInputs() {
    if (minEl) minEl.value = state.min;
    if (maxEl) maxEl.value = state.max;
    if (rangeEl) rangeEl.value = state.max;
    document.querySelectorAll('input[data-type]').forEach(function (input) {
      input.checked = state.types.indexOf(input.value) !== -1;
    });
    document.querySelectorAll('input[data-state]').forEach(function (input) {
      input.checked = state.states.indexOf(input.value) !== -1;
    });
  }

  function resetAll() {
    state = Object.assign({}, DEFAULT_STATE, { types: [], states: [] });
    document.querySelectorAll('input[data-type]').forEach(function (i) { i.checked = false; });
    document.querySelectorAll('input[data-state]').forEach(function (i) { i.checked = false; });
    if (sortEl) sortEl.value = 'relevance';
    syncInputs();
    render();
  }

  /* ------------------------------ Events ------------------------------- */
  document.addEventListener('click', function (e) {
    var cat = e.target.closest('[data-category]');
    if (cat) {
      e.preventDefault();
      var value = cat.getAttribute('data-category');
      if (categoryLabels[value]) {
        state.category = value;
        render();
        var anchor = document.querySelector('.catalog-catbar');
        if (anchor) {
          var y = anchor.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }
      return;
    }

    var remove = e.target.closest('[data-remove]');
    if (remove) {
      e.preventDefault();
      var key = remove.getAttribute('data-remove');
      if (key === 'category') state.category = 'todos';
      else if (key === 'q') state.q = '';
      else if (key === 'price') { state.min = 0; state.max = MAX_PRICE; syncInputs(); }
      else if (key.indexOf('type:') === 0) {
        var type = key.slice(5);
        state.types = state.types.filter(function (t) { return t !== type; });
        var cb = document.querySelector('input[data-type][value="' + type + '"]');
        if (cb) cb.checked = false;
      } else if (key.indexOf('state:') === 0) {
        var s = key.slice(6);
        state.states = state.states.filter(function (v) { return v !== s; });
        var sb = document.querySelector('input[data-state][value="' + s + '"]');
        if (sb) sb.checked = false;
      }
      render();
      return;
    }

    if (e.target.closest('#emptyClear') || e.target.closest('#clearFilters')) {
      e.preventDefault();
      resetAll();
    }
  });

  if (sortEl) {
    sortEl.addEventListener('change', function () {
      state.sort = sortEl.value;
      render();
    });
  }

  var priceTimer = null;
  function onPriceChange() {
    var min = Math.max(0, Number(minEl && minEl.value) || 0);
    var max = Math.max(0, Number(maxEl && maxEl.value) || 0);
    if (max === 0) max = MAX_PRICE;
    if (min > max) { var tmp = min; min = max; max = tmp; }
    state.min = min;
    state.max = max;
    if (rangeEl) rangeEl.value = max;
    window.clearTimeout(priceTimer);
    priceTimer = window.setTimeout(render, 160);
  }

  if (minEl) minEl.addEventListener('input', onPriceChange);
  if (maxEl) maxEl.addEventListener('input', onPriceChange);
  if (rangeEl) {
    rangeEl.addEventListener('input', function () {
      if (maxEl) maxEl.value = rangeEl.value;
      onPriceChange();
    });
  }

  document.querySelectorAll('input[data-type]').forEach(function (input) {
    input.addEventListener('change', function () {
      state.types = Array.prototype.slice.call(document.querySelectorAll('input[data-type]:checked')).map(function (i) { return i.value; });
      render();
    });
  });

  document.querySelectorAll('input[data-state]').forEach(function (input) {
    input.addEventListener('change', function () {
      state.states = Array.prototype.slice.call(document.querySelectorAll('input[data-state]:checked')).map(function (i) { return i.value; });
      render();
    });
  });

  document.querySelectorAll('[data-collapse]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.filter-group');
      if (group) group.classList.toggle('is-collapsed');
      btn.setAttribute('aria-expanded', group && group.classList.contains('is-collapsed') ? 'false' : 'true');
    });
  });

  /* ------------------------------- Init -------------------------------- */
  readURL();
  syncInputs();
  updateCounts();
  render();
})();
