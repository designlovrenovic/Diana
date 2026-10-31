/* Interactions and motion.
   Plain JavaScript, no dependencies. Every section's timers and reveals run only
   while that section is on screen; phones get taps and swipes instead of hover. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = !(window.matchMedia && window.matchMedia('(hover: none)').matches);

  // ---------- elements ----------
  var root = $('.cp');
  var sec = {};
  ['hero', 'exp', 'gal', 'art', 'cta', 'foot'].forEach(function (k) { sec[k] = $('[data-r="' + k + '"]'); });
  var ret = $('[data-r="ret"]'), pins = [$('[data-r="p0"]'), $('[data-r="p1"]'), $('[data-r="p2"]')];
  var counters = $$('[data-hc]'), layers = $$('.ipw.b .lay'), rotWords = $$('.rot .rw');
  var steps = $$('.pstep'), ringTexts = $$('.ring .rt'), ring = $('svg.ring'), marker = $('.ring .mk');
  var ringG = $('.ring-g'), lens = $('.lens'), odo = $('.odo-in'), lensImgs = $$('.lens .xl'), media = $('[data-r="media"]');
  var prints = $$('.pc'), fan = $('[data-r="fan"]'), fanIn = $('.fan-in'), captions = $$('[data-ac]');
  var stack = $('.stack'), cards = $$('.stack .card'), badge = $('[data-r="badge"]');
  var mnav = $('.mnav'), mbtn = $('.mbtn');
  var clockEl = $('[data-clock]'), goldenEl = $('[data-golden]');
  var TILT0 = [-7, 4, -3, 6];

  // ---------- state ----------
  var s = { armed: false, step: 0, prevStep: -1, top: 0, lift: -1, seen: {},
    hc: 0, hprev: -1, htick: 0, hov: false, snap: -1, turns: 0, art: 0, dealt: false, vis: {}, act: {}, stick: 0, menu: false,
    clock: '--:--', golden: '' };
  var visNow = {}, actNow = {};
  var queued = false;
  function set(patch) {
    var p = typeof patch === 'function' ? patch(s) : patch;
    for (var k in p) s[k] = p[k];
    if (!queued) { queued = true; Promise.resolve().then(function () { queued = false; render(); }); }
  }

  // ---------- render: state -> DOM ----------
  function cls(el, name) { if (el && el.getAttribute('class') !== name) el.setAttribute('class', name); }
  function hide(el, h) { if (el && el.hidden !== h) el.hidden = h; }
  function join() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  var lastLetters = '';

  function render() {
    var seen = s.seen, vis = s.vis, act = s.act;
    root.classList.toggle('armed', s.armed);
    ['exp', 'gal', 'art', 'cta', 'foot'].forEach(function (k) {
      sec[k].classList.toggle('is-in', !!seen[k]);
      sec[k].classList.toggle('vis', !!vis[k]);
    });

    // hero
    sec.hero.classList.toggle('hov', s.hov);
    ret.classList.toggle('snap', s.snap >= 0);
    counters.forEach(function (el, i) { hide(el, i !== s.hc); });
    layers.forEach(function (el, i) {
      var c = i === s.hc ? (s.htick === 0 ? 'on first' : 'on') : (i === s.hprev ? 'leave' : '');
      cls(el, join('lay', c));
    });
    var letterKey = s.hc + '/' + s.hprev + '/' + s.htick;
    if (letterKey !== lastLetters) {
      lastLetters = letterKey;
      rotWords.forEach(function (el, i) {
        var on = i === s.hc, leave = i === s.hprev;
        var base = s.htick === 0 ? 0.5 : (on ? 0.14 : 0), step = on ? 0.035 : 0.022;
        $$('.rl', el).forEach(function (l, j) { l.style.animationDelay = (base + j * step).toFixed(3) + 's'; });
        cls(el, join('rw', on ? 'on' : (leave ? 'leave' : '')));
      });
    }

    // experience
    steps.forEach(function (el, i) { el.classList.toggle('on', i === s.step); el.setAttribute('aria-pressed', String(i === s.step)); });
    ringTexts.forEach(function (el, i) { cls(el, join('rt', i === s.step ? 'on' : '')); });
    var k = act.exp ? 'k' + (s.stick % 2) : '';
    cls(ring, join('ring', k));
    cls(marker, join('mk', k));
    cls(lens, join('lens', seen.exp ? 'b' + (s.stick % 2) : ''));
    ringG.style.transform = 'rotate(' + (-45 - s.turns * 90) + 'deg)';
    cls(odo, 'odo-in s' + s.step);
    lensImgs.forEach(function (el, i) {
      cls(el, join('xl', !seen.exp ? '' : (i === s.step ? 'on' : (i === s.prevStep ? 'leave' : ''))));
    });

    // artists
    prints.forEach(function (el, i) {
      var tf, a = s.art, off = i - 1.5;
      if (!seen.art) tf = 'translate(0px, 90px) rotate(' + TILT0[i] + 'deg) scale(.86)';
      else {
        var x = off * 0.92 + (i < a ? -0.16 : (i > a ? 0.16 : 0));
        tf = i === a
          ? 'translate(calc(var(--cw) * var(--sp, 1) * ' + x.toFixed(3) + '), calc(var(--cw) * -0.1)) rotate(0deg) scale(1.1)'
          : 'translate(calc(var(--cw) * var(--sp, 1) * ' + x.toFixed(3) + '), ' + (off * off * 12).toFixed(1) + 'px) rotate(' + (off * 8).toFixed(1) + 'deg) scale(.95)';
      }
      el.style.transform = tf;
      el.style.zIndex = i === a ? 10 : 6 - Math.abs(i - a);
      el.style.transitionDelay = s.dealt ? '0s' : (0.15 + i * 0.09).toFixed(2) + 's';
      cls(el, join('pc', !seen.art ? 'pre' : (i === a ? 'act' : '')));
    });
    captions.forEach(function (el, i) { hide(el, i !== s.art); });
    fanIn.style.setProperty('--ac', seen.art ? (-(s.art - 1.5) * 0.92).toFixed(3) : '0');

    // cta: the photo stack
    cards.forEach(function (el, i) {
      cls(el, join('card', 'p' + ((i - s.top + 4) % 4), i === s.lift ? 'lift' : ''));
    });

    // menu + footer
    mnav.classList.toggle('open', s.menu);
    mbtn.setAttribute('aria-expanded', String(s.menu));
    if (clockEl.textContent !== s.clock) clockEl.textContent = s.clock;
    if (goldenEl.textContent !== s.golden) goldenEl.textContent = s.golden;
  }

  // ---------- hero: rotating word + camera viewfinder that follows the cursor ----------
  var snapIdx = -1, mouse = null, jump = false, loopRaf = 0;
  var cur = { x: -300, y: -300, w: 60, h: 60, mx: 0, my: 0 }, tgt = { x: -300, y: -300, w: 60, h: 60, mx: 0, my: 0 };
  function kick() { if (!loopRaf) loopRaf = requestAnimationFrame(loop); }
  function loop() {
    var d = 0;
    if (snapIdx >= 0) {
      var pr = pins[snapIdx].getBoundingClientRect(), hr = sec.hero.getBoundingClientRect();
      tgt.x = pr.left - hr.left - 14; tgt.y = pr.top - hr.top - 14; tgt.w = pr.width + 28; tgt.h = pr.height + 28;
    }
    ['x', 'y', 'w', 'h'].forEach(function (p) { cur[p] += (tgt[p] - cur[p]) * 0.2; d = Math.max(d, Math.abs(tgt[p] - cur[p])); });
    ['mx', 'my'].forEach(function (p) { cur[p] += (tgt[p] - cur[p]) * 0.08; d = Math.max(d, Math.abs(tgt[p] - cur[p]) * 100); });
    ret.style.setProperty('--rx', cur.x.toFixed(1)); ret.style.setProperty('--ry', cur.y.toFixed(1));
    ret.style.setProperty('--rw', cur.w.toFixed(1)); ret.style.setProperty('--rh', cur.h.toFixed(1));
    sec.hero.style.setProperty('--mx', cur.mx.toFixed(3)); sec.hero.style.setProperty('--my', cur.my.toFixed(3));
    loopRaf = d > 0.25 ? requestAnimationFrame(loop) : 0;
  }
  sec.hero.addEventListener('mousemove', function (e) {
    if (!canHover) return;
    var r = sec.hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    mouse = { x: x, y: y };
    tgt.mx = Math.max(-1, Math.min(1, (x / r.width) * 2 - 1));
    tgt.my = Math.max(-1, Math.min(1, (y / r.height) * 2 - 1));
    if (snapIdx < 0) { tgt.x = x - 30; tgt.y = y - 30; tgt.w = 60; tgt.h = 60; }
    if (jump) { ['x', 'y', 'w', 'h'].forEach(function (p) { cur[p] = tgt[p]; }); jump = false; }
    kick();
  });
  sec.hero.addEventListener('mouseenter', function () { if (!canHover) return; jump = true; if (!s.hov) set({ hov: true }); });
  sec.hero.addEventListener('mouseleave', function () {
    if (!canHover) return;
    snapIdx = -1; tgt.mx = 0; tgt.my = 0;
    set({ hov: false, snap: -1 });
    kick();
  });
  pins.forEach(function (el, i) {
    el.addEventListener('mouseenter', function () { if (!canHover) return; snapIdx = i; set({ snap: i }); kick(); });
    el.addEventListener('mouseleave', function () {
      if (!canHover) return;
      snapIdx = -1;
      if (mouse) { tgt.x = mouse.x - 30; tgt.y = mouse.y - 30; tgt.w = 60; tgt.h = 60; }
      set({ snap: -1 });
      kick();
    });
  });
  function heroNext() {
    if (!visNow.hero) return;
    set(function (st) { return { hprev: st.hc, hc: (st.hc + 1) % 3, htick: st.htick + 1 }; });
  }

  // ---------- experience: the lens and its four steps ----------
  var stepT = 0;
  function runSteps() {
    clearTimeout(stepT);
    set(function (st) { return { stick: st.stick + 1 }; });
    stepT = setTimeout(function () { goStep((s.step + 1) % 4); }, 5200);
  }
  function goStep(i) {
    clearTimeout(stepT); stepT = 0;
    if (i !== s.step) set(function (st) { return { prevStep: st.step, step: i, turns: st.turns + ((i - st.step + 4) % 4), stick: st.stick + 1 }; });
    else set(function (st) { return { stick: st.stick + 1 }; });
    if (actNow.exp) stepT = setTimeout(function () { goStep((i + 1) % 4); }, 5200);
  }
  steps.forEach(function (el, i) { el.addEventListener('click', function () { goStep(i); }); });
  media.addEventListener('mousemove', function (e) {
    if (!canHover) return;
    var r = media.getBoundingClientRect();
    media.style.setProperty('--tx', Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)).toFixed(3));
    media.style.setProperty('--ty', Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)).toFixed(3));
  });
  media.addEventListener('mouseleave', function () { media.style.setProperty('--tx', '0'); media.style.setProperty('--ty', '0'); });

  // swipe helpers (phones)
  var sw = null;
  function swipeStart(e) { var t = e.touches && e.touches[0]; sw = t ? { x: t.clientX, y: t.clientY } : null; }
  function swipeDir(e) {
    var t = e.changedTouches && e.changedTouches[0], st = sw;
    sw = null;
    if (!t || !st) return 0;
    var dx = t.clientX - st.x, dy = t.clientY - st.y;
    return Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 ? (dx < 0 ? 1 : -1) : 0;
  }
  media.addEventListener('touchstart', swipeStart, { passive: true });
  media.addEventListener('touchend', function (e) { var d = swipeDir(e); if (d) goStep((s.step + d + 4) % 4); }, { passive: true });

  // ---------- artists: the hand of prints ----------
  var artHover = false, artTapAt = 0, artStarted = false, artT = 0, dealT = 0;
  function startArt() {
    if (artStarted) return;
    artStarted = true;
    dealT = setTimeout(function () { set({ dealt: true }); }, 1700);
    if (reduce) return;
    artT = setInterval(function () {
      if (artHover || !actNow.art || Date.now() - artTapAt < 6000) return;
      set(function (st) { return { art: (st.art + 1) % 4 }; });
    }, 3400);
  }
  prints.forEach(function (el, i) {
    el.addEventListener('mouseenter', function () { if (!canHover) return; artHover = true; if (s.art !== i) set({ art: i }); });
    el.addEventListener('click', function () { artTapAt = Date.now(); if (s.art !== i) set({ art: i }); });
  });
  fan.addEventListener('mousemove', function (e) {
    if (!canHover) return;
    var r = fan.getBoundingClientRect();
    fan.style.setProperty('--fx', Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)).toFixed(3));
    fan.style.setProperty('--fy', Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)).toFixed(3));
  });
  fan.addEventListener('mouseleave', function () { artHover = false; fan.style.setProperty('--fx', '0'); fan.style.setProperty('--fy', '0'); });
  fan.addEventListener('touchstart', swipeStart, { passive: true });
  fan.addEventListener('touchend', function (e) {
    var d = swipeDir(e);
    if (!d) return;
    artTapAt = Date.now();
    set(function (st) { return { art: (st.art + d + 4) % 4 }; });
  }, { passive: true });

  // ---------- cta: the shuffling photo stack ----------
  var stackHover = false, liftT = 0;
  function shuffle(force) {
    if (s.lift >= 0) return;
    if (!force && (stackHover || reduce || !visNow.cta)) return;
    var top = s.top;
    set({ lift: top });
    clearTimeout(liftT);
    liftT = setTimeout(function () { set({ top: (top + 1) % 4, lift: -1 }); }, 560);
  }
  stack.addEventListener('mouseenter', function () { if (canHover) stackHover = true; });
  stack.addEventListener('mouseleave', function () { stackHover = false; });
  stack.addEventListener('click', function () { shuffle(true); });

  // ---------- footer: magnetic badge, Zagreb clock, golden hour ----------
  badge.addEventListener('mousemove', function (e) {
    if (!canHover) return;
    var r = badge.getBoundingClientRect();
    badge.style.setProperty('--bx', ((e.clientX - (r.left + r.width / 2)) * 0.28).toFixed(1));
    badge.style.setProperty('--by', ((e.clientY - (r.top + r.height / 2)) * 0.28).toFixed(1));
  });
  badge.addEventListener('mouseleave', function () { badge.style.setProperty('--bx', '0'); badge.style.setProperty('--by', '0'); });

  function fmt(d) {
    try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zagreb' }).format(d); }
    catch (err) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  }
  // start of this evening's golden hour in Zagreb (sun 6° above the horizon)
  function goldenStart(date) {
    var rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009;
    var lat = 45.815, lng = 15.982, e = rad * 23.4397;
    var d = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var lw = rad * -lng, phi = rad * lat;
    var n = Math.round(d - J0 - lw / (2 * Math.PI));
    var ds = J0 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var w = Math.acos((Math.sin(6 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = J0 + (w + lw) / (2 * Math.PI) + n;
    var J = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return new Date((J + 0.5 - J1970) * dayMs);
  }
  function tickClock() {
    var now = new Date(), gh = goldenStart(now), label = 'today ' + fmt(gh);
    if (now.getTime() > gh.getTime() + 60 * 60000) label = 'tomorrow ' + fmt(goldenStart(new Date(now.getTime() + 86400000)));
    else if (now.getTime() >= gh.getTime()) label = 'is on now';
    set({ clock: fmt(now), golden: label });
  }

  // ---------- phones: full-screen menu ----------
  mbtn.addEventListener('click', function () { set({ menu: true }); });
  $$('.mclose, .mnav a').forEach(function (el) { el.addEventListener('click', function () { if (s.menu) set({ menu: false }); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && s.menu) set({ menu: false }); });

  // ---------- scroll parallax ----------
  var raf = 0;
  function parallax() {
    var vh = window.innerHeight || 800;
    var hr = sec.hero.getBoundingClientRect();
    sec.hero.style.setProperty('--hp', Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height))).toFixed(4));
    ['exp', 'art', 'cta'].forEach(function (k) {
      var r = sec[k].getBoundingClientRect();
      sec[k].style.setProperty('--p', Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))).toFixed(4));
    });
  }
  window.addEventListener('scroll', function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; parallax(); });
  }, { passive: true });

  // ---------- section visibility: reveal once, run timers only while on screen ----------
  function setVis(k, on) {
    if (!!visNow[k] === on) return;
    visNow[k] = on;
    set(function (st) {
      var v = Object.assign({}, st.vis); v[k] = on;
      var n = { vis: v };
      if (on && !st.seen[k]) { var sn = Object.assign({}, st.seen); sn[k] = true; n.seen = sn; }
      return n;
    });
    if (k === 'art' && on) startArt();
  }

  // The parts that move on by themselves (lens steps, artist rotation) start only once
  // the visitor is well into that section, so nothing has advanced before they get there.
  function setAct(k, on) {
    if (!k || !!actNow[k] === on) return;
    actNow[k] = on;
    set(function (st) { var a = Object.assign({}, st.act); a[k] = on; return { act: a }; });
    if (k === 'exp') { if (on) runSteps(); else { clearTimeout(stepT); stepT = 0; } }
  }
  var engage = { exp: media, art: fan };

  // ---------- start ----------
  set({ armed: true });
  render();
  if (typeof IntersectionObserver === 'function') {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        setVis(e.target.getAttribute('data-r'), e.isIntersecting && (e.intersectionRatio >= 0.15 || e.intersectionRect.height >= 240));
      });
    }, { threshold: [0, 0.2, 0.4, 0.7] });
    Object.keys(sec).forEach(function (k) { io.observe(sec[k]); });
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var vh = (e.rootBounds && e.rootBounds.height) || window.innerHeight || 800;
        var k = Object.keys(engage).filter(function (n) { return engage[n] === e.target; })[0];
        setAct(k, e.isIntersecting && (e.intersectionRatio >= 0.75 || e.intersectionRect.height >= vh * 0.6));
      });
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1] });
    Object.keys(engage).forEach(function (k) { io2.observe(engage[k]); });
  } else {
    Object.keys(sec).forEach(function (k) { setVis(k, true); });
    Object.keys(engage).forEach(function (k) { setAct(k, true); });
  }
  setInterval(function () { shuffle(false); }, 3800);
  if (!reduce) setTimeout(function () { heroNext(); setInterval(heroNext, 3800); }, 4600);
  tickClock();
  setInterval(tickClock, 20000);
  parallax();
})();
