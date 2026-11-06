/* 交互演示：电化学阻抗谱 Nyquist 图
   等效电路：R_om + (R_ct ∥ C_dl) + 有界 Warburg（有限长度扩散 σ/√(jω)·tanh√(jωτ)）
   半圆按书中图 3.2 简化为一个等效弧（阳极小弧已并入），标注为阴极 ORR 电荷转移。 */
(function () {
  'use strict';

  function themeOf() {
    var cs = getComputedStyle(document.documentElement);
    function read(n, fb) { var v = (cs.getPropertyValue(n) || '').trim(); return v || fb; }
    var dark = false;
    try {
      var m = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || parseFloat(m[3]) > 0.4)) dark = (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) < 118;
    } catch (e) { dark = false; }
    return { ink: read('--ink', dark ? '#e6eef6' : '#16202a'), ink2: read('--ink-2', dark ? '#9fadba' : '#5b6673'),
      line: read('--line', dark ? '#22303a' : '#e5e0d5'), accent: read('--accent', dark ? '#4fd1c5' : '#0d7a74'),
      h2: read('--h2', dark ? '#6cb8e8' : '#0b6ca6'), water: read('--water', dark ? '#48c9d8' : '#0aa0b4'),
      heat: read('--heat', dark ? '#f08a4b' : '#cf5a15') };
  }
  function setVars(root, T) {
    ['ink', 'ink2', 'line', 'accent', 'h2', 'water', 'heat'].forEach(function (k) {
      root.style.setProperty('--dm-' + k, T[k]);
    });
  }
  function fitCanvas(cv, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || (cv.parentNode ? cv.parentNode.clientWidth : 0) || 560;
    cv.style.height = h + 'px';
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function fmt(v, d) { return v.toFixed(d === undefined ? 2 : d); }
  function fLabel(f) {
    if (f >= 1000) return (f / 1000).toFixed(0) + ' kHz';
    if (f >= 10) return f.toFixed(0) + ' Hz';
    return f.toFixed(2) + ' Hz';
  }

  window.DEMOS = window.DEMOS || {};
  window.DEMOS['eis'] = {
    name: '电化学阻抗谱：Nyquist 图怎么读',
    init: function (root) {
      var T = themeOf(); setVars(root, T); root.classList.add('dm-eis');
      var H = 282;
      function plotH() {
        var w = cv ? (cv.clientWidth || 560) : 560;
        if (w > 700) return 372;
        if (w > 540) return 330;
        return 282;
      }
      var TAU = 40; // 有限长度扩散的时间常数 s（固定，不开放为控件）
      var P = { Rom: 0.10, Rct: 0.55, Cdl: 0.06, sig: 0.12 };
      var picked = null, proj = null, pts = [];

      root.innerHTML = [
        '<p class="dm-tip">拖四个参数，看半圆直径、顶点频率和低频尾怎么变；点曲线上任意一点，读出它的频率和主导过程（频率从右往左降低）。</p>',
        '<canvas class="demo-canvas dm-cv"></canvas>',
        '<div class="legend">',
        '<span><i style="background:var(--accent)"></i>阻抗谱（10 kHz → 0.01 Hz）</span>',
        '<span><i style="background:var(--water)"></i>高频截距 = 欧姆电阻 R_om</span>',
        '<span><i style="background:var(--h2)"></i>半圆 = 阴极 ORR 电荷转移（直径 ≈ R_ct）</span>',
        '<span><i style="background:var(--heat)"></i>低频 45° 尾 = Warburg 氧扩散</span>',
        '</div>',
        '<div class="ctl"><label>欧姆电阻 R<sub>om</sub></label><input type="range" data-k="Rom" min="0.02" max="0.40" step="0.01" value="0.10"><span class="val" data-v="Rom">0.10 Ω·cm²</span></div>',
        '<div class="ctl"><label>电荷转移电阻 R<sub>ct</sub></label><input type="range" data-k="Rct" min="0.05" max="1.50" step="0.01" value="0.55"><span class="val" data-v="Rct">0.55 Ω·cm²</span></div>',
        '<div class="ctl"><label>双电层电容 C<sub>dl</sub></label><input type="range" data-k="Cdl" min="0.01" max="1.00" step="0.01" value="0.06"><span class="val" data-v="Cdl">0.06 F·cm⁻²</span></div>',
        '<div class="ctl"><label>Warburg 系数 σ</label><input type="range" data-k="sig" min="0" max="0.25" step="0.005" value="0.12"><span class="val" data-v="sig">0.120 Ω·cm²·s⁻¹⁄²</span></div>',
        '<div class="dm-pick" data-r="pick">点曲线取点：读出该点的频率、Z′、-Z″ 和主导过程。</div>',
        '<p class="demo-note" data-r="note"></p>',
        '</div>',
        '<style>.dm-eis .ctl label{min-width:132px}.dm-eis canvas{display:block;width:100%}',
        '.dm-eis .dm-pick{font-size:12.2px;color:var(--dm-ink2);border-left:2px solid var(--dm-line);padding-left:9px;margin:10px 0 0;min-height:1.9em}',
        '.dm-eis .dm-pick b{color:var(--dm-accent);font-weight:600}</style>'
      ].join('');

      var cv = root.querySelector('canvas');
      var out = {}, note = root.querySelector('[data-r="note"]'), pick = root.querySelector('[data-r="pick"]');
      root.querySelectorAll('[data-v]').forEach(function (el) { out[el.getAttribute('data-v')] = el; });

      // 阻抗谱：10 kHz → 0.01 Hz，对数均分；Warburg 用有界形式，尾巴不会冲出画框
      function spectrum() {
        var arr = [], N = 170, hi = 4, lo = -2;
        var tau = P.Rct * P.Cdl;  // 同一组参数下为常数，原实现每个采样点重算一次
        for (var i = 0; i < N; i++) {
          var f = Math.pow(10, hi + (lo - hi) * i / (N - 1));
          var w = 2 * Math.PI * f;
          var den = 1 + w * w * tau * tau;  // 原来 re/im 各算一次同一分母
          var re = P.Rom + P.Rct / den;
          var im = -P.Rct * w * tau / den;
          if (P.sig > 1e-4) {
            var zr = Math.sqrt(w * TAU / 2), tr, ti;
            if (zr > 15) { tr = 1; ti = 0; }
            else {
              var den = Math.cosh(2 * zr) + Math.cos(2 * zr);
              tr = Math.sinh(2 * zr) / den;
              ti = Math.sin(2 * zr) / den;
            }
            var k = P.sig / Math.sqrt(2 * w);
            re += k * (tr + ti);
            im -= k * (tr - ti);
          }
          arr.push({ f: f, x: re, y: -im });
        }
        return arr;
      }
      function apexFreq() { return 1 / (2 * Math.PI * P.Rct * P.Cdl); }
      function niceStep(span) {
        var raw = span / 5, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
        var m = raw / p;
        return (m <= 1.5 ? 1 : m <= 3.5 ? 2 : m <= 7.5 ? 5 : 10) * p;
      }

      function draw() {
        var box = fitCanvas(cv, plotH()), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 180) return;
        ctx.clearRect(0, 0, W, HH);
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        var padL = 50, padT = 16, padB = 34;
        var pw = W - padL - 16, ph = HH - padT - padB;
        var reserve = W >= 560 ? 196 : 0;
        var S = Math.min(ph, pw - reserve);
        if (S < 130) { reserve = 0; S = Math.min(ph, pw); }
        var y0 = padT + Math.max(0, (ph - S) / 2);
        pts = spectrum();
        var xmax = 0, ymax = 0;
        for (var i = 0; i < pts.length; i++) {
          if (pts[i].x > xmax) xmax = pts[i].x;
          if (pts[i].y > ymax) ymax = pts[i].y;
        }
        // 横纵轴同比例（1 Ω·cm² 等长），半圆才是圆的；上限随曲线自动扩展
        var span = Math.max(0.4, Math.max(xmax, ymax) * 1.12);
        var sc = S / span;
        var gx = padL + Math.max(0, (pw - reserve - S) / 2);
        function px(x) { return gx + x * sc; }
        function py(y) { return y0 + S - y * sc; }
        proj = { px: px, py: py, S: S };

        // 网格
        var st = niceStep(span);
        ctx.strokeStyle = T.line; ctx.lineWidth = 1;
        ctx.fillStyle = T.ink2;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        var g;
        for (g = 0; g <= span + 1e-9; g += st) {
          var X = px(g), Y = py(g);
          ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y0 + S); ctx.stroke();
          if (Y > y0 - 0.5) { ctx.beginPath(); ctx.moveTo(gx, Y); ctx.lineTo(gx + S, Y); ctx.stroke(); }
        }
        // 坐标轴
        ctx.strokeStyle = T.ink2; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y0 + S); ctx.lineTo(gx + S, y0 + S); ctx.stroke();
        // 刻度数字
        ctx.fillStyle = T.ink2;
        for (g = 0; g <= span + 1e-9; g += st) {
          ctx.fillText(g.toFixed(st < 0.1 ? 2 : 1), px(g), y0 + S + 5);
          var YY = py(g);
          if (YY > y0 - 0.5) {
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText(g.toFixed(st < 0.1 ? 2 : 1), gx - 5, YY);
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          }
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('Z′ / (Ω·cm²)', gx + S / 2, y0 + S + 19);
        ctx.save();
        ctx.translate(13, y0 + S / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('-Z″ / (Ω·cm²)', 0, 0);
        ctx.restore();

        // 曲线
        ctx.strokeStyle = T.accent; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var k = 0; k < pts.length; k++) {
          var X2 = px(pts[k].x), Y2 = py(pts[k].y);
          if (k === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2);
        }
        ctx.stroke();

        // 高频截距 R_om
        var xOm = px(P.Rom);
        ctx.fillStyle = T.water;
        ctx.beginPath(); ctx.arc(xOm, py(0), 3.2, 0, 6.29); ctx.fill();
        ctx.strokeStyle = T.water; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(xOm, py(0) - 5); ctx.lineTo(xOm, py(0) + 5); ctx.stroke();
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('R_om', xOm - 5, py(0) - 4);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        // 直径虚线 + R_ct 端点
        ctx.strokeStyle = T.ink2; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px(P.Rom), py(0)); ctx.lineTo(px(P.Rom + P.Rct), py(0)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = T.h2;
        ctx.beginPath(); ctx.moveTo(px(P.Rom + P.Rct), py(0) - 4); ctx.lineTo(px(P.Rom + P.Rct), py(0) + 4); ctx.stroke();
        // 弧顶
        var ax = P.Rom + P.Rct / 2, ay = P.Rct / 2;
        ctx.fillStyle = T.h2;
        ctx.beginPath(); ctx.arc(px(ax), py(ay), 3.2, 0, 6.29); ctx.fill();

        // 右栏读图提示（不压在曲线上）
        if (reserve) {
          var rx = gx + S + 26;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillStyle = T.ink;
          ctx.font = '12px system-ui,"Microsoft YaHei",sans-serif';
          ctx.fillText('读图顺序', rx, y0 + 2);
          ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
          ctx.fillStyle = T.ink2;
          var lines = ['① 与实轴交点 → R_om', '② 半圆直径 → R_ct', '③ 弧顶频率 → 动力学', '④ 低频 45° 尾 → 扩散'];
          for (var li = 0; li < lines.length; li++) ctx.fillText(lines[li], rx, y0 + 24 + li * 21);
          ctx.fillStyle = T.accent;
          ctx.fillText('点曲线取点 →', rx, y0 + 24 + lines.length * 21 + 10);
        }

        // 已选点：十字引导线 + 频率标签
        if (picked) {
          var px0 = px(picked.x), py0 = py(picked.y);
          ctx.strokeStyle = T.accent; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0, y0 + S); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(gx, py0); ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = T.accent; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px0, py0, 5.5, 0, 6.29); ctx.stroke();
          var lx = Math.min(gx + S - 52, Math.max(gx + 4, px0 + 8));
          var ly = Math.max(y0 + 4, py0 - 20);
          ctx.fillStyle = T.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(fLabel(picked.f), lx, ly);
        }
      }

      function update() {
        var fa = apexFreq();
        out.Rom.textContent = fmt(P.Rom) + ' Ω·cm²';
        out.Rct.textContent = fmt(P.Rct) + ' Ω·cm²';
        out.Cdl.textContent = fmt(P.Cdl) + ' F·cm⁻²';
        out.sig.textContent = fmt(P.sig, 3) + ' Ω·cm²·s⁻¹⁄²';
        note.textContent = '读法：高频端与实轴的交点就是 R_om（' + fmt(P.Rom) + ' Ω·cm²，膜电阻 + 接触电阻）；半圆直径 ≈ R_ct（' + fmt(P.Rct) + ' Ω·cm²），对应阴极氧还原的电荷转移过程（书中阳极小弧已并入这个等效弧）。弧顶在 f = 1/(2πR_ctC_dl) ≈ ' + (fa >= 10 ? fa.toFixed(1) : fa.toFixed(2)) + ' Hz：同一 R_ct 下电容越大，弧越“矮胖”、顶点越靠左。低频 45° 尾是氧在 GDL 里的扩散。Warburg 采用有限长度扩散（τ_d 固定 40 s），所以尾巴会弯向实轴，不会无限延伸。';
      }
      function refresh() {
        try { draw(); update(); } catch (e) { if (window.console) console.warn('eis:', e); }
      }

      root.querySelectorAll('input[type=range]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          P[inp.getAttribute('data-k')] = parseFloat(inp.value);
          picked = null;
          var el = inp.parentNode.querySelector('.val');
          if (el) el.textContent = '';
          refresh();
        });
      });

      cv.addEventListener('click', function (ev) {
        if (!proj || !pts.length) return;
        var r = cv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
        var best = null, bd = 1e9;
        for (var i = 0; i < pts.length; i++) {
          var X = proj.px(pts[i].x), Y = proj.py(pts[i].y);
          var d = (X - mx) * (X - mx) + (Y - my) * (Y - my);
          if (d < bd) { bd = d; best = pts[i]; }
        }
        if (!best) return;
        picked = { x: best.x, y: best.y, f: best.f };
        var fa = apexFreq(), kind;
        if (best.f > fa * 8) kind = '高频段，接近欧姆电阻';
        else if (best.f > fa / 8) kind = '阴极 ORR 电荷转移段（R_ct 与 C_dl 并联）';
        else kind = P.sig > 0.02 ? '低频氧扩散段（Warburg，45° 尾）' : '低频收尾，扩散阻抗很弱';
        pick.innerHTML = '<b>' + fLabel(best.f) + '</b> · Z′ = ' + fmt(best.x) + '、-Z″ = ' + fmt(best.y) + ' Ω·cm² —— ' + kind + '。点曲线可换一个点。';
        refresh();
      });
      cv.style.cursor = 'crosshair';

      function observe() {
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function () { if (!root.isConnected) { ro.disconnect(); return; } refresh(); });
          ro.observe(cv.parentNode || cv);
        } else window.addEventListener('resize', refresh);
      }
      refresh();
      observe();
    }
  };
})();
