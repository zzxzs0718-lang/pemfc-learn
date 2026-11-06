/* 交互演示：0 ℃ 以下冷启动
   集总参数：整片电池一个热容，产热 = I(1.48 − V)；产水先进膜（λ 上限 14），
   膜吸满后余水结冰；冰满之前升到 0 ℃ 就算成功。假设写在 demo-note 里。 */
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
    var hs = h + 'px';
    if (cv.style.height !== hs) cv.style.height = hs;  // 动画每帧都调用：值相同就不写样式
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function minus(v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); }

  window.DEMOS = window.DEMOS || {};
  window.DEMOS['coldstart'] = {
    name: '冷启动：零度以下，电池能不能把自己“热活”',
    init: function (root) {
      var T = themeOf(); setVars(root, T); root.classList.add('dm-cs');
      var H = 250;
      // 模型常数（每平方米活性面积的集总值）
      var C_AREAL = 2.0e4;   // J/(m²·K)，含双极板
      var E_HHV = 1.48;      // V
      var FARADAY = 96485;   // C/mol
      var ICE_CAP = 1.0;     // mol/m²，可容纳的冰
      var LAM_SAT = 14;      // 0 ℃ 附近膜态水上限
      var L_FREEZE = 6010;   // J/mol
      var DT = 0.5, TMAX = 480;
      var P = { T0: -20, j: 0.4, dm: 25, lam0: 4 };
      var sim = null, status = '', cursor = 0, raf = 0, clock = 0;

      root.innerHTML = [
        '<p class="dm-tip">自启动只靠反应热升温。调初始温度、电流、膜厚和初始含水量，看它先到 0 ℃，还是先被冰封住。</p>',
        '<div class="cs-top"><span class="pill" data-r="pill">计算中</span>',
        '<span>t <b data-r="t">0</b> s</span><span>温度 <b data-r="tc">−20.0</b> ℃</span>',
        '<span>膜态水 λ <b data-r="lam">4.0</b></span><span>冰分数 <b data-r="ice">0.00</b></span>',
        '<span>电压 <b data-r="v">0.48</b> V</span></div>',
        '<canvas class="demo-canvas dm-cv"></canvas>',
        '<div class="legend"><span><i style="background:var(--heat)"></i>电池温度 ℃</span>',
        '<span><i style="background:var(--h2)"></i>冰体积分数 0–1</span>',
        '<span><i style="background:var(--water)"></i>膜态水 λ（÷14，同一根 0–1 轴）</span></div>',
        '<div class="cs-ctls">',
        '<div class="ctl"><label>初始温度</label><input type="range" data-k="T0" min="-30" max="-5" step="1" value="-20"><span class="val" data-v="T0">−20 ℃</span></div>',
        '<div class="ctl"><label>电流密度</label><input type="range" data-k="j" min="0.10" max="1.00" step="0.05" value="0.40"><span class="val" data-v="j">0.40 A·cm⁻²</span></div>',
        '<div class="ctl"><label>膜厚</label><input type="range" data-k="dm" min="15" max="100" step="5" value="25"><span class="val" data-v="dm">25 μm</span></div>',
        '<div class="ctl"><label>初始含水量 λ<sub>0</sub></label><input type="range" data-k="lam0" min="2" max="12" step="0.5" value="4"><span class="val" data-v="lam0">4.0</span></div>',
        '</div>',
        '<div class="cs-act"><button type="button" class="demo-btn" data-r="replay">重播过程</button></div>',
        '<p class="demo-note" data-r="note"></p>',
        '</div>',
        '<style>',
        '.dm-cs .cs-top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;font-size:12px;color:var(--dm-ink2);margin:6px 0 4px}',
        '.dm-cs .cs-top b{color:var(--dm-ink);font-variant-numeric:tabular-nums;font-weight:600}',
        '.dm-cs .pill{font-size:12px;padding:1px 9px;border:1px solid var(--dm-line);border-radius:3px}',
        '.dm-cs .pill.ok{color:var(--dm-water);border-color:var(--dm-water)}',
        '.dm-cs .pill.bad{color:var(--dm-accent);border-color:var(--dm-accent)}',
        '.dm-cs canvas{display:block;width:100%}',
        '.dm-cs .cs-ctls{display:grid;grid-template-columns:1fr 1fr;gap:0 20px;margin:2px 0 0}',
        '.dm-cs .ctl{margin:3px 0}',
        '.dm-cs .ctl label{min-width:104px}',
        '.dm-cs .ctl .val{min-width:74px}',
        '@media (max-width:560px){.dm-cs .cs-ctls{grid-template-columns:1fr}}',
        '.dm-cs .cs-act{margin:6px 0 0}',
        '.dm-cs .demo-btn{padding:4px 14px}',
        '</style>'
      ].join('');

      var cv = root.querySelector('canvas');
      var rd = {};
      root.querySelectorAll('[data-r]').forEach(function (el) { rd[el.getAttribute('data-r')] = el; });
      var out = {};
      root.querySelectorAll('[data-v]').forEach(function (el) { out[el.getAttribute('data-v')] = el; });

      function simRun() {
        var memUptake = 0, memCap = (LAM_SAT - P.lam0) * 1800 * (P.dm + 20) * 1e-6;
        var ice = 0, TK = 273.15 + P.T0, t = 0;
        var arr = [], st = 'fail_time';
        var logTerm = 0.18 * Math.log(P.j / 0.2);  // 只依赖 P.j，原实现每个时间步重算
        function lamNow() { return P.lam0 + memUptake / (1800 * (P.dm + 20) * 1e-6); }
        function vNow(x) { return Math.max(0.15, 0.65 + 0.005 * (TK - 273.15) - logTerm - 0.30 * x); }
        function state() { var x = ice / ICE_CAP; return { t: t, TC: TK - 273.15, lam: lamNow(), ice: x, V: vNow(x) }; }
        for (var i = 0; i <= TMAX / DT; i++) {
          var TC = TK - 273.15, x = ice / ICE_CAP, Vx = vNow(x);  // 电压同一个 x 只算一次
          arr.push({ t: t, TC: TC, lam: lamNow(), ice: x, V: Vx });
          if (TC >= 0) { st = 'ok'; break; }
          var q = P.j * 1e4 * (E_HHV - Vx);
          var dn = P.j * 1e4 / (2 * FARADAY) * DT;
          var toMem = Math.min(dn, Math.max(0, memCap - memUptake));
          memUptake += toMem;
          var toIce = Math.min(dn - toMem, Math.max(0, ICE_CAP - ice));
          ice += toIce;
          TK += (q + toIce * L_FREEZE / DT) * DT / C_AREAL;
          t += DT;
          if (TK - 273.15 >= 0) { st = 'ok'; arr.push(state()); break; }
          if (ice >= ICE_CAP - 1e-9) { st = 'fail_ice'; arr.push(state()); break; }
          if (t >= TMAX) { st = 'fail_time'; break; }
        }
        return { arr: arr, st: st };
      }

      function draw() {
        var box = fitCanvas(cv, H), ctx = box.ctx, W = box.w, HH = box.h;
        if (W < 200 || !sim) return;
        ctx.clearRect(0, 0, W, HH);
        var arr = sim.arr;
        var tEnd = Math.max(20, arr[arr.length - 1].t);
        var padL = 64, padR = 18;
        var pw = W - padL - padR;
        var yT = 16, hT = 92, yB = 132, hB = 88;
        var tMin = Math.min(P.T0 - 2, -5), tMax = 4;
        function X(t) { return padL + (t / tEnd) * pw; }
        function YT(v) { return yT + hT - ((v - tMin) / (tMax - tMin)) * hT; }
        function YI(v) { return yB + hB - v * hB; }
        function YL(v) { return YI(v / LAM_SAT); }   // λ 归一化到冰分数的 0–1 轴
        ctx.font = '11px system-ui,"Microsoft YaHei",sans-serif';
        ctx.lineWidth = 1;

        // 横轴（两个面板共用）
        var step = tEnd > 240 ? 120 : tEnd > 120 ? 60 : tEnd > 60 ? 20 : 10;
        ctx.strokeStyle = T.line; ctx.fillStyle = T.ink2;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (var tt = 0; tt <= tEnd + 1e-6; tt += step) {
          var x = X(tt);
          ctx.beginPath(); ctx.moveTo(x, yT); ctx.lineTo(x, yT + hT); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, yB); ctx.lineTo(x, yB + hB); ctx.stroke();
          ctx.fillText(tt + '', x, yB + hB + 6);
        }
        ctx.textAlign = 'left';
        ctx.fillText('t / s', 6, yB + hB + 6);

        // 上面板：温度。左侧只保留这一个竖排轴标题，刻度统一右对齐到同一列
        ctx.strokeStyle = T.line;
        ctx.beginPath();
        ctx.moveTo(padL, yT); ctx.lineTo(padL, yT + hT); ctx.lineTo(padL + pw, yT + hT);
        ctx.stroke();
        ctx.strokeStyle = T.water; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(padL, YT(0)); ctx.lineTo(padL + pw, YT(0)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = T.water; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('0 ℃（成败线）', padL + 5, YT(0) - 3);
        ctx.fillStyle = T.ink2; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        var tv0 = Math.ceil(tMin / 10) * 10;
        for (var tv = tv0; tv <= tMax; tv += 10) {
          if (tv === 0) continue;
          ctx.fillText(minus(tv, 0), padL - 8, YT(tv));
        }
        ctx.save(); ctx.translate(15, yT + hT / 2); ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = T.ink2;
        ctx.fillText('温度 / ℃', 0, 0); ctx.restore();

        // 下面板：冰分数与膜态水共用一根 0–1 轴，不再设右侧 λ 刻度
        ctx.strokeStyle = T.line;
        ctx.beginPath();
        ctx.moveTo(padL, yB); ctx.lineTo(padL, yB + hB); ctx.lineTo(padL + pw, yB + hB);
        ctx.stroke();
        ctx.fillStyle = T.ink2; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('0', padL - 6, YI(0));
        ctx.fillText('0.5', padL - 6, YI(0.5));
        ctx.fillText('1.0', padL - 6, YI(1));

        // 三条曲线（画到光标）
        var lim = Math.min(cursor, arr.length - 1);
        ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.strokeStyle = T.heat;
        ctx.beginPath();
        for (var i = 0; i <= lim; i++) {
          var a = arr[i], ax = X(a.t), ay = YT(a.TC);
          if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
        }
        ctx.stroke();
        ctx.strokeStyle = T.h2;
        ctx.beginPath();
        for (var j = 0; j <= lim; j++) {
          var b = arr[j], bx = X(b.t), by = YI(b.ice);
          if (j === 0) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.strokeStyle = T.water;
        ctx.beginPath();
        for (var k = 0; k <= lim; k++) {
          var c = arr[k], cx = X(c.t), cy = YL(c.lam);
          if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // 游标
        var cur = arr[lim], mx = X(cur.t);
        ctx.strokeStyle = T.ink2; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(mx, yT); ctx.lineTo(mx, yB + hB); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = T.heat; ctx.beginPath(); ctx.arc(mx, YT(cur.TC), 3, 0, 6.29); ctx.fill();
        ctx.fillStyle = T.h2; ctx.beginPath(); ctx.arc(mx, YI(cur.ice), 3, 0, 6.29); ctx.fill();
        ctx.fillStyle = T.water; ctx.beginPath(); ctx.arc(mx, YL(cur.lam), 3, 0, 6.29); ctx.fill();

        // λ 不设独立刻度，直接在曲线末端标实际值
        var ly = YL(cur.lam);
        var labelY = Math.max(yB + 12, Math.min(yB + hB - 4, ly - 7));
        var labelX = Math.max(padL + 56, Math.min(mx - 4, padL + pw - 2));
        ctx.fillStyle = T.water; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('λ = ' + cur.lam.toFixed(1), labelX, labelY);
      }

      function readout() {
        var arr = sim.arr, cur = arr[Math.min(cursor, arr.length - 1)];
        rd.t.textContent = Math.round(cur.t);
        rd.tc.textContent = minus(cur.TC, 1);
        rd.lam.textContent = cur.lam.toFixed(1);
        rd.ice.textContent = cur.ice.toFixed(2);
        rd.v.textContent = cur.V.toFixed(2);
      }

      function verdict() {
        var arr = sim.arr, last = arr[arr.length - 1];
        if (sim.st === 'ok') {
          rd.pill.textContent = '启动成功';
          rd.pill.className = 'pill ok';
          rd.note.textContent = '结论：约 ' + last.t.toFixed(0) + ' s 升到 0 ℃，此时冰体积分数 ' + last.ice.toFixed(2) + '、膜态水 λ ≈ ' + last.lam.toFixed(1) + '，冰还没来得及把阴极反应界面封死。这是集总参数简化：整片电池一个温度、一个冰分数；真实电池里靠流道处和靠膜处结冰并不同步。';
        } else if (sim.st === 'fail_ice') {
          rd.pill.textContent = '启动失败';
          rd.pill.className = 'pill bad';
          rd.note.textContent = '结论：约 ' + last.t.toFixed(0) + ' s 冰体积分数就到 1，温度还停在 ' + minus(last.TC, 1) + ' ℃，阴极活性位被冰覆盖，冷启动死亡。想救回来：减薄膜（储水更多）、降低初始含水量、提高电流（同样产水量下产热更快），或者改用外部辅助加热。集总参数模型只反映趋势。';
        } else {
          rd.pill.textContent = '启动失败';
          rd.pill.className = 'pill bad';
          rd.note.textContent = '结论：' + TMAX + ' s 内温度没升到 0 ℃（停在 ' + minus(last.TC, 1) + ' ℃，冰分数 ' + last.ice.toFixed(2) + '），产热跑不赢结冰。集总参数模型（单温度、单冰分数）只用于看趋势，真实电池还有温度梯度、过冷水和膜内非均匀吸水。';
        }
      }

      function startAnim() {
        if (raf) cancelAnimationFrame(raf);
        cursor = 0; clock = performance.now();
        var total = Math.max(1200, Math.min(4200, sim.arr.length * 6));
        function loop(now) {
          if (!root.isConnected) { raf = 0; return; }
          var e = Math.min(1, (now - clock) / total);
          cursor = Math.round(e * (sim.arr.length - 1));
          try { draw(); readout(); } catch (err) {}
          if (e < 1) raf = requestAnimationFrame(loop); else raf = 0;
        }
        raf = requestAnimationFrame(loop);
      }

      function settled() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        cursor = sim.arr.length - 1;
        try { draw(); readout(); } catch (e) {}
      }

      root.querySelectorAll('input[type=range]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var k = inp.getAttribute('data-k');
          P[k] = parseFloat(inp.value);
          if (k === 'T0') out[k].textContent = minus(P[k], 0) + ' ℃';
          else if (k === 'j') out[k].textContent = P[k].toFixed(2) + ' A·cm⁻²';
          else if (k === 'dm') out[k].textContent = P[k] + ' μm';
          else out[k].textContent = P[k].toFixed(1);
          sim = simRun();
          verdict();
          settled();
        });
      });
      rd.replay.addEventListener('click', function () { startAnim(); });

      function observe() {
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(function () { if (!root.isConnected) { ro.disconnect(); return; } try { draw(); } catch (e) {} });
          ro.observe(cv.parentNode || cv);
        } else window.addEventListener('resize', function () { try { draw(); } catch (e) {} });
      }
      sim = simRun();
      verdict();
      cursor = sim.arr.length - 1;
      try { draw(); readout(); } catch (e) {}
      observe();
    }
  };
})();
