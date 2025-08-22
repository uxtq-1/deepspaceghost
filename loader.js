/* =================================================
   Chattia Loader — Single Entry Point
   - Resolves its own base URL safely
   - Loads CSS + main JS from the same origin/path
   - Adds referrerPolicy, crossorigin; avoids duplicates
   ================================================= */

(function(){
  'use strict';

  // Optional: hardcode if hosting assets elsewhere. Otherwise, auto-detect.
  const SCRIPT_BASE_URL = ''; // e.g., 'https://your-cdn.example.com/chattia'

  // Prevent double-loading
  if (window.__CHATTIA_LOADER__) return;
  window.__CHATTIA_LOADER__ = true;

  // Determine base URL
  const thisScript = document.currentScript;
  let baseUrl = SCRIPT_BASE_URL && SCRIPT_BASE_URL.trim() ? SCRIPT_BASE_URL.trim() : '';
  if (!baseUrl && thisScript && thisScript.src) {
    baseUrl = thisScript.src.substring(0, thisScript.src.lastIndexOf('/'));
  }
  if (!baseUrl) {
    console.error('Chattia Loader: Could not resolve base URL.');
    return;
  }

  // Avoid duplicates
  function alreadyLoaded(hrefOrSrc) {
    const s = [...document.scripts].some(el => el.src === hrefOrSrc);
    const l = [...document.querySelectorAll('link[rel="stylesheet"]')].some(el => el.href === hrefOrSrc);
    return s || l;
  }

  // 1) Load CSS
  const cssHref = `${baseUrl}/chatbot.css`;
  if (!alreadyLoaded(cssHref)) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    cssLink.href = cssHref;
    cssLink.referrerPolicy = 'no-referrer';
    cssLink.crossOrigin = 'anonymous';
    document.head.appendChild(cssLink);
  }

  // 2) Load main JS
  const jsSrc = `${baseUrl}/chatbot.js`;
  if (!alreadyLoaded(jsSrc)) {
    const jsScript = document.createElement('script');
    jsScript.src = jsSrc;
    jsScript.defer = true;
    jsScript.referrerPolicy = 'no-referrer';
    jsScript.crossOrigin = 'anonymous';
    document.head.appendChild(jsScript);
  }
})();
