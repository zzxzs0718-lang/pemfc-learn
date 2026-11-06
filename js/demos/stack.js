/* 交互演示：单电池层叠 + 电堆歧管流量分配
   左：单电池爆炸图，点一层看作用；右：U/Z 歧管一维集总网络（摩擦 + 动量回收），
   分配趋势是定性结果，不是 CFD。 */
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
    var w = cv.clientWidth || (cv.parentNode ? cv.parentNode.clientWidth : 0) || 300;
    var hs = h + 'px';
    if (cv.style.height !== hs) cv.style.height = hs;  // 流动点动画每帧调用：值相同就不写样式
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function fmt(v, d) { return v.toFixed(d === undefined ? 2 : d); }

  window.DEMOS = window.DEMOS || {};
  window.DEMOS['stack'] = {
    name: '单电池怎么叠成电堆：层叠结构与歧管分配',
    init: function (root) {
      var T = themeOf(); setVars(root, T); root.classList.add('dm-st');
      var H = 246;
      var LAYERS = [
        { n: '端板', d: '电堆最外侧的厚板，用螺栓给膜电极和双极板施加均匀夹紧力，保证密封、压低接触电阻。常用铝合金，金属表面还要做绝缘耐蚀涂层。' },
        { n: '绝缘板', d: '夹在集流板与端板之间，切断漏电通路——端板是金属的，不绝缘就会把电堆短路到外壳。' },
        { n: '集流板', d: '收集每片单电池的电流并引出到外负载。要高电导率（常用镀金铜板），否则自身的欧姆热很可观。' },
        { n: '双极板（阴极）', d: '一面刻阴极流场，供空气、排水；另一面贴膜电极，同时导电、导热、支撑。电堆里相邻两片电池共用一块板，所以叫“双极”。' },
        { n: '阴极 GDL', d: '气体扩散层：把流道里的氧均匀送到催化层，同时导出电子、导出产物水。太厚传质阻力大，太薄又容易水淹。' },
        { n: '阴极 CL', d: '阴极催化层，氧还原（ORR）就在这里发生，Pt 颗粒与离聚物共存。这里产水最多，冷启动时冰也最先堵这里。' },
        { n: '质子交换膜', d: '只让质子通过，隔断电子和反应气体。含水量 λ 决定电导率；冷启动时它还是最先吸水的“储水库”，膜越厚储水越多。' },
        { n: '阳极 CL', d: '阳极催化层，氢氧化（HOR）发生地。HOR 动力学比 ORR 快得多，所以阳极的活化损失很小。' },
        { n: '阳极 GDL', d: '把氢送到阳极催化层，同时把膜侧的水和热导走；和阴极 GDL 一起决定膜两侧的水活度梯度。' },
        { n: '双极板（阳极）', d: '一面是阳极流场供氢；电堆中另一侧常与相邻电池共用，中间还会开冷却流道，把反应热带走。' }
      ];
      var P = { kind: 'Z', N: 60, A: 0.8 };
      var sel = 6, hits = [], dist = [];
      var phase = 0, raf = 0, lastT = 0;

      root.innerHTML = [
        '<p class="dm-tip">左边点任意一层，看它管什么；右边切 U / Z 型歧管、调片数与截面积，看中间那几片什么时候开始欠气。</p>',
        '<div class="panes">',
        '<div class="pane"><div class="cap">单电池爆炸图 · 点击一层</div><canvas data-c="stack"></canvas></div>',
        '<div class="pane"><div class="cap">各单片进气流量（沿电堆厚度）</div><canvas data-c="flow"></canvas></div>',
        '</div>',
        '<div class="ctl"><label>歧管型式</label><select data-k="kind"><option value="Z">Z 型（进出口异侧）</option><option value="U">U 型（进出口同侧）</option></select></div>',
        '<div class="ctl"><label>单片数</label><input type="range" data-k="N" min="10" max="100" step="1" value="60"><span class="val" data-v="N">60 片</span></div>',
        '<div class="ctl"><label>歧管相对截面积</label><input type="range" data-k="A" min="0.5" max="2.0" step="0.05" value="0.8"><span class="val" data-v="A">0.80</span></div>',
        '<p class="dm-dist" data-r="dist"></p>',
        '<p class="dm-layer" data-r="layer"></p>',
        '<p class="demo-note" data-r="note"></p>',
        '</div>',
        '<style>',
        '.dm-st .panes{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
        '.dm-st .pane{min-width:0}',
        '.dm-st .cap{font-size:11px;color:var(--dm-ink2);margin:2px 0 2px;letter-spacing:.02em}',
        '.dm-st canvas{display:block;width:100%}',
        '.dm-st .ctl{margin:4px 0}',
        '.dm-st .ctl label{min-width:112px}',
        '.dm-st .dm-dist{margin:8px 0 0;font-size:12.2px;color:var(--dm-ink2);font-variant-numeric:tabular-nums}',
        '.dm-st .dm-layer{margin:4px 0 0;font-size:12.3px;color:var(--dm-ink);border-left:2px solid var(--dm-accent);padding-left:9px}',
        '.dm-st .dm-layer b{color:var(--dm-accent)}',
        '@media (max-width:600px){.dm-st .panes{grid-template-columns:1fr}}',
        '</style>'
      ].join('');

      var cv1 = root.querySelector('canvas[data-c="stack"]');
      var cv2 = root.querySelector('canvas[data-c="flow"]');
      var rd = {}, out = {};
      root.querySelectorAll('[data-r]').forEach(function (el) { rd[el.getAttribute('data-r')] = el; });
      root.querySelectorAll('[data-v]').forEach(function (el) { out[el.getAttribute('data-v')] = el; });

      // ---------- 左：层叠结构 ----------
      function drawStack() {
        var box = fitCanvas(cv1, H), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 140) return;
        ctx.clearRect(0, 0, W, HH);
        hits = [];
        var n = LAYERS.length, step = (HH - 36) / n;
        var w = Math.max(70, Math.min(W - 104, 210));
        var x0 = Math.max(10, (W - 100 - w) / 2);
        var dx = 8, ph = Math.min(14, step - 5);
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        for (var i = 0; i < n; i++) {
          var y = 12 + i * step, on = i === sel;
          var porous = i >= 4 && i <= 8;
          ctx.beginPath();
          ctx.moveTo(x0 + dx, y); ctx.lineTo(x0 + w + dx, y);
          ctx.lineTo(x0 + w, y + ph); ctx.lineTo(x0, y + ph); ctx.closePath();
          ctx.fillStyle = on ? T.accent : (porous ? T.water : T.h2);
          ctx.globalAlpha = on ? 0.3 : (porous ? 0.18 : 0.12);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = on ? 1.6 : 1;
          ctx.strokeStyle = on ? T.accent : T.line;
          ctx.stroke();
          ctx.fillStyle = on ? T.accent : T.ink2;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(LAYERS[i].n, x0 + w + dx + 7, y + ph / 2);
          hits.push({ i: i, x0: x0 - 3, x1: W - 2, y0: y - 3, y1: y + ph + 3 });
        }
        var by = 12 + n * step;
        ctx.strokeStyle = T.line; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x0, by - 3); ctx.lineTo(x0 + w, by - 3); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = T.ink2; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('…中间重复 N 片，两端再加端板', x0, by);
        var sy = 12 + sel * step + ph / 2;
        ctx.fillStyle = T.accent;
        ctx.beginPath(); ctx.moveTo(x0 - 7, sy); ctx.lineTo(x0 - 2, sy - 3.2); ctx.lineTo(x0 - 2, sy + 3.2); ctx.closePath(); ctx.fill();
      }

      // ---------- 右：歧管流量分配 ----------
      // 一维集总网络：进气沿程摩擦 + 动量回收，排气沿程摩擦；单片按 √Δp 取流
      function solve(N, A, kind) {
        var Rm = 1 / (N * N * N * A * A);
        var q = new Array(N).fill(1);
        /* 800 次迭代复用同一组工作数组：原来每轮新建 5 个长度 N 的数组（N 最大 100）。
           每轮都会完整覆盖被读取的元素（suf[N]、pre[0] 恒为 0，pin/pout/qn 全量重写）。 */
        var suf = new Array(N + 1).fill(0), pre = new Array(N + 1).fill(0);
        var pin = new Array(N).fill(0), pout = new Array(N).fill(0), qn = new Array(N).fill(0);
        for (var it = 0; it < 800; it++) {
          for (var i = N - 1; i >= 0; i--) suf[i] = suf[i + 1] + q[i];
          for (var j = 0; j < N; j++) pre[j + 1] = pre[j] + q[j];
          pin[0] = 1;
          var Mprev = suf[0];
          for (var a = 0; a < N - 1; a++) {
            var M = suf[a + 1];
            pin[a + 1] = pin[a] - Rm * M * M + 0.5 * Rm * Math.max(0, Mprev * Mprev - M * M);
            Mprev = M;
          }
          if (kind === 'U') {
            pout[0] = 0;
            for (var b = 0; b < N - 1; b++) {
              var S = suf[b + 1];
              pout[b + 1] = pout[b] + Rm * S * S;
            }
          } else {
            pout[N - 1] = 0;
            for (var c = N - 2; c >= 0; c--) {
              var S2 = pre[c + 1];
              pout[c] = pout[c + 1] + Rm * S2 * S2;
            }
          }
          var sum = 0;
          for (var d = 0; d < N; d++) {
            var v = Math.sqrt(Math.max(0, pin[d] - pout[d]));
            qn[d] = v; sum += v;
          }
          var mean = sum / N || 1;
          for (var e = 0; e < N; e++) q[e] = 0.75 * q[e] + 0.25 * (qn[e] / mean);
        }
        var mn = q.reduce(function (s, v) { return s + v; }, 0) / N || 1;
        return q.map(function (v) { return v / mn; });
      }

      function drawFlow() {
        var box = fitCanvas(cv2, H), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 180) return;
        ctx.clearRect(0, 0, W, HH);
        var N = P.N, u = P.kind === 'U';
        var y0 = 42, y1 = HH - 36;
        var railL = 30, cx0 = 44, cx1 = 108, railR = 122;
        var px0 = 158, px1 = W - 22;
        var rmax = Math.max(1.7, Math.max.apply(null, dist) * 1.05);
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';

        // 两条歧管
        ctx.strokeStyle = T.ink2; ctx.globalAlpha = 0.22; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(railL, y0); ctx.lineTo(railL, y1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(railR, y0); ctx.lineTo(railR, y1); ctx.stroke();
        ctx.globalAlpha = 1;

        // 端口：进气在上端，排气 U 在上端 / Z 在下端
        ctx.fillStyle = T.h2; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('进气', railL, y0 - 14);
        ctx.beginPath(); ctx.moveTo(railL, y0 - 12); ctx.lineTo(railL - 4, y0 - 4); ctx.lineTo(railL + 4, y0 - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = T.heat;
        if (u) {
          ctx.fillText('排气', railR, y0 - 14);
          ctx.beginPath(); ctx.moveTo(railR, y0 - 12); ctx.lineTo(railR - 4, y0 - 4); ctx.lineTo(railR + 4, y0 - 4); ctx.closePath(); ctx.fill();
        } else {
          ctx.textBaseline = 'top';
          ctx.fillText('排气', railR, y1 + 8);
          ctx.beginPath(); ctx.moveTo(railR, y1 + 8); ctx.lineTo(railR - 4, y1); ctx.lineTo(railR + 4, y1); ctx.closePath(); ctx.fill();
        }

        // 单片之间与歧管的短接
        var cellH = (y1 - y0) / N, gap = cellH > 3 ? Math.min(1.1, cellH * 0.16) : 0;
        ctx.strokeStyle = T.ink2; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
        for (var i = 0; i < N; i++) {
          var yy = y0 + (i + 0.5) * cellH;
          ctx.beginPath(); ctx.moveTo(railL, yy); ctx.lineTo(cx0, yy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx1, yy); ctx.lineTo(railR, yy); ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // 色带：每片一条
        for (var k = 0; k < N; k++) {
          var rel = dist[k], starve = rel < 0.9;
          ctx.fillStyle = starve ? T.accent : T.h2;
          ctx.globalAlpha = starve ? Math.min(1, 0.45 + (0.9 - rel) * 1.1) : 0.28 + 0.42 * Math.min(1, (rel - 0.9) / 0.7);
          ctx.fillRect(cx0, y0 + k * cellH, cx1 - cx0, Math.max(0.6, cellH - gap));
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = T.line; ctx.lineWidth = 1;
        ctx.strokeRect(cx0, y0, cx1 - cx0, y1 - y0);
        ctx.fillStyle = T.ink2; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('单片', (cx0 + cx1) / 2, y0 - 4);

        // 流量剖面
        ctx.textAlign = 'left'; ctx.fillStyle = T.ink2;
        ctx.fillText('流量 / 平均', px0, y0 - 6);
        function xOf(rel) { return px0 + Math.min(1, Math.max(0, rel / rmax)) * (px1 - px0); }
        var xMean = xOf(1);
        ctx.strokeStyle = T.line; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xMean, y0); ctx.lineTo(xMean, y1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = T.ink2; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('1×', xMean, y1 + 8);
        ctx.textAlign = 'right'; ctx.fillText('0', xOf(0) + 2, y1 + 8);
        ctx.fillText(rmax.toFixed(1) + '×', xOf(rmax), y1 + 8);

        ctx.strokeStyle = T.ink; ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (var m = 0; m < N; m++) {
          var myy = y0 + (m + 0.5) * cellH, mxx = xOf(dist[m]);
          if (m === 0) ctx.moveTo(mxx, myy); else ctx.lineTo(mxx, myy);
        }
        ctx.stroke();
        // 最欠点
        var mi = 0;
        for (var q = 1; q < N; q++) if (dist[q] < dist[mi]) mi = q;
        var minY = y0 + (mi + 0.5) * cellH, minX = xOf(dist[mi]);
        ctx.fillStyle = T.accent;
        ctx.beginPath(); ctx.arc(minX, minY, 3.4, 0, 6.29); ctx.fill();
        var right = minX < W - 96;
        ctx.textAlign = right ? 'left' : 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('最欠气', minX + (right ? 7 : -7), Math.min(y1 - 8, Math.max(y0 + 8, minY)));

        // 流动小点（动画）
        var span = y1 - y0;
        ctx.globalAlpha = 0.75;
        for (var d2 = 0; d2 < 4; d2++) {
          var pos = (phase + d2 * 0.25) % 1;
          ctx.fillStyle = T.h2;
          ctx.beginPath(); ctx.arc(railL, y0 + pos * span, 1.8, 0, 6.29); ctx.fill();
          ctx.fillStyle = T.heat;
          ctx.beginPath(); ctx.arc(railR, u ? y1 - pos * span : y0 + pos * span, 1.8, 0, 6.29); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = T.ink2; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText((u ? 'U 型' : 'Z 型') + ' · ' + N + ' 片', W - 4, HH - 3);
      }

      function updateRead() {
        var N = P.N, mn = 1, mx = 0, imn = 0, imx = 0, s2 = 0;
        for (var i = 0; i < N; i++) {
          var v = dist[i];
          if (v < mn) { mn = v; imn = i; }
          if (v > mx) { mx = v; imx = i; }
          s2 += (v - 1) * (v - 1);
        }
        var sd = Math.sqrt(s2 / N);
        rd.dist.textContent = '最欠：第 ' + (imn + 1) + ' 片 ' + fmt(mn) + '×平均；最富：第 ' + (imx + 1) + ' 片 ' + fmt(mx) + '×；相对标准差 ' + (sd * 100).toFixed(0) + '%。';
        rd.note.textContent = (P.kind === 'Z'
          ? 'Z 型：进气从一端进、排气从另一端出，沿程两种压力变化方向相反，中间段压差最小，所以中间单片最容易欠气。截面积调小或片数调多，欠气会更明显。'
          : 'U 型：进出口在同一端，靠近端口的前几片“抢”到更多气，越往远端越少；远端单片长期低流量，性能会先衰减。')
          + '以上是一维集总网络（沿程摩擦 + 动量回收，单片按 √Δp 取流）算出的定性趋势，不是 CFD 结果。';
        rd.layer.innerHTML = '<b>' + LAYERS[sel].n + '</b> — ' + LAYERS[sel].d;
      }
      function refreshFlow() {
        dist = solve(P.N, P.A, P.kind);
        try { drawFlow(); updateRead(); } catch (e) { if (window.console) console.warn('stack flow:', e); }
      }
      function refreshStack() {
        try { drawStack(); updateRead(); } catch (e) { if (window.console) console.warn('stack layers:', e); }
      }

      cv1.addEventListener('click', function (ev) {
        var r = cv1.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
        for (var i = 0; i < hits.length; i++) {
          var h = hits[i];
          if (mx >= h.x0 && mx <= h.x1 && my >= h.y0 && my <= h.y1) { sel = h.i; refreshStack(); return; }
        }
      });
      cv1.style.cursor = 'pointer';
      root.querySelector('select[data-k="kind"]').addEventListener('change', function (ev) {
        P.kind = ev.target.value; refreshFlow();
      });
      root.querySelectorAll('input[type=range]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.getAttribute('data-k');
          P[k] = parseFloat(inp.value);
          out[k].textContent = k === 'N' ? P[k] + ' 片' : P[k].toFixed(2);
          refreshFlow();
        });
      });

      function observe() {
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function () {
            if (!root.isConnected) { ro.disconnect(); return; }
            try { drawStack(); drawFlow(); } catch (e) {}
          });
          ro.observe(cv1); ro.observe(cv2);
        } else window.addEventListener('resize', function () { try { drawStack(); drawFlow(); } catch (e) {} });
      }
      // 歧管里流动的小点，约 12 帧/秒
      function tick(ts) {
        if (!root.isConnected) { raf = 0; return; }
        if (ts - lastT > 85) { lastT = ts; phase = (phase + 0.013) % 1; try { drawFlow(); } catch (e) {} }
        raf = requestAnimationFrame(tick);
      }

      refreshFlow();
      refreshStack();
      observe();
      raf = requestAnimationFrame(tick);
    }
  };
})();
