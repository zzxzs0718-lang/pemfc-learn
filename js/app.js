/* ===========================================================
   PEMFC 水热管理 · 学习站应用逻辑
   无依赖、离线可用。内容来自 js/content/*.js，演示来自 js/demos/*.js
   =========================================================== */
(function () {
  'use strict';

  var CHAPTERS = [];
  (function collect() {
    var bag = window.CONTENT || {};
    for (var i = 1; i <= 9; i++) {
      var c = bag['ch' + i];
      if (c && c.sections) CHAPTERS.push(c);
    }
    CHAPTERS.sort(function (a, b) { return (a.num || 0) - (b.num || 0); });
  })();

  var PKEY = 'pemfc-progress-v1';
  var TKEY = 'pemfc-theme';
  var P = loadProgress();

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PKEY);
      var o = raw ? JSON.parse(raw) : null;
      if (o && o.read) { o.quiz = o.quiz || {}; return o; }
    } catch (e) { /* 忽略损坏数据 */ }
    return { read: {}, quiz: {} };
  }
  function saveProgress() {
    try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { /* 隐私模式下静默失败 */ }
  }

  /* ---------- 小工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var GREEK = {
    Delta: 'Δ', delta: 'δ', alpha: 'α', beta: 'β', gamma: 'γ', eta: 'η', lambda: 'λ',
    mu: 'μ', nu: 'ν', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', Phi: 'Φ', omega: 'ω',
    Omega: 'Ω', theta: 'θ', epsilon: 'ε', zeta: 'ζ', kappa: 'κ', pi: 'π', partial: '∂',
    infty: '∞', pm: '±', le: '≤', ge: '≥', neq: '≠', approx: '≈', cdot: '·', times: '×',
    div: '÷', to: '→', rightarrow: '→', leftarrow: '←', sum: '∑', int: '∫', sqrt: '√'
  };

  /* 这些替换在每次渲染中会执行上百次：正则改为模块级常量，只创建一次 */
  var RE_TEX_LEFT_RIGHT = /\\left|\\right/g;
  var RE_TEX_FRAC = /\\frac\{([^{}]*)\}\{([^{}]*)\}/g;
  var RE_TEX_SQRT = /\\sqrt\{([^{}]*)\}/g;
  var RE_TEX_CMD = /\\([A-Za-z]+)/g;
  var RE_TEX_SUP_BRACE = /\^\{([^{}]*)\}/g;
  var RE_TEX_SUB_BRACE = /\_\{([^{}]*)\}/g;
  var RE_TEX_SUP = /\^([A-Za-z0-9])/g;
  var RE_TEX_SUB = /_([A-Za-z0-9])/g;
  var RE_INLINE_BOLD = /\*\*([^*]+)\*\*/g;
  var RE_INLINE_MARK = /==([^=]+)==/g;
  var RE_INLINE_MATH = /\$([^$]+)\$/g;
  var RE_ATTR_ESC = /[&<>"]/g;
  var ATTR_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  var RE_LEAD_SEP = /^[\s·．.、]+/;
  var CALLOUT_ICONS = { tip: '◆', warn: '▲', think: '?', note: 'i' };

  /* 宽容处理：内容作者若误写 LaTeX，也能大致渲染出来 */
  function texify(s) {
    var out = String(s);
    out = out.replace(RE_TEX_LEFT_RIGHT, '');
    out = out.replace(RE_TEX_FRAC, '<span class="fr"><span class="nu">$1</span><span class="de">$2</span></span>');
    out = out.replace(RE_TEX_SQRT, '√($1)');
    out = out.replace(RE_TEX_CMD, function (m, name) { return GREEK[name] || m; });
    out = out.replace(RE_TEX_SUP_BRACE, '<sup>$1</sup>').replace(RE_TEX_SUB_BRACE, '<sub>$1</sub>');
    out = out.replace(RE_TEX_SUP, '<sup>$1</sup>').replace(RE_TEX_SUB, '<sub>$1</sub>');
    return out;
  }

  function inline(s) {
    if (!s) return '';
    return String(s)
      .replace(RE_INLINE_BOLD, '<strong>$1</strong>')
      .replace(RE_INLINE_MARK, '<mark>$1</mark>')
      .replace(RE_INLINE_MATH, function (m, inner) {
        return '<span class="imath">' + (inner.indexOf('\\') >= 0 ? texify(inner) : inner) + '</span>';
      });
  }

  function readCount(c) {
    var r = P.read[c.id] || {}, n = 0;
    c.sections.forEach(function (s) { if (r[s.id]) n++; });
    return n;
  }
  /* 一次遍历同时得到总节数与已读节数：原来 totalSections/totalRead 各遍历一遍全书 */
  function progressCounts() {
    var total = 0, read = 0;
    for (var i = 0; i < CHAPTERS.length; i++) {
      var c = CHAPTERS[i], n = c.sections.length, r = P.read[c.id] || {}, k = 0;
      for (var j = 0; j < n; j++) if (r[c.sections[j].id]) k++;
      total += n;
      read += k;
    }
    return { total: total, read: read };
  }
  function chapterById(id) {
    for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === id) return CHAPTERS[i];
    return null;
  }
  function demoNames() {
    var o = window.DEMOS || {}, n = 0;
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) n++;
    return n;
  }

  /* ---------- 侧栏 ---------- */
  function buildSidebar(activeId, activeSec) {
    var sb = $('#sidebar');
    var h = [];
    h.push('<div class="nav-group"><p class="nav-label">开始</p>');
    h.push(navItem('#/home', '总览', '◈', activeId === 'home', '', ''));
    h.push(navItem('#/prep', '开读准备', '✦', activeId === 'prep', '', ''));
    h.push('</div>');

    h.push('<div class="nav-group"><p class="nav-label">八章精读</p>');
    CHAPTERS.forEach(function (c, idx) {
      var n = c.sections.length;
      var done = readCount(c) >= n && n > 0;
      h.push(navItem('#/' + c.id, c.title, String(c.num), c.id === activeId, done ? '✓' : '', c.id));
      if (c.id === activeId) {
        var read = P.read[c.id] || {};
        h.push('<div class="nav-sub">');
        c.sections.forEach(function (s) {
          var isRead = read[s.id];
          h.push('<a href="#/' + c.id + '/' + s.id + '" class="' + (s.id === activeSec ? 'read-color' : '') + '">' +
            (isRead ? '✓ ' : '') + inline(s.title) + '</a>');
        });
        h.push('</div>');
      }
    });
    h.push('</div>');

    h.push('<div class="nav-group"><p class="nav-label">学习工具</p>');
    h.push(navItem('#/extend', '延伸思考', '?', activeId === 'extend', '', ''));
    h.push(navItem('#/formulas', '公式速查', '∑', activeId === 'formulas', '', ''));
    h.push(navItem('#/glossary', '术语表', 'A', activeId === 'glossary', '', ''));
    h.push('</div>');

    h.push('<div class="nav-group" style="margin-top:6px"><a class="nav-item" href="javascript:void(0)" id="resetBtn" ' +
      'style="color:var(--ink-3);font-size:12.5px">↺ 重置学习进度</a></div>');
    sb.innerHTML = h.join('');
  }

  function navItem(href, label, num, active, tick, id) {
    return '<a class="nav-item ' + (active ? 'active' : '') + '" href="' + href + '"' +
      (active ? ' aria-current="page"' : '') +
      (id ? ' data-ch="' + id + '"' : '') + '>' +
      '<span class="nav-num">' + num + '</span><span>' + inline(label) + '</span>' +
      (tick ? '<span class="tick">' + tick + '</span>' : '') + '</a>';
  }

  function updateRing() {
    var pc = progressCounts();
    var t = pc.total || 1;
    var pct = Math.round(pc.read / t * 100);
    $('#overallPct').textContent = pct + '%';
    var c = 2 * Math.PI * 15.5;
    $('#ringFg').style.strokeDashoffset = String(c * (1 - pct / 100));
  }

  /* ---------- 渲染：block ---------- */
  function renderBlocks(blocks) {
    if (!blocks) return '';
    return blocks.map(renderBlock).join('');
  }

  function renderBlock(b) {
    if (!b || !b.type) return '';
    switch (b.type) {
      case 'p':
        return '<p>' + inline(b.text) + '</p>';
      case 'h3':
        return '<h3>' + inline(b.text) + '</h3>';
      case 'list': {
        var tag = b.ordered ? 'ol' : 'ul';
        var items = (b.items || []).map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('');
        return '<' + tag + '>' + items + '</' + tag + '>';
      }
      case 'formula':
        return '<div class="formula"><div class="fx">' + (b.html || '') + '</div>' +
          (b.note ? '<div class="note">' + inline(b.note) + '</div>' : '') + '</div>';
      case 'key':
        return '<div class="key"><div class="kt">关键概念</div><h4>' + inline(b.title) + '</h4>' +
          '<p>' + inline(b.text) + '</p></div>';
      case 'callout': {
        var cls = 'k-' + (b.kind || 'note');
        return '<div class="callout ' + cls + '"><div class="ci">' + (CALLOUT_ICONS[b.kind] || 'i') + '</div>' +
          '<div>' + (b.title ? '<b>' + inline(b.title) + '</b>' : '') + '<p>' + inline(b.text) + '</p></div></div>';
      }
      case 'table': {
        var head = (b.head || []).map(function (x) { return '<th>' + inline(x) + '</th>'; }).join('');
        var rows = (b.rows || []).map(function (r) {
          return '<tr>' + r.map(function (x) { return '<td>' + inline(x) + '</td>'; }).join('') + '</tr>';
        }).join('');
        return '<div class="tablewrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      }
      case 'figure':
        return '<figure><div class="svgbox">' + (b.svg || '') + '</div>' +
          (b.caption ? '<figcaption>' + inline(b.caption) + '</figcaption>' : '') + '</figure>';
      case 'img': {
        var alt = attr(b.alt || b.caption || '');
        var inner;
        if (b.srcDark) {
          inner = '<img class="only-light" src="' + b.src + '" alt="' + alt + '">' +
                  '<img class="only-dark" src="' + b.srcDark + '" alt="' + alt + '">';
        } else {
          inner = '<img src="' + b.src + '" alt="' + alt + '">';
        }
        return '<figure class="imgfig">' + inner +
          '<figcaption>' + inline(b.caption || '') +
          (b.credit ? '<span class="credit">' + b.credit + '</span>' : '') +
          '</figcaption></figure>';
      }
      case 'quote':
        return '<blockquote class="quote">' + inline(b.text) +
          (b.from ? '<span>—— ' + inline(b.from) + '</span>' : '') + '</blockquote>';
      case 'example':
        return '<div class="example"><div class="example-h">' + inline(b.title || '例题') + '</div>' +
          '<div class="example-b">' + renderBlocks(b.blocks) + '</div></div>';
      case 'keypoints': {
        var li = (b.items || []).map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('');
        return '<div class="keypoints"><h4>本章要点</h4><ol>' + li + '</ol></div>';
      }
      case 'demo':
        return '<div class="demo" data-demo="' + b.id + '">' +
          '<div class="demo-head"><span class="dot"></span><b data-demo-title>' + b.id + '</b>' +
          '<span>交互演示</span></div>' +
          '<div class="demo-body"></div>' +
          (b.caption ? '<p class="demo-cap">' + inline(b.caption) + '</p>' : '') + '</div>';
      default:
        return '<p>' + inline(b.text || '') + '</p>';
    }
  }

  /* ---------- 渲染：章节 ---------- */
  function renderChapter(c, activeSec) {
    var h = [];
    var nSec = c.sections.length;
    h.push('<div class="wrap">');
    h.push('<div class="chapter-head">');
    h.push('<div class="eyebrow"><span>第 ' + c.num + ' 章</span><span>·</span><span title="页码为此 PDF 文件的页序号">PDF p.' + (c.pages || '') + '</span>' +
      (c.hours ? '<span>·</span><span>约 ' + c.hours + ' 小时</span>' : '') + '</div>');
    h.push('<h1>' + inline(c.title) + '</h1>');
    if (c.subtitle) h.push('<p class="lede-sub">' + inline(c.subtitle) + '</p>');
    if (c.intro) h.push('<p class="lede">' + inline(c.intro) + '</p>');
    h.push('<div class="chips">');
    h.push('<span class="chip a">' + nSec + ' 节</span>');
    h.push('<span class="chip">已读 ' + readCount(c) + ' / ' + nSec + '</span>');
    if (c.terms && c.terms.length) h.push('<span class="chip">' + c.terms.length + ' 个术语</span>');
    if (c.quiz && c.quiz.length) h.push('<span class="chip">' + c.quiz.length + ' 题自测</span>');
    h.push('</div>');
    var longToc = nSec > 8;
    h.push('<div class="toc-inline' + (longToc ? ' collapsed' : '') + '" id="tocInline">');
    c.sections.forEach(function (s) {
      h.push('<a href="#/' + c.id + '/' + s.id + '">' + inline(s.title) + '</a>');
    });
    h.push('</div>');
    if (longToc) {
      h.push('<button class="toc-more" id="tocMore">展开全部 ' + nSec + ' 节 ▾</button>');
    }
    h.push('</div>');

    c.sections.forEach(function (s, si) {
      var isRead = (P.read[c.id] || {})[s.id];
      h.push('<section class="sec" id="sec-' + s.id + '">');
      h.push('<h2><span class="sec-tag">' + (s.id || ('§' + (si + 1))) + '</span>' + inline(stripNum(s.title, s.id)) +
        '<button class="mark-btn ' + (isRead ? 'on' : '') + '" data-read-ch="' + c.id + '" data-read-sec="' + s.id + '">' +
        (isRead ? '已读' : '标记已读') + '</button></h2>');
      h.push(renderBlocks(s.blocks));
      h.push('</section>');
    });

    h.push(renderExtendSection(c));
    h.push(renderQuiz(c));
    h.push(renderChapNav(c));
    h.push('</div>');
    return h.join('');
  }

  function stripNum(title, id) {
    if (!title || !id) return title || '';
    var t = String(title).trim();
    if (t.indexOf(id) === 0) return t.slice(id.length).replace(RE_LEAD_SEP, '');
    return t;
  }

  function renderQuiz(c) {
    if (!c.quiz || !c.quiz.length) return '';
    var h = ['<div class="quiz" data-quiz-ch="' + c.id + '">'];
    h.push('<h3>本章自测 · ' + c.quiz.length + ' 题</h3>');
    h.push('<p class="qdesc">点选项立刻判分并给解释。答错不扣分，记录最高分。</p>');
    c.quiz.forEach(function (q, qi) {
      // 正确答案位置做一个确定性的换位，避免全卷答案都落在同一个选项上
      var opts = (q.options || []).slice();
      var n = opts.length;
      var ans = (typeof q.answer === 'number' && q.answer >= 0 && q.answer < n) ? q.answer : 0;
      var target = n ? (qi + (c.num || 1)) % n : 0;
      if (target !== ans) { var tmp = opts[ans]; opts[ans] = opts[target]; opts[target] = tmp; }
      h.push('<div class="q" data-ans="' + target + '" data-qi="' + qi + '">');
      h.push('<p class="qt"><i>' + (qi + 1 < 10 ? '0' : '') + (qi + 1) + '</i>' + inline(q.q) + '</p>');
      opts.forEach(function (o, oi) {
        h.push('<div class="opt" data-i="' + oi + '"><span class="k">' + 'ABCD'.charAt(oi) + '</span><span>' + inline(o) + '</span></div>');
      });
      h.push('<p class="qexp">' + inline(q.explain || '') + '</p>');
      h.push('</div>');
    });
    var best = P.quiz[c.id];
    h.push('<div class="quiz-score">' + (best ? '上次得分：' + best.best + ' / ' + c.quiz.length : '') + '</div>');
    h.push('</div>');
    return h.join('');
  }

  function renderChapNav(c) {
    var idx = CHAPTERS.indexOf(c);
    var prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
    var h = ['<nav class="chap-nav">'];
    h.push(prev
      ? '<a href="#/' + prev.id + '" class="prev"><span>← 上一章</span><b>第 ' + prev.num + ' 章 ' + inline(prev.title) + '</b></a>'
      : '<a href="#/home" class="prev"><span>← 返回</span><b>总览</b></a>');
    h.push(next
      ? '<a href="#/' + next.id + '" class="next"><span>下一章 →</span><b>第 ' + next.num + ' 章 ' + inline(next.title) + '</b></a>'
      : '<a href="#/formulas" class="next"><span>下一站 →</span><b>公式速查</b></a>');
    h.push('</nav>');
    return h.join('');
  }

  /* ---------- 渲染：首页 ---------- */
  function renderHome() {
    var pc = progressCounts();
    var t = pc.total;
    var nf = 0;
    CHAPTERS.forEach(function (c) {
      c.sections.forEach(function (s) {
        (s.blocks || []).forEach(function (b) { if (b.type === 'formula') nf++; });
      });
    });
    var ne = 0;
    CHAPTERS.forEach(function (c) { ne += (c.extend || []).length; });
    var h = [];
    h.push('<div class="wrap">');
    h.push('<section class="hero">');
    h.push('<p class="eyebrow">精读工作台 · 8 章 · ' + t + ' 节</p>');
    h.push('<h1>水多了“淹”，水少了“干”——<br>PEMFC 的一切都卡在这<em>一线之间</em>。</h1>');
    h.push('<p class="sub">这是《质子交换膜燃料电池水热管理》（焦魁 等）的伴读网页：把八章拆成 ' + t +
      ' 个能一口气读完的小节，每节配机制讲解、公式、可拖动的仿真和一道自测。按左侧目录走一遍，你会从“背公式”变成“能解释现象”。</p>');
    h.push('<div class="hero-stats">');
    h.push('<div class="stat"><b>' + t + '</b><span>可读小节</span></div>');
    h.push('<div class="stat"><b>' + nf + '</b><span>个公式讲解</span></div>');
    h.push('<div class="stat"><b>' + demoNames() + '</b><span>个交互演示</span></div>');
    h.push('<div class="stat"><b>' + ne + '</b><span>道延伸思考</span></div>');
    h.push('<div class="stat"><b>' + Math.round(pc.read / (t || 1) * 100) + '%</b><span>你的进度</span></div>');
    h.push('</div>');
    h.push(cellMapSVG());
    h.push('</section>');

    var last = P.last && chapterById(P.last.ch);
    if (last) {
      h.push('<a class="ch-card" href="#/' + last.id + (P.last.sec ? '/' + P.last.sec : '') + '" style="margin-top:22px;flex-direction:row;align-items:center;gap:16px;padding:15px 20px">' +
        '<span style="font-size:18px;color:var(--accent)">▸</span>' +
        '<span style="flex:1 1 auto"><b style="font-size:14.5px">继续上次：第 ' + last.num + ' 章 · ' + inline(last.title) + '</b>' +
        '<p style="margin:3px 0 0">' + (P.last.sec ? '上次读到 §' + P.last.sec : '上次停在章首') + '</p></span>' +
        '<span style="color:var(--accent);font-size:13px;white-space:nowrap">接着读 →</span></a>');
    }

    h.push('<h2 class="section-title">八章 · 一条主线<small>从单电池的一片膜电极，一路推到整车系统</small></h2>');
    h.push('<div class="ch-grid">');
    CHAPTERS.forEach(function (c) {
      var pct = Math.round(readCount(c) / (c.sections.length || 1) * 100);
      h.push('<a class="ch-card" href="#/' + c.id + '">');
      h.push('<span class="cnum">第 ' + c.num + ' 章 · PDF p.' + (c.pages || '') + '</span>');
      h.push('<h3>' + inline(c.title) + '</h3>');
      h.push('<p>' + inline(c.subtitle || '') + '</p>');
      h.push('<div class="meta"><span>' + c.sections.length + ' 节</span><span>' + (c.hours || 1) + ' 小时</span>' +
        (pct ? '<span>' + pct + '% 已读</span>' : '') + '</div>');
      h.push('<div class="bar"><i style="width:' + pct + '%"></i></div>');
      h.push('</a>');
    });
    h.push('</div>');

    h.push('<h2 class="section-title">怎么用<small>三步，别贪多</small></h2>');
    h.push('<div class="ch-grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">');
    h.push(tipCard('① 先看机制，别看公式', '每节开头都在讲“为什么这件事难”。读完能用自己的话复述一遍，再回去看公式——公式只是把这句话写成符号。'));
    h.push(tipCard('② 拖一下演示', '标着「交互演示」的地方一定要动。水热管理是典型的“感觉型”知识：把膜厚、电流、温度拖到极端，你会立刻记住趋势。'));
    h.push(tipCard('③ 章末：先自测，再延伸', '选择题查漏，标「延伸思考」的开放题查你**能不能迁移**——答案默认折叠，先写三行再点开。答错的回读对应小节。'));
    h.push('</div>');

    h.push('<a class="ch-card" href="#/extend" style="margin-top:26px;flex-direction:row;align-items:center;gap:18px;padding:18px 20px">' +
      '<span style="font-size:22px">?</span>' +
      '<span style="flex:1 1 auto"><b style="font-size:15px">延伸思考：' + ne + ' 道超出书本的开放题</b>' +
      '<p style="margin:4px 0 0">分四类——概念深挖 / 定量计算 / 工程设计 / 科研前沿。每题带提示链与参考要点，答案折叠，先写再看。</p></span>' +
      '<span style="color:var(--accent);font-size:13px;white-space:nowrap">去刷题 →</span></a>');

    h.push('<a class="ch-card" href="#/prep" style="margin-top:12px;flex-direction:row;align-items:center;gap:18px;padding:18px 20px">' +
      '<span style="font-size:22px">✦</span>' +
      '<span style="flex:1 1 auto"><b style="font-size:15px">开读准备：要补哪些课、要装哪些软件</b>' +
      '<p style="margin:4px 0 0">热力学/电化学/传质的最低门槛自查表 + 10 款软件的用途与学到什么程度 + 四周路线。</p></span>' +
      '<span style="color:var(--accent);font-size:13px;white-space:nowrap">去看看 →</span></a>');

    h.push('<div class="keypoints" style="margin-top:34px">');
    h.push('<h4>读之前，先记住这三个数</h4>');
    h.push('<ol>');
    h.push('<li>理论电压 <b>1.229 V</b>（25 ℃，生成液态水），实际单电池工作点通常只有 <b>0.6–0.7 V</b>——差的那一半，就是你要学的全部内容。</li>');
    h.push('<li>Nafion 膜的质子传导必须有水，含水量 λ 从 0（干）到 22（全湿），电导率相差几个数量级。</li>');
    h.push('<li>一片 50 μm 的膜，就是“既要把水留住、又要把水排掉”这条矛盾的主战场。</li>');
    h.push('</ol>');
    h.push('</div>');
    h.push('</div>');
    return h.join('');
  }

  function tipCard(t, d) {
    return '<div class="ch-card" style="cursor:default"><h3 style="font-size:15px">' + t + '</h3>' +
      '<p style="font-size:13px">' + d + '</p></div>';
  }

  function cellMapSVG() {
    var layers = [
      { x: 236, w: 42, c: 'var(--heat)', o: 0.16, t: '双极板' },
      { x: 282, w: 44, c: 'var(--ink-2)', o: 0.14, t: 'GDL' },
      { x: 330, w: 34, c: 'var(--key-line)', o: 0.18, t: 'CL' },
      { x: 368, w: 52, c: 'var(--accent)', o: 0.30, t: 'PEM' },
      { x: 424, w: 34, c: 'var(--key-line)', o: 0.18, t: 'CL' },
      { x: 462, w: 44, c: 'var(--ink-2)', o: 0.14, t: 'GDL' },
      { x: 510, w: 42, c: 'var(--heat)', o: 0.16, t: '双极板' }
    ];
    var s = [];
    s.push('<svg viewBox="0 0 720 250" role="img" aria-label="PEMFC 单电池层状结构示意">');
    s.push('<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="var(--ink-2)"/></marker>' +
      '<marker id="ahb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="var(--h2)"/></marker></defs>');
    layers.forEach(function (L) {
      s.push('<rect x="' + L.x + '" y="72" width="' + L.w + '" height="104" rx="3" fill="' + L.c +
        '" fill-opacity="' + L.o + '" stroke="var(--line-2)" stroke-width="1"/>');
      s.push('<text x="' + (L.x + L.w / 2) + '" y="124" text-anchor="middle" font-size="11.5" fill="var(--ink-2)" ' +
        'transform="rotate(-90 ' + (L.x + L.w / 2) + ' 124)" letter-spacing="1">' + L.t + '</text>');
    });
    // 电子外电路
    s.push('<path d="M257 72 V40 H531 V72" fill="none" stroke="var(--ink-2)" stroke-width="1.4" stroke-dasharray="1 0"/>');
    s.push('<rect x="374" y="26" width="40" height="27" rx="4" fill="var(--panel)" stroke="var(--ink-2)" stroke-width="1.2"/>');
    s.push('<text x="394" y="44" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">负载</text>');
    s.push('<text x="300" y="20" text-anchor="middle" font-size="11" fill="var(--ink-3)">e⁻ 只能走外电路</text>');
    // H2 进
    s.push('<path d="M96 112 H206" stroke="var(--h2)" stroke-width="1.6" marker-end="url(#ahb)" fill="none"/>');
    s.push('<text x="100" y="103" font-size="12" fill="var(--h2)">H₂</text>');
    s.push('<text x="96" y="136" font-size="10.5" fill="var(--ink-3)">→ 2H⁺ + 2e⁻</text>');
    // O2 进
    s.push('<path d="M624 112 H574" stroke="var(--heat)" stroke-width="1.6" marker-end="url(#ah)" fill="none"/>');
    s.push('<text x="600" y="103" font-size="12" fill="var(--heat)">O₂</text>');
    s.push('<text x="576" y="136" font-size="10.5" fill="var(--ink-3)">+ 4H⁺ + 4e⁻</text>');
    // 质子
    s.push('<path d="M372 150 H416" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#ah)" fill="none"/>');
    s.push('<text x="394" y="168" text-anchor="middle" font-size="10.5" fill="var(--accent)">H⁺ · H₂O</text>');
    // 水排出
    s.push('<path d="M531 176 V212" stroke="var(--water)" stroke-width="1.6" marker-end="url(#ah)" fill="none"/>');
    s.push('<text x="540" y="206" font-size="11" fill="var(--water)">H₂O 排出</text>');
    // 产热
    s.push('<path d="M394 176 V212" stroke="var(--heat)" stroke-width="1.4" stroke-dasharray="3 3" marker-end="url(#ah)" fill="none"/>');
    s.push('<text x="300" y="206" font-size="11" fill="var(--heat)">热 Q 必须导出</text>');
    s.push('<text x="360" y="240" font-size="10.5" fill="var(--ink-3)">膜电极（MEA）＝ GDL + CL + PEM 的对称三明治</text>');
    s.push('</svg>');
    return '<div class="cellmap">' + s.join('') + '</div>';
  }

  /* ---------- 渲染：公式速查 ---------- */
  function renderFormulas() {
    var h = ['<div class="wrap">'];
    h.push('<div class="chapter-head"><div class="eyebrow"><span>学习工具</span></div>');
    h.push('<h1>公式速查</h1><p class="lede">全书出现过的公式按章节集中在这里。复习时先看“物理含义”，再回忆符号——考试和答辩都这么用。</p></div>');
    h.push('<div class="toolbar"><input class="search" id="fSearch" placeholder="输入关键词过滤，例如：能斯特、过电势、渗透率…"></div>');
    h.push('<div id="fList">');
    var any = false;
    CHAPTERS.forEach(function (c) {
      var items = [];
      c.sections.forEach(function (s) {
        (s.blocks || []).forEach(function (b) {
          if (b.type === 'formula') items.push({ sec: s, b: b });
        });
      });
      if (!items.length) return;
      any = true;
      h.push('<div class="fgroup" data-group="' + c.id + '">');
      h.push('<h2 class="section-title" style="font-size:17px;margin:30px 0 6px">第 ' + c.num + ' 章 · ' + inline(c.title) + '</h2>');
      items.forEach(function (it) {
        var plain = String(it.b.html || '').replace(/<[^>]*>/g, ' ');
        h.push('<div class="f-item" data-text="' + attr(it.sec.title + ' ' + (it.b.note || '') + ' ' + plain) + '">');
        h.push('<div class="fmeta"><a href="#/' + c.id + '/' + it.sec.id + '">' + inline(it.sec.title) + '</a> · p.' + (c.pages || '') + '</div>');
        h.push('<div class="fx">' + (it.b.html || '') + '</div>');
        if (it.b.note) h.push('<div class="note" style="font-size:12.6px;color:var(--ink-2);text-align:center">' + inline(it.b.note) + '</div>');
        h.push('</div>');
      });
      h.push('</div>');
    });
    if (!any) h.push('<p class="empty">还没有内容。</p>');
    h.push('</div></div>');
    return h.join('');
  }

  function attr(s) {
    return String(s || '').replace(RE_ATTR_ESC, function (ch) { return ATTR_ESC[ch]; });
  }

  /* ---------- 渲染：术语表 ---------- */
  function renderGlossary() {
    // 同一术语可能在多章出现：合并成一行，保留最长释义，出处列出所有章节
    var map = {}, order = [];
    CHAPTERS.forEach(function (c) {
      (c.terms || []).forEach(function (t) {
        var k = String(t.t || '').trim();
        if (!k) return;
        if (!map[k]) { map[k] = { t: t, d: t.d || '', en: t.en || '', chs: [c] }; order.push(k); }
        else {
          var m = map[k];
          if ((t.d || '').length > m.d.length) m.d = t.d;
          if (!m.en && t.en) m.en = t.en;
          if (m.chs.indexOf(c) < 0) m.chs.push(c);
        }
      });
    });
    var rows = order.map(function (k) { return map[k]; });
    var h = ['<div class="wrap">'];
    h.push('<div class="chapter-head"><div class="eyebrow"><span>学习工具</span></div>');
    h.push('<h1>术语表</h1><p class="lede">全书 ' + rows.length + ' 条核心术语（同一条在多章出现时已合并），中英对照。写论文、看文献、答辩时都用得上。</p></div>');
    h.push('<div class="toolbar"><input class="search" id="gSearch" placeholder="搜索中英文术语，例如：Nafion、渗透率、水淹…"></div>');
    h.push('<table class="gloss"><thead><tr><th style="width:148px">术语</th><th style="width:200px">英文</th><th>解释</th><th style="width:112px">出处</th></tr></thead><tbody>');
    rows.forEach(function (r) {
      var srcs = r.chs.map(function (c) {
        return '<a href="#/' + c.id + '">第' + c.num + '章</a>';
      }).join('、');
      h.push('<tr data-text="' + attr(r.t.t + ' ' + r.en + ' ' + r.d) + '">' +
        '<td>' + inline(r.t.t) + '</td>' +
        '<td>' + inline(r.en) + '</td>' +
        '<td>' + inline(r.d) + '</td>' +
        '<td>' + srcs + '</td></tr>');
    });
    if (!rows.length) h.push('<tr><td colspan="4" class="empty">还没有内容。</td></tr>');
    h.push('</tbody></table></div>');
    return h.join('');
  }



  /* ---------- 延伸思考 ---------- */
  var TAG_CLASS = { '概念深挖': 'concept', '定量计算': 'calc', '工程设计': 'design', '科研前沿': 'frontier' };

  function extCard(e, i, c, withCh) {
    var tag = e.tag || '概念深挖';
    var cls = TAG_CLASS[tag] || 'concept';
    var h = ['<div class="ext t-' + cls + '" data-tag="' + attr(tag) + '">'];
    h.push('<div class="ext-h"><span class="ext-no">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
      '<span class="ext-tag">' + inline(tag) + '</span>' +
      (withCh && c ? '<a class="ext-ch" href="#/' + c.id + '">第 ' + c.num + ' 章</a>' : '') + '</div>');
    h.push('<p class="ext-q">' + inline(e.q) + '</p>');
    if (e.hints && e.hints.length) {
      h.push('<details class="ext-d"><summary>卡住了？看提示</summary><ul>' +
        e.hints.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul></details>');
    }
    if (e.answer) {
      h.push('<details class="ext-d"><summary>写完再对答案</summary><div class="ext-a">' + inline(e.answer) + '</div>');
      if (e.to && e.to.length) {
        h.push('<div class="ext-to">回看：' + e.to.map(function (t) {
          var tc = chapterById(t.ch);
          var nm = tc ? ('第' + tc.num + '章') : String(t.ch);
          return '<a href="#/' + t.ch + '/' + (t.sec || '') + '">' + nm + ' §' + (t.sec || '') + '</a>';
        }).join('、') + '</div>');
      }
      h.push('</details>');
    }
    h.push('</div>');
    return h.join('');
  }

  function renderExtendSection(c) {
    if (!c.extend || !c.extend.length) return '';
    var h = ['<section class="sec" id="sec-extend">'];
    h.push('<h2><span class="sec-tag">延伸</span>延伸思考' +
      '<span style="margin-left:auto;font-size:11.5px;color:var(--ink-3);font-weight:400">' +
      c.extend.length + ' 题 · 先自己写，再点开对答案</span></h2>');
    h.push('<p class="ext-lead">' + inline('下面这些题书上没有现成答案。它们考的不是记忆，是**把这一章的机制用到别处**：' +
      '有些是反直觉的，有些要你算一个数，有些是工程上真要做取舍的地方。建议每题先写 3 行再展开。') + '</p>');
    c.extend.forEach(function (e, i) { h.push(extCard(e, i, c, false)); });
    h.push('</section>');
    return h.join('');
  }

  function renderExtendPage() {
    var h = ['<div class="wrap">'];
    var total = 0, tags = {};
    CHAPTERS.forEach(function (c) {
      (c.extend || []).forEach(function (e) { total++; tags[e.tag] = (tags[e.tag] || 0) + 1; });
    });
    h.push('<div class="chapter-head"><div class="eyebrow"><span>学习工具</span><span>·</span><span>' + total + ' 道开放题</span></div>');
    h.push('<h1>延伸思考</h1>');
    h.push('<p class="lede">每题都超出书本：要你迁移、要你算、要你做取舍。答案默认折叠——先写三行，再点开。' +
      '这些题没有标准答案，只有"判断链对不对"。</p></div>');
    h.push('<div class="toolbar">');
    h.push('<button class="flt filter-flt on" data-tag="all">全部 ' + total + '</button>');
    Object.keys(TAG_CLASS).forEach(function (t) {
      h.push('<button class="flt filter-flt" data-tag="' + t + '">' + t + ' ' + (tags[t] || 0) + '</button>');
    });
    h.push('<input class="search" id="eSearch" placeholder="搜索关键词…">');
    h.push('<button class="flt" id="extAll">全部展开</button>');
    h.push('</div>');
    CHAPTERS.forEach(function (c) {
      if (!c.extend || !c.extend.length) return;
      h.push('<div class="egroup" data-ch="' + c.id + '">');
      h.push('<h2 class="section-title" style="font-size:17px;margin:28px 0 10px">' +
        '<a href="#/' + c.id + '" style="color:var(--ink)">第 ' + c.num + ' 章 · ' + inline(c.title) + '</a>' +
        '<small>' + c.extend.length + ' 题</small></h2>');
      c.extend.forEach(function (e, i) { h.push(extCard(e, i, c, false)); });
      h.push('</div>');
    });
    if (!total) h.push('<p class="empty">还没有延伸题。</p>');
    h.push('</div>');
    return h.join('');
  }

  /* ---------- 渲染：学习准备 ---------- */
  function renderPrep() {
    var h = ['<div class="wrap">'];
    h.push('<div class="chapter-head"><div class="eyebrow"><span>开读之前</span><span>·</span><span>10 分钟读完</span></div>');
    h.push('<h1>要准备什么，要同步学什么软件</h1>');
    h.push('<p class="lede">这本书介于「教材」和「专著」之间：前半本是传输现象，后半本是建模与仿真。' +
      '所以准备分两块——脑子里的知识，和会用的工具。下面按「缺了会卡住」的优先级排。</p></div>');

    h.push('<h2 class="section-title">一、知识准备<small>按「不学就卡在哪一章」排序</small></h2>');
    h.push('<div class="ch-grid">');
    h.push(prepCard('① 工程热力学 + 电化学', '最硬的门槛，第 1 章就要用',
      '焓/熵/吉布斯自由能、可逆电压、能斯特方程、Butler-Volmer、Tafel、交换电流密度、三类过电势。' +
      '如果只能补一块，就补这块：极化曲线看不懂，后面全是死记。'));
    h.push(prepCard('② 传热学 + 传质学', '第 2、5 章的主线',
      'Fick 定律、对流传质、能量方程、热阻网络、相变换热。再补一点多孔介质：Darcy 定律、渗透率、' +
      '毛细压力与 Leverett 函数——液态水在 GDL 里怎么走全靠它。'));
    h.push(prepCard('③ 流体力学', '第 2.2、4 章',
      'N-S 方程、层流压降、两相流与表面张力/接触角、VOF 的物理含义。' +
      '不要求会推导，要求看到「流道里的液滴」能说出受哪几个力。'));
    h.push(prepCard('④ 数值方法', '第 4、5 章',
      '有限差分/有限体积的离散思想、收敛与网格无关性、时间步与稳定性。' +
      'LBM 只要先懂「粒子分布函数 + 碰撞 + 迁移」三件事，不用一上来啃 D3Q19。'));
    h.push(prepCard('⑤ 材料与结构常识', '随时要用',
      'Nafion 的磺酸基侧链为什么能导质子、Pt/C 催化剂、碳纸/碳布 GDL、PTFE 疏水处理、' +
      '流场板石墨 vs 金属。这些名词不熟，读第 2 章会很吃力。'));
    h.push(prepCard('⑥ 数学工具', '边用边补',
      '偏微分方程与边界条件、复数（EIS 必需）、量纲分析与数量级估算。' +
      '后两条比会解方程更重要——本书大量结论是靠数量级判断出来的。'));
    h.push('</div>');

    h.push('<div class="keypoints" style="margin-top:26px"><h4>读完一章的「最低门槛」自查</h4><ol>');
    h.push('<li>能写出 ΔG = −nFE，并说清每个符号的单位；能算出 1.229 V 是怎么来的。</li>');
    h.push('<li>能解释为什么实测开路电压明显低于 1.229 V（渗氢、混合电位、Pt 氧化）。</li>');
    h.push('<li>能在极化曲线上指出活化/欧姆/传质三段，并说出各自的物理过程。</li>');
    h.push('<li>能用 Fick 定律估一个 200 μm GDL 的氧气扩散通量，并和 1 A/cm² 的需求对比。</li>');
    h.push('<li>能说清电渗拖拽和反扩散谁在什么条件下占上风，以及膜厚、电流的影响。</li>');
    h.push('<li>看到一张 Nyquist 图，能指出高频截距、半圆直径、45° 尾分别对应什么。</li>');
    h.push('<li>能说出 VOF 和 LBM 各自适合什么问题，为什么多孔介质里更爱用 LBM。</li>');
    h.push('</ol></div>');

    h.push('<div class="callout k-warn" style="margin-top:22px"><div class="ci">▲</div><div>');
    h.push('<b>不要先学的两样东西</b><p>湍流模型细节、LBM 的 MRT 碰撞矩阵。它们是第 4 章的进阶内容，' +
      '在你还没建立「水从哪来、到哪去」的物理图像之前学，只会增加挫败感。</p></div></div>');

    h.push('<h2 class="section-title">二、软件：按「性价比」排队<small>标 ★ 的是最该先装的两个</small></h2>');
    h.push('<table><thead><tr><th style="width:170px">软件</th><th>用来干什么</th><th style="width:104px">对应章节</th><th style="width:150px">学到什么程度</th></tr></thead><tbody>');
    var sw = [
      ['★ Python<br><span style="color:var(--ink-3);font-size:11.5px">numpy / scipy / matplotlib</span>',
        '画极化曲线、拟合 EIS、写一维与准二维模型、批量后处理。本书的低维模型用 50 行就能复现。',
        '第 1、5.3、7 章',
        '能独立跑出书上那张极化曲线，并和改参数后的趋势对上'],
      ['★ COMSOL Multiphysics<br><span style="color:var(--ink-3);font-size:11.5px">燃料电化学 / Fuel Cell 模块</span>',
        '电化学-流动-传热-组分耦合，单电池与电堆三维模型。与本书第 5、6 章的建模路线最贴合，中文资料也多。',
        '第 2、5、6 章',
        '能搭一个 2D 单流道半电池，做出网格无关性，并让极化曲线落在合理区间'],
      ['ANSYS Fluent<br><span style="color:var(--ink-3);font-size:11.5px">含 PEMFC / VOF 模型</span>',
        '流道内两相流、液滴与排水、多孔介质流动。第 4 章「流道内的模拟」的主力工具。',
        '第 4、5.2 章',
        '会做一个流道里液滴被气体吹走的 VOF 算例'],
      ['OpenFOAM + ParaView',
        '开源 CFD，可改求解器、看自定义场。想真正搞懂第 4 章的两相界面处理，读源码比看公式快。',
        '第 4 章',
        '能跑通 interFoam 并读懂相方程'],
      ['MATLAB / Simulink',
        '一维稳态模型、准二维瞬态模型、电堆流体网络、系统与控制策略。第 6.3、7.4 的思路天然适合它。',
        '第 5.3、6.3、7 章',
        '搭一个 20 片电堆的一维热-水-气网络并跑变载工况'],
      ['电化学工作站软件<br><span style="color:var(--ink-3);font-size:11.5px">Gamry / BioLogic EC-Lab / CHI</span>',
        '测 EIS、CV、LSV、高频阻抗、电流中断。第 3 章几乎所有实验都靠它。',
        '第 3 章',
        '会设激励幅值（5–10 mV）、频率范围（10 kHz–0.1 Hz），会判断数据是否可信'],
      ['ZView / ZSimpWin / impedance.py',
        '把 Nyquist 图拟合成等效电路，取出 R_om、R_ct、C_dl、Warburg 系数。',
        '第 3.3 节',
        '能拟合出四个参数并解释每个参数变大意味着什么'],
      ['SolidWorks / NX / FreeCAD',
        '流场板、夹具、歧管设计，导出 STEP 给仿真用。',
        '第 2.2、6.1 章',
        '能画一个蛇形流场和叉指流场并检查压降趋势'],
      ['Zotero + LaTeX（或 Word）',
        '文献管理与报告写作。这本书每章末尾都有参考文献，顺着读是最高效的扩展方式。',
        '全书',
        '能把书里的引文一键抓进自己的库'],
      ['Palabos / 自写 LBM 代码',
        '格子玻尔兹曼，多孔介质内单相/两相流动。选学，但对理解第 4.3 节帮助极大。',
        '第 4 章',
        '能跑一个 D2Q9 泊肃叶流，验证松弛时间与黏度的关系']
    ];
    sw.forEach(function (row) {
      h.push('<tr><td>' + row[0] + '</td><td>' + row[1] + '</td><td>' + row[2] + '</td><td>' + row[3] + '</td></tr>');
    });
    h.push('</tbody></table>');

    h.push('<div class="callout k-tip" style="margin-top:18px"><div class="ci">◆</div><div>');
    h.push('<b>别一次装五个</b><p>最省力的组合是 <b>Python + COMSOL</b>：Python 管算和画，COMSOL 管真三维。' +
      '等你把第 5 章的单流道跑通了，再决定要不要上 Fluent/OpenFOAM。</p></div></div>');

    h.push('<h2 class="section-title">三、四周路线<small>每周 6–8 小时，配合本站「标记已读」</small></h2>');
    h.push('<table><thead><tr><th style="width:74px">周次</th><th>读什么</th><th>动手做什么</th></tr></thead><tbody>');
    var plan = [
      ['第 1 周', '第 1、2 章（热力学、动力学、极化曲线、水与热的来源、膜内水传输）',
        '用 Python 画出三段损失叠加的极化曲线；手算一次电渗拖拽 vs 反扩散的净水通量'],
      ['第 2 周', '第 3 章（表征与诊断），重点 3.3 电化学阻抗谱',
        '给一条模拟阻抗谱做等效电路拟合；把 3.4 的分布测量方法列成一张对照表'],
      ['第 3 周', '第 4、5 章（数值方法与单电池模型）',
        'COMSOL 里搭 2D 单流道半电池，做网格无关性；再用一维模型对比计算耗时'],
      ['第 4 周', '第 6、7 章（电堆与系统）',
        '搭一个 20 片电堆的一维流体网络，看歧管流量分配不均；画一张系统能量流图']
    ];
    plan.forEach(function (row) {
      h.push('<tr><td><b>' + row[0] + '</b></td><td>' + row[1] + '</td><td>' + row[2] + '</td></tr>');
    });
    h.push('</tbody></table>');

    h.push('<h2 class="section-title">四、如果你要上实验台<small>第 3 章对应的硬件</small></h2>');
    h.push('<div class="ch-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">');
    h.push(prepCard('单电池夹具 + 加热/控温', '硬件', '带流场板的石墨或金属夹具、加热棒、热电偶、压紧力可控的螺栓或气缸。'));
    h.push(prepCard('电化学工作站 + 电子负载', '测电', 'EIS、CV、LSV、高频阻抗、电流中断都靠它；电子负载负责恒流/恒压拉载。'));
    h.push(prepCard('气路：MFC + 加湿罐 + 露点仪', '测气与水', '质量流量控制器定化学计量比，鼓泡/膜加湿定相对湿度，露点仪验证加湿量。'));
    h.push(prepCard('可视化：透明电池 + 高速相机', '看水', '第 3.5 节的核心手段。注意透明端板的导热与压紧和真实电池差异很大。'));
    h.push(prepCard('温度场：红外热像 / 分布式热电偶', '看热', '测面内温度分布，验证「局部热点导致局部干燥」的推断。'));
    h.push(prepCard('大科学装置：X 射线 / 中子成像', '看内部', '能穿透金属端板看到液态水分布，但机时贵，通常只做机理验证。'));
    h.push('</div>');

    h.push('<div class="keypoints" style="margin-top:30px"><h4>一句话总结</h4><ol>');
    h.push('<li>脑子先补<b>热力学-电化学</b>和<b>传热传质</b>两块，其余边读边补。</li>');
    h.push('<li>软件先装 <b>Python</b> 和 <b>COMSOL</b>，把「算得出来」和「算得对」分开练。</li>');
    h.push('<li>每章读完做一件事：把这一章的内容画成一张图或者写成 30 行代码。做不到，就是没读懂。</li>');
    h.push('</ol></div>');
    h.push('</div>');
    return h.join('');
  }

  function prepCard(t, tag, d) {
    return '<div class="ch-card" style="cursor:default">' +
      '<span class="cnum">' + tag + '</span>' +
      '<h3 style="font-size:15px">' + t + '</h3>' +
      '<p style="font-size:13px">' + d + '</p></div>';
  }

  /* ---------- 观察器回收 ----------
     演示模块每次挂载都会 new MutationObserver / ResizeObserver 监听主题与尺寸，
     页面切走后 DOM 被丢弃，但观察器仍持有画布引用（一块 772×372 的画布约 1 MB）。
     这里统一登记、每次重渲染前断开，避免长时间连续翻页导致内存持续上涨。 */
  var liveObservers = [];
  function patchObservers() {
    ['MutationObserver', 'ResizeObserver'].forEach(function (name) {
      var Orig = window[name];
      if (!Orig || Orig.__pemfcPatched) return;
      var Wrapped = function (cb) {
        var inst = new Orig(cb);
        var orgObserve = inst.observe;
        inst.observe = function () {
          liveObservers.push(inst);
          return orgObserve.apply(inst, arguments);
        };
        return inst;
      };
      Wrapped.prototype = Orig.prototype;
      Wrapped.__pemfcPatched = true;
      window[name] = Wrapped;
    });
  }
  function dropObservers() {
    for (var i = 0; i < liveObservers.length; i++) {
      try { liveObservers[i].disconnect(); } catch (e) { /* 忽略 */ }
    }
    liveObservers = [];
  }

  /* ---------- 交互绑定 ---------- */
  function mountDemos(root) {
    $$('[data-demo]', root).forEach(function (box) {
      var id = box.getAttribute('data-demo');
      var body = $('.demo-body', box);
      var titleEl = $('[data-demo-title]', box);
      var reg = (window.DEMOS || {})[id];
      if (!reg) {
        if (titleEl) titleEl.textContent = '演示缺失';
        if (body) body.innerHTML = '<p class="demo-note">未找到演示模块 ' + attr(id) + '。</p>';
        return;
      }
      if (titleEl) titleEl.textContent = reg.name || id;
      try {
        reg.init(body);
      } catch (e) {
        if (body) body.innerHTML = '<p class="demo-note">演示加载出错：' + attr(String(e && e.message || e)) + '</p>';
        if (window.console) console.error('[demo:' + id + ']', e);
      }
    });
  }

  function onViewClick(ev) {
    var target = ev.target;
    var more = target.closest ? target.closest('#tocMore') : null;
    if (more) {
      var box = $('#tocInline');
      if (box) {
        var collapsed = box.classList.toggle('collapsed');
        more.textContent = collapsed ? '展开全部目录 ▾' : '收起目录 ▴';
      }
      return;
    }
    var markBtn = target.closest ? target.closest('.mark-btn') : null;
    if (markBtn) { toggleRead(markBtn); return; }
    var opt = target.closest ? target.closest('.opt') : null;
    if (!opt) return;
      var q = opt.parentNode;
      if (!q || q.getAttribute('data-locked') === '1') return;
      var ans = parseInt(q.getAttribute('data-ans'), 10);
      var picked = parseInt(opt.getAttribute('data-i'), 10);
      q.setAttribute('data-locked', '1');
      q.setAttribute('data-correct', picked === ans ? '1' : '0');
      $$('.opt', q).forEach(function (o) {
        var i = parseInt(o.getAttribute('data-i'), 10);
        o.classList.add('locked');
        if (i === ans) o.classList.add('ok');
        else if (i === picked) o.classList.add('no');
      });
    var exp = $('.qexp', q);
    if (exp) exp.classList.add('show');
    scoreQuiz(opt.closest('.quiz'));
  }

  function scoreQuiz(quizEl) {
    if (!quizEl) return;
    var chId = quizEl.getAttribute('data-quiz-ch');
    var qs = $$('.q', quizEl);
    var total = qs.length, locked = 0, right = 0;
    for (var i = 0; i < total; i++) {
      if (qs[i].getAttribute('data-locked') === '1') {
        locked++;
        if (qs[i].getAttribute('data-correct') === '1') right++;
      }
    }
    var out = $('.quiz-score', quizEl);
    if (!out) return;
    if (locked === total) {
      var rec = P.quiz[chId] || { best: 0 };
      if (right > rec.best) rec.best = right;
      P.quiz[chId] = rec;
      saveProgress();
      out.textContent = '得分 ' + right + ' / ' + total + (right === total ? '　全对，可以往下走了。' : '　把错的那几节再扫一遍。');
      out.style.color = right === total ? 'var(--key-line)' : 'var(--ink-2)';
    } else {
      out.textContent = '已答 ' + locked + ' / ' + total;
    }
  }

  function toggleRead(btn) {
    var ch = btn.getAttribute('data-read-ch');
    var sec = btn.getAttribute('data-read-sec');
    P.read[ch] = P.read[ch] || {};
    if (P.read[ch][sec]) { delete P.read[ch][sec]; btn.classList.remove('on'); btn.textContent = '标记已读'; }
    else { P.read[ch][sec] = 1; btn.classList.add('on'); btn.textContent = '已读'; }
    saveProgress();
    updateRing();
    var r = currentRoute();
    buildSidebar(r.chapter || (r.view === 'home' ? 'home' : r.view), r.sec);
  }

  function bindSearch() {
    var fs = $('#fSearch');
    if (fs) {
      fs.addEventListener('input', function () {
        var q = fs.value.trim().toLowerCase();
        $$('#fList .fgroup').forEach(function (g) {
          var shown = 0;
          $$('.f-item', g).forEach(function (it) {
            var hit = !q || (it.getAttribute('data-text') || '').toLowerCase().indexOf(q) >= 0;
            it.style.display = hit ? '' : 'none';
            if (hit) shown++;
          });
          g.style.display = shown ? '' : 'none';
        });
      });
    }
    var extAll = $('#extAll');
    if (extAll) {
      extAll.addEventListener('click', function () {
        var anyClosed = $$('.ext-d').some(function (d) { return !d.open; });
        $$('.ext-d').forEach(function (d) { d.open = anyClosed; });
        extAll.textContent = anyClosed ? '全部收起' : '全部展开';
      });
    }
    var es = $('#eSearch');
    var flts = $$('.filter-flt');
    function applyExtFilter() {
      var active = 'all';
      flts.forEach(function (b) { if (b.classList.contains('on')) active = b.getAttribute('data-tag'); });
      var q = es ? es.value.trim().toLowerCase() : '';
      $$('.egroup').forEach(function (g) {
        var shown = 0;
        $$('.ext', g).forEach(function (card) {
          var tagOk = active === 'all' || card.getAttribute('data-tag') === active;
          var txtOk = !q || card.textContent.toLowerCase().indexOf(q) >= 0;
          var ok = tagOk && txtOk;
          card.style.display = ok ? '' : 'none';
          if (ok) shown++;
        });
        g.style.display = shown ? '' : 'none';
      });
    }
    flts.forEach(function (b) {
      b.addEventListener('click', function () {
        flts.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        applyExtFilter();
      });
    });
    if (es) es.addEventListener('input', applyExtFilter);

    var gs = $('#gSearch');
    if (gs) {
      gs.addEventListener('input', function () {
        var q = gs.value.trim().toLowerCase();
        $$('table.gloss tbody tr').forEach(function (tr) {
          var hit = !q || (tr.getAttribute('data-text') || '').toLowerCase().indexOf(q) >= 0;
          tr.style.display = hit ? '' : 'none';
        });
      });
    }
  }

  /* ---------- 路由 ---------- */
  function currentRoute() {
    var raw = String(location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').filter(function (x) { return x; });
    if (!parts.length || parts[0] === 'home') return { view: 'home', chapter: '', sec: '' };
    if (parts[0] === 'prep') return { view: 'prep', chapter: 'prep', sec: '' };
    if (parts[0] === 'extend') return { view: 'extend', chapter: 'extend', sec: '' };
    if (parts[0] === 'formulas') return { view: 'formulas', chapter: 'formulas', sec: '' };
    if (parts[0] === 'glossary') return { view: 'glossary', chapter: 'glossary', sec: '' };
    return { view: 'chapter', chapter: parts[0], sec: parts[1] || '' };
  }

  function render() {
    var r = currentRoute();
    var view = $('#view');
    var html = '';
    dropObservers();

    if (r.view === 'chapter') {
      var c = chapterById(r.chapter);
      if (!c) { html = '<div class="wrap"><p class="empty">没有这一章。回到 <a href="#/home">总览</a>。</p></div>'; }
      else html = renderChapter(c, r.sec);
    } else if (r.view === 'prep') {
      html = renderPrep();
    } else if (r.view === 'extend') {
      html = renderExtendPage();
    } else if (r.view === 'formulas') {
      html = renderFormulas();
    } else if (r.view === 'glossary') {
      html = renderGlossary();
    } else {
      html = renderHome();
    }

    view.innerHTML = html;
    if (r.view === 'chapter' && !r.sec) window.scrollTo(0, 0);
    else if (r.view !== 'chapter') window.scrollTo(0, 0);

    buildSidebar(r.chapter || (r.view === 'home' ? 'home' : r.view), r.sec);
    updateRing();
    bindSearch();
    mountDemos(view);
    onScroll();

    if (r.view === 'chapter') {
      P.last = { ch: r.chapter, sec: r.sec || '', ts: Date.now() };
      saveProgress();
      var c2 = chapterById(r.chapter);
      var qz = $('[data-quiz-ch]', view);
      if (qz) {
        var total = $$('.q', qz).length;
        var best = P.quiz[r.chapter];
        var out = $('.quiz-score', qz);
        if (best && out) out.textContent = '上次得分：' + best.best + ' / ' + total;
      }
      if (c2 && r.sec) {
        var target = document.getElementById('sec-' + r.sec);
        if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
      }
    }
    if (window.innerWidth <= 860) $('#sidebar').classList.remove('open');
  }

  /* ---------- 主题 / 滚动 ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(TKEY, t); } catch (e) { /* 忽略 */ }
  }
  function initTheme() {
    var forced = /[?&]theme=(light|dark)/.exec(location.search || '');
    if (forced) { applyTheme(forced[1]); return; }
    var saved = null;
    try { saved = localStorage.getItem(TKEY); } catch (e) { /* 忽略 */ }
    if (!saved) saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved);
  }

  var scrollLineEl = null;
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (!scrollLineEl) scrollLineEl = document.getElementById('scrollLine');
    scrollLineEl.style.width = Math.min(100, p * 100) + '%';
  }

  /* ---------- 启动 ---------- */
  function boot() {
    patchObservers();
    initTheme();
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('#resetBtn') : null;
      if (t) {
        if (window.confirm('清空本机保存的阅读进度和测验成绩？')) {
          P = { read: {}, quiz: {} };
          saveProgress();
          render();
        }
      }
    });
    $('#themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    $('#menuBtn').addEventListener('click', function () {
      $('#sidebar').classList.toggle('open');
    });
    $('#view').addEventListener('click', onViewClick);
    $('#sidebar').addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('a') && window.innerWidth <= 860) {
        $('#sidebar').classList.remove('open');
      }
    });
    window.addEventListener('hashchange', render);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (!CHAPTERS.length) {
      $('#view').innerHTML = '<div class="wrap"><p class="empty">内容模块未加载。请确认 js/content/ 下的文件存在。</p></div>';
    } else {
      render();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
