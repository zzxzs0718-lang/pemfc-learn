/* 交互演示：系统能量流与水流的桑基图（手写带状多边形，不依赖任何库）
   能量按供氢高热值配平：输入 = 电输出 + 热 + 未反应氢尾排。
   水按出口饱和需水与可用水比较，判定水是否自给。全部为集总估算。 */
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

  window.DEMOS = window.DEMOS || {};
  window.DEMOS['energyflow'] = {
    name: '系统能量流与水流：氢去了哪、水够不够',
    init: function (root) {
      var T = themeOf(); setVars(root, T); root.classList.add('dm-ef');
      var H = 318;
      var PSAT = 31.2, PBAR = 120, LAMA = 1.5; // 70 ℃ 饱和蒸气压 kPa，背压 kPa，阳极计量比
      var P = { j: 0.8, lc: 2.0, rh: 60 };
      var info = null;

      root.innerHTML = [
        '<p class="dm-tip">改电流密度、阴极化学计量比和加湿湿度，看氢能如何分成电、热、尾气，以及产物水够不够把出口气体加湿到饱和。</p>',
        '<canvas class="demo-canvas dm-cv"></canvas>',
        '<div class="stats"><span>系统效率 <b data-s="eta">—</b></span><span>电输出 <b data-s="el">—</b> W·cm⁻²</span>' +
        '<span>产热 <b data-s="heat">—</b> W·cm⁻²</span><span>氢利用率 <b data-s="hu">—</b></span></div>',
        '<div class="ctl"><label>电流密度</label><input type="range" data-k="j" min="0.2" max="1.5" step="0.05" value="0.8"><span class="val" data-v="j">0.80 A·cm⁻²</span></div>',
        '<div class="ctl"><label>阴极化学计量比</label><input type="range" data-k="lc" min="1.5" max="3.0" step="0.1" value="2.0"><span class="val" data-v="lc">2.0</span></div>',
        '<div class="ctl"><label>加湿相对湿度</label><input type="range" data-k="rh" min="0" max="100" step="5" value="60"><span class="val" data-v="rh">60%</span></div>',
        '<p class="waterline" data-r="water"></p>',
        '<p class="demo-note">假设：按氢气高热值 285.6 kJ·mol⁻¹ 配平；阳极计量比固定 1.5、尾气直排（不循环），所以有 1/3 的氢能随尾气离开。电压用简化极化式 V = 0.80 − 0.16j − 0.035j²（仅用于配平能量，不含传质极限）。加湿与出口都按 70 ℃、1.2 bar、饱和蒸气压 31.2 kPa 计算。不计空压机与泵功，是电堆效率而非系统净效率；膜自身的吸/脱附水没有单列。</p>',
        '</div>',
        '<style>',
        '.dm-ef canvas{display:block;width:100%}',
        '.dm-ef .stats{display:flex;flex-wrap:wrap;gap:4px 20px;font-size:12px;color:var(--dm-ink2);margin:8px 0 6px}',
        '.dm-ef .stats b{color:var(--dm-ink);font-variant-numeric:tabular-nums;font-weight:600}',
        '.dm-ef .ctl{margin:4px 0}',
        '.dm-ef .ctl label{min-width:118px}',
        '.dm-ef .waterline{margin:9px 0 0;font-size:12.3px;color:var(--dm-ink);border-left:2px solid var(--dm-water);padding-left:9px;min-height:1.9em}',
        '.dm-ef .waterline.bad{border-left-color:var(--dm-heat)}',
        '</style>'
      ].join('');

      var cv = root.querySelector('canvas');
      var rd = {}, out = {}, sval = {};
      root.querySelectorAll('[data-r]').forEach(function (el) { rd[el.getAttribute('data-r')] = el; });
      root.querySelectorAll('[data-v]').forEach(function (el) { out[el.getAttribute('data-v')] = el; });
      root.querySelectorAll('[data-s]').forEach(function (el) { sval[el.getAttribute('data-s')] = el; });

      function calc() {
        var j = P.j, V = 0.80 - 0.16 * j - 0.035 * j * j;
        var chem = 1.48 * LAMA * j;        // 供氢化学能 W/cm²
        var el = V * j;
        var tail = (1 - 1 / LAMA) * chem;
        var heat = chem - el - tail;
        // 水：以每 mol 反应氢为基准
        var air = P.lc * 0.5 / 0.21;
        var dryOut = air - 0.5;
        var rh = P.rh / 100;
        var rIn = rh * PSAT / (PBAR - rh * PSAT);
        var rSat = PSAT / (PBAR - PSAT);
        var vapIn = air * rIn;
        var prod = 1;
        var avail = vapIn + prod;
        var cap = dryOut * rSat;
        var surplus = avail - cap;
        return { j: j, V: V, chem: chem, el: el, heat: heat, tail: tail, eta: el / chem,
          air: air, dryOut: dryOut, vapIn: vapIn, prod: prod, avail: avail, cap: cap,
          surplus: surplus, outVap: Math.min(avail, cap), liquid: Math.max(0, surplus),
          rhOut: Math.min(1, avail / cap) };
      }

      function ribbon(ctx, x0, x1, y0a, y0b, y1a, y1b, color) {
        var cx = (x0 + x1) / 2;
        ctx.beginPath();
        ctx.moveTo(x0, y0a);
        ctx.bezierCurveTo(cx, y0a, cx, y1a, x1, y1a);
        ctx.lineTo(x1, y1b);
        ctx.bezierCurveTo(cx, y1b, cx, y0b, x0, y0b);
        ctx.closePath();
        ctx.fillStyle = color; ctx.globalAlpha = 0.26; ctx.fill();
        ctx.globalAlpha = 0.55; ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      function block(ctx, x, y, w, h, color) {
        ctx.fillStyle = color; ctx.globalAlpha = 0.55;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 0.9; ctx.strokeStyle = color; ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.globalAlpha = 1;
      }

      function draw() {
        var box = fitCanvas(cv, H), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 240 || !info) return;
        ctx.clearRect(0, 0, W, HH);
        var narrow = W < 560;
        var labW = Math.min(narrow ? 84 : 112, W * 0.17);
        var srcX = labW + 16;
        var sinkR = W - labW - 14, sinkX = sinkR - 32;
        var gap = 4;
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';

        // ================= 上：能量 =================
        var yTop = 42, yBot = 146, HFULL = yBot - yTop;
        ctx.fillStyle = T.ink; ctx.font = '12px system-ui,"Microsoft YaHei",sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('能量流（供氢高热值 = 100%）', 16, 12);
        ctx.fillStyle = T.ink2; ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('电堆效率 ' + (info.eta * 100).toFixed(0) + '%', W - 16, 13);

        // 源块
        block(ctx, srcX, yTop, 26, HFULL, T.ink2);
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = T.ink;
        ctx.fillText('氢能 100%', srcX - 9, yTop + HFULL / 2 - 9);
        ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
        ctx.fillText(info.chem.toFixed(2) + ' W·cm⁻²', srcX - 9, yTop + HFULL / 2 + 8);
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';

        var shares = [
          { n: '电输出', v: info.el / info.chem, c: T.h2, val: info.el.toFixed(2) + ' W·cm⁻²' },
          { n: '热', v: info.heat / info.chem, c: T.heat, val: info.heat.toFixed(2) + ' W·cm⁻²' },
          { n: '未反应氢尾排', v: info.tail / info.chem, c: T.ink2, val: info.tail.toFixed(2) + ' W·cm⁻²' }
        ];
        var availH = HFULL - gap * (shares.length - 1);
        var y = yTop;
        for (var i = 0; i < shares.length; i++) {
          shares[i].h = shares[i].v * availH;
          shares[i].y = y;
          y += shares[i].h + gap;
        }
        // 源侧分段（无间隙） + 条带
        var ys = yTop;
        for (var k = 0; k < shares.length; k++) {
          var hs = shares[k].v * HFULL;
          ribbon(ctx, srcX + 26, sinkX, ys, ys + hs, shares[k].y, shares[k].y + shares[k].h, shares[k].c);
          ys += hs;
          block(ctx, sinkX, shares[k].y, 30, shares[k].h, shares[k].c);
          var ly = shares[k].y + shares[k].h / 2;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillStyle = T.ink; ctx.font = '11.5px system-ui,"Microsoft YaHei",sans-serif';
          ctx.fillText((narrow ? shares[k].n.slice(0, 2) : shares[k].n) + ' ' + Math.round(shares[k].v * 100) + '%', sinkX + 38, ly - (narrow ? 0 : 7));
          if (!narrow) {
            ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
            ctx.fillText(shares[k].val, sinkX + 38, ly + 7);
          }
        }

        // ================= 下：水 =================
        var wy = 176, wH = 86, wBot = wy + wH;
        ctx.fillStyle = T.ink; ctx.font = '12px system-ui,"Microsoft YaHei",sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('水流（每 mol 反应氢，mol·mol⁻¹）', 16, 158);
        ctx.textAlign = 'right'; ctx.fillStyle = info.surplus >= -0.02 ? T.water : T.heat;
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        ctx.fillText(info.surplus >= -0.02 ? '水自给' : '水不足', W - 16, 159);

        var sources = [
          { n: '加湿带入', v: info.vapIn, c: T.water },
          { n: '产物水', v: info.prod, c: T.h2 }
        ];
        var mergeX = narrow ? W * 0.48 : W * 0.46;
        var scale = (wH - gap) / Math.max(info.avail, 1e-6);  // 两个候选只差 gap(gap>0)，第二项恒更小
        var totalH = info.avail * scale;
        var sy = wy + (wH - totalH) / 2;
        for (var s = 0; s < sources.length; s++) {
          var sh = sources[s].v * scale;
          block(ctx, srcX, sy, 24, Math.max(1.2, sh), sources[s].c);
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = T.ink;
          ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
          ctx.fillText(sources[s].n, srcX - 9, sy + sh / 2 - (narrow ? 0 : 6));
          if (!narrow) {
            ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
            ctx.fillText(fmt(sources[s].v), srcX - 9, sy + sh / 2 + 7);
          }
          sy += sh;
        }
        // 汇合节点
        var mTop = wy + (wH - totalH) / 2;
        block(ctx, mergeX, mTop, 12, totalH, T.ink2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = T.ink2;
        ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
        ctx.fillText('可用水 ' + fmt(info.avail), mergeX + 6, mTop - 3);

        // 源 → 汇合
        var a1 = mTop, a2 = wy + (wH - totalH) / 2;
        for (var s2 = 0; s2 < sources.length; s2++) {
          var sH = sources[s2].v * scale;
          ribbon(ctx, srcX + 24, mergeX, a2, a2 + sH, a1, a1 + sH, sources[s2].c);
          a1 += sH; a2 += sH;
        }

        // 汇合 → 汇点：尾排 + 液态水（或缺口）
        var sinks = [
          { n: '尾排带走', v: info.outVap, c: T.water },
          { n: '液态水', v: info.liquid, c: T.accent }
        ];
        var sinkH = (totalH - gap) * (info.outVap / info.avail);
        var mS = mTop;
        var outTop = wy + (wH - totalH) / 2;
        ribbon(ctx, mergeX + 12, sinkX, mTop, mTop + sinkH, outTop, outTop + sinkH, T.water);
        block(ctx, sinkX, outTop, 30, Math.max(1.2, sinkH), T.water);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = T.ink;
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        var ly1 = outTop + sinkH / 2;
        ctx.fillText('尾排 ' + fmt(info.outVap) + (narrow ? '' : ''), sinkX + 38, ly1 - (narrow ? 0 : 6));
        if (!narrow) {
          ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
          ctx.fillText(narrow ? '' : ('出口 ' + Math.round(info.rhOut * 100) + '% 饱和'), sinkX + 38, ly1 + 7);
        }
        if (info.liquid > 0.005) {
          var lH = Math.max(1.2, (totalH - gap) * (info.liquid / info.avail));
          var lTop = outTop + sinkH + gap;
          ribbon(ctx, mergeX + 12, sinkX, mTop + sinkH + (totalH - sinkH - lH), mTop + totalH, lTop, lTop + lH, T.accent);
          block(ctx, sinkX, lTop, 30, lH, T.accent);
          ctx.fillStyle = T.ink; ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('液态水 ' + fmt(info.liquid), sinkX + 38, lTop + lH / 2);
        } else {
          // 缺口：用虚线框示意“还差多少才饱和”
          var dh = Math.max(4, (totalH - gap) * (info.cap - info.avail) / info.avail);
          dh = Math.min(dh, wH - sinkH - gap);
          var dy = outTop + sinkH + gap;
          ctx.strokeStyle = T.ink2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
          ctx.strokeRect(sinkX + 0.5, dy + 0.5, 29, dy + 0.5 + dh > wBot ? 0 : dh);
          ctx.setLineDash([]);
          ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText('缺口 ' + fmt(-info.surplus), sinkX + 38, dy + 2);
        }
        ctx.fillStyle = T.ink2; ctx.font = '10px system-ui,"Microsoft YaHei",sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('粗细按流量比例；箭头方向 = 能量/水去向', W - 16, HH - 4);
      }

      function update() {
        info = calc();
        out.j.textContent = P.j.toFixed(2) + ' A·cm⁻²';
        out.lc.textContent = P.lc.toFixed(1);
        out.rh.textContent = P.rh + '%';
        sval.eta.textContent = (info.eta * 100).toFixed(0) + '%';
        sval.el.textContent = info.el.toFixed(2);
        sval.heat.textContent = info.heat.toFixed(2);
        sval.hu.textContent = (100 / LAMA).toFixed(0) + '%';
        if (info.surplus >= -0.02) {
          rd.water.className = 'waterline';
          rd.water.textContent = '水判定：自给。可用水 ' + fmt(info.avail) + ' mol，出口饱和只需 ' + fmt(info.cap) + ' mol，多余 ' + fmt(info.liquid) + ' mol 以液态水排出——要注意别积在流道里造成水淹。';
        } else {
          rd.water.className = 'waterline bad';
          rd.water.textContent = '水判定：不足。可用水 ' + fmt(info.avail) + ' mol，出口要饱和需 ' + fmt(info.cap) + ' mol，缺 ' + fmt(-info.surplus) + ' mol（出口只有约 ' + Math.round(info.rhOut * 100) + '% 饱和）。膜有变干风险：提高加湿、降低化学计量比，或把进气温度降下来。';
        }
        try { draw(); } catch (e) { if (window.console) console.warn('energyflow:', e); }
      }

      root.querySelectorAll('input[type=range]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          P[inp.getAttribute('data-k')] = parseFloat(inp.value);
          update();
        });
      });
      function observe() {
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function () { if (!root.isConnected) { ro.disconnect(); return; } try { draw(); } catch (e) {} });
          ro.observe(cv.parentNode || cv);
        } else window.addEventListener('resize', function () { try { draw(); } catch (e) {} });
      }
      update();
      observe();
    }
  };
})();
