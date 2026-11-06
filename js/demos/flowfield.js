/* 交互演示：五种流场对比
   蛇形用半圆回折真画出来；三个条形是 5 格定性比较（依据 2.2.1 节对压降/排水/分配的描述），
   不是 CFD 计算值。 */
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
  function dist2(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
    var t = L ? ((px - a.x) * dx + (py - a.y) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    var qx = a.x + t * dx - px, qy = a.y + t * dy - py;
    return qx * qx + qy * qy;
  }

  window.DEMOS = window.DEMOS || {};
  window.DEMOS['flowfield'] = {
    name: '平行 / 蛇形 / 平行蛇形 / 叉指 / 波浪：五种流场怎么选',
    init: function (root) {
      var T = themeOf(); setVars(root, T); root.classList.add('dm-ff');
      var H = 212;
      var FIELDS = {
        parallel: { name: '平行流场', dp: 1, drain: 2, even: 2,
          pros: '压降最小、加工最简单；但并列流道之间分气不均，局部流道很容易被液态水堵死，大面积极板慎用。' },
        serpentine: { name: '蛇形流场', dp: 4, drain: 4, even: 3,
          pros: '一条流道走完全程，气速高、吹水能力强；代价是流道越长压降越大，大面积时泵气损失明显。' },
        par_serp: { name: '平行蛇形流场', dp: 3, drain: 3, even: 4,
          pros: '几条短蛇形并联，压降与分配均匀性折中；可通过增减并联条数适配板型，是车用最常见的结构。' },
        interdigitated: { name: '叉指流场', dp: 5, drain: 4, even: 3,
          pros: '非畅通流道强制气体穿过多孔电极对流，传质好、排水强；但死端多、压降最大，泵功高。' },
        wavy: { name: '波浪流场', dp: 3, drain: 4, even: 3,
          pros: '波浪脊诱发横向二次流，把气体“搅”进扩散层并带走积水；压降中等偏高，流道加工更复杂。' }
      };
      var ORDER = ['parallel', 'serpentine', 'par_serp', 'interdigitated', 'wavy'];
      var NOTES = {
        parallel: '并联通道各自独立，流量只靠两端歧管压差分配，很容易不均。',
        serpentine: '同一条通道左右往复 5 次，全程被强制吹扫，排水好但压降大。',
        par_serp: '这是 3 条并联蛇形之一，单条长度短，压降比单蛇形低。',
        interdigitated: '这条流道一端封死，气体只能穿过多孔电极进入相邻流道。',
        wavy: '波浪通道让气流左右摆动，产生横向二次流，帮助进扩散层。'
      };
      var DPMAP = ['低', '较低', '中', '较高', '高'];
      var GOODMAP = ['差', '较差', '中', '较好', '好'];
      var cur = 'serpentine', hover = null;
      var state = { channels: [] };

      root.innerHTML = [
        '<p class="dm-tip">切换五种流道看结构差异；把鼠标放到某条流道上会高亮。条形是 5 格定性比较，不是计算值。</p>',
        '<div class="tabs">',
        ORDER.map(function (k) { return '<button type="button" class="demo-btn" data-f="' + k + '">' + FIELDS[k].name.replace('流场', '') + '</button>'; }).join(''),
        '</div>',
        '<canvas class="demo-canvas dm-cv"></canvas>',
        '<div class="bars">',
        '<div class="brow"><span class="bn">压降（越大越费泵功）</span><span class="seg" data-b="dp"></span><span class="bv" data-v="dp"></span></div>',
        '<div class="brow"><span class="bn">排水能力</span><span class="seg" data-b="drain"></span><span class="bv" data-v="drain"></span></div>',
        '<div class="brow"><span class="bn">气体分配均匀度</span><span class="seg" data-b="even"></span><span class="bv" data-v="even"></span></div>',
        '</div>',
        '<p class="pros" data-r="pros"></p>',
        '<p class="hint" data-r="hover">把鼠标移到流道上试一试。</p>',
        '<p class="demo-note">三个条各 5 格：格数越多，压降越大 / 排水越好 / 分配越均匀。评分依据书中 2.2.1 节对四类传统流场和波浪流场的比较，属于定性示意。</p>',
        '</div>',
        '<style>',
        '.dm-ff .tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}',
        '.dm-ff .demo-btn{padding:3px 12px;font-size:12.2px}',
        '.dm-ff canvas{display:block;width:100%}',
        '.dm-ff .bars{display:grid;gap:4px;margin:10px 0 4px}',
        '.dm-ff .brow{display:grid;grid-template-columns:minmax(96px,1fr) 104px auto;align-items:center;gap:10px;font-size:12px;color:var(--dm-ink2)}',
        '.dm-ff .seg{display:flex;gap:3px}',
        '.dm-ff .seg i{flex:1;height:8px;border-radius:1px;background:var(--dm-line)}',
        '.dm-ff .seg i.on{background:var(--dm-h2)}',
        '.dm-ff .bv{font-size:11.6px;color:var(--dm-ink);white-space:nowrap;font-variant-numeric:tabular-nums}',
        '.dm-ff .pros{margin:8px 0 0;font-size:12.4px}',
        '.dm-ff .hint{margin:4px 0 0;font-size:12.2px;color:var(--dm-ink2);border-left:2px solid var(--dm-accent);padding-left:9px;min-height:1.8em}',
        '</style>'
      ].join('');

      var cv = root.querySelector('canvas');
      var rd = {};
      root.querySelectorAll('[data-r]').forEach(function (el) { rd[el.getAttribute('data-r')] = el; });
      // 5 格评分条
      var segs = {}, bvs = {};
      ['dp', 'drain', 'even'].forEach(function (k) {
        var wrap = root.querySelector('[data-b="' + k + '"]');
        for (var i = 0; i < 5; i++) wrap.appendChild(document.createElement('i'));
        segs[k] = wrap.querySelectorAll('i');
        bvs[k] = root.querySelector('[data-v="' + k + '"]');
      });
      var buttons = root.querySelectorAll('button[data-f]');
      function setBars() {
        var f = FIELDS[cur];
        ['dp', 'drain', 'even'].forEach(function (k) {
          var n = f[k];
          for (var i = 0; i < 5; i++) segs[k][i].className = i < n ? 'on' : '';
          var word = k === 'dp' ? DPMAP[n - 1] : GOODMAP[n - 1];
          bvs[k].textContent = word + ' · ' + n + '/5';
        });
        rd.pros.textContent = f.pros;
      }

      // 生成流道中心线；蛇形用半圆回折，肉眼能看出往复
      function snake(xa, xb, y0, y1, passes) {
        var pts = [], d = (y1 - y0) / (passes - 1), r = d / 2;
        for (var k = 0; k < passes; k++) {
          var ya = y0 + k * d;
          if (k % 2 === 0) {
            pts.push({ x: xa, y: ya }, { x: xb, y: ya });
            if (k < passes - 1) {
              for (var a = -Math.PI / 2; a <= Math.PI / 2 + 1e-6; a += Math.PI / 10) {
                pts.push({ x: xb + r * Math.cos(a), y: ya + r + r * Math.sin(a) });
              }
            }
          } else {
            pts.push({ x: xb, y: ya }, { x: xa, y: ya });
            if (k < passes - 1) {
              for (var b = Math.PI / 2; b <= Math.PI * 1.5 + 1e-6; b += Math.PI / 10) {
                pts.push({ x: xa + r * Math.cos(b), y: ya + r + r * Math.sin(b) });
              }
            }
          }
        }
        return pts;
      }

      function build(type, W, HH) {
        var x0 = 82, x1 = W - 82, y0 = 30, y1 = HH - 28;
        var chans = [];
        function add(pts, openL, openR) { chans.push({ id: chans.length + 1, pts: pts, openL: openL !== false, openR: openR !== false }); }
        if (type === 'parallel') {
          var n = 8, dy = (y1 - y0) / (n - 1);
          for (var i = 0; i < n; i++) add([{ x: x0, y: y0 + i * dy }, { x: x1, y: y0 + i * dy }]);
        } else if (type === 'serpentine') {
          add(snake(x0, x1, y0, y1, 5));
        } else if (type === 'par_serp') {
          var g = 3, gap = 34, band = (x1 - x0 - gap * (g - 1)) / g;
          for (var j = 0; j < g; j++) {
            var gx0 = x0 + j * (band + gap), gx1 = gx0 + band;
            add(snake(gx0, gx1, y0, y1, 5));
          }
        } else if (type === 'interdigitated') {
          var n2 = 8, d2 = (y1 - y0) / (n2 - 1);
          for (var k2 = 0; k2 < n2; k2++) {
            var y2 = y0 + k2 * d2;
            if (k2 % 2 === 0) add([{ x: x0, y: y2 }, { x: x1 - 26, y: y2 }], true, false);
            else add([{ x: x0 + 26, y: y2 }, { x: x1, y: y2 }], false, true);
          }
        } else {
          var n3 = 7, d3 = (y1 - y0) / (n3 - 1);
          for (var m = 0; m < n3; m++) {
            var yc = y0 + m * d3, arr = [];
            for (var x = x0; x <= x1 + 0.1; x += 4) {
              arr.push({ x: x, y: yc + 5 * Math.sin(2 * Math.PI * (x - x0) / 96) });
            }
            add(arr);
          }
        }
        return { channels: chans, x0: x0, x1: x1 };
      }

      function draw() {
        var box = fitCanvas(cv, H), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 200) return;
        ctx.clearRect(0, 0, W, HH);
        var sc = build(cur, W, HH), f = FIELDS[cur];
        state.channels = sc.channels;
        var railL = 58, railR = W - 58;

        // 歧管
        ctx.strokeStyle = T.ink2; ctx.globalAlpha = 0.22; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(railL, 26); ctx.lineTo(railL, HH - 24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(railR, 26); ctx.lineTo(railR, HH - 24); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        ctx.fillStyle = T.ink2; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('进气', railL, 20); ctx.fillText('排气', railR, 20);
        // 流道与歧管的短接（只在开口端）
        ctx.strokeStyle = T.ink2; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
        for (var c = 0; c < sc.channels.length; c++) {
          var ch = sc.channels[c], a = ch.pts[0], b = ch.pts[ch.pts.length - 1];
          if (ch.openL) { ctx.beginPath(); ctx.moveTo(railL, a.y); ctx.lineTo(sc.x0, a.y); ctx.stroke(); }
          if (ch.openR) { ctx.beginPath(); ctx.moveTo(sc.x1, b.y); ctx.lineTo(railR, b.y); ctx.stroke(); }
        }
        ctx.globalAlpha = 1;

        // 流道
        for (var i = 0; i < sc.channels.length; i++) {
          var pts = sc.channels[i].pts, on = hover === sc.channels[i].id;
          ctx.strokeStyle = on ? T.accent : T.h2;
          ctx.lineWidth = on ? 5.5 : 3.6;
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.beginPath();
          for (var j = 0; j < pts.length; j++) {
            if (j === 0) ctx.moveTo(pts[j].x, pts[j].y); else ctx.lineTo(pts[j].x, pts[j].y);
          }
          ctx.stroke();
        }

        // 叉指：封端竖杠 + 穿 GDL 的对流箭头
        if (cur === 'interdigitated') {
          ctx.strokeStyle = T.ink2; ctx.lineWidth = 2;
          for (var k = 0; k < sc.channels.length; k++) {
            var p0 = sc.channels[k].pts[0], p1 = sc.channels[k].pts[sc.channels[k].pts.length - 1];
            if (!sc.channels[k].openR) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y - 7); ctx.lineTo(p1.x, p1.y + 7); ctx.stroke(); }
            if (!sc.channels[k].openL) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y - 7); ctx.lineTo(p0.x, p0.y + 7); ctx.stroke(); }
          }
          ctx.setLineDash([3, 3]); ctx.strokeStyle = T.water; ctx.lineWidth = 1.4;
          for (var q = 0; q < sc.channels.length - 1; q += 2) {
            var ya = sc.channels[q].pts[0].y, yb = sc.channels[q + 1].pts[0].y;
            var xm = sc.x0 + 40 + (q % 4 === 0 ? 0 : 22);
            ctx.beginPath(); ctx.moveTo(xm, ya + 3); ctx.lineTo(xm, yb - 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(xm, yb - 3); ctx.lineTo(xm - 3, yb - 8); ctx.moveTo(xm, yb - 3); ctx.lineTo(xm + 3, yb - 8); ctx.stroke();
          }
          ctx.setLineDash([]);
        }

        // 流向箭头
        ctx.fillStyle = T.ink2;
        for (var s = 0; s < sc.channels.length; s++) {
          var cs = sc.channels[s].pts;
          var idx = Math.floor(cs.length * 0.42);
          var q0 = cs[Math.max(0, idx - 1)], q1 = cs[idx];
          var ang = Math.atan2(q1.y - q0.y, q1.x - q0.x);
          ctx.save(); ctx.translate(q1.x, q1.y); ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-2, 3.2); ctx.lineTo(-2, -3.2); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = T.ink2; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(f.name + '（示意画法，不按比例）', W - 4, HH - 4);
      }

      function selectField(k) {
        cur = k; hover = null;
        for (var i = 0; i < buttons.length; i++) buttons[i].classList.toggle('on', buttons[i].getAttribute('data-f') === k);
        rd.hover.textContent = '把鼠标移到流道上试一试。';
        try { draw(); setBars(); } catch (e) { if (window.console) console.warn('flowfield:', e); }
      }
      for (var bi = 0; bi < buttons.length; bi++) {
        (function (btn) { btn.addEventListener('click', function () { selectField(btn.getAttribute('data-f')); }); })(buttons[bi]);
      }

      cv.addEventListener('mousemove', function (ev) {
        var r = cv.getBoundingClientRect(), mx = ev.clientX - r.left, my = ev.clientY - r.top;
        var best = null, bd = 1e9;
        for (var i = 0; i < state.channels.length; i++) {
          var pts = state.channels[i].pts;
          for (var j = 1; j < pts.length; j++) {
            var d = dist2(mx, my, pts[j - 1], pts[j]);
            if (d < bd) { bd = d; best = state.channels[i]; }
          }
        }
        var id = (best && bd < 100) ? best.id : null;
        if (id !== hover) { hover = id; try { draw(); } catch (e) {} }
        if (id) rd.hover.textContent = '第 ' + id + ' 条流道：' + NOTES[cur];
      });
      cv.addEventListener('mouseleave', function () {
        if (hover !== null) { hover = null; try { draw(); } catch (e) {} }
        rd.hover.textContent = '把鼠标移到流道上试一试。';
      });

      function observe() {
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function () { if (!root.isConnected) { ro.disconnect(); return; } try { draw(); } catch (e) {} });
          ro.observe(cv.parentNode || cv);
        } else window.addEventListener('resize', function () { try { draw(); } catch (e) {} });
      }
      selectField(cur);
      observe();
    }
  };
})();
