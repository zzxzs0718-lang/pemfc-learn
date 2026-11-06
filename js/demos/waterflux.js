/* 膜内水传递：电渗拖拽 vs 反扩散 */
(function () {
  'use strict';
  window.DEMOS = window.DEMOS || {};
  var rootStyle = null;
  function cssv(n, fb) {
    try {
      /* 一次 draw 读 7 个 CSS 变量：复用同一个实时 CSSStyleDeclaration */
      if (!rootStyle) rootStyle = getComputedStyle(document.documentElement);
      var v = (rootStyle.getPropertyValue(n) || '').trim();
      return v || fb;
    } catch (e) { return fb; }
  }
  var F = 96485;

  var st = { i: 1.0, L: 50, la: 8, lc: 14, T: 353.15 };

  function model(s) {
    var Lcm = s.L * 1e-4;                       // μm → cm
    var cdry = 1.8e-3;                          // mol/cm³ 干膜浓度（ρ/EW）
    var lavg = (s.la + s.lc) / 2;
    var nd = 2.5 * lavg / 22;                   // 电渗拖拽系数（water/proton）
    var D = 1.6e-6 * Math.exp(2416 * (1 / 303 - 1 / s.T)) * (0.5 + 0.06 * lavg); // cm²/s
    var dc = cdry * (s.lc - s.la);              // mol/cm³
    var Ndiff = D * dc / Lcm;                   // mol/(cm²·s)，正=阴极→阳极
    var drag = nd * s.i / F;                    // mol/(cm²·s)，正=阳极→阴极
    var perProton = s.i / F;
    return {
      nd: nd, D: D, Ndiff: Ndiff, drag: drag,
      dragPP: nd,
      diffPP: perProton > 0 ? Ndiff / perProton : 0,
      netPP: perProton > 0 ? (nd - Ndiff / perProton) : 0
    };
  }

  window.DEMOS.waterflux = {
    name: '膜里到底往哪边跑水',
    init: function (root) {
      root.innerHTML = [
        '<div class="ctl"><label>电流密度</label><input type="range" id="wI" min="0.05" max="2" step="0.05" value="1"><span class="val" id="wVI"></span></div>',
        '<div class="ctl"><label>膜厚</label><input type="range" id="wL" min="15" max="200" step="1" value="50"><span class="val" id="wVL"></span></div>',
        '<div class="ctl"><label>阳极侧 λ</label><input type="range" id="wA" min="1" max="16" step="0.5" value="8"><span class="val" id="wVA"></span></div>',
        '<div class="ctl"><label>阴极侧 λ</label><input type="range" id="wC" min="1" max="22" step="0.5" value="14"><span class="val" id="wVC"></span></div>',
        '<div class="ctl"><label>温度</label><input type="range" id="wT" min="303" max="363" step="1" value="353"><span class="val" id="wVT"></span></div>',
        '<canvas class="demo-canvas" id="wCv" height="300"></canvas>',
        '<div class="demo-note" id="wRead"></div>'
      ].join('');
      var cv = root.querySelector('#wCv'), ctx = null, W = 0, H = 300;
      /* 控件与读数节点一次取好，避免每次 input/draw 重复查询 DOM */
      var elI = root.querySelector('#wI'), elL = root.querySelector('#wL'), elA = root.querySelector('#wA'),
        elC = root.querySelector('#wC'), elT = root.querySelector('#wT');
      var vI = root.querySelector('#wVI'), vL = root.querySelector('#wVL'), vA = root.querySelector('#wVA'),
        vC = root.querySelector('#wVC'), vT = root.querySelector('#wVT');
      var readEl = root.querySelector('#wRead');

      function sync() {
        st.i = +elI.value;
        st.L = +elL.value;
        st.la = +elA.value;
        st.lc = +elC.value;
        st.T = +elT.value;
        vI.textContent = st.i.toFixed(2) + ' A/cm²';
        vL.textContent = st.L + ' μm';
        vA.textContent = st.la.toFixed(1);
        vC.textContent = st.lc.toFixed(1);
        vT.textContent = (st.T - 273.15).toFixed(0) + ' ℃';
      }

      function prep() {
        var dpr = window.devicePixelRatio || 1;
        W = cv.clientWidth || 640;
        cv.width = Math.max(1, Math.round(W * dpr));
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
        ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function arrow(x, y, len, dir, color, wdt) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = wdt;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * len, y); ctx.stroke();
        var hx = x + dir * len;
        ctx.beginPath();
        ctx.moveTo(hx, y); ctx.lineTo(hx - dir * 8, y - 5); ctx.lineTo(hx - dir * 8, y + 5);
        ctx.closePath(); ctx.fill();
      }

      function draw() {
        if (!ctx) return;
        var ink = cssv('--ink', '#16202a'), ink2 = cssv('--ink-2', '#5b6673'),
          line = cssv('--line', '#e5e0d5'), accent = cssv('--accent', '#0d7a74'),
          water = cssv('--water', '#0aa0b4'), heat = cssv('--heat', '#cf5a15'),
          key = cssv('--key-line', '#4d9a52');
        var m = model(st);
        ctx.clearRect(0, 0, W, H);
        ctx.font = '11.5px system-ui, sans-serif';

        var bx = 96, bw = W - 200, by = 64, bh = 72;

        // 膜体
        ctx.fillStyle = 'rgba(10,160,180,0.13)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = water; ctx.lineWidth = 1.2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = ink2; ctx.textAlign = 'center';
        ctx.fillText('质子交换膜（' + st.L + ' μm）', bx + bw / 2, by + bh - 9);

        // λ 剖面
        ctx.beginPath(); ctx.strokeStyle = accent; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]);
        ctx.moveTo(bx, by + bh - (st.la / 22) * bh);
        ctx.lineTo(bx + bw, by + bh - (st.lc / 22) * bh);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = accent; ctx.textAlign = 'left';
        ctx.fillText('λ 分布', bx + 6, by + 16);

        // 阳极 / 阴极侧标注
        ctx.fillStyle = heat; ctx.textAlign = 'center'; ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('阳极 λ=' + st.la.toFixed(1), bx - 2, by - 14);
        ctx.fillText('阴极 λ=' + st.lc.toFixed(1), bx + bw + 2, by - 14);
        ctx.font = '11.5px system-ui, sans-serif';

        // 拖拽箭头（阳极→阴极，画在膜上方）
        var dragLen = Math.min(bw - 40, 20 + m.dragPP * 62);
        arrow(bx + bw / 2 - dragLen / 2, by - 32, dragLen, 1, heat, 3.2);
        ctx.fillStyle = heat; ctx.textAlign = 'center';
        ctx.fillText('电渗拖拽  ' + m.dragPP.toFixed(2) + ' H₂O/H⁺', bx + bw / 2, by - 42);

        // 反扩散箭头（阴极→阳极，画在膜下方）
        var diffLen = Math.min(bw - 40, 20 + m.diffPP * 62);
        arrow(bx + bw / 2 + diffLen / 2, by + bh + 30, diffLen, -1, water, 3.2);
        ctx.fillStyle = water;
        ctx.fillText('反扩散  ' + m.diffPP.toFixed(2) + ' H₂O/H⁺', bx + bw / 2, by + bh + 50);

        // 净通量条
        var ny = by + bh + 100;
        var net = m.netPP;
        var cx = bx + bw / 2, half = bw / 2 - 10;
        ctx.fillStyle = line; ctx.fillRect(bx, ny - 9, bw, 18);
        var scale = Math.min(1, Math.abs(net) / 1.2);
        ctx.fillStyle = net > 0 ? heat : (net < 0 ? water : key);
        if (net > 0) ctx.fillRect(cx, ny - 9, half * scale, 18);
        else ctx.fillRect(cx - half * scale, ny - 9, half * scale, 18);
        ctx.strokeStyle = ink2; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, ny - 13); ctx.lineTo(cx, ny + 13); ctx.stroke();
        ctx.fillStyle = ink2; ctx.textAlign = 'left';
        ctx.fillText('← 阳极变湿', bx, ny - 16);
        ctx.textAlign = 'right';
        ctx.fillText('阳极变干 →', bx + bw, ny - 16);

        var verdict, vcol;
        if (net > 0.12) { verdict = '拖拽占上风：阳极侧在失水，膜靠阴极侧补水。'; vcol = heat; }
        else if (net < -0.12) { verdict = '反扩散占上风：水被推回阳极，阳极有积水/水淹风险。'; vcol = water; }
        else { verdict = '两者基本抵消：膜内水的收支接近平衡，这是设计想要的点。'; vcol = key; }
        ctx.textAlign = 'center'; ctx.fillStyle = vcol; ctx.font = '12.5px system-ui, sans-serif';
        ctx.fillText('净水通量 ' + (net >= 0 ? '+' : '') + net.toFixed(2) + ' H₂O/H⁺（正=流向阴极）', bx + bw / 2, ny + 34);

        readEl.innerHTML =
          verdict + '<br>拖拽 ∝ <i>n</i><sub>d</sub>·<i>i</i>（随电流线性增大，且 λ 越大越强）；' +
          '反扩散 ∝ <i>D</i><sub>λ</sub>·Δλ/<i>L</i>（膜越薄越强，所以薄膜是"自增湿"的关键）。' +
          '当前拖拽 ' + (m.drag * 1e6).toFixed(1) + '、反扩散 ' + (Math.abs(m.Ndiff) * 1e6).toFixed(1) +
          ' ×10⁻⁶ mol/(cm²·s)，扩散系数 ' + (m.D * 1e6).toFixed(2) + '×10⁻⁶ cm²/s。';
      }

      function redraw() { prep(); draw(); }
      [elI, elL, elA, elC, elT].forEach(function (inp) {
        inp.addEventListener('input', function () { sync(); draw(); });
      });
      try { sync(); redraw(); } catch (e) { root.innerHTML += '<p class="demo-note">绘图失败：' + e.message + '</p>'; }
      if (window.ResizeObserver) {
        try { new ResizeObserver(function () { redraw(); }).observe(cv); } catch (e) { /* 忽略 */ }
      } else { window.addEventListener('resize', redraw); }
      new MutationObserver(function () { redraw(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  };
})();
