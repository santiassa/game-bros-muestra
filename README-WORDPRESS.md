# GameBros — Guía de integración WordPress + WooCommerce

Sitio de 4 páginas para **GameBros** (Suba, Bogotá) con identidad **blanco + morado** y la estructura, proporciones y tipografía en mayúsculas del tema **Sportiq**.

No es un one-page: cada sección vive en un archivo HTML independiente y todas comparten el mismo Header y Footer.

---

## 1. Archivos del proyecto

| Archivo | Uso |
| --- | --- |
| `index.html` | Inicio: hero slider, marcas, 3 banners, más vendidos, sale banner, nuevos ingresos, franja de confianza. |
| `catalogo.html` | Catálogo unificado: subsecciones PlayStation / Xbox / Switch / Accesorios / Combos, sidebar de filtros y 30 productos. |
| `quienes-somos.html` | Historia, valores, garantías y sede. |
| `faq.html` | Preguntas frecuentes con acordeones, búsqueda y soporte. |
| `assets/css/styles.css` | Sistema de diseño completo y responsive. |
| `assets/js/products.js` | Base de datos de 30 productos en COP + helpers. |
| `assets/js/site.js` | Header, búsqueda, carrito, vista rápida, drawer móvil, toasts, cupón y render de tarjetas. |
| `assets/js/home.js` | Hero slider (flechas, dots, autoplay 5 s, swipe, teclado) y carrusel de tendencias. |
| `assets/js/catalogo.js` | Filtros instantáneos, orden, sincronización de URL y títulos de subsección. |
| `assets/js/faq.js` | Acordeones de una sola apertura y búsqueda instantánea. |
| `logo-gamebros-192.png` | Logo para header, footer, drawer y favicon. |
| `logo-gamebros.png` | Logo fuente para Open Graph. |

> Las fotos de producto son imágenes reales de Unsplash usadas como *placeholders*. En producción se reemplazan por las fotos definitivas de cada producto, idealmente sobre fondo blanco o lavanda.

---

## 2. Paleta y tokens

Los colores viven en `:root` dentro de `assets/css/styles.css`:

```css
--white: #FFFFFF;          /* fondo principal */
--smoke: #F8F7FC;          /* secciones alternas */
--lavender: #EDE9FE;       /* fondos suaves, iconos, badges */
--purple: #6D28D9;         /* CTA, precios de oferta, activos */
--purple-light: #7C3AED;   /* hover */
--purple-deep: #4C1D95;    /* acentos de alto contraste */
--purple-darkest: #2E1065; /* topbar, footer, franjas */
--ink: #1B1230;            /* texto principal */
--muted: #6F6880;          /* texto secundario */
--line: #E9E4F2;           /* bordes */
```

Tipografías: **Barlow Condensed** (títulos), **Inter** (texto), **JetBrains Mono** (etiquetas y datos).

En WordPress conviene volcar estos valores en `theme.json` (`settings.color.palette`) y registrar las tres fuentes en `theme.json` (`settings.typography.fontFamilies`).

---

## 3. Header y Footer compartidos

El Header y el Footer son **idénticos en las 4 páginas** y se generaron desde una sola plantilla para evitar divergencias.

### Header

- **Topbar** morada oscura: envío gratis, teléfono, ayuda, moneda COP y redes sociales.
- **Logo grande**: `height: 115px` en escritorio, `108px` a ≤1024 px y `72px` en móvil (mínimo 70 px a 320 px). `width: auto; max-width: 280px; object-fit: contain`.
- **Barra de búsqueda ancha** con selector de categoría y botón morado. Envía a `catalogo.html?q=…&categoria=…`.
- **Acciones**: redes sociales, botón de carrito con contador y botón de menú móvil.
- **Navegación principal**: Inicio, Catálogo (con dropdown de subsecciones), Quiénes somos, FAQ y acceso directo a ofertas.
- **Drawer móvil** con las mismas rutas y categorías.

### Footer

- Logo, descripción, redes sociales, medios de pago, columnas de tienda/ayuda/contacto y línea legal.
- Enlaces a `faq.html#faq-envios`, `faq.html#faq-garantias`, `quienes-somos.html#sede`, etc.

### Redes oficiales (obligatorias en Header y Footer de las 4 páginas)

```html
<a href="https://www.tiktok.com/@gamebrosoficial12s" target="_blank" rel="noopener">TikTok</a>
<a href="https://www.instagram.com/gamebrosoficial12s/" target="_blank" rel="noopener">Instagram</a>
```

### WordPress

- `header.php` → topbar, logo (`the_custom_logo()` o `custom_logo`), búsqueda (`get_product_search_form()`), carrito y `wp_nav_menu()`.
- `footer.php` → columnas, redes y datos de contacto.
- Registrar menús:

```php
register_nav_menus(array(
  'primary' => 'Navegación principal',
  'mobile'  => 'Navegación móvil',
  'footer'  => 'Footer',
));
```

- El logo se controla desde **Apariencia → Personalizar → Identidad del sitio**. Para conservar el tamaño, añadir al CSS del tema la regla `.custom-logo { height: 115px; width: auto; max-width: 280px; object-fit: contain; }`.

---

## 4. Inicio (`index.html`)

| Bloque | Contenido | Plantilla WordPress sugerida |
| --- | --- | --- |
| Hero slider | 4 slides con flechas, dots 1–4, autoplay 5 s y CTAs a cada categoría. | `front-page.php` + ACF/patrón de bloques o plugin de slider. |
| Brand strip | PlayStation, Xbox, Nintendo, DualSense, Razer, HyperX, Logitech G. | Franja estática o menú de marcas (`product_brand`). |
| 3 banners | Next-Gen Power, Diversión Portátil, Hasta 30% de Descuento. | 3 bloques reutilizables con enlaces a `product_cat`. |
| Más vendidos | 8 productos en oferta + “Ver todos los productos”. | `wc_get_products(['orderby' => 'popularity', 'limit' => 8])`. |
| Sale banner | “IT'S SALE TIME / OFERTAS GAMEBROS”, cupón `GAMEBROS`. | Bloque promocional + cupón real de WooCommerce. |
| Nuevos ingresos | Carrusel horizontal con 8 productos recientes. | `wc_get_products(['orderby' => 'date', 'limit' => 8])`. |
| Franja de confianza | Envíos, garantía y pagos seguros. | Franja estática del tema. |

### Slider

- 4 slides, 4 dots, flechas anterior/siguiente.
- Autoplay cada **5 segundos**; se pausa con hover, foco, pestaña oculta y `prefers-reduced-motion`.
- Soporta swipe táctil y teclado (`←` / `→`).
- En WordPress se puede mantener el JS actual sobre un markup de 4 slides o migrar a **Swiper** conservando dots numéricos y el mismo copy.

---

## 5. Catálogo unificado (`catalogo.html`)

### Subsecciones integradas

- Ruta visible: **Catálogo > Todos | PlayStation | Xbox | Switch | Accesorios | Combos**.
- Al hacer clic en una subsección se filtra la misma grilla, se actualiza el título (`Catálogo > PlayStation`) y la URL (`?categoria=playstation`), sin salir del catálogo.
- El dropdown del Header y el drawer móvil apuntan a las mismas URLs.

### Filtros del sidebar

- **Precio en COP**: campos mínimo/máximo + slider (rango 0 – 4.500.000).
- **Tipo de producto**: Consola, Control, Diadema, Videojuego, Combo, Accesorio.
- **Estado**: En Stock / En Promoción.
- **Orden**: relevancia, precio asc/desc, mayor descuento, nombre A–Z.
- Chips de filtros activos con remoción individual y botón “Limpiar todo”.

### Parámetros de URL soportados

| Parámetro | Ejemplo | Efecto |
| --- | --- | --- |
| `categoria` | `?categoria=xbox` | Activa la subsección Xbox. |
| `q` | `?q=dualsense` | Búsqueda por nombre, SKU, tipo o categoría. |
| `estado` | `?estado=promo` | Filtra productos en promoción. |
| `estado` | `?estado=stock` | Filtra productos en stock. |

Los filtros se combinan y la URL se actualiza con `history.replaceState` para poder compartir el estado.

### Base de productos

`assets/js/products.js` contiene **30 productos**:

- PlayStation: 8
- Xbox: 7
- Switch: 7
- Accesorios: 8
- Combos: 3 (transversales a las categorías)

Cada producto incluye: `id`, `name`, `category`, `type`, `price`, `oldPrice`, `img`, `badge`, `rating`, `reviews`, `stock`, `featured`, `recent`, `sku`, `desc`.

### WordPress / WooCommerce

- **Categorías** → `product_cat`: `playstation`, `xbox`, `switch`, `accesorios` y `combos` (o una taxonomía propia para combos).
- **Tipo de producto** → atributo global `tipo` (`Consola`, `Control`, `Diadema`, `Videojuego`, `Combo`, `Accesorio`) o categorías secundarias.
- **Estado** → stock nativo de WooCommerce + `_sale_price` para promociones.
- **Precio** → filtro nativo de WooCommerce o plugin de filtros (WOOF, FacetWP).
- **Grilla** → `woocommerce_before_shop_loop`, `woocommerce_after_shop_loop` y `content-product.php`.

```php
<ul class="products columns-3">
  <?php
  $args = array(
    'limit'   => 30,
    'status'  => 'publish',
    'orderby' => 'date',
  );
  foreach (wc_get_products($args) as $product) {
    wc_get_template_part('content', 'product');
  }
  ?>
</ul>
```

Conservar las clases `.product-card`, `.product-card__media`, `.product-card__title`, `.price`, `.add_to_cart_button` para reutilizar los estilos.

---

## 6. Quiénes somos (`quienes-somos.html`)

- Hero de página con migas de pan.
- Historia de GameBros desde 2019 en Suba.
- Cifras: gamers atendidos, productos, meses de garantía, calificación.
- Valores: pasión, transparencia, comunidad.
- Garantías: oficial, envíos, pagos, cambios y devoluciones.
- Sede: dirección, horario, WhatsApp, correo y enlace a Google Maps.

En WordPress: `page-quienes-somos.php` o una página con bloques/ACF. La sede puede mapearse a un CPT `sede` o a opciones del tema.

---

## 7. FAQ (`faq.html`)

- 17 preguntas en 4 grupos: compras y pagos, envíos, garantías, productos y soporte.
- Acordeón nativo con `<details>` / `<summary>`: funciona sin JavaScript.
- Búsqueda instantánea que filtra preguntas y oculta grupos sin resultados.
- Solo un acordeón abierto por grupo.
- Enlaces directos: `#faq-pagos`, `#faq-envios`, `#faq-garantias`, `#faq-soporte`.
- Bloque final de soporte por WhatsApp, correo y sede.

En WordPress: `page-faq.php` con un repetidor ACF (pregunta/respuesta) o el bloque nativo de acordeón. Mantener los IDs de sección para no romper enlaces del Footer.

---

## 8. Carrito demo

- Persistencia en `localStorage` con la clave **`gamebros_cart_v2`**.
- Drawer lateral con cantidades, subtotal, envío y total.
- Envío gratis desde **$300.000 COP**; si no, **$15.000 COP**.
- Finalización por WhatsApp (`https://wa.me/573105550134`).
- Vista rápida de producto en modal.
- En producción: reemplazar por el mini-cart de WooCommerce (`woocommerce_mini_cart()`), escuchar `wc_fragments_refreshed` / `added_to_cart` y mantener las clases del drawer.

---

## 9. Búsqueda y navegación

- La barra del Header envía a `catalogo.html` con `q` y `categoria`.
- Sugerencias instantáneas de productos mientras se escribe.
- Todas las rutas del menú son archivos reales: `index.html`, `catalogo.html`, `quienes-somos.html`, `faq.html`.
- El menú móvil y el drawer de categorías replican las mismas rutas.
- Skip link, `aria-current`, `aria-expanded`, `aria-live`, foco visible y `prefers-reduced-motion`.

---

## 10. Rendimiento y assets

- Fuentes con `display=swap`, `preconnect` a Google Fonts.
- Imágenes de producto con `loading="lazy"` y `decoding="async"`; hero con `fetchpriority="high"`.
- CSS y JS externos, sin frameworks.
- En WordPress:
  - `wp_get_attachment_image()` con `srcset`/`sizes`,
  - WebP/AVIF,
  - caché de página y objetos,
  - diferir JS no crítico.

---

## 11. QA ejecutado

Suite Puppeteer con **58/58 verificaciones aprobadas**:

- Logo 115 px en escritorio y 70 px en móvil.
- Hero con 4 slides, 4 dots, flechas y autoplay de 5 s.
- Controles del hero (dots/progreso) sin solaparse con los botones CTA en 1440, 1280, 1024, 900, 768, 600, 390 y 320 px.
- Sugerencias del buscador por encima de la barra de secciones (header con `z-index` propio).
- Mensaje “Envío gratis desde $300.000” resaltado como pill en el topbar.
- 8 productos en “Más vendidos” y 8 en “Nuevos ingresos”.
- 30 productos en el catálogo.
- Filtros por categoría, precio, tipo y estado.
- Deep links `?categoria=`, `?q=`, `?estado=`.
- Acordeones y búsqueda del FAQ.
- Redes sociales con `target="_blank"` y `rel="noopener"`.
- Enlaces internos resueltos.
- Sin overflow horizontal en 1440, 1024, 768, 390 y 320 px.
- Sin errores de JavaScript en consola.

---

## 12. Checklist de lanzamiento

- [ ] Reemplazar imágenes placeholder por fotos reales de cada producto.
- [ ] Verificar precios, stock y reseñas reales (COP, IVA incluido).
- [ ] Migrar `products.js` a productos WooCommerce.
- [ ] Mapear categorías, atributo `tipo` y estados de promoción.
- [ ] Conectar el carrito demo al mini-cart de WooCommerce.
- [ ] Conectar pasarela de pago (Wompi, Mercado Pago, PayU, etc.).
- [ ] Configurar envío gratis desde $300.000 y entrega el mismo día en Suba.
- [ ] Reemplazar el mapa decorativo por Google Maps embebido.
- [ ] Conectar formularios/soporte a correo o CRM.
- [ ] Configurar Google Analytics 4 y Meta Pixel.
- [ ] Revisar `lang="es-CO"`, moneda COP y metadatos Open Graph.
- [ ] Probar en 320, 390, 768, 1024 y 1440 px.
- [ ] Validar contraste AA y navegación por teclado.
