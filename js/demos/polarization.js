/* 极化曲线：三段电压损失 + 功率密度 */
(function () {
  'use strict';
  window.DEMOS = window.DEMOS || {};

  var rootStyle = null;
  function cssv(n, fb) {
    try {
      /* 一次 draw 要读 8 个 CSS 变量：复用同一个实时 CSSStyleDeclaration，
         避免每个颜色都重新解析一次样式（原实现调用 getComputedStyle 8 次）。 */
      if (!rootStyle) rootStyle = getComputedStyle(document.documentElement);
      var v = (rootStyle.getPropertyValue(n) || '').trim();
      return v || fb;
    } catch (e) { return fb; }
  }

  var R = 8.314, F = 96485;
  var st = { T: 353.15, j0: 1e-3, Rom: 0.15, jL: 1.6, alpha: 0.5, showLoss: true };

  function erev(T, pH2, pO2) {
    // 温度修正 + 能斯特（分压 atm）
    return 1.229 - 0.85e-3 * (T - 298.15) + (R * T / (2 * F)) * Math.log(pH2 * Math.pow(pO2, 0.5));
  }
  /* 每条曲线共用一组固定参数：把与 j 无关的 E、b 在 draw 开头算一次。
     原实现对每个采样点都重算 erev（含 Math.pow/Math.log），一次 draw 约 1360 次。 */
  function makeVoltage(s) {
    var E = erev(s.T, 1.0, 0.21);
    var b = R * s.T / (s.alpha * F);
    return function (j) {
      var act = b * Math.log(Math.max(j, 1e-6) / s.j0);
      if (act < 0) act = 0;
      var ohm = j * s.Rom;
      var ratio = Math.min(0.999, j / s.jL);
      var conc = -0.06 * Math.log(1 - ratio);
      return { E: E, act: act, ohm: ohm, conc: conc, V: Math.max(0, E - act - ohm - conc) };
    };
  }

  window.DEMOS.polarization = {
    name: '极化曲线：电压到底丢在哪',
    init: function (root) {
      root.innerHTML = [
        '<div class="ctl"><label>温度</label><input type="range" id="pT" min="298" max="368" step="1" value="353"><span class="val" id="vT"></span></div>',
        '<div class="ctl"><label>交换电流密度 j₀</label><input type="range" id="pj0" min="-5" max="-1" step="0.1" value="-3"><span class="val" id="vj0"></span></div>',
        '<div class="ctl"><label>面电阻 R</label><input type="range" id="pR" min="0.03" max="0.6" step="0.01" value="0.15"><span class="val" id="vR"></span></div>',
        '<div class="ctl"><label>极限电流 j_L</label><input type="range" id="pL" min="0.5" max="3" step="0.05" value="1.6"><span class="val" id="vL"></span></div>',
        '<div class="ctl"><label>传输系数 α</label><input type="range" id="pA" min="0.3" max="0.7" step="0.02" value="0.5"><span class="val" id="vA"></span></div>',
        '<div class="ctl"><label>显示损失分解</label><button class="demo-btn on" id="pLoss">显示</button></div>',
        '<canvas class="demo-canvas" id="pCv" height="300"></canvas>',
        '<div class="legend"><span><i style="background:var(--accent)"></i>输出电压 V</span>' +
          '<span><i style="background:var(--water)"></i>功率密度 P = V·j</span>' +
          '<span><i style="background:var(--heat)"></i>活化损失</span>' +
          '<span><i style="background:var(--h2)"></i>欧姆损失</span>' +
          '<span><i style="background:var(--key-line)"></i>传质损失</span></div>',
        '<div class="demo-note" id="pRead"></div>'
      ].join('');

      var cv = root.querySelector('#pCv');
      var read = root.querySelector('#pRead');
      var ctx = null, W = 0, H = 0;
      var hoverJ = -1;
      /* 控件节点在演示生命周期内不会重建：一次取好，避免每次 input 都查询 10 次 DOM */
      var elT = root.querySelector('#pT'), elJ0 = root.querySelector('#pj0'),
        elR = root.querySelector('#pR'), elL = root.querySelector('#pL'), elA = root.querySelector('#pA'),
        vT = root.querySelector('#vT'), vJ0 = root.querySelector('#vj0'), vR = root.querySelector('#vR'),
        vL = root.querySelector('#vL'), vA = root.querySelector('#vA');

      function sync() {
        st.T = +elT.value;
        st.j0 = Math.pow(10, +elJ0.value);
        st.Rom = +elR.value;
        st.jL = +elL.value;
        st.alpha = +elA.value;
        vT.textContent = (st.T - 273.15).toFixed(0) + ' ℃';
        var j0 = st.j0;
        vJ0.textContent = (j0 < 0.01 ? j0.toExponential(1) : j0.toFixed(3)) + ' A/cm²';
        vR.textContent = st.Rom.toFixed(2) + ' Ω·cm²';
        vL.textContent = st.jL.toFixed(2) + ' A/cm²';
        vA.textContent = st.alpha.toFixed(2);
      }

      function prep() {
        var dpr = window.devicePixelRatio || 1;
        var cw = cv.clientWidth || 640;
        W = cw; H = 300;
        cv.width = Math.max(1, Math.round(cw * dpr));
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
        ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function draw() {
        if (!ctx) return;
        var ink = cssv('--ink', '#16202a'), ink2 = cssv('--ink-2', '#5b6673'),
          line = cssv('--line', '#e5e0d5'), accent = cssv('--accent', '#0d7a74'),
          water = cssv('--water', '#0aa0b4'), heat = cssv('--heat', '#cf5a15'),
          h2 = cssv('--h2', '#0b6ca6'), key = cssv('--key-line', '#4d9a52');

        var V = makeVoltage(st);
        var ml = 52, mr = 54, mt = 16, mb = 40;
        var pw = W - ml - mr, ph = H - mt - mb;
        var xmax = 2.2, ymax = 1.25, pmax = 1.4;
        ctx.clearRect(0, 0, W, H);
        ctx.font = '11px system-ui, sans-serif';

        function X(j) { return ml + j / xmax * pw; }
        function Y(v) { return mt + ph - v / ymax * ph; }

        // 网格
        ctx.strokeStyle = line; ctx.lineWidth = 1;
        for (var v = 0; v <= ymax; v += 0.25) {
          ctx.beginPath(); ctx.moveTo(ml, Y(v)); ctx.lineTo(ml + pw, Y(v)); ctx.stroke();
        }
        for (var j = 0; j <= xmax; j += 0.25) {
          ctx.beginPath(); ctx.moveTo(X(j), mt); ctx.lineTo(X(j), mt + ph); ctx.stroke();
        }
        // 轴
        ctx.strokeStyle = ink2; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(ml, mt + ph); ctx.lineTo(ml + pw, mt + ph); ctx.stroke();
        // 右轴
        ctx.beginPath(); ctx.moveTo(ml + pw, mt); ctx.lineTo(ml + pw, mt + ph); ctx.stroke();

        ctx.fillStyle = ink2;
        for (var vv = 0; vv <= ymax; vv += 0.25) {
          var yy = Y(vv);
          ctx.textAlign = 'right'; ctx.fillText(vv.toFixed(2), ml - 6, yy + 3);
          ctx.textAlign = 'left';
          var pv = vv / ymax * pmax;
          if (vv > 0) ctx.fillText(pv.toFixed(2), ml + pw + 6, yy + 3);
        }
        for (var jj = 0; jj <= xmax; jj += 0.5) {
          ctx.textAlign = 'center';
          ctx.fillText(jj.toFixed(1), X(jj), mt + ph + 15);
        }
        ctx.save();
        ctx.translate(14, mt + ph / 2); ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.fillStyle = ink2;
        ctx.fillText('电压 U / V', 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(W - 11, mt + ph / 2); ctx.rotate(Math.PI / 2);
        ctx.textAlign = 'center'; ctx.fillStyle = water;
        ctx.fillText('功率密度 p / W·cm⁻²', 0, 0);
        ctx.restore();
        ctx.textAlign = 'center'; ctx.fillStyle = ink2;
        ctx.fillText('电流密度 j / A·cm⁻²', ml + pw / 2, H - 6);

        // 损失分解
        if (st.showLoss) {
          /* 三条损失曲线共用同一组采样：先算一遍电压，再分别取 act/ohm/conc。
             原实现对同一个 j 重复调用 voltage 三次。 */
          var lossVals = [];
          for (var kl = 0; kl <= 220; kl++) lossVals.push(V(Math.max(xmax * kl / 220, 0.001)));
          var pairs = [['act', heat], ['ohm', h2], ['conc', key]];
          pairs.forEach(function (pr) {
            ctx.beginPath(); ctx.strokeStyle = pr[1]; ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 3]);
            var first = true;
            for (var k = 0; k <= 220; k++) {
              var jx = xmax * k / 220;
              var val = lossVals[k][pr[0]];
              if (!isFinite(val) || val > ymax) break;
              var px = X(jx), py = Y(val);
              if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.setLineDash([]);
          });
        }

        // 电压曲线
        ctx.beginPath(); ctx.strokeStyle = accent; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
        var started = false, clipped = false;
        for (var k2 = 0; k2 <= 400; k2++) {
          var jx2 = xmax * k2 / 400;
          var o2 = V(Math.max(jx2, 1e-4));
          if (o2.V <= 0.002) { clipped = true; break; }
          var px2 = X(jx2), py2 = Y(o2.V);
          if (!started) { ctx.moveTo(px2, py2); started = true; } else ctx.lineTo(px2, py2);
        }
        ctx.stroke();

        // 功率曲线
        ctx.beginPath(); ctx.strokeStyle = water; ctx.lineWidth = 1.8;
        var s2 = false, peak = { p: 0, j: 0 };
        for (var k3 = 0; k3 <= 300; k3++) {
          var j3 = xmax * k3 / 300;
          var o3 = V(Math.max(j3, 1e-4));
          var p3 = o3.V * j3;
          if (p3 > peak.p) peak = { p: p3, j: j3 };
          var pxx = X(j3), pyy = Y(p3 / pmax * ymax);
          if (!s2) { ctx.moveTo(pxx, pyy); s2 = true; } else ctx.lineTo(pxx, pyy);
        }
        ctx.stroke();

        // 峰值标记
        ctx.fillStyle = water;
        ctx.beginPath(); ctx.arc(X(peak.j), Y(peak.p / pmax * ymax), 3.2, 0, 6.2832); ctx.fill();

        // 0.65 V 参考线
        ctx.strokeStyle = ink2; ctx.setLineDash([2, 4]); ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(ml, Y(0.65)); ctx.lineTo(ml + pw, Y(0.65)); ctx.stroke();
        ctx.globalAlpha = 1; ctx.setLineDash([]);
        ctx.fillStyle = ink2; ctx.textAlign = 'left';
        ctx.fillText('典型工作点 0.65 V', ml + 6, Y(0.65) - 5);

        // hover 十字线
        if (hoverJ >= 0) {
          var oh = V(Math.max(hoverJ, 1e-4));
          ctx.strokeStyle = ink2; ctx.globalAlpha = 0.35; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(X(hoverJ), mt); ctx.lineTo(X(hoverJ), mt + ph); ctx.stroke();
          ctx.globalAlpha = 1; ctx.setLineDash([]);
          ctx.fillStyle = accent;
          ctx.beginPath(); ctx.arc(X(hoverJ), Y(Math.max(0, oh.V)), 4, 0, 6.2832); ctx.fill();
        }

        // 读数
        var at1 = V(1.0);
        var eff = at1.V / 1.253 * 100;
        read.innerHTML = '在 1.0 A·cm⁻² 时：<b>U = ' + at1.V.toFixed(3) + ' V</b>，' +
          '其中活化 ' + at1.act.toFixed(3) + ' V、欧姆 ' + at1.ohm.toFixed(3) + ' V、传质 ' + at1.conc.toFixed(3) + ' V；' +
          '电压效率约 <b>' + eff.toFixed(0) + '%</b>。峰值功率密度 <b>' + peak.p.toFixed(2) + ' W·cm⁻²</b>' +
          '（j ≈ ' + peak.j.toFixed(2) + ' A·cm⁻²）。' +
          (clipped ? ' 曲线在 j≈' + (st.jL * 0.997).toFixed(2) + ' 处被极限电流截断。' : '');
      }

      function redraw() { prep(); draw(); }

      [elT, elJ0, elR, elL, elA].forEach(function (inp) {
        inp.addEventListener('input', function () { sync(); draw(); });
      });
      root.querySelector('#pLoss').addEventListener('click', function () {
        st.showLoss = !st.showLoss;
        this.classList.toggle('on', st.showLoss);
        this.textContent = st.showLoss ? '显示' : '隐藏';
        draw();
      });
      cv.addEventListener('mousemove', function (ev) {
        var r = cv.getBoundingClientRect();
        var ml = 52, mr = 54, pw = W - ml - mr;
        var j = (ev.clientX - r.left - ml) / pw * 2.2;
        hoverJ = (j >= 0 && j <= 2.2) ? j : -1;
        draw();
      });
      cv.addEventListener('mouseleave', function () { hoverJ = -1; draw(); });

      try { sync(); redraw(); } catch (e) { root.innerHTML += '<p class="demo-note">绘图失败：' + e.message + '</p>'; }
      if (window.ResizeObserver) {
        try { new ResizeObserver(function () { redraw(); }).observe(cv); } catch (e) { /* 忽略 */ }
      } else {
        window.addEventListener('resize', redraw);
      }
      var mo = new MutationObserver(function () { redraw(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  };
})();
