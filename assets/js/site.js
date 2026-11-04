/* ==========================================================================
   GAMEBROS — interacciones compartidas: header, carrito, quick view, toasts
   ========================================================================== */
(function () {
  'use strict';

  var CART_KEY = 'gamebros_cart_v2';
  var WA_NUMBER = '573105550134';
  var SHIPPING_FREE_FROM = 300000;
  var SHIPPING_COST = 15000;

  var products = window.GAMEBROS_PRODUCTS || [];
  var byId = window.GAMEBROS_BY_ID || {};
  var categories = window.GAMEBROS_CATEGORIES || {};

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatCOP(value) {
    return '$' + Math.round(Number(value) || 0).toLocaleString('es-CO');
  }

  function waLink(product) {
    var msg = 'Hola GameBros, quiero comprar: ' + product.name +
      ' (SKU ' + product.sku + ') por ' + formatCOP(product.price) + ' COP.';
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  function stars(rating) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<svg class="icon" aria-hidden="true"><use href="#icon-star"></use></svg>';
    }
    return out;
  }

  function productCard(p) {
    if (!p) return '';
    var badge = '';
    if (p.type === 'Combo') {
      badge = '<span class="p-badge p-badge--combo">Combo</span>';
    } else if (p.oldPrice) {
      badge = '<span class="p-badge p-badge--sale">-' + p.discount + '%</span>';
    } else if (p.recent) {
      badge = '<span class="p-badge p-badge--new">Nuevo</span>';
    }
    var oldPrice = p.oldPrice ? '<span class="product-card__old">' + formatCOP(p.oldPrice) + '</span>' : '';
    var catLabel = (categories[p.category] || p.category) + ' · ' + p.type;

    return '' +
      '<article class="product-card" data-product-id="' + escapeHtml(p.id) + '">' +
        '<div class="product-card__media">' +
          '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.name) + '" width="760" height="760" loading="lazy" decoding="async">' +
          '<div class="product-card__badges">' + badge + '</div>' +
          '<div class="product-card__quick">' +
            '<button class="quick-btn" type="button" data-action="add" data-id="' + escapeHtml(p.id) + '" aria-label="Añadir ' + escapeHtml(p.name) + ' al carrito" title="Añadir al carrito">' +
              '<svg class="icon" aria-hidden="true"><use href="#icon-cart"></use></svg></button>' +
            '<button class="quick-btn" type="button" data-action="quick" data-id="' + escapeHtml(p.id) + '" aria-label="Vista rápida de ' + escapeHtml(p.name) + '" title="Vista rápida">' +
              '<svg class="icon" aria-hidden="true"><use href="#icon-eye"></use></svg></button>' +
            '<a class="quick-btn quick-btn--wa" href="' + escapeHtml(waLink(p)) + '" target="_blank" rel="noopener" aria-label="Comprar ' + escapeHtml(p.name) + ' por WhatsApp" title="Comprar por WhatsApp">' +
              '<svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg></a>' +
          '</div>' +
        '</div>' +
        '<div class="product-card__body">' +
          '<div class="product-card__cat">' + escapeHtml(catLabel) + '</div>' +
          '<button class="product-card__title" type="button" data-action="quick" data-id="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</button>' +
          '<div class="product-card__rating">' +
            '<span class="product-card__stars" aria-hidden="true">' + stars(p.rating) + '</span>' +
            '<span class="product-card__reviews">' + p.rating.toFixed(1) + ' (' + p.reviews + ')</span>' +
          '</div>' +
          '<div class="product-card__prices">' + oldPrice +
            '<span class="product-card__price">' + formatCOP(p.price) + '<small>COP</small></span>' +
          '</div>' +
          '<div class="product-card__meta">' +
            '<span class="product-card__stock' + (p.stock ? '' : ' product-card__stock--out') + '">' + (p.stock ? 'En stock' : 'Agotado') + '</span>' +
            '<span class="product-card__installment">12x ' + formatCOP(Math.ceil(p.price / 12)) + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ------------------------------ Toasts ------------------------------ */
  function toast(message, icon) {
    var stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-' + (icon || 'check') + '"></use></svg><span>' + escapeHtml(message) + '</span>';
    stack.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 240);
    }, 3200);
  }

  /* ------------------------------ Cart ------------------------------- */
  function readCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (item) {
        return item && byId[item.id] && Number(item.qty) > 0;
      }).map(function (item) {
        return { id: item.id, qty: Math.min(99, Math.max(1, Number(item.qty) || 1)) };
      });
    } catch (err) { return []; }
  }

  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (err) { /* storage blocked */ }
  }

  function cartTotals(items) {
    var subtotal = items.reduce(function (sum, item) {
      var p = byId[item.id];
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
    var shipping = subtotal === 0 || subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST;
    return { subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
  }

  function updateCartUI() {
    var items = readCart();
    var count = items.reduce(function (sum, item) { return sum + item.qty; }, 0);
    $$('[data-cart-count]').forEach(function (el) { el.textContent = count; });
    var drawerBody = $('#cartItems');
    var drawerFoot = $('#cartFoot');
    var titleCount = $('#cartTitleCount');
    if (titleCount) titleCount.textContent = count;

    if (!drawerBody || !drawerFoot) return;

    if (!items.length) {
      drawerBody.innerHTML = '' +
        '<div class="cart-empty">' +
          '<div class="cart-empty__icon"><svg class="icon" aria-hidden="true"><use href="#icon-cart"></use></svg></div>' +
          '<h3>Tu carrito está vacío</h3>' +
          '<p>Explora el catálogo y encuentra tu próximo setup.</p>' +
          '<a class="btn btn-primary" href="catalogo.html">Ver catálogo</a>' +
        '</div>';
      drawerFoot.innerHTML = '';
      return;
    }

    drawerBody.innerHTML = items.map(function (item) {
      var p = byId[item.id];
      return '' +
        '<div class="cart-item">' +
          '<div class="cart-item__img"><img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.name) + '" width="72" height="72" loading="lazy"></div>' +
          '<div>' +
            '<div class="cart-item__name">' + escapeHtml(p.name) + '</div>' +
            '<div class="cart-item__price">' + formatCOP(p.price * item.qty) + '</div>' +
            '<div class="cart-item__qty">' +
              '<button type="button" data-action="qty-dec" data-id="' + escapeHtml(p.id) + '" aria-label="Quitar una unidad de ' + escapeHtml(p.name) + '"><svg class="icon icon--sm" aria-hidden="true"><use href="#icon-minus"></use></svg></button>' +
              '<span>' + item.qty + '</span>' +
              '<button type="button" data-action="qty-inc" data-id="' + escapeHtml(p.id) + '" aria-label="Añadir una unidad de ' + escapeHtml(p.name) + '"><svg class="icon icon--sm" aria-hidden="true"><use href="#icon-plus"></use></svg></button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" data-action="remove" data-id="' + escapeHtml(p.id) + '" aria-label="Eliminar ' + escapeHtml(p.name) + ' del carrito">' +
            '<svg class="icon" aria-hidden="true"><use href="#icon-trash"></use></svg></button>' +
        '</div>';
    }).join('');

    var t = cartTotals(items);
    drawerFoot.innerHTML = '' +
      '<div class="cart-summary"><span>Subtotal</span><span>' + formatCOP(t.subtotal) + '</span></div>' +
      '<div class="cart-summary"><span>Envío</span><span>' + (t.shipping ? formatCOP(t.shipping) : 'Gratis') + '</span></div>' +
      '<div class="cart-summary cart-summary--total"><span>Total</span><strong>' + formatCOP(t.total) + '</strong></div>' +
      '<button class="btn btn-primary btn-block" type="button" data-action="checkout">' +
        '<svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg>Finalizar compra</button>' +
      '<p class="cart-drawer__note">' + (t.subtotal >= SHIPPING_FREE_FROM ? '¡Felicidades! Tienes envío gratis.' : 'Te faltan ' + formatCOP(SHIPPING_FREE_FROM - t.subtotal) + ' para el envío gratis.') + ' Demo funcional.</p>';
  }

  function addToCart(id, qty, opts) {
    var p = byId[id];
    if (!p) return;
    var items = readCart();
    var found = items.filter(function (item) { return item.id === id; })[0];
    if (found) {
      found.qty = Math.min(99, found.qty + (qty || 1));
    } else {
      items.push({ id: id, qty: Math.min(99, qty || 1) });
    }
    writeCart(items);
    updateCartUI();
    toast(p.name + ' se añadió al carrito.');
    if (!opts || opts.open !== false) openCart();
  }

  function setQty(id, delta) {
    var items = readCart();
    var found = items.filter(function (item) { return item.id === id; })[0];
    if (!found) return;
    found.qty += delta;
    if (found.qty <= 0) {
      items = items.filter(function (item) { return item.id !== id; });
    }
    writeCart(items);
    updateCartUI();
  }

  function removeItem(id) {
    var items = readCart().filter(function (item) { return item.id !== id; });
    writeCart(items);
    updateCartUI();
    toast('Producto eliminado del carrito.', 'trash');
  }

  function checkout() {
    var items = readCart();
    if (!items.length) return;
    var t = cartTotals(items);
    var lines = items.map(function (item) {
      var p = byId[item.id];
      return '• ' + item.qty + 'x ' + p.name + ' — ' + formatCOP(p.price * item.qty);
    });
    var msg = 'Hola GameBros, quiero finalizar este pedido:\n' + lines.join('\n') +
      '\n\nSubtotal: ' + formatCOP(t.subtotal) +
      '\nEnvío: ' + (t.shipping ? formatCOP(t.shipping) : 'Gratis') +
      '\nTotal: ' + formatCOP(t.total) +
      '\n\nMi nombre es: ';
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    toast('Pedido enviado a WhatsApp. ¡Gracias por comprar en GameBros!', 'whatsapp');
  }

  /* --------------------------- Cart drawer UI -------------------------- */
  function openCart() {
    var drawer = $('#cartDrawer');
    var overlay = $('#cartOverlay');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('is-open');
    document.body.classList.add('is-locked');
    var close = $('.cart-close', drawer);
    if (close) close.focus({ preventScroll: true });
  }

  function closeCart() {
    var drawer = $('#cartDrawer');
    var overlay = $('#cartOverlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('is-open');
    if (!document.querySelector('.mobile-drawer.is-open, .qv-overlay.is-open')) {
      document.body.classList.remove('is-locked');
    }
  }

  /* ---------------------------- Quick view ---------------------------- */
  var qvState = { id: null, qty: 1, lastFocus: null };

  function ensureQuickView() {
    if ($('#qvOverlay')) return;
    var wrap = document.createElement('div');
    wrap.className = 'qv-overlay';
    wrap.id = 'qvOverlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '' +
      '<div class="qv-modal" role="dialog" aria-modal="true" aria-labelledby="qvTitle">' +
        '<button class="qv-close" type="button" data-action="qv-close" aria-label="Cerrar vista rápida">' +
          '<svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg></button>' +
        '<div class="qv-grid">' +
          '<div class="qv-media"><img id="qvImg" src="" alt="" width="760" height="760"></div>' +
          '<div class="qv-body">' +
            '<div class="qv-cat" id="qvCat"></div>' +
            '<h2 class="qv-title" id="qvTitle"></h2>' +
            '<div class="qv-rating"><span class="qv-stars" id="qvStars" aria-hidden="true"></span><span id="qvReviews"></span></div>' +
            '<div class="qv-prices"><span class="qv-old" id="qvOld"></span><span class="qv-price" id="qvPrice"></span></div>' +
            '<p class="qv-desc" id="qvDesc"></p>' +
            '<span class="qv-stock" id="qvStock">En stock</span>' +
            '<div class="qv-actions">' +
              '<div class="qv-qty">' +
                '<button type="button" data-action="qv-dec" aria-label="Quitar una unidad"><svg class="icon icon--sm" aria-hidden="true"><use href="#icon-minus"></use></svg></button>' +
                '<span id="qvQty">1</span>' +
                '<button type="button" data-action="qv-inc" aria-label="Añadir una unidad"><svg class="icon icon--sm" aria-hidden="true"><use href="#icon-plus"></use></svg></button>' +
              '</div>' +
              '<button class="btn btn-primary" type="button" data-action="qv-add" id="qvAdd">Añadir al carrito</button>' +
              '<a class="btn btn-outline" id="qvWa" href="#" target="_blank" rel="noopener">' +
                '<svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg>WhatsApp</a>' +
            '</div>' +
            '<div class="qv-meta">' +
              '<div>SKU<strong id="qvSku"></strong></div>' +
              '<div>Categoría<strong id="qvCategory"></strong></div>' +
              '<div>Tipo<strong id="qvType"></strong></div>' +
              '<div>Garantía<strong>12 meses GameBros</strong></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) closeQuickView();
    });
  }

  function openQuickView(id) {
    var p = byId[id];
    if (!p) return;
    ensureQuickView();
    qvState.id = id;
    qvState.qty = 1;
    qvState.lastFocus = document.activeElement;

    $('#qvImg').src = p.img;
    $('#qvImg').alt = p.name;
    $('#qvCat').textContent = (categories[p.category] || p.category) + ' · ' + p.type;
    $('#qvTitle').textContent = p.name;
    $('#qvStars').innerHTML = stars(p.rating);
    $('#qvReviews').textContent = p.rating.toFixed(1) + ' · ' + p.reviews + ' reseñas';
    $('#qvOld').textContent = p.oldPrice ? formatCOP(p.oldPrice) : '';
    $('#qvPrice').innerHTML = formatCOP(p.price) + ' <small>COP</small>';
    $('#qvDesc').textContent = p.desc;
    $('#qvStock').textContent = p.stock ? 'En stock — listo para enviar' : 'Agotado temporalmente';
    $('#qvQty').textContent = '1';
    $('#qvSku').textContent = p.sku;
    $('#qvCategory').textContent = categories[p.category] || p.category;
    $('#qvType').textContent = p.type;
    $('#qvWa').href = waLink(p);

    var overlay = $('#qvOverlay');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    var close = $('.qv-close', overlay);
    if (close) close.focus({ preventScroll: true });
  }

  function closeQuickView() {
    var overlay = $('#qvOverlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.mobile-drawer.is-open, .cart-drawer.is-open')) {
      document.body.classList.remove('is-locked');
    }
    if (qvState.lastFocus && qvState.lastFocus.focus) qvState.lastFocus.focus({ preventScroll: true });
  }

  /* --------------------------- Mobile drawer -------------------------- */
  function openMenu() {
    var drawer = $('#mobileDrawer');
    var overlay = $('#drawerOverlay');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.classList.add('is-open');
    document.body.classList.add('is-locked');
    var close = $('.drawer-close', drawer);
    if (close) close.focus({ preventScroll: true });
  }

  function closeMenu() {
    var drawer = $('#mobileDrawer');
    var overlay = $('#drawerOverlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.classList.remove('is-open');
    if (!document.querySelector('.cart-drawer.is-open, .qv-overlay.is-open')) {
      document.body.classList.remove('is-locked');
    }
  }

  /* ----------------------------- Search ------------------------------- */
  function setupSearch() {
    var input = $('#headerSearchInput');
    var hint = $('#searchHint');
    if (!input || !hint) return;

    function renderHint() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) {
        hint.classList.remove('is-open');
        hint.innerHTML = '';
        return;
      }
      var matches = products.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1 || p.type.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 6);
      if (!matches.length) {
        hint.classList.remove('is-open');
        hint.innerHTML = '';
        return;
      }
      hint.innerHTML = matches.map(function (p) {
        return '<a href="catalogo.html?q=' + encodeURIComponent(p.name) + '">' +
          '<svg class="icon" aria-hidden="true"><use href="#icon-search"></use></svg>' +
          '<span>' + escapeHtml(p.name) + '</span></a>';
      }).join('');
      hint.classList.add('is-open');
    }

    input.addEventListener('input', renderHint);
    input.addEventListener('focus', renderHint);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.header-search')) hint.classList.remove('is-open');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hint.classList.remove('is-open'); input.blur(); }
    });

    var form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value.trim();
        var cat = form.querySelector('.header-search__select');
        var url = 'catalogo.html';
        var params = [];
        if (cat && cat.value) params.push('categoria=' + encodeURIComponent(cat.value));
        if (q) params.push('q=' + encodeURIComponent(q));
        if (params.length) url += '?' + params.join('&');
        window.location.href = url;
      });
    }
  }

  /* ------------------------------ Init -------------------------------- */
  function init() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    /* Cart count + drawer initial state */
    updateCartUI();

    /* Header nav dropdown */
    $$('.nav-dropdown-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var item = btn.closest('.main-nav__item');
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.main-nav__item')) {
        $$('.main-nav__item.is-open').forEach(function (item) {
          item.classList.remove('is-open');
          var btn = $('.nav-dropdown-toggle', item);
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    /* Sticky nav shadow */
    var nav = $('.main-nav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 30); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* Global delegated actions */
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.getAttribute('data-action');
      var id = el.getAttribute('data-id');

      switch (action) {
        case 'menu-open': e.preventDefault(); openMenu(); break;
        case 'menu-close': e.preventDefault(); closeMenu(); break;
        case 'cart-open': e.preventDefault(); openCart(); break;
        case 'cart-close': e.preventDefault(); closeCart(); break;
        case 'add': e.preventDefault(); addToCart(id, 1); break;
        case 'quick': e.preventDefault(); openQuickView(id); break;
        case 'remove': e.preventDefault(); removeItem(id); break;
        case 'qty-inc': e.preventDefault(); setQty(id, 1); break;
        case 'qty-dec': e.preventDefault(); setQty(id, -1); break;
        case 'checkout': e.preventDefault(); checkout(); break;
        case 'qv-close': e.preventDefault(); closeQuickView(); break;
        case 'qv-inc': e.preventDefault(); qvState.qty = Math.min(99, qvState.qty + 1); $('#qvQty').textContent = qvState.qty; break;
        case 'qv-dec': e.preventDefault(); qvState.qty = Math.max(1, qvState.qty - 1); $('#qvQty').textContent = qvState.qty; break;
        case 'qv-add':
          e.preventDefault();
          if (qvState.id) {
            addToCart(qvState.id, qvState.qty, { open: false });
            closeQuickView();
            openCart();
          }
          break;
        case 'copy':
          e.preventDefault();
          copyText(el.getAttribute('data-copy') || 'GAMEBROS');
          break;
        case 'clear-cart':
          e.preventDefault();
          writeCart([]);
          updateCartUI();
          toast('Carrito vaciado.', 'trash');
          break;
      }
    });

    /* Overlay closes */
    var cartOverlay = $('#cartOverlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    var drawerOverlay = $('#drawerOverlay');
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeMenu);

    /* Drawer links close menu */
    $$('#mobileDrawer a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(); });
    });

    /* Escape closes everything */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeMenu();
      closeCart();
      closeQuickView();
      $$('.main-nav__item.is-open').forEach(function (item) {
        item.classList.remove('is-open');
        var btn = $('.nav-dropdown-toggle', item);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });

    /* Newsletter demo */
    $$('[data-newsletter]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = form.querySelector('input[type="email"]');
        if (!email || !email.value || email.value.indexOf('@') === -1) {
          toast('Escribe un correo válido para suscribirte.', 'mail');
          if (email) email.focus();
          return;
        }
        toast('¡Listo! Te suscribiste a las ofertas de GameBros.');
        form.reset();
      });
    });

    setupSearch();
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* noop */ }
      ta.remove();
      toast('Cupón ' + text + ' copiado. Úsalo al finalizar tu compra.', 'copy');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Cupón ' + text + ' copiado. Úsalo al finalizar tu compra.', 'copy');
      }).catch(fallback);
    } else {
      fallback();
    }
  }

  window.GameBros = {
    productCard: productCard,
    formatCOP: formatCOP,
    waLink: waLink,
    toast: toast,
    updateCartUI: updateCartUI,
    addToCart: addToCart,
    openCart: openCart,
    closeCart: closeCart,
    openQuickView: openQuickView,
    closeQuickView: closeQuickView,
    escapeHtml: escapeHtml,
    stars: stars
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
