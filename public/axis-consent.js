/**
 * Axis cookie consent — standalone script. Loaded only when cookie consent is enabled.
 * Reads payload from #axis-snippets-payload (base64 JSON), shows banner or injects snippets.
 */
(function() {
  'use strict';
  var STORAGE_KEY = 'axis_cookie_consent';

  function getPayload() {
    try {
      var el = document.getElementById('axis-snippets-payload');
      if (!el || typeof atob !== 'function') return null;
      var raw = (el.content ? el.content.textContent : el.textContent) || '';
      if (!raw.trim()) return null;
      return JSON.parse(atob(raw.trim()));
    } catch (e) {
      return null;
    }
  }

  function hasSnippets(payload) {
    return payload && ((payload.head && payload.head.trim()) || (payload.bodyEnd && payload.bodyEnd.trim()));
  }

  /**
   * Execute snippet HTML safely. External scripts (with src) are loaded via
   * script elements. Inline scripts are executed via Function() to avoid
   * creating DOM script nodes that trigger Vite HMR reloads in dev.
   */
  function executeSnippetHtml(html, target) {
    if (!html || !target) return;
    try {
      var wrap = document.createElement('div');
      wrap.innerHTML = html;
      var child;
      while ((child = wrap.firstChild)) {
        if (child.tagName === 'SCRIPT') {
          if (child.src) {
            // External script — must create a real script element
            var s = document.createElement('script');
            s.src = child.src;
            for (var i = 0; i < child.attributes.length; i++) {
              var a = child.attributes[i];
              if (a.name !== 'src') s.setAttribute(a.name, a.value);
            }
            s.setAttribute('data-axis-consent', 'true');
            target.appendChild(s);
          } else if (child.textContent && child.textContent.trim()) {
            // Inline script — execute via Function() to avoid DOM mutation
            try { (new Function(child.textContent))(); } catch (e) {}
          }
          wrap.removeChild(child);
        } else {
          target.appendChild(child);
        }
      }
    } catch (e) {}
  }

  function hideBanner() {
    try {
      var b = document.getElementById('axis-cookie-banner');
      if (b) b.remove();
    } catch (e) {}
  }

  function runSnippets(payload) {
    if (!hasSnippets(payload)) return;
    // Prevent re-injection on SPA navigations
    if (window.__axisSnippetsInjected) return;
    window.__axisSnippetsInjected = true;
    try {
      if (payload.head) executeSnippetHtml(payload.head, document.head);
      if (payload.bodyEnd) executeSnippetHtml(payload.bodyEnd, document.body);
    } catch (e) {}
  }

  function sendPageView() {
    try {
      window.dispatchEvent(new CustomEvent('axis:page-view', { detail: { path: location.pathname, url: location.href } }));
    } catch (e) {}
    try {
      if (window.gtag) window.gtag('event', 'page_view', { page_location: location.href, page_title: document.title });
    } catch (e) {}
    try {
      if (window.clarity) {
        window.clarity('set', 'current_url', location.pathname + location.search);
        window.clarity('event', 'virtual_page_view');
      }
    } catch (e) {}
  }

  function showBanner(payload) {
    // Don't show duplicate banner
    if (document.getElementById('axis-cookie-banner')) return;
    try {
      var bar = document.createElement('div');
      bar.id = 'axis-cookie-banner';
      bar.setAttribute('role', 'dialog');
      bar.setAttribute('aria-label', 'Cookie preferences');
      bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;background:var(--surface, #1a1a1a);color:var(--text, #eee);font-size:14px;box-shadow:0 -2px 10px rgba(0,0,0,.2);';
      bar.innerHTML = '<span style="margin-right:8px;">We use optional cookies for analytics.</span><button type="button" id="axis-cookie-necessary" style="padding:6px 12px;cursor:pointer;background:transparent;border:1px solid currentColor;border-radius:6px;color:inherit;font:inherit;">Necessary only</button><button type="button" id="axis-cookie-accept" style="padding:6px 12px;cursor:pointer;background:var(--accent, #b85c38);border:none;border-radius:6px;color:#fff;font:inherit;">Accept all</button>';
      document.body.appendChild(bar);
      document.getElementById('axis-cookie-necessary').onclick = function() {
        try { localStorage.setItem(STORAGE_KEY, 'necessary'); } catch (e) {}
        hideBanner();
      };
      document.getElementById('axis-cookie-accept').onclick = function() {
        try { localStorage.setItem(STORAGE_KEY, 'all'); } catch (e) {}
        runSnippets(payload);
        hideBanner();
      };
    } catch (e) {}
  }

  function run() {
    var payload = getPayload();
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      raw = null;
    }
    var choice = (raw === 'all' || raw === 'necessary') ? raw : null;

    if (choice === 'all') {
      runSnippets(payload);
      try {
        document.addEventListener('astro:page-load', function() {
          setTimeout(sendPageView, 150);
        });
      } catch (e) {}
      return;
    }
    if (choice === 'necessary') return;
    showBanner(payload);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(run, 0);
    });
  } else {
    setTimeout(run, 0);
  }
})();
