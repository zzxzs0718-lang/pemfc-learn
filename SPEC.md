# 《质子交换膜燃料电池水热管理》学习网站 —— 内容创作契约 (SPEC)

作者：焦魁 等。源文本已抽取到：D:/One Drive/OneDrive/桌面/学习/_work/text/*.txt
（每个文件带页码标记 `===== [PDF p.N] =====`，引用页码时以这个为准。）

最终产物：静态网站 D:/One Drive/OneDrive/桌面/学习/pemfc-learn/，双击 index.html 即可打开，
**不依赖网络、不依赖 CDN**。所以：禁止外部图片、禁止外链字体、禁止 KaTeX。

---

## 1. 你的交付物（一个 JS 文件）

文件路径：`pemfc-learn/js/content/<name>.js`，UTF-8 无 BOM，浏览器直接 `<script>` 加载的普通脚本（不要用 import/export）。

```js
window.CONTENT = window.CONTENT || {};
window.CONTENT["ch1"] = {
  id: "ch1",
  num: 1,
  title: "导论",
  subtitle: "一句话副标题（15 字以内，点出本章灵魂）",
  pages: "21–42",
  hours: 2,                       // 建议学习时长（小时，数字）
  intro: "本章导语，80–140 字，说清『为什么先学这一章』。",
  sections: [ /* 见下 */ ],
  quiz: [ /* 见下，3–6 题 */ ],
  terms: [ /* 见下，5–10 条 */ ]
};
```

## 2. section 与 block 结构

```js
section = { id: "2.2", title: "2.2 极板和流场", blocks: [ ... ] }
```
`id` 必须和书里小节号一致（如 "2.2"、"2.2.1"），`title` 写成「小节号 + 名称」。

block 只允许以下类型（type 字段严格区分）：

| type | 字段 | 说明 |
|---|---|---|
| `p` | `text` | 普通段落。支持 `**粗体**`、`==高亮==`、`$公式$`（见 §4）。 |
| `h3` | `text` | 段落内的次标题（不带编号的小标题，如「1. 焓和反应焓」） |
| `list` | `ordered`(bool), `items`([string]) | 列表，items 支持 `**粗体**`。 |
| `formula` | `html`, `note` | 公式。`html` 用 §4 的公式片段语法；`note` 写「式(1-28) + 一句话物理含义」。 |
| `key` | `title`, `text` | 关键概念卡片（高亮框）。一章 4–8 个，只放真正的地基概念。 |
| `callout` | `kind`("tip"/"warn"/"note"/"think"), `title`, `text` | 提示 / 警告 / 思考题。 |
| `table` | `head`([string]), `rows`([[string]]) | 对比表。行内支持 `**粗体**`。 |
| `figure` | `svg`, `caption` | 自己画的 inline SVG（见 §5）。 |
| `demo` | `id`, `caption` | 调用交互演示，id 从 §6 白名单选。 |
| `example` | `title`, `blocks`(blocks 数组) | 例题（推导/计算），内部可嵌套 p/formula/list。 |
| `keypoints` | `items`([string]) | 本章小结要点。放在最后一个 section 的最后。 |
| `quote` | `text`, `from` | 引用原文金句（可选）。 |

## 3. quiz / terms

```js
quiz = [{ q: "题干", options: ["A...","B...","C...","D..."], answer: 0, explain: "为什么，一句话点透。" }]
```
- 每题 3–4 个选项，`answer` 是正确项下标；干扰项必须是「学生真的会犯的错」，不能凑数。
- 题干问机制、问因果、问「以下哪个说法错误」，不要只问定义背诵。

```js
terms = [{ t: "质子交换膜", en: "proton exchange membrane, PEM", d: "40–80 字解释，带单位/数量级更好" }]
```

## 4. 文本与公式的写法

正文里的 `$...$` 会被渲染成行内公式，内部只允许：`<sup>`、`<sub>`、`<i>`、`<span class="fr">`。

分数写法（**必须用这个结构**）：
`<span class="fr"><span class="nu">分子</span><span class="de">分母</span></span>`

常用片段示例：
- 可逆电压：`<i>E</i> = −<span class="fr"><span class="nu">Δ<i>G</i></span><span class="de"><i>nF</i></span></span>`
- 上标下标：`<i>j</i><sub>0</sub>`，`mol<sup>−1</sup>`
- 希腊字母直接用字符：α β γ η λ σ φ Δ Θ。
- 乘号 `×`，减号 `−`（U+2212），单位连接用 `·`。

**注意**：文本里出现的裸 `<` `>` 必须写成 `&lt;` `&gt;`（例如 `&lt;0.1 V`），否则渲染出错。

## 5. 自绘 SVG 的规范

- 尺寸 `<svg viewBox="0 0 640 320">`，不要写死 width/height。
- 只用 fill / stroke / text，颜色用 CSS 变量：`var(--ink)`、`var(--ink-2)`、`var(--accent)`、
  `var(--h2)`(蓝)、`var(--water)`(青)、`var(--heat)`(橙)、`var(--line)`。禁止写死 #000。
- 中文文字 font-size 不小于 11；font-family 不用写（继承）。
- 图注文字不要放进 SVG，写进 `caption`。

## 6. 可用的交互演示 id（白名单）

| id | 内容 | 归属 |
|---|---|---|
| `polarization` | 极化曲线：活化/欧姆/传质三段损失，可调温度、交换电流密度、膜阻 | Lead |
| `nernst` | 可逆电压随温度/分压变化 | Lead |
| `waterflux` | 电渗拖拽 vs 反扩散，净水通量方向 | Lead |
| `eis` | 电化学阻抗谱 Nyquist 图（高频半圆 + 低频扩散尾） | demos |
| `flowfield` | 平行 / 蛇形 / 平行蛇形 / 叉指 / 波浪 流场对比 | demos |
| `coldstart` | 冷启动温度演化与成败判据 | demos |
| `stack` | 单电池→电堆层叠、歧管流量分配 | demos |
| `energyflow` | 系统能量 / 水 / 热流（桑基式） | demos |

放 `demo` block 时**只写 id 和 caption**，不要自己写 DOM。

## 7. 内容质量红线（会被打回）

1. **必须来自这本书**。概念、公式、结论、数据都能在对应章节文本里找到出处；可补充通用背景，
   但不要写书上没有的具体数字（除 F=96485 C/mol 这类常数）。
2. **页码可追溯**：在每个 section 的正文里自然带出至少一处「（p.31）」这样的 PDF 页码。
3. **不要抄原文长句**。用你自己的话讲，教学口吻（第二人称「你」），句子短。一段最多 5 行。
4. **每章至少 1 个 example（例题/推导）和 1 个 demo 或 figure**；key 卡片 4–8 个。
5. 术语首次出现时给英文缩写（PEMFC、GDL、CL、MPL、EIS、OCV…）。
6. 不要用「本章将介绍……」这种空话开头；直接进入问题。
7. 单位必须写，数量级必须写，公式符号必须和书一致。

## 8. 交付前自检

```powershell
node -e "global.window={};require('D:/One Drive/OneDrive/桌面/学习/pemfc-learn/js/content/ch1.js');const c=window.CONTENT.ch1;console.log(c.sections.length, JSON.stringify(c).length)"
```
要求：不报错，`JSON.stringify(c).length` 落在 20000–60000（内容厚度参考）。
再逐条自查：所有 type 在白名单内；所有 demo.id 在白名单内；没有裸 `<`；没有外部链接。