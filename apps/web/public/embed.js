/*!
 * Twirl embed. Paste where the configurator should appear:
 *   <div data-twirl-product="PRODUCT_ID"></div>
 *   <script src="https://YOUR-TWIRL-DOMAIN/embed.js" async></script>
 *
 * Optional attributes on the div:
 *   data-height="700"  fixed height in pixels (otherwise it sizes itself to the page width)
 *
 * Events, dispatched on the div (bubbling):
 *   twirl:ready   detail: { productId }
 *   twirl:change  detail: { productId, selections, price: { total, currency } }  (total in cents)
 *
 * No dependencies. Messages are accepted only from Twirl's own origin and only from the frame
 * this script created. Message format: apps/web/src/lib/embed-protocol.ts.
 */
(function () {
  'use strict';
  if (window.__twirlEmbed) return;
  window.__twirlEmbed = true;

  var script =
    document.currentScript ||
    Array.prototype.slice
      .call(document.getElementsByTagName('script'))
      .filter(function (s) {
        return /\/embed\.js(\?|$)/.test(s.src);
      })
      .pop();
  if (!script || !script.src) return;
  var origin = new URL(script.src).origin;
  var frames = [];
  var ID = /^[0-9A-Za-z]{6,32}$/;

  function mount(el) {
    if (el.getAttribute('data-twirl-mounted')) return;
    var id = el.getAttribute('data-twirl-product') || '';
    if (!ID.test(id)) {
      console.warn('[twirl] Invalid product id on', el);
      return;
    }
    el.setAttribute('data-twirl-mounted', 'true');
    var fixed = parseInt(el.getAttribute('data-height') || '', 10);
    var iframe = document.createElement('iframe');
    iframe.src = origin + '/embed/' + encodeURIComponent(id);
    iframe.title = 'Product configurator';
    iframe.loading = 'lazy';
    iframe.allow = 'fullscreen; xr-spatial-tracking';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText =
      'display:block;width:100%;border:0;border-radius:12px;background:transparent;height:' +
      (fixed > 0 ? fixed : 600) +
      'px';
    el.appendChild(iframe);
    frames.push({ el: el, iframe: iframe, id: id, fixed: fixed > 0 });
  }

  function onMessage(event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.source !== 'twirl' || typeof data.productId !== 'string') return;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (event.source !== f.iframe.contentWindow) continue;
      if (data.type === 'resize') {
        var h = Number(data.height);
        if (!f.fixed && isFinite(h) && h >= 200 && h <= 2000) f.iframe.style.height = h + 'px';
      } else if (data.type === 'ready' || data.type === 'change') {
        var detail = { productId: data.productId };
        if (data.type === 'change') {
          detail.selections = data.selections;
          detail.price = data.price;
        }
        f.el.dispatchEvent(
          new CustomEvent('twirl:' + data.type, { detail: detail, bubbles: true }),
        );
      }
      return;
    }
  }

  function scan() {
    var els = document.querySelectorAll('[data-twirl-product]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  window.addEventListener('message', onMessage);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  // Pick up containers added later (single-page stores).
  if (window.MutationObserver) {
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
