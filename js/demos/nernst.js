/* 可逆电压：温度、分压与"熵热" */
(function () {
  'use strict';
  window.DEMOS = window.DEMOS || {};
  var rootStyle = null;
  function cssv(n, fb) {
    try {
      /* 一次 draw 读 6 个 CSS 变量：复用同一个实时 CSSStyleDeclaration */
      if (!rootStyle) rootStyle = getComputedStyle(document.documentElement);
      var v = (rootStyle.getPropertyValue(n) || '').trim();
      return v || fb;
    } catch (e) { return fb; }
  }
  var R = 8.314, F = 96485, dH = -285.83e3, dS = -163.29;

  function E0(T) { return -(dH - T * dS) / (2 * F); }
  function Ecell(T, pH2, pO2) { return E0(T) + R * T / (2 * F) * Math.log(pH2 * Math.sqrt(pO2)); }

  var st = { T: 353.15, pH2: 1.0, pO2: 0.21 };

  window.DEMOS.nernst = {
    name: '可逆电压：为什么温度升高反而不划算',
    init: function (root) {
      root.innerHTML = [
        '<div class="ctl"><label>温度</label><input type="range" id="nT" min="273" max="373" step="1" value="353"><span class="val" id="nVT"></span></div>',
        '<div class="ctl"><label>氢气分压</label><input type="range" id="nH" min="0.5" max="3" step="0.05" value="1"><span class="val" id="nVH"></span></div>',
        '<div class="ctl"><label>氧气分压</label><input type="range" id="nO" min="0.05" max="3" step="0.01" value="0.21"><span class="val" id="nVO"></span></div>',
        '<canvas class="demo-canvas" id="nCv" height="360"></canvas>',
        '<div class="demo-note" id="nRead"></div>'
      ].join('');
      var cv = root.querySelector('#nCv'), ctx = null, W = 0, H = 360;
      /* 控件与读数节点一次取好，避免每次 input/draw 重复查询 DOM */
      var elT = root.querySelector('#nT'), elH = root.querySelector('#nH'), elO = root.querySelector('#nO');
      var vT = root.querySelector('#nVT'), vH = root.querySelector('#nVH'), vO = root.querySelector('#nVO');
      var readEl = root.querySelector('#nRead');

      function sync() {
        st.T = +elT.value;
        st.pH2 = +elH.value;
        st.pO2 = +elO.value;
        vT.textContent = (st.T - 273.15).toFixed(0) + ' ℃';
        vH.textContent = st.pH2.toFixed(2) + ' atm';
        vO.textContent = st.pO2.toFixed(2) + ' atm';
      }

      function prep() {
        var dpr = window.devicePixelRatio || 1;
        var cw = cv.clientWidth || 640;
        W = cw;
        cv.width = Math.max(1, Math.round(cw * dpr));
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
        ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function draw() {
        if (!ctx) return;
        var ink2 = cssv('--ink-2', '#5b6673'), line = cssv('--line', '#e5e0d5'),
          accent = cssv('--accent', '#0d7a74'), heat = cssv('--heat', '#cf5a15'),
          water = cssv('--water', '#0aa0b4'), ink = cssv('--ink', '#16202a');
        ctx.clearRect(0, 0, W, H);
        ctx.font = '11px system-ui, sans-serif';

        var ml = 54, mr = 24, mt = 18, ph = 210, pw = W - ml - mr;
        var t0 = 273.15, t1 = 373.15, y0 = 1.10, y1 = 1.28;
        function X(t) { return ml + (t - t0) / (t1 - t0) * pw; }
        function Y(e) { return mt + ph - (e - y0) / (y1 - y0) * ph; }

        ctx.strokeStyle = line; ctx.lineWidth = 1;
        for (var e = y0; e <= y1 + 1e-9; e += 0.03) {
          ctx.beginPath(); ctx.moveTo(ml, Y(e)); ctx.lineTo(ml + pw, Y(e)); ctx.stroke();
        }
        for (var t = 273.15; t <= 373.16; t += 20) {
          ctx.beginPath(); ctx.moveTo(X(t), mt); ctx.lineTo(X(t), mt + ph); ctx.stroke();
        }
        ctx.strokeStyle = ink2; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(ml, mt + ph); ctx.lineTo(ml + pw, mt + ph); ctx.stroke();
        ctx.fillStyle = ink2;
        for (var e2 = y0; e2 <= y1 + 1e-9; e2 += 0.06) {
          ctx.textAlign = 'right'; ctx.fillText(e2.toFixed(2), ml - 6, Y(e2) + 3);
        }
        for (var t2 = 273.15; t2 <= 373.16; t2 += 20) {
          ctx.textAlign = 'center';
          ctx.fillText((t2 - 273.15).toFixed(0), X(t2), mt + ph + 15);
        }
        ctx.textAlign = 'center';
        ctx.fillText('温度 / ℃', ml + pw / 2, mt + ph + 32);
        ctx.save();
        ctx.translate(14, mt + ph / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('可逆电压 E / V', 0, 0);
        ctx.restore();

        // 曲线
        ctx.beginPath(); ctx.strokeStyle = accent; ctx.lineWidth = 2.4;
        for (var k = 0; k <= 200; k++) {
          var tt = t0 + (t1 - t0) * k / 200;
          var ee = Ecell(tt, st.pH2, st.pO2);
          var px = X(tt), py = Y(ee);
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 标准态 1.229V 参考
        ctx.strokeStyle = ink2; ctx.globalAlpha = 0.45; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(ml, Y(1.229)); ctx.lineTo(ml + pw, Y(1.229)); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = ink2; ctx.textAlign = 'left';
        ctx.fillText('标准态 1.229 V（25 ℃，液态水）', ml + 6, Y(1.229) - 6);

        // 当前点
        var cur = Ecell(st.T, st.pH2, st.pO2);
        ctx.fillStyle = heat;
        ctx.beginPath(); ctx.arc(X(st.T), Y(cur), 5, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = heat; ctx.globalAlpha = 0.4; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(X(st.T), mt + ph); ctx.lineTo(X(st.T), Y(cur)); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = ink; ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = X(st.T) > ml + pw * 0.6 ? 'right' : 'left';
        ctx.fillText(cur.toFixed(3) + ' V', X(st.T) + (ctx.textAlign === 'right' ? -9 : 9), Y(cur) - 10);
        ctx.font = '11px system-ui, sans-serif';

        /* 下半部分：焓的分配 */
        var by = mt + ph + 52, bh = 30, bw = pw;
        var useful = -dH + st.T * dS;      // 可做电功的部分 |ΔG|
        var total = -dH;
        var frac = useful / total;
        ctx.fillStyle = line;
        ctx.fillRect(ml, by, bw, bh);
        ctx.fillStyle = water;
        ctx.fillRect(ml, by, bw * frac, bh);
        ctx.fillStyle = heat;
        ctx.fillRect(ml + bw * frac, by, bw * (1 - frac), bh);
        ctx.fillStyle = '#fff';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('电功上限 |ΔG| ' + (useful / 1000).toFixed(1) + ' kJ/mol', ml + 8, by + 19);
        ctx.textAlign = 'right';
        ctx.fillText('熵热 T|ΔS| ' + ((-st.T * dS) / 1000).toFixed(1) + ' kJ/mol', ml + bw - 8, by + 19);
        ctx.fillStyle = ink2; ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('反应焓 |ΔH| = ' + (total / 1000).toFixed(1) + ' kJ/mol（以 1 mol H₂ 计）', ml, by - 7);
        ctx.textAlign = 'center';
        ctx.fillText('热力学效率上限 = |ΔG| / |ΔH| = ' + (frac * 100).toFixed(1) + '%', ml + bw / 2, by + bh + 18);

        var nst = R * st.T / (2 * F) * Math.log(st.pH2 * Math.sqrt(st.pO2));
        readEl.innerHTML =
          '当前 E = <b>' + cur.toFixed(3) + ' V</b>，其中标准态部分 ' + E0(st.T).toFixed(3) + ' V，' +
          '能斯特修正 <b>' + (nst >= 0 ? '+' : '') + (nst * 1000).toFixed(1) + ' mV</b>。' +
          '温度每升高 1 ℃，可逆电压下降约 0.85 mV——这正是"低温运行更省电压、但反应更慢、还要更复杂的水管理"的根源。';
      }

      function redraw() { prep(); draw(); }
      [elT, elH, elO].forEach(function (inp) {
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
