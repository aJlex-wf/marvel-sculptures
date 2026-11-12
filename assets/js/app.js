/* ==========================================================================
   MARVEL · Кинетический архив — логика страницы
   ========================================================================== */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const DATA = window.SCULPTURES || [];
  const CATS = window.CATEGORIES || {};

  /* ---------------------------------------------------------------- utils */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f = (n) => Math.round(n * 10) / 10;
  let uidCounter = 0;

  function polar(cx, cy, deg, len) {
    const r = (deg * Math.PI) / 180;
    return [cx + Math.sin(r) * len, cy + Math.cos(r) * len];
  }

  function shade(hex, amt) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = clamp(((n >> 16) & 255) + amt, 0, 255);
    const g = clamp(((n >> 8) & 255) + amt, 0, 255);
    const b = clamp((n & 255) + amt, 0, 255);
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  /* ================================================================
     Генератор кинетической скульптуры (векторная фигура)
     ================================================================ */
  function buildSculpture(s, uid) {
    const p = s.pose || {};
    const bulk = p.bulk || 1;
    const cx = 150 + (p.lean || 0);
    const shoulderY = 138;
    const hipY = 236;
    const headY = 100;
    const shHalf = 24 * bulk;
    const hipHalf = 12.5 * bulk;

    const c0 = s.colors[0];          // основной материал
    const c1 = s.colors[1];          // блик / второй металл
    const c2 = s.colors[2] || s.colors[1]; // энергия

    const gid = "m" + uid;
    const eid = "e" + uid;
    const fid = "f" + uid;

    /* --- конечности --- */
    function arm(sh, a1, bend, l1, l2) {
      const e = polar(sh[0], sh[1], a1, l1);
      const h = polar(e[0], e[1], a1 + bend, l2);
      return { e: e, h: h, a1: a1, a2: a1 + bend };
    }
    function leg(hp, a1, bend, l1, l2) {
      const k = polar(hp[0], hp[1], a1, l1);
      const t = polar(k[0], k[1], a1 + bend, l2);
      return { k: k, t: t, a1: a1, a2: a1 + bend };
    }

    const shL = [cx - shHalf, shoulderY - 3];
    const shR = [cx + shHalf, shoulderY - 3];
    const hipL = [cx - hipHalf, hipY];
    const hipR = [cx + hipHalf, hipY];

    const armA = arm(shR, p.armA[0], p.armA[1], 36 * bulk, 32 * bulk);   // передняя
    const armB = arm(shL, p.armB[0], p.armB[1], 36 * bulk, 32 * bulk);   // задняя
    const legA = leg(hipR, p.legA[0], p.legA[1], 48 * bulk, 46 * bulk);
    const legB = leg(hipL, p.legB[0], p.legB[1], 48 * bulk, 46 * bulk);

    const ctx = {
      s: s, uid: uid, cx: cx, bulk: bulk, c0: c0, c1: c1, c2: c2,
      shoulderY: shoulderY, hipY: hipY, headY: headY,
      shHalf: shHalf, hipHalf: hipHalf,
      armA: armA, armB: armB, legA: legA, legB: legB,
      shL: shL, shR: shR, hipL: hipL, hipR: hipR
    };

    /* --- плащ (обтекаемый, уносится влево) --- */
    let cape = "";
    if (s.cape) {
      const cw = 25 * bulk;
      const cc = s.colors[3] || c0;
      cape =
        '<path d="M' + f(cx + shHalf * 0.92) + ' ' + f(shoulderY - 12) +
        ' C' + f(cx + shHalf * 1.15) + ' ' + f(shoulderY + 56) + ' ' + f(cx + shHalf * 0.78) + ' ' + f(shoulderY + 118) + ' ' + f(cx + shHalf * 0.22) + ' ' + f(shoulderY + 164) +
        ' Q' + f(cx - cw * 1.05) + ' ' + f(shoulderY + 198) + ' ' + f(cx - cw * 2.25) + ' ' + f(shoulderY + 172) +
        ' C' + f(cx - cw * 1.75) + ' ' + f(shoulderY + 108) + ' ' + f(cx - cw * 0.95) + ' ' + f(shoulderY + 46) + ' ' + f(cx - shHalf * 0.92) + ' ' + f(shoulderY - 12) +
        ' Z" fill="url(#' + gid + 'C)" opacity=".96"/>' +
        '<path d="M' + f(cx - shHalf * 0.55) + ' ' + f(shoulderY - 4) +
        ' C' + f(cx - cw * 0.9) + ' ' + f(shoulderY + 62) + ' ' + f(cx - cw * 1.35) + ' ' + f(shoulderY + 120) + ' ' + f(cx - cw * 1.85) + ' ' + f(shoulderY + 168) +
        '" fill="none" stroke="' + shade(cc, -26) + '" stroke-width="1.3" opacity=".55"/>' +
        '<path d="M' + f(cx + shHalf * 0.35) + ' ' + f(shoulderY + 4) +
        ' C' + f(cx + shHalf * 0.55) + ' ' + f(shoulderY + 60) + ' ' + f(cx + shHalf * 0.2) + ' ' + f(shoulderY + 110) + ' ' + f(cx - shHalf * 0.3) + ' ' + f(shoulderY + 150) +
        '" fill="none" stroke="' + shade(cc, -26) + '" stroke-width="1.3" opacity=".45"/>';
    }

    /* --- торс: широкие плечи, узкая талия --- */
    const waistHalf = 17.5 * bulk;
    const torso =
      '<path d="M' + f(cx - shHalf) + ' ' + f(shoulderY) +
      ' C' + f(cx - shHalf - 2.5) + ' ' + f(shoulderY + 16) + ' ' + f(cx - waistHalf - 2) + ' ' + f(shoulderY + 32) + ' ' + f(cx - waistHalf) + ' ' + f(shoulderY + 56) +
      ' C' + f(cx - waistHalf) + ' ' + f(shoulderY + 76) + ' ' + f(cx - hipHalf * 1.05) + ' ' + f(shoulderY + 92) + ' ' + f(cx - hipHalf * 1.05) + ' ' + f(hipY) +
      ' L' + f(cx + hipHalf * 1.05) + ' ' + f(hipY) +
      ' C' + f(cx + hipHalf * 1.05) + ' ' + f(shoulderY + 92) + ' ' + f(cx + waistHalf) + ' ' + f(shoulderY + 76) + ' ' + f(cx + waistHalf) + ' ' + f(shoulderY + 56) +
      ' C' + f(cx + waistHalf + 2) + ' ' + f(shoulderY + 32) + ' ' + f(cx + shHalf + 2.5) + ' ' + f(shoulderY + 16) + ' ' + f(cx + shHalf) + ' ' + f(shoulderY) +
      ' C' + f(cx + 12) + ' ' + f(shoulderY - 11) + ' ' + f(cx - 12) + ' ' + f(shoulderY - 11) + ' ' + f(cx - shHalf) + ' ' + f(shoulderY) + ' Z"' +
      ' fill="url(#' + gid + ')"/>' +
      /* грудные пластины */
      '<path d="M' + f(cx - shHalf * 0.72) + ' ' + f(shoulderY + 12) + ' Q' + f(cx - 4) + ' ' + f(shoulderY + 22) + ' ' + f(cx - 3) + ' ' + f(shoulderY + 44) +
      '" fill="none" stroke="' + shade(c0, -34) + '" stroke-width="1.8" opacity=".55"/>' +
      '<path d="M' + f(cx + shHalf * 0.72) + ' ' + f(shoulderY + 12) + ' Q' + f(cx + 4) + ' ' + f(shoulderY + 22) + ' ' + f(cx + 3) + ' ' + f(shoulderY + 44) +
      '" fill="none" stroke="' + shade(c0, -34) + '" stroke-width="1.8" opacity=".55"/>' +
      /* пояс */
      '<path d="M' + f(cx - waistHalf - 1) + ' ' + f(shoulderY + 84) + ' L' + f(cx + waistHalf + 1) + ' ' + f(shoulderY + 84) +
      '" stroke="' + shade(c0, -38) + '" stroke-width="5" opacity=".75" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + f(cx - waistHalf * 0.5) + ' ' + f(shoulderY + 84) + ' L' + f(cx + waistHalf * 0.5) + ' ' + f(shoulderY + 84) +
      '" stroke="' + shade(c2, -20) + '" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/>';

    /* --- шея --- */
    const neck =
      '<path d="M' + f(cx - 6.5 * bulk) + ' ' + f(headY + 12) +
      ' L' + f(cx - 7.5 * bulk) + ' ' + f(shoulderY + 2) +
      ' L' + f(cx + 7.5 * bulk) + ' ' + f(shoulderY + 2) +
      ' L' + f(cx + 6.5 * bulk) + ' ' + f(headY + 12) + ' Z" fill="' + shade(c0, -22) + '"/>';

    /* --- голова + маски --- */
    let head = "";
    const hr = 19 * bulk;
    const skin = s.colors[4] || "#d9a982";
    const hair = s.colors[5] || shade(c0, -60);
    if (s.mask === "helmet") {
      head =
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY) + '" rx="' + f(hr) + '" ry="' + f(hr * 1.1) + '" fill="url(#' + gid + ')"/>' +
        '<path d="M' + f(cx - hr * 0.92) + ' ' + f(headY - 2) + ' Q' + f(cx) + ' ' + f(headY - 9) + ' ' + f(cx + hr * 0.92) + ' ' + f(headY - 2) +
        ' L' + f(cx + hr * 0.8) + ' ' + f(headY - 4) + ' Q' + f(cx) + ' ' + f(headY - 14) + ' ' + f(cx - hr * 0.8) + ' ' + f(headY - 4) + ' Z" fill="' + shade(c1, 10) + '"/>' +
        '<path d="M' + f(cx - hr * 0.78) + ' ' + f(headY - 1) + ' Q' + f(cx) + ' ' + f(headY - 10) + ' ' + f(cx + hr * 0.78) + ' ' + f(headY - 1) +
        ' Q' + f(cx) + ' ' + f(headY + 5) + ' ' + f(cx - hr * 0.78) + ' ' + f(headY - 1) + ' Z" fill="' + c2 + '" opacity=".9"/>' +
        '<path d="M' + f(cx - hr * 0.55) + ' ' + f(headY + 12) + ' L' + f(cx) + ' ' + f(headY + 17) + ' L' + f(cx + hr * 0.55) + ' ' + f(headY + 12) +
        '" fill="none" stroke="' + shade(c0, -40) + '" stroke-width="1.6" opacity=".6"/>';
    } else if (s.mask === "helm") {
      /* шлем-колпак + крылья + лицо в прорези */
      head =
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY) + '" rx="' + f(hr * 0.98) + '" ry="' + f(hr * 1.08) + '" fill="url(#' + gid + ')"/>' +
        '<path d="M' + f(cx - hr * 0.98) + ' ' + f(headY + 4) + ' L' + f(cx - hr * 2.05) + ' ' + f(headY - 10) + ' L' + f(cx - hr * 1.02) + ' ' + f(headY + 19) + ' Z" fill="url(#' + gid + ')"/>' +
        '<path d="M' + f(cx + hr * 0.98) + ' ' + f(headY + 4) + ' L' + f(cx + hr * 2.05) + ' ' + f(headY - 10) + ' L' + f(cx + hr * 1.02) + ' ' + f(headY + 19) + ' Z" fill="url(#' + gid + ')"/>' +
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY + 6) + '" rx="' + f(hr * 0.62) + '" ry="' + f(hr * 0.6) + '" fill="' + skin + '"/>' +
        '<path d="M' + f(cx - hr * 0.99) + ' ' + f(headY - 2) + ' C' + f(cx - hr * 0.8) + ' ' + f(headY - hr * 1.3) + ' ' + f(cx + hr * 0.8) + ' ' + f(headY - hr * 1.3) + ' ' + f(cx + hr * 0.99) + ' ' + f(headY - 2) +
        ' L' + f(cx + hr * 0.6) + ' ' + f(headY - 2) + ' C' + f(cx + hr * 0.45) + ' ' + f(headY - hr * 0.95) + ' ' + f(cx - hr * 0.45) + ' ' + f(headY - hr * 0.95) + ' ' + f(cx - hr * 0.6) + ' ' + f(headY - 2) + ' Z" fill="url(#' + gid + ')"/>' +
        '<path d="M' + f(cx - hr * 0.42) + ' ' + f(headY + 5) + ' L' + f(cx - hr * 0.16) + ' ' + f(headY + 5) + ' M' + f(cx + hr * 0.16) + ' ' + f(headY + 5) + ' L' + f(cx + hr * 0.42) + ' ' + f(headY + 5) +
        '" stroke="#3a2a24" stroke-width="2" stroke-linecap="round"/>';
    } else if (s.mask === "horns") {
      head =
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY) + '" rx="' + f(hr * 0.94) + '" ry="' + f(hr * 1.08) + '" fill="' + skin + '"/>' +
        '<path d="M' + f(cx - hr * 0.8) + ' ' + f(headY - 8) + ' C' + f(cx - hr * 1.5) + ' ' + f(headY - 26) + ' ' + f(cx - hr * 1.15) + ' ' + f(headY - 44) + ' ' + f(cx - hr * 0.55) + ' ' + f(headY - 38) +
        ' C' + f(cx - hr * 0.8) + ' ' + f(headY - 28) + ' ' + f(cx - hr * 0.9) + ' ' + f(headY - 18) + ' ' + f(cx - hr * 0.86) + ' ' + f(headY - 12) + ' Z" fill="' + c1 + '"/>' +
        '<path d="M' + f(cx + hr * 0.8) + ' ' + f(headY - 8) + ' C' + f(cx + hr * 1.5) + ' ' + f(headY - 26) + ' ' + f(cx + hr * 1.15) + ' ' + f(headY - 44) + ' ' + f(cx + hr * 0.55) + ' ' + f(headY - 38) +
        ' C' + f(cx + hr * 0.8) + ' ' + f(headY - 28) + ' ' + f(cx + hr * 0.9) + ' ' + f(headY - 18) + ' ' + f(cx + hr * 0.86) + ' ' + f(headY - 12) + ' Z" fill="' + c1 + '"/>' +
        '<path d="M' + f(cx - hr * 0.9) + ' ' + f(headY - 6) + ' C' + f(cx - hr * 0.6) + ' ' + f(headY - hr * 1.25) + ' ' + f(cx + hr * 0.6) + ' ' + f(headY - hr * 1.25) + ' ' + f(cx + hr * 0.9) + ' ' + f(headY - 8) +
        ' L' + f(cx + hr * 0.7) + ' ' + f(headY - 14) + ' C' + f(cx + hr * 0.25) + ' ' + f(headY - hr * 1.05) + ' ' + f(cx - hr * 0.25) + ' ' + f(headY - hr * 1.05) + ' ' + f(cx - hr * 0.7) + ' ' + f(headY - 14) + ' Z" fill="' + hair + '"/>' +
        '<path d="M' + f(cx - hr * 0.42) + ' ' + f(headY + 3) + ' L' + f(cx - hr * 0.16) + ' ' + f(headY + 3) + ' M' + f(cx + hr * 0.16) + ' ' + f(headY + 3) + ' L' + f(cx + hr * 0.42) + ' ' + f(headY + 3) +
        '" stroke="#3a2a24" stroke-width="2" stroke-linecap="round"/>';
    } else if (s.mask === "mask") {
      head =
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY) + '" rx="' + f(hr * 0.93) + '" ry="' + f(hr * 1.05) + '" fill="' + skin + '"/>' +
        '<path d="M' + f(cx - hr * 0.98) + ' ' + f(headY - 3) + ' C' + f(cx - hr * 0.72) + ' ' + f(headY - hr * 1.32) + ' ' + f(cx + hr * 0.72) + ' ' + f(headY - hr * 1.32) + ' ' + f(cx + hr * 0.98) + ' ' + f(headY - 5) +
        ' L' + f(cx + hr * 0.84) + ' ' + f(headY - 13) + ' C' + f(cx + hr * 0.28) + ' ' + f(headY - hr * 1.06) + ' ' + f(cx - hr * 0.28) + ' ' + f(headY - hr * 1.06) + ' ' + f(cx - hr * 0.84) + ' ' + f(headY - 13) + ' Z" fill="' + hair + '"/>' +
        '<path d="M' + f(cx - hr * 0.45) + ' ' + f(headY + 2) + ' L' + f(cx - hr * 0.17) + ' ' + f(headY + 2) + ' M' + f(cx + hr * 0.17) + ' ' + f(headY + 2) + ' L' + f(cx + hr * 0.45) + ' ' + f(headY + 2) +
        '" stroke="#3a2a24" stroke-width="2" stroke-linecap="round"/>';
    } else {
      head =
        '<ellipse cx="' + f(cx) + '" cy="' + f(headY) + '" rx="' + f(hr * 0.9) + '" ry="' + f(hr * 1.05) + '" fill="' + skin + '"/>' +
        '<path d="M' + f(cx - hr * 0.98) + ' ' + f(headY - 1) + ' C' + f(cx - hr * 0.82) + ' ' + f(headY - hr * 1.38) + ' ' + f(cx + hr * 0.82) + ' ' + f(headY - hr * 1.38) + ' ' + f(cx + hr * 0.98) + ' ' + f(headY - 5) +
        ' L' + f(cx + hr * 0.86) + ' ' + f(headY - 12) + ' C' + f(cx + hr * 0.3) + ' ' + f(headY - hr * 1.1) + ' ' + f(cx - hr * 0.3) + ' ' + f(headY - hr * 1.1) + ' ' + f(cx - hr * 0.86) + ' ' + f(headY - 10) + ' Z" fill="' + hair + '"/>' +
        '<path d="M' + f(cx - hr * 0.45) + ' ' + f(headY + 2) + ' L' + f(cx - hr * 0.17) + ' ' + f(headY + 2) + ' M' + f(cx + hr * 0.17) + ' ' + f(headY + 2) + ' L' + f(cx + hr * 0.45) + ' ' + f(headY + 2) +
        '" stroke="#3a2a24" stroke-width="2" stroke-linecap="round" opacity=".9"/>';
    }

    /* --- руки / ноги --- */
    const tone = (base, amt) => shade(base, amt);
    const armAPath = (() => {
      const s0 = shR, e = armA.e, h = armA.h;
      return '<g class="sk__body">' +
        '<path d="M' + f(s0[0]) + ' ' + f(s0[1]) + ' L' + f(e[0]) + ' ' + f(e[1]) + '" stroke="' + tone(c0, 8) + '" stroke-width="' + f(17 * bulk) + '"/>' +
        '<circle cx="' + f(e[0]) + '" cy="' + f(e[1]) + '" r="' + f(8.6 * bulk) + '" fill="' + tone(c0, 8) + '"/>' +
        '<path d="M' + f(e[0]) + ' ' + f(e[1]) + ' L' + f(h[0]) + ' ' + f(h[1]) + '" stroke="' + tone(c0, 8) + '" stroke-width="' + f(13 * bulk) + '"/>' +
        '<circle cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="' + f(7.4 * bulk) + '" fill="' + tone(c0, 8) + '"/>' +
        '</g>';
    })();
    const armBPath = (() => {
      const s0 = shL, e = armB.e, h = armB.h;
      return '<g class="sk__body">' +
        '<path d="M' + f(s0[0]) + ' ' + f(s0[1]) + ' L' + f(e[0]) + ' ' + f(e[1]) + '" stroke="' + tone(c0, -34) + '" stroke-width="' + f(17 * bulk) + '"/>' +
        '<circle cx="' + f(e[0]) + '" cy="' + f(e[1]) + '" r="' + f(8.6 * bulk) + '" fill="' + tone(c0, -34) + '"/>' +
        '<path d="M' + f(e[0]) + ' ' + f(e[1]) + ' L' + f(h[0]) + ' ' + f(h[1]) + '" stroke="' + tone(c0, -34) + '" stroke-width="' + f(13 * bulk) + '"/>' +
        '<circle cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="' + f(7.4 * bulk) + '" fill="' + tone(c0, -34) + '"/>' +
        '</g>';
    })();
    const legAPath = (() => {
      const s0 = hipR, k = legA.k, t = legA.t;
      const toe = polar(t[0], t[1], legA.a2 - 6, 13 * bulk);
      return '<g class="sk__body">' +
        '<path d="M' + f(s0[0]) + ' ' + f(s0[1]) + ' L' + f(k[0]) + ' ' + f(k[1]) + '" stroke="' + tone(c0, -6) + '" stroke-width="' + f(20 * bulk) + '"/>' +
        '<circle cx="' + f(k[0]) + '" cy="' + f(k[1]) + '" r="' + f(10 * bulk) + '" fill="' + tone(c0, -6) + '"/>' +
        '<path d="M' + f(k[0]) + ' ' + f(k[1]) + ' L' + f(t[0]) + ' ' + f(t[1]) + '" stroke="' + tone(c0, -6) + '" stroke-width="' + f(14.5 * bulk) + '"/>' +
        '<path d="M' + f(t[0]) + ' ' + f(t[1]) + ' L' + f(toe[0]) + ' ' + f(toe[1]) + '" stroke="' + tone(c0, -22) + '" stroke-width="' + f(9.5 * bulk) + '" stroke-linecap="round"/>' +
        '</g>';
    })();
    const legBPath = (() => {
      const s0 = hipL, k = legB.k, t = legB.t;
      const toe = polar(t[0], t[1], legB.a2 - 6, 13 * bulk);
      return '<g class="sk__body">' +
        '<path d="M' + f(s0[0]) + ' ' + f(s0[1]) + ' L' + f(k[0]) + ' ' + f(k[1]) + '" stroke="' + tone(c0, -32) + '" stroke-width="' + f(20 * bulk) + '"/>' +
        '<circle cx="' + f(k[0]) + '" cy="' + f(k[1]) + '" r="' + f(10 * bulk) + '" fill="' + tone(c0, -32) + '"/>' +
        '<path d="M' + f(k[0]) + ' ' + f(k[1]) + ' L' + f(t[0]) + ' ' + f(t[1]) + '" stroke="' + tone(c0, -32) + '" stroke-width="' + f(14.5 * bulk) + '"/>' +
        '<path d="M' + f(t[0]) + ' ' + f(t[1]) + ' L' + f(toe[0]) + ' ' + f(toe[1]) + '" stroke="' + tone(c0, -44) + '" stroke-width="' + f(9.5 * bulk) + '" stroke-linecap="round"/>' +
        '</g>';
    })();

    /* --- реквизит --- */
    const prop = buildProp(ctx);

    /* --- кинетические элементы --- */
    const kin = buildKinetic(ctx);

    /* --- постамент (по уровню стоп) --- */
    const footY = Math.max(legA.t[1], legB.t[1], legA.k[1], legB.k[1]);
    const plinthY = Math.min(352, Math.max(footY + 14, 250));
    const plinth =
      '<g class="sk__plinth">' +
      '<ellipse cx="150" cy="' + f(plinthY + 2) + '" rx="70" ry="13" fill="rgba(0,0,0,.5)"/>' +
      '<path d="M66 ' + f(plinthY) + ' L72 ' + f(plinthY + 22) + ' L228 ' + f(plinthY + 22) + ' L234 ' + f(plinthY) + ' Z" fill="#080a10" stroke="rgba(255,255,255,.07)"/>' +
      '<ellipse cx="150" cy="' + f(plinthY) + '" rx="84" ry="16" fill="#0d1018" stroke="rgba(255,255,255,.12)"/>' +
      '<ellipse cx="150" cy="' + f(plinthY - 2) + '" rx="70" ry="12" fill="none" stroke="rgba(255,255,255,.05)"/>' +
      '</g>';

    const defs =
      '<defs>' +
      '<linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c1 + '"/>' +
      '<stop offset=".38" stop-color="' + c0 + '"/>' +
      '<stop offset="1" stop-color="' + shade(c0, -46) + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gid + 'C" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + shade(s.colors[3] || c0, 22) + '"/>' +
      '<stop offset="1" stop-color="' + shade(s.colors[3] || c0, -40) + '"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + eid + '" cx=".5" cy=".5" r=".5">' +
      '<stop offset="0" stop-color="' + c2 + '" stop-opacity=".95"/>' +
      '<stop offset=".55" stop-color="' + c2 + '" stop-opacity=".28"/>' +
      '<stop offset="1" stop-color="' + c2 + '" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + fid + '" cx=".5" cy=".5" r=".5">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".55"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>';

    return '<svg class="sk" viewBox="-45 25 390 400" xmlns="' + SVG_NS + '" role="img" aria-label="Кинетическая скульптура: ' + s.name + '">' +
      defs +
      '<ellipse cx="150" cy="250" rx="140" ry="150" fill="url(#' + fid + ')"/>' +
      plinth +
      kin.back +
      '<g class="sk__figure sk__metal">' +
      cape + legBPath + armBPath + torso + neck + legAPath + armAPath + head +
      '</g>' +
      prop +
      kin.front +
      '</svg>';
  }

  /* ---------------------------------------------------------------- props */
  function buildProp(c) {
    const { c0, c1, c2, cx, bulk } = c;
    const tone = (base, amt) => shade(base, amt);
    const handA = c.armA.h;
    const handB = c.armB.h;
    const chest = [cx, c.shoulderY + 44];
    let out = "";

    switch (c.s.prop) {
      case "reactor": {
        out +=
          '<g class="sk__fx">' +
          '<circle cx="' + f(chest[0]) + '" cy="' + f(chest[1]) + '" r="25" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(chest[0]) + '" cy="' + f(chest[1]) + '" r="11.5" fill="none" stroke="' + c2 + '" stroke-width="2.4"/>' +
          '<circle cx="' + f(chest[0]) + '" cy="' + f(chest[1]) + '" r="6" fill="' + c2 + '"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="17" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="6.5" fill="' + c2 + '"/>' +
          '<circle cx="' + f(handB[0]) + '" cy="' + f(handB[1]) + '" r="12" fill="url(#e' + c.uid + ')" opacity=".7"/>' +
          '</g>';
        break;
      }
      case "shield": {
        const r = 34;
        out +=
          '<g class="sk__fx" transform="rotate(-12 ' + f(handA[0]) + ' ' + f(handA[1]) + ')">' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="' + r + '" fill="url(#m' + c.uid + ')"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="' + (r - 5) + '" fill="none" stroke="' + c1 + '" stroke-width="3"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="' + (r - 11) + '" fill="none" stroke="' + c0 + '" stroke-width="2" opacity=".7"/>' +
          '<path d="M' + f(handA[0]) + ' ' + f(handA[1] - 15) + ' L' + f(handA[0] + 4.5) + ' ' + f(handA[1] - 4.5) + ' L' + f(handA[0] + 14) + ' ' + f(handA[1] - 4.5) +
          ' L' + f(handA[0] + 7) + ' ' + f(handA[1] + 2) + ' L' + f(handA[0] + 9) + ' ' + f(handA[1] + 12) + ' L' + f(handA[0]) + ' ' + f(handA[1] + 6) +
          ' L' + f(handA[0] - 9) + ' ' + f(handA[1] + 12) + ' L' + f(handA[0] - 7) + ' ' + f(handA[1] + 2) + ' L' + f(handA[0] - 14) + ' ' + f(handA[1] - 4.5) +
          ' L' + f(handA[0] - 4.5) + ' ' + f(handA[1] - 4.5) + ' Z" fill="' + c1 + '"/>' +
          '<path d="M' + f(handA[0] - r + 8) + ' ' + f(handA[1] - 12) + ' A' + (r - 6) + ' ' + (r - 6) + ' 0 0 1 ' + f(handA[0] + 4) + ' ' + f(handA[1] - r + 7) +
          '" fill="none" stroke="#fff" stroke-width="2.5" opacity=".45" stroke-linecap="round"/>' +
          '</g>';
        break;
      }
      case "hammer": {
        /* рукоять продолжает линию плеча — молот уходит вверх */
        const shaft = c.armA.a1 - 4;
        const dir = polar(handA[0], handA[1], shaft, 58);
        const p1 = polar(dir[0], dir[1], shaft + 90, 19);
        const p2 = polar(dir[0], dir[1], shaft - 90, 19);
        const q1 = polar(p1[0], p1[1], shaft, 15);
        const q2 = polar(p2[0], p2[1], shaft, 15);
        out +=
          '<g class="sk__fx">' +
          '<path d="M' + f(handA[0]) + ' ' + f(handA[1]) + ' L' + f(dir[0]) + ' ' + f(dir[1]) + '" stroke="' + shade(c1, -46) + '" stroke-width="7" stroke-linecap="round"/>' +
          '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(q1[0]) + ' ' + f(q1[1]) + ' L' + f(q2[0]) + ' ' + f(q2[1]) + ' L' + f(p2[0]) + ' ' + f(p2[1]) + ' Z"' +
          ' fill="url(#' + "m" + c.uid + ')" stroke="' + shade(c1, -50) + '" stroke-width="1"/>' +
          '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(q1[0]) + ' ' + f(q1[1]) + '" stroke="' + shade(c1, 26) + '" stroke-width="3" opacity=".8"/>' +
          '<circle cx="' + f(dir[0]) + '" cy="' + f(dir[1]) + '" r="14" fill="url(#e' + c.uid + ')" opacity=".5" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="16" fill="url(#e' + c.uid + ')" opacity=".7"/>' +
          '<g class="sk__arc" stroke="' + c2 + '"><path d="M' + f(handA[0] + 22) + ' ' + f(handA[1] - 34) + ' L' + f(handA[0] + 8) + ' ' + f(handA[1] - 18) +
          ' L' + f(handA[0] + 24) + ' ' + f(handA[1] - 6) + ' L' + f(handA[0] + 10) + ' ' + f(handA[1] + 10) + '"/></g>' +
          '</g>';
        break;
      }
      case "batons": {
        function baton(h, ang) {
          const e = polar(h[0], h[1], ang, 38);
          return '<path d="M' + f(h[0]) + ' ' + f(h[1]) + ' L' + f(e[0]) + ' ' + f(e[1]) + '" stroke="' + shade(c1, -10) + '" stroke-width="5.5" stroke-linecap="round"/>' +
            '<circle cx="' + f(e[0]) + '" cy="' + f(e[1]) + '" r="3" fill="' + c2 + '"/>';
        }
        out += '<g class="sk__fx">' + baton(handA, c.armA.a2 + 40) + baton(handB, c.armB.a2 - 40) +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="10" fill="url(#e' + c.uid + ')" opacity=".6"/>' +
          '<circle cx="' + f(handB[0]) + '" cy="' + f(handB[1]) + '" r="10" fill="url(#e' + c.uid + ')" opacity=".6"/></g>';
        break;
      }
      case "web": {
        let lines = "";
        for (let i = 0; i < 9; i++) {
          const a = -60 + i * 15;
          const e = polar(handA[0], handA[1], a, 140);
          lines += '<path d="M' + f(handA[0]) + ' ' + f(handA[1]) + ' L' + f(e[0]) + ' ' + f(e[1]) + '"/>';
        }
        out +=
          '<g class="sk__fx">' +
          '<g class="sk__web" stroke="' + c1 + '" stroke-width="1.2" opacity=".75">' + lines + '</g>' +
          '<g class="sk__web" stroke="' + c2 + '" stroke-width="1.4" opacity=".55">' +
          '<path d="M' + f(handA[0]) + ' ' + f(handA[1]) + ' A46 46 0 0 1 ' + f(handA[0] + 46) + ' ' + f(handA[1] + 10) + '"/>' +
          '<path d="M' + f(handA[0]) + ' ' + f(handA[1]) + ' A78 78 0 0 1 ' + f(handA[0] + 76) + ' ' + f(handA[1] + 18) + '"/>' +
          '</g>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="9" fill="url(#e' + c.uid + ')" opacity=".8"/>' +
          '</g>';
        break;
      }
      case "cannon": {
        const dir = polar(c.shR[0], c.shR[1], 70, 46);
        const dir2 = polar(c.shL[0], c.shL[1], 118, 40);
        out +=
          '<g class="sk__fx">' +
          '<path d="M' + f(c.shR[0]) + ' ' + f(c.shR[1]) + ' L' + f(dir[0]) + ' ' + f(dir[1]) + '" stroke="' + shade(c1, -24) + '" stroke-width="15" stroke-linecap="round"/>' +
          '<circle cx="' + f(dir[0]) + '" cy="' + f(dir[1]) + '" r="10.5" fill="none" stroke="' + shade(c1, -6) + '" stroke-width="3"/>' +
          '<circle cx="' + f(dir[0]) + '" cy="' + f(dir[1]) + '" r="7" fill="' + c2 + '" opacity=".85"/>' +
          '<circle cx="' + f(dir[0]) + '" cy="' + f(dir[1]) + '" r="20" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '<path d="M' + f(c.shL[0]) + ' ' + f(c.shL[1]) + ' L' + f(dir2[0]) + ' ' + f(dir2[1]) + '" stroke="' + shade(c1, -30) + '" stroke-width="13" stroke-linecap="round"/>' +
          '<circle cx="' + f(dir2[0]) + '" cy="' + f(dir2[1]) + '" r="6" fill="' + shade(c2, -30) + '"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="14" fill="url(#e' + c.uid + ')" opacity=".75"/>' +
          '</g>';
        break;
      }
      case "staff": {
        /* посох вертикально: 180° — вверх, 0° — вниз */
        const top = polar(handA[0], handA[1], 180, 92);
        const bot = polar(handA[0], handA[1], 0, 46);
        out +=
          '<g class="sk__fx">' +
          '<path d="M' + f(top[0]) + ' ' + f(top[1]) + ' L' + f(bot[0]) + ' ' + f(bot[1]) + '" stroke="' + shade(c1, -18) + '" stroke-width="6" stroke-linecap="round"/>' +
          '<circle cx="' + f(top[0]) + '" cy="' + f(top[1]) + '" r="11" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(top[0]) + '" cy="' + f(top[1]) + '" r="6" fill="' + c2 + '"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="11" fill="url(#e' + c.uid + ')" opacity=".6"/>' +
          '</g>';
        break;
      }
      case "runes": {
        let ticks = "";
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * 360;
          const p1 = polar(cx, 196, a, 96);
          const p2 = polar(cx, 196, a, 86);
          ticks += '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(p2[0]) + ' ' + f(p2[1]) + '"/>';
        }
        out +=
          '<g class="sk__fx">' +
          '<circle cx="' + f(cx) + '" cy="196" r="96" fill="none" stroke="' + c2 + '" stroke-width="1.2" opacity=".45" stroke-dasharray="6 10"/>' +
          '<circle cx="' + f(cx) + '" cy="196" r="78" fill="none" stroke="' + c2 + '" stroke-width="1" opacity=".35" stroke-dasharray="2 8"/>' +
          '<g class="sk__web" stroke="' + c2 + '" stroke-width="1.4" opacity=".6">' + ticks + '</g>' +
          '<circle cx="' + f(cx) + '" cy="196" r="96" fill="url(#e' + c.uid + ')" opacity=".22" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(handA[0]) + '" cy="' + f(handA[1]) + '" r="14" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '<circle cx="' + f(handB[0]) + '" cy="' + f(handB[1]) + '" r="14" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
          '</g>';
        break;
      }
      case "swarm": {
        let dots = "";
        for (let i = 0; i < 22; i++) {
          const ang = (i * 137.5) % 360;
          const rad = 42 + ((i * 23) % 70);
          const p1 = polar(cx + 20, 240, ang, rad);
          dots += '<circle cx="' + f(p1[0]) + '" cy="' + f(p1[1]) + '" r="' + f(1.6 + (i % 3) * 0.7) + '" fill="' + c2 + '"/>';
        }
        out += '<g class="sk__fx sk__swarm" style="--dur:9s">' + dots + '</g>';
        break;
      }
      case "photon": {
        function orb(h, r) {
          return '<circle cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="' + r + '" fill="url(#e' + c.uid + ')" class="sk__glow-pulse"/>' +
            '<circle cx="' + f(h[0]) + '" cy="' + f(h[1]) + '" r="' + (r * 0.34) + '" fill="#fff" opacity=".9"/>';
        }
        let rays = "";
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * 360 + 12;
          const p1 = polar(handA[0], handA[1], a, 26);
          const p2 = polar(handA[0], handA[1], a, 58);
          rays += '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(p2[0]) + ' ' + f(p2[1]) + '"/>';
        }
        out +=
          '<g class="sk__fx">' +
          '<g class="sk__web" stroke="' + c2 + '" stroke-width="1.6" opacity=".55">' + rays + '</g>' +
          orb(handA, 26) + orb(handB, 16) +
          '</g>';
        break;
      }
      default:
        break;
    }
    return out;
  }

  /* -------------------------------------------------------------- kinetic */
  function buildKinetic(c) {
    const cx = c.cx;
    const acc = c.c2;
    const back =
      '<g class="sk__fx sk__fx--back" style="transform-origin:' + f(cx) + 'px 250px">' +
      '<ellipse class="sk__ring sk__ring--rev" style="--dur:34s; transform-origin:' + f(cx) + 'px 250px" cx="' + f(cx) + '" cy="250" rx="122" ry="46" stroke="' + acc + '" stroke-width="1.4" stroke-dasharray="16 22" opacity=".55"/>' +
      '<ellipse class="sk__ring" style="--dur:26s; transform-origin:' + f(cx) + 'px 250px" cx="' + f(cx) + '" cy="250" rx="96" ry="150" stroke="' + acc + '" stroke-width="1" stroke-dasharray="4 18" opacity=".4"/>' +
      '</g>';
    const front =
      '<g class="sk__fx" style="transform-origin:' + f(cx) + 'px 250px">' +
      '<circle class="sk__node" style="--dur:15s; transform-origin:' + f(cx) + 'px 250px" cx="' + f(cx) + '" cy="104" r="4" fill="' + acc + '" opacity=".9"/>' +
      '<circle class="sk__node" style="--dur:21s; transform-origin:' + f(cx) + 'px 250px" cx="' + f(cx) + '" cy="160" r="2.6" fill="' + acc + '" opacity=".75"/>' +
      '<circle class="sk__node" style="--dur:11s; transform-origin:' + f(cx) + 'px 250px" cx="' + f(cx) + '" cy="290" r="3" fill="' + acc + '" opacity=".8"/>' +
      '<path d="M' + f(cx - 104) + ' 120 Q' + f(cx) + ' 74 ' + f(cx + 104) + ' 120" fill="none" stroke="' + acc + '" stroke-width="1" opacity=".22" stroke-dasharray="3 12"/>' +
      '<path d="M' + f(cx - 86) + ' 340 Q' + f(cx) + ' 372 ' + f(cx + 86) + ' 340" fill="none" stroke="' + acc + '" stroke-width="1" opacity=".2" stroke-dasharray="3 12"/>' +
      '</g>';
    return { back: back, front: front };
  }

  /* ================================================================
     Рендер коллекции
     ================================================================ */
  const grid = $("#grid");
  const gridEmpty = $("#grid-empty");

  const STAT_LABELS = { power: "Сила", speed: "Скорость", tech: "Технология", endurance: "Ресурс" };

  function statBars(stats) {
    return Object.keys(STAT_LABELS)
      .map(function (k) {
        return '<div class="bar"><span class="bar__label">' + STAT_LABELS[k] + '</span>' +
          '<span class="bar__track"><span class="bar__fill" data-w="' + stats[k] + '"></span></span></div>';
      })
      .join("");
  }

  function cardMarkup(s, index) {
    const cat = (s.cats && s.cats[0]) || "";
    const catName = CATS[cat] || "";
    return (
      '<article class="card" data-id="' + s.id + '" data-cats="' + s.cats.join(" ") + '" style="animation-delay:' + index * 60 + 'ms">' +
      '<div class="card__frame">' +
      '<span class="card__badge">№ ' + s.num + '</span>' +
      '<span class="card__cat">' + catName + '</span>' +
      '<div class="card__art">' + buildSculpture(s, "c" + s.id + ++uidCounter) + '</div>' +
      '</div>' +
      '<div class="card__body">' +
      '<h3>' + s.name + '</h3>' +
      '<p class="card__codename">' + s.codename + '</p>' +
      '<p class="card__meta"><span><b>' + s.year + '</b> год</span><span><b>' + s.height + '</b></span><span><b>' + s.weight + '</b></span></p>' +
      '<div class="card__stats">' + statBars(s.stats) + '</div>' +
      '<button class="card__open" type="button" data-open="' + s.id + '">Рассмотреть</button>' +
      '</div>' +
      '</article>'
    );
  }

  function renderGrid() {
    grid.innerHTML = DATA.map(cardMarkup).join("");
    fillBars();
  }

  /* Ширина полос начисляется синхронно: принудительный reflow фиксирует
     начальное состояние (width: 0), после чего transition отрабатывает. */
  function fillBars(scope) {
    const bars = $$(".bar__fill", scope || document);
    if (!bars.length) return;
    bars[0].getBoundingClientRect();
    bars.forEach(function (el) {
      el.style.width = el.dataset.w + "%";
    });
  }

  /* ================================================================
     Фильтры
     ================================================================ */
  let currentFilter = "all";

  function applyFilter(key) {
    currentFilter = key;
    let shown = 0;
    $$(".card", grid).forEach(function (card) {
      const cats = (card.dataset.cats || "").split(" ");
      const match = key === "all" || cats.indexOf(key) > -1;
      card.classList.toggle("is-hidden", !match);
      if (match) {
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "";
        shown++;
      }
    });
    gridEmpty.hidden = shown !== 0;
    fillBars(grid);
  }

  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".filter").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      applyFilter(btn.dataset.filter);
    });
  });

  /* ================================================================
     Модальное окно
     ================================================================ */
  const modal = $("#modal");
  const mTurn = $("#m-turn");
  const mRot = $("#m-rot");
  const mSpin = $("#m-spin");
  let currentIndex = 0;
  let spinning = false;
  let spinTimer = null;
  let rot = 0;
  let lastFocus = null;

  function fillModal(s) {
    $("#m-num").textContent = "№ " + s.num;
    $("#m-title").textContent = s.name;
    $("#m-codename").textContent = s.codename;
    $("#m-desc").textContent = s.desc;
    $("#m-quote").textContent = s.quote;

    const specs = [
      ["Год создания", s.year],
      ["Серия", s.series],
      ["Материалы", s.material],
      ["Высота", s.height],
      ["Вес", s.weight],
      ["Механизм", s.mechanism],
      ["Категория", (s.cats || []).map(function (c) { return CATS[c]; }).join(" · ")],
      ["Примечание", s.note]
    ];
    $("#m-specs").innerHTML = specs.map(function (row) {
      return "<div><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
    }).join("");

    $("#m-stats").innerHTML = statBars(s.stats);
    mTurn.innerHTML = buildSculpture(s, "m" + s.id + ++uidCounter);
    fillBars($("#m-stats"));
  }

  function openModal(id) {
    const idx = DATA.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    currentIndex = idx;
    rot = 0;
    mRot.value = 0;
    mTurn.style.setProperty("--rot", "0deg");
    fillModal(DATA[idx]);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    lastFocus = document.activeElement;
    $(".modal__close", modal).focus();
    startSpin();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    stopSpin();
    if (lastFocus) lastFocus.focus();
  }

  function step(delta) {
    currentIndex = (currentIndex + delta + DATA.length) % DATA.length;
    fillModal(DATA[currentIndex]);
    rot = 0;
    mTurn.style.setProperty("--rot", "0deg");
    mRot.value = 0;
  }

  function startSpin() {
    if (spinning) return;
    spinning = true;
    mSpin.setAttribute("aria-pressed", "true");
    let last = Date.now();
    const loop = function () {
      if (!spinning) return;
      const now = Date.now();
      const dt = Math.min(80, now - last);
      last = now;
      rot = (rot + dt * 0.021) % 360;
      mTurn.style.setProperty("--rot", rot.toFixed(2) + "deg");
      spinTimer = setTimeout(loop, 16);
    };
    spinTimer = setTimeout(loop, 16);
  }

  function stopSpin() {
    spinning = false;
    if (spinTimer) clearTimeout(spinTimer);
    spinTimer = null;
    if (mSpin) mSpin.setAttribute("aria-pressed", "false");
  }

  document.addEventListener("click", function (e) {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      openModal(opener.dataset.open);
      return;
    }
    if (e.target.closest("[data-close]")) closeModal();
  });

  $("#m-prev").addEventListener("click", function () { step(-1); });
  $("#m-next").addEventListener("click", function () { step(1); });
  mSpin.addEventListener("click", function () {
    if (spinning) { stopSpin(); } else { startSpin(); }
  });
  mRot.addEventListener("input", function () {
    stopSpin();
    rot = parseFloat(mRot.value);
    mTurn.style.setProperty("--rot", rot + "deg");
  });

  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ================================================================
     Шапка, навигация, прогресс
     ================================================================ */
  const header = $("#site-header");
  const progressBar = $("#progress-bar");
  const nav = $("#nav");
  const burger = $("#burger");

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-stuck", y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    let current = "";
    $$("section[id]").forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= 140) current = sec.id;
    });
    $$(".nav a").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", function () {
    const open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ================================================================
     Переключатель движения
     ================================================================ */
  const motionBtn = $("#motion-toggle");
  motionBtn.addEventListener("click", function () {
    const on = document.body.dataset.motion === "on";
    document.body.dataset.motion = on ? "off" : "on";
    motionBtn.setAttribute("aria-pressed", String(!on));
  });

  /* ================================================================
     Появление секций и счётчики
     ================================================================ */
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px" });

  function observeReveals() {
    $$(".reveal").forEach(function (el) { io.observe(el); });
  }

  const counterIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1500;
      const t0 = Date.now();
      const tick = function () {
        const pr = clamp((Date.now() - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - pr, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (pr < 1) setTimeout(tick, 16);
      };
      tick();
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$("[data-count]").forEach(function (el) { counterIO.observe(el); });

  /* ================================================================
     Фон: угли
     ================================================================ */
  function initEmbers() {
    const cv = $("#embers");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    let parts = [];
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      w = rect.width; h = rect.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, w * h / 16000));
      parts = [];
      for (let i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.9 + 0.4,
          vy: -(Math.random() * 0.32 + 0.06),
          vx: (Math.random() - 0.5) * 0.18,
          a: Math.random() * 0.6 + 0.15,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.72 ? "240,180,120" : "230,36,41"
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y += p.vy;
        p.x += p.vx + (mouse.x - 0.5) * 0.28;
        p.tw += 0.02;
        if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 10;
        if (p.x > w + 12) p.x = -10;
        const alpha = p.a * (0.55 + Math.sin(p.tw) * 0.45);
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + p.hue + "," + alpha.toFixed(3) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      setTimeout(frame, 16);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    });
    resize();
    frame();
  }

  /* ================================================================
     Форма записи
     ================================================================ */
  const form = $("#visit-form");
  const formMsg = $("#form-msg");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = form.elements.name;
    const email = form.elements.email;
    const date = form.elements.date;
    let ok = true;
    [name, email, date].forEach(function (el) {
      const valid = el.checkValidity();
      el.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      formMsg.textContent = "Проверьте поля — кажется, что-то пропущено.";
      return;
    }
    const d = date.value.split("-").reverse().join(".");
    formMsg.textContent = "Готово, " + name.value.trim() + "! Забронировано на " + d + ". Письмо с деталями отправлено на " + email.value.trim() + ".";
    form.reset();
  });

  /* ================================================================
     Hero: кинетическое ядро — 3D-сцена на canvas, реагирует на курсор
     ================================================================ */
  function initCore() {
    const cv = $("#piece");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const hero = $(".hero");

    /* --- математика --- */
    const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
    const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
    const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
    const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

    /* --- икосаэдр: 12 вершин, 20 граней --- */
    const t = (1 + Math.sqrt(5)) / 2;
    const ICO_V = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    const ICO_F = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    /* --- орбитальные кольца --- */
    const RINGS = [
      { r: 1.00, tx: 1.40, ty: 0.10, spin: 0.26, phase: 0, w: 4.6, seg: 84, hue: 0 },
      { r: 0.86, tx: 0.30, ty: 1.10, spin: -0.34, phase: 1.1, w: 3.4, seg: 84, hue: 1 },
      { r: 0.72, tx: 1.05, ty: 0.95, spin: 0.46, phase: 2.3, w: 2.4, seg: 72, hue: 2 },
      { r: 0.56, tx: 0.12, ty: 0.05, spin: -0.62, phase: 0.6, w: 1.8, seg: 64, hue: 1 },
      { r: 1.14, tx: 1.55, ty: 0.62, spin: 0.16, phase: 3.4, w: 2.2, seg: 88, hue: 2 }
    ];

    /* --- состояние --- */
    const S = {
      w: 0, h: 0, dpr: 1,
      px: 0, py: 0,          // курсор в координатах канваса
      tx: 0, ty: 0,          // целевая позиция курсора
      active: 0,             // 0..1 — наведение
      tiltX: 0, tiltY: 0,    // наклон сцены
      glow: 0,               // свечение ядра
      t: 0
    };

    const PARTICLES = [];
    const PCOUNT = 220;

    function seedParticles() {
      PARTICLES.length = 0;
      for (let i = 0; i < PCOUNT; i++) {
        const x = (Math.random() - 0.5) * 3.4;
        const y = (Math.random() - 0.5) * 3.0;
        const z = (Math.random() - 0.5) * 2.6;
        PARTICLES.push({
          x: x, y: y, z: z,
          hx: x, hy: y, hz: z,
          vx: 0, vy: 0, vz: 0,
          r: Math.random() * 1.7 + 0.5,
          a: Math.random() * 0.5 + 0.2
        });
      }
    }

    function resize() {
      const rect = cv.getBoundingClientRect();
      if (!rect.width) return;
      S.dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.w = rect.width; S.h = rect.height;
      cv.width = Math.round(rect.width * S.dpr);
      cv.height = Math.round(rect.height * S.dpr);
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    }

    /* --- проекция --- */
    function makeCam() {
      const R = Math.min(S.w, S.h) * 0.345;
      return { cx: S.w * 0.5, cy: S.h * 0.46, R: R, f: 3.4 };
    }
    function project(p, cam) {
      const sc = cam.f / (cam.f - p[2]);
      return [cam.cx + p[0] * cam.R * sc, cam.cy + p[1] * cam.R * sc, p[2], sc];
    }

    /* --- цвет стальной ленты по глубине и блику --- */
    function steelRGB(lum, warm, bounce) {
      const l = Math.max(0, Math.min(1.4, lum));
      let r = 26 + 214 * l;
      let g = 31 + 194 * l;
      let b = 44 + 150 * l;
      if (warm) { r += 16 * l; g -= 5 * l; b -= 20 * l; }
      if (bounce) { r += 74 * bounce; g -= 16 * bounce; b -= 30 * bounce; }
      return [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
    }
    function steel(lum, warm, bounce) {
      const c = steelRGB(lum, warm, bounce);
      return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
    }

    const LIGHT = norm([-0.42, -0.72, 0.55]);      // ключевой
    const BOUNCE = norm([0.12, 0.94, -0.32]);      // отражение снизу (тёплое)

    function drawRing(ring, cam, spin, alpha) {
      const pts = [];
      for (let i = 0; i <= ring.seg; i++) {
        const a = (i / ring.seg) * Math.PI * 2;
        let p = [Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0];
        p = rotZ(p, spin);
        p = rotX(p, ring.tx);
        p = rotY(p, ring.ty);
        p = rotX(p, S.tiltX);
        p = rotY(p, S.tiltY);
        pts.push(project(p, cam));
      }
      /* тело ленты */
      ctx.lineWidth = ring.w;
      ctx.lineCap = "round";
      for (let i = 0; i < ring.seg; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        const zm = (p1[2] + p2[2]) * 0.5;
        const depth = clamp((zm + 1.3) / 2.6, 0, 1);
        const a = (i / ring.seg) * Math.PI * 2;
        const spec = 0.5 + 0.5 * Math.cos(a - 2.2);
        const lum = 0.1 + depth * 0.55 + spec * 0.45;
        ctx.strokeStyle = steel(lum * 0.75, ring.hue === 2);
        ctx.globalAlpha = alpha * (0.32 + depth * 0.68);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      }
      /* блик по верхней кромке */
      ctx.lineWidth = Math.max(0.6, ring.w * 0.3);
      for (let i = 0; i < ring.seg; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        const zm = (p1[2] + p2[2]) * 0.5;
        const depth = clamp((zm + 1.3) / 2.6, 0, 1);
        const a = (i / ring.seg) * Math.PI * 2;
        const spec = Math.pow(0.5 + 0.5 * Math.cos(a - 2.2), 3);
        if (spec < 0.35) continue;
        ctx.strokeStyle = "rgba(255,238,214," + (spec * depth * 0.85 * alpha).toFixed(3) + ")";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(p1[0] - 0.7, p1[1] - 0.9);
        ctx.lineTo(p2[0] - 0.7, p2[1] - 0.9);
        ctx.stroke();
      }
      /* узлы-крепления */
      for (let i = 0; i < ring.seg; i += Math.max(12, Math.round(ring.seg / 4))) {
        const p = pts[i];
        const depth = clamp((p[2] + 1.3) / 2.6, 0, 1);
        ctx.globalAlpha = alpha * (0.2 + depth * 0.7);
        ctx.fillStyle = steel(0.55 + depth * 0.5, false);
        ctx.beginPath();
        ctx.arc(p[0], p[1], ring.w * 0.62, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawCore(cam, spin) {
      const R = 0.30;
      /* 1) вращаем вершины в 3D */
      const rv = ICO_V.map(function (v) {
        let p = rotY(v, spin * 0.6);
        p = rotX(p, spin * 0.25 + 0.4);
        p = rotX(p, S.tiltX);
        p = rotY(p, S.tiltY);
        return [p[0] * R, p[1] * R, p[2] * R];
      });
      /* 2) проецируем */
      const verts = rv.map(function (p) { return project(p, cam); });

      /* 3) нормали граней считаем в 3D */
      const half = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);
      const faces = ICO_F.map(function (f) {
        const a = rv[f[0]], b = rv[f[1]], c = rv[f[2]];
        const n = norm(cross(
          [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
        ));
        const diff = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const bounce = Math.max(0, n[0] * BOUNCE[0] + n[1] * BOUNCE[1] + n[2] * BOUNCE[2]);
        const spec = Math.pow(Math.max(0, n[0] * half[0] + n[1] * half[1] + n[2] * half[2]), 26);
        const rim = Math.pow(1 - Math.abs(n[2]), 3);
        const z = (verts[f[0]][2] + verts[f[1]][2] + verts[f[2]][2]) / 3;
        return { f: f, z: z, diff: diff, spec: spec, bounce: bounce, rim: rim };
      }).sort(function (p, q) { return p.z - q.z; });

      faces.forEach(function (fc) {
        const a = verts[fc.f[0]], b = verts[fc.f[1]], c = verts[fc.f[2]];
        const lum = 0.2 + fc.diff * 0.46 + fc.bounce * 0.16 + fc.rim * 0.24 + fc.spec * 0.7;
        const rgb = steelRGB(lum * 0.62, true, fc.bounce * 0.8);
        /* мягкий градиент внутри грани — от центра к источнику света */
        const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3;
        const grad = ctx.createLinearGradient(gx, gy, gx + LIGHT[0] * 95, gy + LIGHT[1] * 95);
        grad.addColorStop(0, "rgb(" + Math.round(Math.min(255, rgb[0] * 1.42)) + "," + Math.round(Math.min(255, rgb[1] * 1.42)) + "," + Math.round(Math.min(255, rgb[2] * 1.42)) + ")");
        grad.addColorStop(0.55, "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")");
        grad.addColorStop(1, "rgb(" + Math.round(rgb[0] * 0.46) + "," + Math.round(rgb[1] * 0.46) + "," + Math.round(rgb[2] * 0.46) + ")");
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.97;
        ctx.fill();
        ctx.strokeStyle = "rgba(255," + Math.round(214 + fc.diff * 41) + "," + Math.round(168 + fc.diff * 72) + "," + (0.05 + fc.diff * 0.3 + fc.spec * 0.45 + fc.rim * 0.22).toFixed(3) + ")";
        ctx.lineWidth = 0.7;
        ctx.globalAlpha = 1;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      /* 4) свечение ядра поверх граней (bloom) */
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(cam.cx, cam.cy, 0, cam.cx, cam.cy, cam.R * 0.78);
      g.addColorStop(0, "rgba(255,206,140," + (0.14 + S.glow * 0.5).toFixed(3) + ")");
      g.addColorStop(0.45, "rgba(226,74,54," + (0.07 + S.glow * 0.26).toFixed(3) + ")");
      g.addColorStop(1, "rgba(230,36,41,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cam.cx, cam.cy, cam.R * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    function drawParticles(cam, dt, frozen) {
      const attractR = 1.7;
      /* экранные координаты курсора → система координат сцены (с учётом наклона) */
      const cur = rotY(rotX([(S.px - cam.cx) / cam.R, (S.py - cam.cy) / cam.R, 0], -S.tiltX * 0.6), -S.tiltY * 0.6);
      const ax = cur[0], ay = cur[1];
      const active = frozen ? 0 : S.active;
      const step = Math.min(0.034, dt || 0.016);

      if (!frozen) {
        for (let i = 0; i < PARTICLES.length; i++) {
          const p = PARTICLES[i];
          /* пружина к «дому» — удерживает поле в объёме */
          let fx = (p.hx - p.x) * 2.2;
          let fy = (p.hy - p.y) * 2.2;

          if (active > 0.01) {
            const dx = ax - p.x, dy = ay - p.y;
            const d = Math.hypot(dx, dy);
            if (d < attractR && d > 0.0001) {
              const f = (1 - d / attractR) * 26 * active;
              const nx = dx / d, ny = dy / d;
              /* притяжение + завихрение вокруг курсора */
              fx += nx * f - ny * f * 0.72;
              fy += ny * f + nx * f * 0.72;
              /* совсем близкие частицы «прилипают» к курсору */
              if (d < attractR * 0.3) {
                p.x += (ax - p.x) * 0.1;
                p.y += (ay - p.y) * 0.1;
              }
            }
          }

          p.vx = (p.vx + fx * step) * 0.9;
          p.vy = (p.vy + fy * step) * 0.9;
          p.vz = (p.vz + (p.hz - p.z) * 1.4 * step) * 0.94;
          p.vx += (Math.random() - 0.5) * 0.0022;
          p.vy += (Math.random() - 0.5) * 0.0022;
          p.x += p.vx * step;
          p.y += p.vy * step;
          p.z += p.vz * step;
        }
      }

      /* рисуем сзади → впереди */
      const sorted = PARTICLES.slice().sort(function (a, b) { return a.z - b.z; });
      for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i];
        let q = rotX([p.x, p.y, p.z], S.tiltX * 0.6);
        q = rotY(q, S.tiltY * 0.6);
        const s = project(q, cam);
        const depth = clamp((s[2] + 1.3) / 2.6, 0, 1);
        const near = active > 0.01
          ? clamp(1 - Math.hypot(ax - p.x, ay - p.y) / attractR, 0, 1) * active
          : 0;
        const alpha = (0.05 + depth * 0.3 + near * 0.5) * p.a;
        const r = p.r * (0.5 + depth * 0.65) * (1 - near * 0.35);
        ctx.beginPath();
        ctx.arc(s[0], s[1], r, 0, Math.PI * 2);
        ctx.fillStyle = near > 0.05
          ? "rgba(255,214,150," + Math.min(0.95, alpha * 1.7).toFixed(3) + ")"
          : "rgba(176,192,222," + Math.min(0.55, alpha).toFixed(3) + ")";
        ctx.fill();
      }
    }

    function frame(ts) {
      const dt = Math.min(0.05, (ts - (frame.last || ts)) / 1000);
      frame.last = ts;
      const paused = document.body.dataset.motion === "off";

      if (!paused) S.t += dt;
      const t = S.t;

        /* курсор → наклон */
      if (!paused) {
        S.px += (S.tx - S.px) * Math.min(1, dt * 14);
        S.py += (S.ty - S.py) * Math.min(1, dt * 14);
      }
      const nx = clamp((S.px - S.w * 0.5) / (S.w * 0.5), -1.6, 1.6);
      const ny = clamp((S.py - S.h * 0.5) / (S.h * 0.5), -1.6, 1.6);
      if (!paused) {
        S.tiltY += (nx * 0.30 - S.tiltY) * Math.min(1, dt * 3.2);
        S.tiltX += (ny * 0.20 - S.tiltX) * Math.min(1, dt * 3.2);
        /* ядро разгорается, когда курсор рядом */
        const near = S.active * clamp(1 - Math.hypot(nx, ny) / 0.85, 0, 1);
        S.glow += (near - S.glow) * Math.min(1, dt * 2.6);
      }
      const cam = makeCam();

      ctx.clearRect(0, 0, S.w, S.h);

      /* мягкая тень-подложка */
      const sh = ctx.createRadialGradient(cam.cx, cam.cy + cam.R * 0.12, cam.R * 0.2, cam.cx, cam.cy, cam.R * 1.75);
      sh.addColorStop(0, "rgba(150,120,110,0.14)");
      sh.addColorStop(1, "rgba(120,140,180,0)");
      ctx.fillStyle = sh;
      ctx.fillRect(0, 0, S.w, S.h);

      /* частицы — дальний план */
      drawParticles(cam, paused ? 0 : dt, paused);

      /* механизм разгоняется, когда курсор у ядра */
      if (!paused) {
        const boost = 1 + S.glow * 1.8;
        RINGS.forEach(function (r) { r.phase += r.spin * boost * dt; });
      }

      /* кольца: дальние первыми */
      const order = RINGS.map(function (r) {
        let n = rotX([0, 0, 1], r.tx);
        n = rotY(n, r.ty);
        n = rotX(n, S.tiltX);
        n = rotY(n, S.tiltY);
        return { r: r, z: n[2] };
      }).sort(function (a, b) { return a.z - b.z; });

      order.forEach(function (o) {
        drawRing(o.r, cam, o.r.phase, 1);
      });

      /* ядро */
      drawCore(cam, t);

      /* цикл на таймере: rAF может быть задушен в фоновых вкладках */
      setTimeout(function () { frame(performance.now()); }, 16);
    }

    /* --- курсор --- */
    function onMove(e) {
      const rect = cv.getBoundingClientRect();
      S.tx = e.clientX - rect.left;
      S.ty = e.clientY - rect.top;
      S.active = 1;
    }
    if (hero) {
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", function () { S.active = 0; });
    }
    cv.addEventListener("pointermove", onMove);

    window.addEventListener("resize", function () {
      resize();
      seedParticles();
    });

    resize();
    seedParticles();
    setTimeout(function () { frame(performance.now()); }, 16);
  }

  /* ================================================================
     Старт
     ================================================================ */
  renderGrid();
  observeReveals();
  initEmbers();
  initCore();
})();
