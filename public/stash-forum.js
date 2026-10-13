/* STASH / Invision embed — shop stays hosted on Vercel.
   Load via https://stashpawn.vercel.app/stash-forum.js
   No Supabase secrets or cross-origin checkout API calls on the forum. */
(function () {
  'use strict';
  var script = document.currentScript;
  var root = document.getElementById('stash-forum');
  if (!root) return;
  if (root.dataset.stashMounted === '1') return;
  root.dataset.stashMounted = '1';
  var origin = 'https://stashpawn.vercel.app';
  var embed = document.createElement('div');
  embed.style.cssText = 'width:100%;max-width:900px;margin:0 auto;background:#f3f3ed;color:#20211f;font-family:Arial,Helvetica,sans-serif;border:1px solid #ddd;box-sizing:border-box;';
  var head = document.createElement('div');
  head.style.cssText = 'padding:14px 18px;background:#20211f;color:white;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;';
  var title = document.createElement('strong');
  title.textContent = 'STASH / PAWNSHOP';
  title.style.cssText = 'letter-spacing:2px;font-size:13px;';
  var open = document.createElement('a');
  open.href = origin + '/';
  open.target = '_blank';
  open.rel = 'noopener noreferrer';
  open.textContent = 'OUVRIR EN GRAND ↗';
  open.style.cssText = 'color:#ff865e;font-size:12px;font-weight:bold;text-decoration:none;';
  head.append(title, open);
  var iframe = document.createElement('iframe');
  iframe.src = origin + '/forum.html';
  iframe.title = 'STASH Pawnshop — Boutique interactive';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.style.cssText = 'display:block;border:0;width:100%;height:960px;background:#f3f3ed;';
  var foot = document.createElement('div');
  foot.style.cssText = 'padding:10px 18px;background:#20211f;color:#eee;font-size:12px;';
  foot.textContent = 'Stock, réservations et demandes gérés directement par la boutique STASH.';
  embed.append(head, iframe, foot);
  root.replaceChildren(embed);
  // Accept resize messages only from the trusted Stash storefront iframe.
  window.addEventListener('message', function(event) {
    if (event.origin !== origin || event.source !== iframe.contentWindow) return;
    var data = event.data;
    if (!data || data.type !== 'stash-forum-layout' || !Number.isFinite(data.height)) return;
    var height = Math.max(700, Math.min(12000, Math.ceil(data.height)));
    iframe.style.height = height + 'px';
    if (data.overlay && iframe.getBoundingClientRect().top < -160) {
      // Move the forum viewport to the active checkout without taking focus.
      iframe.scrollIntoView({block:'start',behavior:'smooth'});
    }
  });
})();
