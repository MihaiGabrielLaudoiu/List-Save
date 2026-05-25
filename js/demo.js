(function () {
  'use strict';

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';

  var DEMOS = {
    'index.html': [
      {
        icon: '<i class="fas fa-search" style="color:#2563eb"></i>',
        title: 'Buscador Inteligente',
        desc: 'Busca cualquier producto y encuentra el precio más barato entre Mercadona, Carrefour y Eroski al instante.',
        selector: '#home-search-form, .search-container, [class*="search"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-store" style="color:#2563eb"></i>',
        title: 'Supermercados Destacados',
        desc: 'Acceso directo a los productos de Mercadona, Carrefour y Eroski. Compara precios entre todos ellos.',
        selector: '.stores-section, .home-stores, [class*="store"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-chart-line" style="color:#2563eb"></i>',
        title: 'Productos en Oferta',
        desc: 'Descubre los productos con mejores precios y ofertas destacadas de la semana.',
        selector: '.offers-section, [class*="offer"], [class*="destacado"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-arrow-right" style="color:#2563eb"></i>',
        title: 'Navegación Completa',
        desc: 'Accede a todas las secciones: Mi lista, Comparador, Productos y Estadísticas desde el menú superior.',
        selector: '.nav__list, .header__nav',
        action: 'highlight'
      }
    ],

    'comparador.html': [
      {
        icon: '<i class="fas fa-balance-scale" style="color:#2563eb"></i>',
        title: 'Comparador de Precios',
        desc: 'Compara precios de productos entre Mercadona, Carrefour y Eroski en una sola vista.',
        selector: '.comparator-container, .comparator, [class*="comparator"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-search-plus" style="color:#2563eb"></i>',
        title: 'Buscador de Productos',
        desc: 'Escribe el nombre de un producto y el comparador busca automáticamente en todos los supermercados.',
        selector: '#search-product, [class*="search"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-table" style="color:#2563eb"></i>',
        title: 'Tabla Comparativa',
        desc: 'Resultados ordenados por precio con colores: verde para el más barato, rojo para el más caro.',
        selector: '.comparison-table, .results-table, [class*="table"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-sync-alt" style="color:#2563eb"></i>',
        title: 'Sincronizar Precios',
        desc: 'Actualiza los precios desde las APIs oficiales de los supermercados con un clic.',
        selector: '[class*="sync"], [id*="sync"]',
        action: 'scroll'
      }
    ],

    'mi-lista.html': [
      {
        icon: '<i class="fas fa-list" style="color:#2563eb"></i>',
        title: 'Tu Lista de la Compra',
        desc: 'Crea y gestiona listas de compra personalizadas. Añade productos y cantidades fácilmente.',
        selector: '.lists-container, .shopping-list, [class*="list"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-plus-circle" style="color:#2563eb"></i>',
        title: 'Añadir Productos',
        desc: 'Añade productos a tu lista con cantidad y observaciones. Todo guardado automáticamente.',
        selector: '#add-product-form, [class*="add"], [class*="new-item"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-euro-sign" style="color:#2563eb"></i>',
        title: 'Precios en tu Lista',
        desc: 'Cada producto muestra el precio más bajo disponible. Sabes cuánto gastarás antes de ir a comprar.',
        selector: '.list-items, .items-container, [class*="item"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-trash-alt" style="color:#2563eb"></i>',
        title: 'Gestiona tus Listas',
        desc: 'Edita el nombre, duplica o elimina listas. Organiza tus compras por supermercado o día.',
        selector: '.list-actions, [class*="actions"]',
        action: 'scroll'
      }
    ],

    'productos.html': [
      {
        icon: '<i class="fas fa-box" style="color:#2563eb"></i>',
        title: 'Catálogo de Productos',
        desc: 'Explora el catálogo completo de productos con precios de todos los supermercados.',
        selector: '.products-container, .catalog, [class*="product"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-filter" style="color:#2563eb"></i>',
        title: 'Filtros y Búsqueda',
        desc: 'Filtra por categoría, supermercado o rango de precio. Encuentra lo que necesitas rápido.',
        selector: '.filters, [class*="filter"], [class*="search"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-tags" style="color:#2563eb"></i>',
        title: 'Precios Detallados',
        desc: 'Cada producto muestra el precio en cada supermercado con el más barato destacado.',
        selector: '.product-card, [class*="card"], [class*="price"]',
        action: 'scroll'
      }
    ],

    'graficos.html': [
      {
        icon: '<i class="fas fa-chart-bar" style="color:#2563eb"></i>',
        title: 'Estadísticas de Precios',
        desc: 'Visualiza la evolución de precios y encuentra los momentos más baratos para comprar.',
        selector: '.charts-container, .graficos, [class*="chart"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-chart-pie" style="color:#2563eb"></i>',
        title: 'Comparativa por Supermercado',
        desc: 'Gráficos que comparan los precios medios de cada supermercado. ¿Cuál es más barato?',
        selector: '.store-chart, [class*="store"], [class*="supermarket"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-chart-line" style="color:#2563eb"></i>',
        title: 'Evolución Temporal',
        desc: 'Sigue cómo cambian los precios con el tiempo. Detecta tendencias y ahorra.',
        selector: '.trend-chart, [class*="trend"], [class*="timeline"]',
        action: 'scroll'
      }
    ],

    'login.html': [
      {
        icon: '<i class="fas fa-sign-in-alt" style="color:#2563eb"></i>',
        title: 'Inicio de Sesión',
        desc: 'Accede a tu cuenta para gestionar tus listas y ajustes personalizados.',
        selector: '.login-form, form, [class*="login"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-user-plus" style="color:#2563eb"></i>',
        title: 'Registro',
        desc: '¿No tienes cuenta? Regístrate gratis y empieza a ahorrar en tus compras.',
        selector: '[href*="register"], [class*="register"]',
        action: 'highlight'
      }
    ],

    'register.html': [
      {
        icon: '<i class="fas fa-user-plus" style="color:#2563eb"></i>',
        title: 'Crear Cuenta',
        desc: 'Regístrate con tu correo y contraseña. En segundos tendrás tu lista de la compra personalizada.',
        selector: '.register-form, form, [class*="register"]',
        action: 'scroll'
      }
    ],

    'ajustes.html': [
      {
        icon: '<i class="fas fa-cog" style="color:#2563eb"></i>',
        title: 'Ajustes de Usuario',
        desc: 'Personaliza tu experiencia: idioma, moneda, notificaciones y más.',
        selector: '.settings-container, [class*="setting"]',
        action: 'scroll'
      },
      {
        icon: '<i class="fas fa-language" style="color:#2563eb"></i>',
        title: 'Cambio de Idioma',
        desc: 'La interfaz está disponible en múltiples idiomas. Cambia el idioma en tiempo real.',
        selector: '[class*="language"], [id*="language"], [name*="language"]',
        action: 'scroll'
      }
    ],

    'nosotros.html': [
      {
        icon: '<i class="fas fa-info-circle" style="color:#2563eb"></i>',
        title: 'Sobre List & Save',
        desc: 'Conoce el proyecto: un comparador de precios y gestor de listas para ahorrar en tus compras.',
        selector: '.about-container, [class*="about"], [class*="nosotros"]',
        action: 'scroll'
      }
    ],

    'contacto.html': [
      {
        icon: '<i class="fas fa-envelope" style="color:#2563eb"></i>',
        title: 'Formulario de Contacto',
        desc: 'Envíanos un mensaje directamente desde la web. Te responderemos lo antes posible.',
        selector: '.contact-form, form, [class*="contact"]',
        action: 'scroll'
      }
    ]
  };

  function getPageDemos() {
    return DEMOS[currentPage] || DEMOS['index.html'];
  }

  function createDemoButton() {
    var btn = document.createElement('button');
    btn.id = 'demo-fab';
    btn.className = 'demo-fab';
    btn.setAttribute('aria-label', 'Demo');
    btn.title = 'Demo - Ver funcionalidades';
    btn.innerHTML = '<span class="demo-fab__icon">▶</span>';
    document.body.appendChild(btn);
    return btn;
  }

  function createDemoOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'demo-overlay';
    overlay.className = 'demo-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    return overlay;
  }

  function createDemoPanel() {
    var panel = document.createElement('div');
    panel.id = 'demo-panel';
    panel.className = 'demo-panel';
    panel.style.display = 'none';
    document.body.appendChild(panel);
    return panel;
  }

  function highlightElement(selector) {
    var el = document.querySelector(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    var origOutline = el.style.outline;
    var origBg = el.style.background;

    el.style.outline = '3px solid #2563eb';
    el.style.outlineOffset = '3px';
    el.style.transition = 'outline 0.3s ease';

    setTimeout(function () {
      el.style.outline = origOutline;
      el.style.outlineOffset = '';
    }, 3000);

    var tip = document.createElement('div');
    tip.className = 'demo-tooltip';
    tip.textContent = '✓ Esta es la funcionalidad';
    tip.style.cssText =
      'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:10px 24px;border-radius:12px;font-size:14px;z-index:10001;box-shadow:0 8px 24px rgba(37,99,235,0.3);animation:demoFadeIn 0.3s ease;max-width:85vw;text-align:center;white-space:nowrap;';
    if (window.innerWidth <= 480) {
      tip.style.fontSize = '12px';
      tip.style.padding = '8px 16px';
      tip.style.bottom = '80px';
      tip.style.whiteSpace = 'normal';
    }
    document.body.appendChild(tip);

    setTimeout(function () {
      if (tip.parentNode) tip.parentNode.removeChild(tip);
    }, 2500);
  }

  function openDemo() {
    var demos = getPageDemos();
    var panel = document.getElementById('demo-panel');
    var overlay = document.getElementById('demo-overlay');

    if (!panel || !overlay) return;

    var pageNames = {
      'index.html': 'Inicio',
      'comparador.html': 'Comparador',
      'mi-lista.html': 'Mi Lista',
      'productos.html': 'Productos',
      'graficos.html': 'Estadísticas',
      'login.html': 'Iniciar Sesión',
      'register.html': 'Registro',
      'ajustes.html': 'Ajustes',
      'nosotros.html': 'Nosotros',
      'contacto.html': 'Contacto'
    };

    var pageName = pageNames[currentPage] || 'List & Save';
    var titleHtml =
      '<div class="demo-panel__header">' +
      '<span class="demo-panel__icon">▶</span>' +
      '<span class="demo-panel__title">Demo - ' + pageName + '</span>' +
      '<button class="demo-panel__close" id="demo-close">&times;</button>' +
      '</div>';

    var descHtml =
      '<div class="demo-panel__desc">' +
      'Explora las funcionalidades principales de <strong>List & Save</strong> en esta sección. Pulsa en cada demo para descubrir cómo funciona.' +
      '</div>';

    var listHtml = '<div class="demo-panel__list">';
    demos.forEach(function (demo, i) {
      listHtml +=
        '<div class="demo-item" data-index="' + i + '">' +
        '<div class="demo-item__icon">' + demo.icon + '</div>' +
        '<div class="demo-item__content">' +
        '<div class="demo-item__title">' + demo.title + '</div>' +
        '<div class="demo-item__desc">' + demo.desc + '</div>' +
        '</div>' +
        '<button class="demo-item__btn" data-index="' + i + '">Ver</button>' +
        '</div>';
    });
    listHtml += '</div>';

    var footerHtml =
      '<div class="demo-panel__footer">' +
      '<span class="demo-panel__count">' + demos.length + ' funcionalidades</span>' +
      '</div>';

    panel.innerHTML = titleHtml + descHtml + listHtml + footerHtml;
    panel.style.display = 'flex';
    overlay.style.display = 'block';

    panel.querySelector('#demo-close').addEventListener('click', closeDemo);
    overlay.addEventListener('click', closeDemo);

    panel.querySelectorAll('.demo-item__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index'), 10);
        var demo = demos[idx];
        if (demo && demo.selector) {
          closeDemo();
          setTimeout(function () {
            highlightElement(demo.selector);
          }, 300);
        }
      });
    });

    panel.querySelectorAll('.demo-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('.demo-item__btn')) return;
        var idx = parseInt(this.getAttribute('data-index'), 10);
        var demo = demos[idx];
        if (demo && demo.selector) {
          closeDemo();
          setTimeout(function () {
            highlightElement(demo.selector);
          }, 300);
        }
      });
    });
  }

  function closeDemo() {
    var panel = document.getElementById('demo-panel');
    var overlay = document.getElementById('demo-overlay');
    if (panel) panel.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }

  function injectStyles() {
    var css = document.createElement('style');
    css.textContent =
      '.demo-fab{position:fixed;bottom:140px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(37,99,235,0.35);display:flex;align-items:center;justify-content:center;transition:all 0.3s ease;font-size:0}.demo-fab:hover{transform:scale(1.1);box-shadow:0 8px 28px rgba(37,99,235,0.45);background:#1d4ed8}.demo-fab__icon{font-size:20px;line-height:1}' +
      '.demo-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;backdrop-filter:blur(4px)}' +
      '.demo-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:520px;max-width:92vw;max-height:82vh;background:var(--color-white,#fff);border-radius:18px;z-index:10001;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.25);overflow:hidden;animation:demoSlideIn 0.35s ease}' +
      '.demo-panel__header{display:flex;align-items:center;padding:18px 22px;border-bottom:1px solid var(--color-border,#e2e8f0);gap:10px}' +
      '.demo-panel__icon{width:32px;height:32px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}' +
      '.demo-panel__title{font-weight:600;font-size:16px;color:var(--color-text,#0f172a);flex:1}' +
      '.demo-panel__close{width:30px;height:30px;border-radius:50%;border:none;background:var(--color-background2,#eef2f7);color:var(--color-text-light,#64748b);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}.demo-panel__close:hover{background:var(--color-border,#e2e8f0);color:var(--color-text,#0f172a)}' +
      '.demo-panel__desc{padding:14px 22px;font-size:13px;color:var(--color-text-light,#64748b);line-height:1.5;border-bottom:1px solid var(--color-border,#e2e8f0);background:var(--color-background,#f6f8fb)}' +
      '.demo-panel__list{flex:1;overflow-y:auto;padding:8px 12px}' +
      '.demo-item{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:12px;cursor:pointer;transition:all 0.2s;margin-bottom:4px}' +
      '.demo-item:hover{background:var(--color-background,#f6f8fb)}.demo-item:active{transform:scale(0.99)}' +
      '.demo-item__icon{width:36px;height:36px;border-radius:10px;background:var(--color-background2,#eef2f7);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}' +
      '.demo-item__content{flex:1;min-width:0}' +
      '.demo-item__title{font-weight:600;font-size:14px;color:var(--color-text,#0f172a);margin-bottom:3px}' +
      '.demo-item__desc{font-size:12px;color:var(--color-text-light,#64748b);line-height:1.4}' +
      '.demo-item__btn{flex-shrink:0;padding:6px 14px;border-radius:8px;border:none;background:#2563eb;color:#fff;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;margin-top:2px}.demo-item__btn:hover{background:#1d4ed8}' +
      '.demo-panel__footer{padding:10px 22px;border-top:1px solid var(--color-border,#e2e8f0);text-align:center}' +
      '.demo-panel__count{font-size:11px;color:var(--color-text-light,#64748b)}' +
      '@keyframes demoSlideIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.92)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}' +
      '@keyframes demoFadeIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}' +
      '.demo-tooltip{animation:demoFadeIn 0.3s ease}' +
      '@media(max-width:768px){.demo-panel{width:85vw;border-radius:16px}.demo-panel__header{padding:14px 16px}.demo-panel__desc{padding:12px 16px;font-size:12px}.demo-item{padding:12px;gap:10px}.demo-item__title{font-size:13px}.demo-item__desc{font-size:11px}.demo-item__btn{font-size:11px;padding:5px 12px}}' +
      '@media(max-width:480px){.demo-fab{bottom:100px;right:16px;width:48px;height:48px}.demo-fab__icon{font-size:17px}.demo-panel{width:94vw;max-height:86vh;border-radius:14px;top:auto;bottom:10px;left:3vw;transform:none;animation:demoSlideUp 0.35s ease}.demo-panel__header{padding:12px 14px}.demo-panel__icon{width:28px;height:28px;font-size:12px}.demo-panel__title{font-size:14px}.demo-panel__close{width:26px;height:26px;font-size:16px}.demo-panel__desc{padding:10px 14px;font-size:11px}.demo-panel__list{padding:6px 8px}.demo-item{padding:10px;gap:8px;border-radius:10px;margin-bottom:3px}.demo-item__icon{width:30px;height:30px;font-size:13px}.demo-item__title{font-size:12px}.demo-item__desc{font-size:11px}.demo-item__btn{font-size:11px;padding:4px 10px}.demo-panel__footer{padding:8px 14px}}' +
      '@keyframes demoSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(css);
  }

  function init() {
    injectStyles();
    createDemoOverlay();
    createDemoPanel();
    var btn = createDemoButton();
    btn.addEventListener('click', openDemo);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDemo();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
