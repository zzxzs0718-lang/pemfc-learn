window.CONTENT = window.CONTENT || {};

window.CONTENT["ch4"] = {
  "id": "ch4",
  "num": 4,
  "title": "多相流动与电极动力学仿真",
  "subtitle": "同一滴水，三把尺子",
  "pages": "121–167",
  "hours": 4,
  "intro": "你在上一章已经见过水堵在流道和多孔电极里的样子。真要把它算出来，麻烦就来了：流道里是毫米级液滴，扩散层里是几十微米的孔，催化层里是几纳米的缝——没有哪个模型能同时装下。这一章讲的是工程师怎么按尺度挑工具，以及每把工具的软肋在哪里。",
  "sections": [
    {
      "id": "4.1",
      "title": "4.1 数值方法回顾",
      "blocks": [
        {
          "type": "p",
          "text": "先把工具箱摊开。同一杯水，可以追每一个分子（分子动力学，MD），可以追一群粒子的分布（格子玻尔兹曼，LB），也可以干脆把它当连续介质解方程（Navier–Stokes，NS）。三种世界观，对应三个尺度。（p.121）"
        },
        {
          "type": "p",
          "text": "尺度一大，方法就从“数分子”变成“解守恒律”。MD 的假设最少、结果最准，但要跟踪每个分子的时空轨迹，算力和存储都吃不消，跨尺度耦合至今没有解决。（p.122）"
        },
        {
          "type": "figure",
          "svg": "<svg viewBox=\"0 0 640 320\">\n  <defs><marker id=\"ch4a1\" markerWidth=\"8\" markerHeight=\"8\" refX=\"6\" refY=\"3\" orient=\"auto\"><path d=\"M0,0 L6,3 L0,6 z\" fill=\"var(--ink-2)\"/></marker></defs>\n  <text x=\"196\" y=\"32\" font-size=\"11\" fill=\"var(--ink-2)\">特征尺度增大 →</text>\n  <line x1=\"196\" y1=\"44\" x2=\"596\" y2=\"44\" stroke=\"var(--line)\" marker-end=\"url(#ch4a1)\"/>\n  <text x=\"150\" y=\"88\" text-anchor=\"end\" font-size=\"12\" fill=\"var(--ink)\">分子动力学</text>\n  <text x=\"150\" y=\"104\" text-anchor=\"end\" font-size=\"11\" fill=\"var(--ink-2)\">MD</text>\n  <rect x=\"196\" y=\"68\" width=\"150\" height=\"30\" fill=\"var(--heat)\" fill-opacity=\"0.16\" stroke=\"var(--heat)\"/>\n  <text x=\"206\" y=\"88\" font-size=\"11\" fill=\"var(--ink)\">1–100 nm</text>\n  <text x=\"150\" y=\"158\" text-anchor=\"end\" font-size=\"12\" fill=\"var(--ink)\">格子玻尔兹曼</text>\n  <text x=\"150\" y=\"174\" text-anchor=\"end\" font-size=\"11\" fill=\"var(--ink-2)\">LB / LBM</text>\n  <rect x=\"270\" y=\"138\" width=\"262\" height=\"30\" fill=\"var(--h2)\" fill-opacity=\"0.16\" stroke=\"var(--h2)\"/>\n  <text x=\"280\" y=\"158\" font-size=\"11\" fill=\"var(--ink)\">10 nm – 100 μm</text>\n  <text x=\"150\" y=\"228\" text-anchor=\"end\" font-size=\"12\" fill=\"var(--ink)\">宏观连续</text>\n  <text x=\"150\" y=\"244\" text-anchor=\"end\" font-size=\"11\" fill=\"var(--ink-2)\">NS 方程</text>\n  <rect x=\"420\" y=\"208\" width=\"192\" height=\"30\" fill=\"var(--accent)\" fill-opacity=\"0.16\" stroke=\"var(--accent)\"/>\n  <text x=\"430\" y=\"228\" font-size=\"11\" fill=\"var(--ink)\">1 μm – 1 mm</text>\n  <text x=\"196\" y=\"286\" font-size=\"11\" fill=\"var(--ink-2)\">越往右 Kn 越小，连续介质假设越可靠</text>\n  <text x=\"196\" y=\"306\" font-size=\"11\" fill=\"var(--ink-2)\">中段互相交叠：介观方法上下都能接</text>\n</svg>",
          "caption": "三种尺度的分工。横条是各自的适用窗口；越往右 Kn 越小，连续介质假设越可靠。（据 p.121–122 绘制）"
        },
        {
          "type": "p",
          "text": "夹在中间的是介观方法。它只统计、不跟踪，所以既不受连续介质假设的束缚，又能下探到纳米孔。分界线是克努森数 Kn：分子平均自由程除以特征长度。（p.122）"
        },
        {
          "type": "key",
          "title": "克努森数 Kn",
          "text": "Kn = λ/d，λ 是分子平均自由程（常温常压空气约 68 nm），d 是特征长度。Kn 远小于 0.01 时连续介质成立，NS 方程可用；接近或超过 0.1，就得换介观或分子方法。"
        },
        {
          "type": "table",
          "head": [
            "部件",
            "特征尺寸",
            "孔隙尺度",
            "常用方法"
          ],
          "rows": [
            [
              "**流道**",
              "毫米级",
              "—",
              "NS 方程 + VOF；近年 LB、DNS"
            ],
            [
              "**扩散层 GDL**",
              "厚 150–400 μm",
              "宏孔几十至上百 μm，微孔 &lt;0.5 μm",
              "VOF、LB"
            ],
            [
              "**微孔层 MPL**",
              "厚 10–100 μm",
              "微孔 &lt;500 nm，宏观裂缝 5–15 μm",
              "LB 为主"
            ],
            [
              "**催化层 CL**",
              "厚 5–10 μm",
              "孔约 100 nm",
              "LB + 表面反应"
            ]
          ]
        },
        {
          "type": "p",
          "text": "看表就明白：不是哪种方法更高级，而是你的孔有多大、Kn 落在哪一格。（p.122）"
        }
      ]
    },
    {
      "id": "4.2",
      "title": "4.2 流道内的模拟",
      "blocks": [
        {
          "type": "p",
          "text": "流道是全书最上镜的地方：一滴水在气流里长出来、被吹歪、拉成条、糊成膜。可它偏偏最难算。（p.122）"
        },
        {
          "type": "p",
          "text": "难在三处。界面一直在动，形状还会剧烈变形；两相物性差几百倍，界面附近极易失稳；流速一高，还会出现湍流。（p.124）"
        },
        {
          "type": "p",
          "text": "所以这一节分三条线走：宏观方法怎么抓住界面（4.2.2），LB 凭什么更擅长界面（4.2.3），真出现湍流又怎么办（4.2.4）。"
        },
        {
          "type": "callout",
          "kind": "tip",
          "title": "三条线不是三个备选",
          "text": "别把这三条线当成三个可以随便挑的工具。顺序是递进的：先用宏观方法拿到液滴的整体行为，再用 LB 看界面附近的细节，只有当你关心湍流撕裂时才上 DNS。工具选错，算力白烧，结论还未必可信。（p.124）"
        }
      ]
    },
    {
      "id": "4.2.1",
      "title": "4.2.1 流动现象概述",
      "blocks": [
        {
          "type": "p",
          "text": "阴极流道里的水有两个来源。一是水蒸气分压超过当地饱和蒸气压，在壁面凝成液滴；二是催化层生成的水被毛细压力推着，穿过微孔层和扩散层，从孔口挤出来。（p.122–123）"
        },
        {
          "type": "p",
          "text": "挤出来以后就是一道力学题：迎风面和背风面的压差、气流的剪切力，对上液滴在三相线处的表面张力 σ_lg、σ_sg、σ_sl。（p.123）"
        },
        {
          "type": "h3",
          "text": "液滴的四种结局"
        },
        {
          "type": "list",
          "ordered": true,
          "items": [
            "气流不够强：液滴被孔口钉住，越长越大，最后连到上壁面或侧壁，形成柱状流，把流道局部堵死，压降陡增。",
            "继续长大成膜：水膜盖住扩散层表面的孔，反应气体进不去。",
            "气流够强：液滴挣脱孔口，沿底壁往出口爬，沿途还可能和别的液滴聚并。",
            "聚并之后再回到前两种结局。"
          ]
        },
        {
          "type": "p",
          "text": "注意后两个坏结局的共同点：不是“流道里有水”，而是水把气体的入口盖住了。这才是水淹真正伤性能的方式。（p.123）"
        },
        {
          "type": "callout",
          "kind": "warn",
          "title": "阳极不是“顺便吹干”就行",
          "text": "氢气的密度和黏度都远小于空气，同样流速下施加在液滴上的剪切力小得多，正常工况下单纯吹扫很难把阳极流道吹干。而阴极先淹，浓度差引起的回流还会把水送到阳极。（p.122）"
        },
        {
          "type": "p",
          "text": "还有一层变量：湍流。极限电流密度已超过 3 A·cm⁻²，大功率电堆要求空气流速很高；三维流场的脊和挡板又会在扩散层表面刮出涡。湍流的多尺度撕裂让液滴碎得不规则，模拟难度再上一档。（p.123）"
        }
      ]
    },
    {
      "id": "4.2.2",
      "title": "4.2.2 宏观数值方法对运动界面的处理",
      "blocks": [
        {
          "type": "p",
          "text": "宏观方法抓界面只有两条路。要么把界面当成一条真实存在、会动的边界，网格跟着它走，这叫界面追踪（front tracking）；要么定义一个标量场，让它的等值面顺便代表界面，这叫界面捕捉（front capturing）。（p.124）"
        },
        {
          "type": "table",
          "head": [
            "对比项",
            "界面追踪",
            "界面捕捉"
          ],
          "rows": [
            [
              "界面在哪",
              "显式的网格面或标记点",
              "标量场的等值面"
            ],
            [
              "守恒性",
              "好",
              "VOF 好，Level-Set 差"
            ],
            [
              "高维复杂度",
              "高，还要处理界面重连",
              "低，天然处理合并与破碎"
            ],
            [
              "代表方法",
              "front tracking",
              "Level-Set、VOF（PLIC）"
            ],
            [
              "软肋",
              "拓扑变化难",
              "数值耗散会把界面抹厚"
            ]
          ]
        },
        {
          "type": "p",
          "text": "Level-Set 由 Osher 在 1988 年提出。它把界面写成 φ=0 的等值面，法向和曲率都能直接对 φ 求导，所以表面张力好算，界面的合并与破碎也不用特殊处理。代价是每步都要把 φ 重新初始化成距离函数，这一步会抹掉尖锐界面，宏观量不守恒。（p.124–125）"
        },
        {
          "type": "key",
          "title": "界面捕捉",
          "text": "不解界面本身，解一个标量场：VOF 用体积分数 γ，Level-Set 用带符号距离 φ，界面就是 γ=0.5 或 φ=0 的等值面。好处是不用改网格；代价是界面被数值耗散抹厚，位置精度不如追踪法。"
        },
        {
          "type": "p",
          "text": "流体体积法（volume of fluid, VOF）走另一条：只记每个格子被液相占了多少，也就是体积分数 γ。守恒性好、存储省，但 γ 只给比例、不给位置，最早的 VOF 根本画不清界面形状。（p.125）"
        },
        {
          "type": "key",
          "title": "PLIC 界面重构",
          "text": "分段线性界面计算：在界面格子里用一条直线切下去，斜率由相邻格子的 γ 梯度估计。重构分辨率高、误差小，Fluent、Flow-3D、Gerris 的 VOF 模块配的都是它。"
        },
        {
          "type": "p",
          "text": "现在主流就是 PLIC。它把“一格一个数”变成了“一格里一条线”，界面才有形状可言。（p.125）"
        },
        {
          "type": "formula",
          "html": "<span class=\"fr\"><span class=\"nu\">∂γ<sub>l</sub></span><span class=\"de\">∂<i>t</i></span></span> + ∇·(γ<sub>l</sub><i>u</i>) = 0",
          "note": "式(4-3)　γ_l 是液相体积分数（无量纲，0–1），u 是速度矢量（m·s⁻¹），∇· 是散度。γ 被速度场带着走，界面就出现在它从 0 变到 1 的地方。"
        },
        {
          "type": "formula",
          "html": "ρ(<span class=\"fr\"><span class=\"nu\">∂<i>u</i></span><span class=\"de\">∂<i>t</i></span></span> + <i>u</i>·∇<i>u</i>) = −∇<i>P</i> + ∇·[μ(∇<i>u</i> + ∇<i>u</i><sup>T</sup>)] + ρ<i>g</i> + σκ∇γ<sub>l</sub>",
          "note": "式(4-2)　ρ 密度（kg·m⁻³），μ 动力黏度（Pa·s），P 静压（Pa），u 速度，g 重力加速度。最后一项是表面张力：σ 为表面张力系数（N·m⁻¹），κ 为界面曲率（m⁻¹），只在界面格子里非零。"
        },
        {
          "type": "formula",
          "html": "ρ = γ<sub>v</sub>ρ<sub>v</sub> + γ<sub>l</sub>ρ<sub>l</sub>，　μ = γ<sub>v</sub>μ<sub>v</sub> + γ<sub>l</sub>μ<sub>l</sub>，　γ<sub>v</sub> + γ<sub>l</sub> = 1",
          "note": "式(4-4)之后　下标 l 液相、v 气相，ρ、μ 是混合物的等效密度与黏度。界面格子只是两相的加权平均，γ=0.5 的格子既不像水也不像气。"
        },
        {
          "type": "p",
          "text": "曲率 κ 是 γ 的二阶导数。界面只有一两个格子厚，差分会把误差放大好几倍。κ 算歪了，表面张力就指错方向，界面附近凭空冒出小涡——这就是寄生流（spurious currents），文献里也叫虚假速度。（p.125、p.133）"
        },
        {
          "type": "figure",
          "svg": "<svg viewBox=\"0 0 640 320\">\n  <defs><marker id=\"ch4a2\" markerWidth=\"8\" markerHeight=\"8\" refX=\"6\" refY=\"3\" orient=\"auto\"><path d=\"M0,0 L6,3 L0,6 z\" fill=\"var(--water)\"/></marker></defs>\n  <rect x=\"40\" y=\"64\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.55\" stroke=\"var(--line)\"/><text x=\"66\" y=\"94\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">1.00</text><rect x=\"92\" y=\"64\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.55\" stroke=\"var(--line)\"/><text x=\"118\" y=\"94\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">1.00</text><rect x=\"144\" y=\"64\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.33\" stroke=\"var(--line)\"/><text x=\"170\" y=\"94\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.55</text><rect x=\"40\" y=\"116\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.55\" stroke=\"var(--line)\"/><text x=\"66\" y=\"146\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">1.00</text><rect x=\"92\" y=\"116\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.41\" stroke=\"var(--line)\"/><text x=\"118\" y=\"146\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.72</text><rect x=\"144\" y=\"116\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.10\" stroke=\"var(--line)\"/><text x=\"170\" y=\"146\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.10</text><rect x=\"40\" y=\"168\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.29\" stroke=\"var(--line)\"/><text x=\"66\" y=\"198\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.48</text><rect x=\"92\" y=\"168\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.09\" stroke=\"var(--line)\"/><text x=\"118\" y=\"198\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.08</text><rect x=\"144\" y=\"168\" width=\"52\" height=\"52\" fill=\"var(--water)\" fill-opacity=\"0.05\" stroke=\"var(--line)\"/><text x=\"170\" y=\"198\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">0.00</text>\n  <polyline points=\"40,200 100,168 150,110 196,80\" fill=\"none\" stroke=\"var(--heat)\" stroke-width=\"2\"/>\n  <text x=\"40\" y=\"246\" font-size=\"11\" fill=\"var(--ink-2)\">格子里只有 γ：界面靠 PLIC 直线重构</text>\n  <text x=\"40\" y=\"266\" font-size=\"11\" fill=\"var(--ink-2)\">γ = 1 全液相，0 全气相</text>\n  <text x=\"336\" y=\"246\" font-size=\"11\" fill=\"var(--ink-2)\">曲率靠二阶差分 → 误差</text>\n  <text x=\"336\" y=\"266\" font-size=\"11\" fill=\"var(--ink-2)\">表面张力失配 → 界面附近假涡</text>\n  <circle cx=\"470\" cy=\"148\" r=\"54\" fill=\"var(--water)\" fill-opacity=\"0.16\" stroke=\"var(--water)\"/>\n  <path d=\"M418,118 Q430,100 452,96\" fill=\"none\" stroke=\"var(--water)\" marker-end=\"url(#ch4a2)\"/>\n  <path d=\"M522,118 Q510,100 488,96\" fill=\"none\" stroke=\"var(--water)\" marker-end=\"url(#ch4a2)\"/>\n  <path d=\"M418,178 Q430,196 452,200\" fill=\"none\" stroke=\"var(--water)\" marker-end=\"url(#ch4a2)\"/>\n  <path d=\"M522,178 Q510,196 488,200\" fill=\"none\" stroke=\"var(--water)\" marker-end=\"url(#ch4a2)\"/>\n  <text x=\"470\" y=\"152\" text-anchor=\"middle\" font-size=\"12\" fill=\"var(--ink)\">液滴</text>\n  <line x1=\"556\" y1=\"96\" x2=\"594\" y2=\"82\" stroke=\"var(--line)\"/>\n  <text x=\"596\" y=\"80\" text-anchor=\"end\" font-size=\"11\" fill=\"var(--water)\">寄生流</text>\n</svg>",
          "caption": "VOF 的两件事。左：界面格子只记一个体积分数，靠 PLIC 在格子里切线；右：曲率算不准时表面张力不再自平衡，界面附近冒出寄生流。（p.125–126）"
        },
        {
          "type": "example",
          "title": "算一算：一个界面格子有多“假”",
          "blocks": [
            {
              "type": "p",
              "text": "设某格子液相体积分数 γ_l = 0.3，其余是空气。取 ρ_l = 998 kg·m⁻³、ρ_v = 1.2 kg·m⁻³，μ_l = 1.0×10⁻³ Pa·s、μ_v = 1.8×10⁻⁵ Pa·s。"
            },
            {
              "type": "formula",
              "html": "ρ = 0.7×1.2 + 0.3×998 = 300.2 kg·m⁻³，　μ = 0.7×1.8×10⁻⁵ + 0.3×1.0×10⁻³ = 3.1×10⁻⁴ Pa·s",
              "note": "式(4-4)后的混合物性　ρ、μ 是格子里的等效密度与黏度，下标 l 液相、v 气相。算出来的密度 300，既不是水也不是空气。"
            },
            {
              "type": "p",
              "text": "这个格子既不和水（998）一样，也不和空气（1.2）一样，而是某种“密度 300 的流体”。黏度同样不真实。"
            },
            {
              "type": "p",
              "text": "所以 VOF 的界面必须压在 1–2 个格子里，压得越薄越像真的。界面一糊到 5 个格子，中间格的 γ 可能只有 0.1–0.2，动量方程等于在算另一种物质；曲率再一误差，液滴就会自己抖起来。"
            }
          ]
        },
        {
          "type": "p",
          "text": "所以流道里的 VOF 对网格极其敏感：网格粗一点，界面糊成三格，曲率更不准，寄生流更大，液滴甚至可能“自己”动起来。你看到的速度里，有一部分是假的。（p.125）"
        },
        {
          "type": "p",
          "text": "第二个坑在壁面。接触线附近的曲率由壁面法向决定，法向又由接触角决定。静态接触角模型把 θ 当常数，只对静止的球冠准确；液滴一变形就露馅。（p.126–127）"
        },
        {
          "type": "formula",
          "html": "σ<sub>lg</sub>cosθ<sub>s</sub> = σ<sub>sg</sub> − σ<sub>sl</sub>，　Ca = <span class=\"fr\"><span class=\"nu\">μ<i>U</i><sub>cl</sub></span><span class=\"de\">σ</span></span>",
          "note": "式(4-7)　σ_lg、σ_sg、σ_sl 是气-液、固-气、固-液界面张力（N·m⁻¹），θ_s 是静态接触角（°）。右边 Ca 是毛细数：μ 液体动力黏度，U_cl 接触线速度（m·s⁻¹），σ 表面张力系数；Ca 越小越接近平衡。"
        },
        {
          "type": "p",
          "text": "真实情况是迟滞：液滴起动前先变形，接触线有前进角和后退角，静态角夹在中间。于是有了动态接触角，用毛细数 Ca 把接触线速度和角度连起来。Kistler 的 Hoffman 函数和 OpenFOAM 的 tanh 模型是两种常见写法。（p.128–129）"
        },
        {
          "type": "formula",
          "html": "θ<sub>d</sub> = θ<sub>s</sub> + (θ<sub>a</sub> − θ<sub>r</sub>)tanh(<span class=\"fr\"><span class=\"nu\"><i>U</i><sub>cl</sub></span><span class=\"de\"><i>U</i><sub>θ</sub></span></span>)",
          "note": "式(4-10)　θ_d 动态接触角（°），θ_s 静态接触角，θ_a、θ_r 是实验测出的前进角与后退角（上下界）；U_cl 接触线速度（m·s⁻¹），U_θ 是可调参考速度，用来和实验对齐。"
        },
        {
          "type": "callout",
          "kind": "tip",
          "title": "看别人的液滴图，先问三件事",
          "text": "接触角是静态还是动态、用没用 PLIC 重构、网格分辨率多少。三个答案不同，图里的液滴形状和脱离时刻就不同。（p.129）"
        }
      ]
    },
    {
      "id": "4.2.3",
      "title": "4.2.3 格子玻尔兹曼方法在流道中的应用",
      "blocks": [
        {
          "type": "h3",
          "text": "1. 两个动作：碰撞与迁移"
        },
        {
          "type": "p",
          "text": "换个世界观。LB 不问“界面上压强多少”，它问“在这个格点上，朝 19 个离散方向跑的粒子各有多少”（二维取 9 个）。这个“多少”就是分布函数 f。（p.129）"
        },
        {
          "type": "p",
          "text": "每一步只做两件事：碰撞，让 f 往平衡态靠；迁移，让 f 沿自己的速度方向走到隔壁格子。一直重复，宏观量从 f 的求和里读出来。（p.130）"
        },
        {
          "type": "formula",
          "html": "f<sub>α</sub>(<i>x</i> + <i>e</i><sub>α</sub>Δ<i>t</i>, <i>t</i> + Δ<i>t</i>) = f<sub>α</sub>(<i>x</i>, <i>t</i>) − <span class=\"fr\"><span class=\"nu\">1</span><span class=\"de\">τ</span></span>[f<sub>α</sub>(<i>x</i>, <i>t</i>) − f<sub>α</sub><sup>eq</sup>(<i>x</i>, <i>t</i>)] + <i>F</i><sub>α</sub>",
          "note": "式(4-11)　f_α 是沿第 α 个离散方向 e_α 的分布函数，x 位置，t 时间，Δt 时间步，τ 无量纲松弛时间，f_α^eq 平衡态，F_α 外力项。左边迁移，右边碰撞。"
        },
        {
          "type": "formula",
          "html": "f<sub>α</sub><sup>eq</sup> = ω<sub>α</sub>ρ[1 + <span class=\"fr\"><span class=\"nu\"><i>e</i><sub>α</sub>·<i>u</i></span><span class=\"de\"><i>c</i><sub>s</sub><sup>2</sup></span></span> + <span class=\"fr\"><span class=\"nu\">(<i>e</i><sub>α</sub>·<i>u</i>)<sup>2</sup></span><span class=\"de\">2<i>c</i><sub>s</sub><sup>4</sup></span></span> − <span class=\"fr\"><span class=\"nu\"><i>u</i><sup>2</sup></span><span class=\"de\">2<i>c</i><sub>s</sub><sup>2</sup></span></span>]",
          "note": "式(4-12)　ω_α 方向权重，ρ、u 当地密度与速度，c_s 格子声速。D2Q9 里 c_s = 1/√3（格子单位），ω₀ = 4/9、轴向 1/9、对角 1/36。"
        },
        {
          "type": "p",
          "text": "碰撞多快收敛到平衡，由一个数决定：松弛时间 τ。式(4-16)说明它其实就是黏度——τ 越大，流体越“稠”。（p.130–131）"
        },
        {
          "type": "formula",
          "html": "ν = <i>c</i><sub>s</sub><sup>2</sup>(τ − <span class=\"fr\"><span class=\"nu\">1</span><span class=\"de\">2</span></span>)",
          "note": "式(4-16)　ν 是运动黏度（m²·s⁻¹，格子单位下无量纲），τ 是松弛时间。τ = 0.5 时 ν = 0，模型直接崩；τ 越大越黏。工程上先把真实黏度换成格子黏度，再反解 τ。"
        },
        {
          "type": "key",
          "title": "松弛时间 τ",
          "text": "LB 里唯一的手调旋钮，同时决定黏度和稳定性：ν = c_s²(τ − 1/2)。τ 太接近 0.5 会发散，太大则过度耗散。通常先在 0.5–1 之间取值，再用 Δx、Δt 把格子黏度换算回真实黏度。"
        },
        {
          "type": "figure",
          "svg": "<svg viewBox=\"0 0 640 320\">\n  <defs><marker id=\"ch4a3\" markerWidth=\"8\" markerHeight=\"8\" refX=\"6\" refY=\"3\" orient=\"auto\"><path d=\"M0,0 L6,3 L0,6 z\" fill=\"var(--h2)\"/></marker></defs>\n  <line x1=\"196\" y1=\"56\" x2=\"196\" y2=\"264\" stroke=\"var(--line)\"/><line x1=\"196\" y1=\"56\" x2=\"404\" y2=\"56\" stroke=\"var(--line)\"/><line x1=\"248\" y1=\"56\" x2=\"248\" y2=\"264\" stroke=\"var(--line)\"/><line x1=\"196\" y1=\"108\" x2=\"404\" y2=\"108\" stroke=\"var(--line)\"/><line x1=\"300\" y1=\"56\" x2=\"300\" y2=\"264\" stroke=\"var(--line)\"/><line x1=\"196\" y1=\"160\" x2=\"404\" y2=\"160\" stroke=\"var(--line)\"/><line x1=\"352\" y1=\"56\" x2=\"352\" y2=\"264\" stroke=\"var(--line)\"/><line x1=\"196\" y1=\"212\" x2=\"404\" y2=\"212\" stroke=\"var(--line)\"/><line x1=\"404\" y1=\"56\" x2=\"404\" y2=\"264\" stroke=\"var(--line)\"/><line x1=\"196\" y1=\"264\" x2=\"404\" y2=\"264\" stroke=\"var(--line)\"/>\n  <circle cx=\"196\" cy=\"56\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"196\" cy=\"108\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"196\" cy=\"160\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"196\" cy=\"212\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"196\" cy=\"264\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"248\" cy=\"56\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"248\" cy=\"108\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"248\" cy=\"160\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"248\" cy=\"212\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"248\" cy=\"264\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"300\" cy=\"56\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"300\" cy=\"108\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"300\" cy=\"160\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"300\" cy=\"212\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"300\" cy=\"264\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"352\" cy=\"56\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"352\" cy=\"108\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"352\" cy=\"160\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"352\" cy=\"212\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"352\" cy=\"264\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"404\" cy=\"56\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"404\" cy=\"108\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"404\" cy=\"160\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"404\" cy=\"212\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/><circle cx=\"404\" cy=\"264\" r=\"2.5\" fill=\"var(--ink-2)\" fill-opacity=\"0.55\"/>\n  <line x1=\"300\" y1=\"160\" x2=\"352\" y2=\"160\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"352\" y2=\"108\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"300\" y2=\"108\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"248\" y2=\"108\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"248\" y2=\"160\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"248\" y2=\"212\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"300\" y2=\"212\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/><line x1=\"300\" y1=\"160\" x2=\"352\" y2=\"212\" stroke=\"var(--h2)\" stroke-width=\"1.6\" marker-end=\"url(#ch4a3)\"/>\n  <text x=\"372\" y=\"164\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e1</text><text x=\"372\" y=\"92\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e2</text><text x=\"300\" y=\"92\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e3</text><text x=\"228\" y=\"92\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e4</text><text x=\"228\" y=\"164\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e5</text><text x=\"228\" y=\"236\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e6</text><text x=\"300\" y=\"236\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e7</text><text x=\"372\" y=\"236\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e8</text>\n  <circle cx=\"300\" cy=\"160\" r=\"5\" fill=\"var(--heat)\"/>\n  <text x=\"300\" y=\"148\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--ink)\">e0</text>\n  <text x=\"430\" y=\"60\" font-size=\"11\" fill=\"var(--ink-2)\">静止 1 + 轴向 4 + 对角 4</text>\n  <text x=\"40\" y=\"286\" font-size=\"11\" fill=\"var(--ink-2)\">ω₀ = 4/9 静止 · ω₁₋₄ = 1/9 轴向 · ω₅₋₈ = 1/36 对角</text>\n  <text x=\"40\" y=\"40\" font-size=\"11\" fill=\"var(--ink-2)\">每步：先碰撞（趋向平衡态），再迁移（沿 e 走一格）</text>\n</svg>",
          "caption": "D2Q9 格子：1 个静止方向 + 4 个轴向 + 4 个对角，共 9 个离散速度。权重 ω 决定每个方向分到多少平衡分布。（p.130）"
        },
        {
          "type": "h3",
          "text": "2. 多相从哪来"
        },
        {
          "type": "p",
          "text": "Shan-Chen 的办法最省事：给每一相定义一个伪势 ψ(ρ)，让相邻格点的 ψ 互相吸引。引力够强，气液自己就分开了，根本不用追界面。（p.131）"
        },
        {
          "type": "key",
          "title": "伪势（Shan-Chen 模型）",
          "text": "给每个组分或相定义一个伪势 ψ(ρ)，相邻格点的 ψ 相互吸引。作用力强度超过临界值，不同相就自动分离。壁面可湿性靠一个“假想密度”加流固强度参数调节，等价于调接触角。"
        },
        {
          "type": "p",
          "text": "引力怎么塞进方程，有三种流派：速度滑移、Guo、EDM。差别很实在——谁更稳、谁热力学更自洽、以及“调黏度会不会把密度带歪”。（p.132–133）"
        },
        {
          "type": "list",
          "ordered": true,
          "items": [
            "速度滑移最简单，但 τ 一动，密度分布和表面张力跟着变，三个量绑死在一起。",
            "Guo 的热力学一致性最好，可稳定温度范围最窄。",
            "EDM 在 τ&lt;1 时更稳，τ&gt;1 时反过来，且黏度不会污染密度。"
          ]
        },
        {
          "type": "h3",
          "text": "3. 流道里的三道坎"
        },
        {
          "type": "p",
          "text": "第一道坎是物性。空气-水密度比约 836、黏度比约 51，原始 Shan-Chen 只能做到很低的密度比，界面附近还有明显虚假速度，表面张力也没法独立于密度比调。（p.133）"
        },
        {
          "type": "p",
          "text": "第二道坎是边界。很多文献把进出口设成周期边界，再给个体积力推着液滴跑。数值上稳，但它不是压差驱动，也不是固定流速进气，真实流道不这么工作。（p.134）"
        },
        {
          "type": "p",
          "text": "第三道坎是验证。模型改了好几轮，多数还停留在单组分或静态工况，真正和流道实验对上的并不多。（p.134）"
        },
        {
          "type": "callout",
          "kind": "warn",
          "title": "看到漂亮的液滴穿越动画，先翻方法部分",
          "text": "如果写的是周期边界 + 体积力，它验证的是“液滴在均匀气流里怎么变形”，不是“给定压降下流道怎么排水”。这两个问题不能互相替代。（p.134）"
        },
        {
          "type": "example",
          "title": "算一算：τ 怎么和真实黏度对上",
          "blocks": [
            {
              "type": "p",
              "text": "取格子单位 Δx = Δt = 1，c_s² = 1/3。想模拟室温水的运动黏度 ν = 1.0×10⁻⁶ m²·s⁻¹，网格取 1 μm。"
            },
            {
              "type": "p",
              "text": "先定 τ = 0.8，由式(4-16)得格子黏度：ν_lattice = (1/3)×(0.8 − 0.5) = 0.1。"
            },
            {
              "type": "formula",
              "html": "ν<sub>lattice</sub> = <span class=\"fr\"><span class=\"nu\">ν<sub>phys</sub>Δ<i>t</i></span><span class=\"de\">Δ<i>x</i><sup>2</sup></span></span> ⇒ Δ<i>t</i> = <span class=\"fr\"><span class=\"nu\">ν<sub>lattice</sub>Δ<i>x</i><sup>2</sup></span><span class=\"de\">ν<sub>phys</sub></span></span> = <span class=\"fr\"><span class=\"nu\">0.1×(10<sup>−6</sup>)<sup>2</sup></span><span class=\"de\">10<sup>−6</sup></span></span> = 1×10<sup>−7</sup> s",
              "note": "单位换算　ν_lattice 格子黏度，ν_phys 物理黏度（m²·s⁻¹），Δx 网格步长（m），Δt 时间步（s）。Δx = 1 μm 时，一个时间步只有 0.1 μs。"
            },
            {
              "type": "p",
              "text": "一步 0.1 μs，想算 0.1 s 的排水过程就是一百万步。这就是为什么 LB 的加速几乎全靠并行和 GPU。"
            }
          ]
        }
      ]
    },
    {
      "id": "4.2.4",
      "title": "4.2.4 流道内的湍流流动模拟",
      "blocks": [
        {
          "type": "p",
          "text": "湍流是另一套麻烦。k-ε 只给平均量，大涡模拟（LES）只解大涡，都抓不住“液滴被哪个涡撕开”这种瞬时细节。直接数值模拟（DNS）干脆直接解 NS 方程，不引入任何湍流模型。（p.134–135）"
        },
        {
          "type": "p",
          "text": "好处很硬：NS 方程本身是封闭的，不需要模型参数，是目前唯一能给出真实湍流全场信息的方法。代价全在网格上。（p.135）"
        },
        {
          "type": "formula",
          "html": "η = (<span class=\"fr\"><span class=\"nu\">ν<sup>3</sup></span><span class=\"de\">ε</span></span>)<sup>1/4</sup>，　ε ≈ <span class=\"fr\"><span class=\"nu\"><i>u</i><sub>p</sub><sup>3</sup></span><span class=\"de\"><i>L</i></span></span>，　<i>N</i><sup>3</sup> ≳ Re<sub>p</sub><sup>9/4</sup>",
          "note": "式(4-22)之前　η 是最小涡尺度（Kolmogorov 尺度，m），ε 是湍动能耗散率（m²·s⁻³），u_p 是脉动速度均方根（m·s⁻¹），L 是积分尺度（m），N 是单方向格点数。最小涡定网格步长、最大涡定计算域，N³ 就被 Re_p 的 9/4 次方锁死。"
        },
        {
          "type": "p",
          "text": "最小涡是 Kolmogorov 尺度 η，最大涡是积分尺度 L，两头的条件写成 Δx ≤ η、NΔx ≥ L，网格数就只能跟着雷诺数涨。（p.135）"
        },
        {
          "type": "example",
          "title": "算一算：DNS 到底要吃多少格子",
          "blocks": [
            {
              "type": "p",
              "text": "书上的例子：流动雷诺数 Re = 40000，对应的脉动雷诺数 Re_p ≈ 2000。"
            },
            {
              "type": "formula",
              "html": "<i>N</i><sup>3</sup> ≳ Re<sub>p</sub><sup>9/4</sup> = 2000<sup>2.25</sup> ≈ 2.7×10<sup>7</sup>",
              "note": "代入 Re_p　N 是单方向格点数，总格点数约为 N³。两千万量级，还只是“最低要求”。"
            },
            {
              "type": "p",
              "text": "两千万个格点，每个还要存好几个分布函数、推进几万步，普通工作站直接放弃。"
            },
            {
              "type": "p",
              "text": "反过来算：Re_p 只有 200 时，200 的 2.25 次方约 1.5×10⁵，一台笔记本就能跑。燃料电池流道的 Re 常在几千，所以 DNS 在这里可行——不是 DNS 变便宜了，是场景的 Re 够低。"
            }
          ]
        },
        {
          "type": "p",
          "text": "这就是为什么 DNS 长期只算圆管和槽道。好消息是燃料电池流道的湍流雷诺数不高，最高一般几千，还在能接受的范围里。（p.135）"
        },
        {
          "type": "p",
          "text": "壁湍流还有自己的速度尺度：壁面摩擦速度 u_τ，以及摩擦雷诺数 Re_τ。它和流动雷诺数的比值就是 u_τ/u_f。（p.135）"
        },
        {
          "type": "formula",
          "html": "<i>u</i><sub>τ</sub><sup>2</sup> = −<span class=\"fr\"><span class=\"nu\"><i>H</i></span><span class=\"de\">4</span></span>·<span class=\"fr\"><span class=\"nu\">d<i>P</i></span><span class=\"de\">d<i>x</i></span></span>，　Re<sub>τ</sub> = <span class=\"fr\"><span class=\"nu\"><i>u</i><sub>τ</sub><i>H</i></span><span class=\"de\">ν</span></span>",
          "note": "式(4-22)　u_τ 壁面摩擦速度（m·s⁻¹），H 流道宽度（m），dP/dx 流向压力梯度（Pa·m⁻¹），ν 运动黏度，Re_τ 摩擦雷诺数。压力梯度越大，u_τ 越大，贴壁的涡越细，网格越贵。"
        },
        {
          "type": "p",
          "text": "两相 DNS 最难的是入口。做法是先算单相湍流，等它充分发展，把那个速度场当入口，再放液滴进去。结论挺直观：液滴要碎，得同时有湍流和足够大的尺寸，位置也有关系——靠流道中心更容易碎。（p.136）"
        }
      ]
    },
    {
      "id": "4.3",
      "title": "4.3 多孔介质内的模拟",
      "blocks": [
        {
          "type": "p",
          "text": "从毫米走进微米，工具得换。宏观模型把扩散层当成各向同性多孔材料，只用孔隙率、有效扩散系数、渗透率、热导率几个数概括它。（p.138）"
        },
        {
          "type": "list",
          "ordered": true,
          "items": [
            "均匀化假设丢掉了千差万别的微观结构，孔隙尺度的传热传质根本看不见。",
            "结构参数和流动参数的关系靠经验公式，这些公式受实验条件限制，覆盖面窄、成本还高。",
            "孔隙尺度下的微尺度效应和滑移效应，和宏观尺度完全不是一回事。"
          ]
        },
        {
          "type": "p",
          "text": "一句话：宏观模型能算“这块材料平均怎么样”，算不出“这个孔里水怎么走”。（p.138）"
        },
        {
          "type": "p",
          "text": "所以路线是：先造结构（4.3.2），再选工具——孔大的用 VOF（4.3.3），孔小到纳米的用 LB（4.3.4）。"
        }
      ]
    },
    {
      "id": "4.3.1",
      "title": "4.3.1 多孔介质内物理问题概述",
      "blocks": [
        {
          "type": "p",
          "text": "先看清一幅图景。阴极催化层里，碳载体、电解质和铂颗粒凑成三相界面；质子从膜来，电子从骨架来，氧气从孔隙来，在这里合成水、放出热。（p.137）"
        },
        {
          "type": "p",
          "text": "生成的水一部分被膜吸收成膜态水，在浓差、压差和电渗拖拽下跨膜；剩下的穿过多孔层流向流道，被气流带走。热也一样：一部分自加热，剩下的靠冷却流道、尾排和壁面散掉。（p.137）"
        },
        {
          "type": "p",
          "text": "理想平衡一破，就是工程问题。水排不及时，孔堵、流道堵；热排不及时，温度飙升、寿命骤降。水热管理的全部复杂性都藏在这两句话里。（p.137–138）"
        },
        {
          "type": "callout",
          "kind": "think",
          "title": "想想看",
          "text": "同一块扩散层，如果孔隙率从 0.8 降到 0.6，毛细压力会怎么变、液态水的突破压差会怎么变？宏观模型只能给你一个经验系数；孔隙尺度模拟能真的把水推进去，看它从哪个孔出来。"
        }
      ]
    },
    {
      "id": "4.3.2",
      "title": "4.3.2 多孔介质微观结构重构",
      "blocks": [
        {
          "type": "p",
          "text": "重构只有两条路：X 射线断层扫描（X-CT）和随机重建。前者拍真实材料，后者用程序“长”出统计上像的材料。（p.138）"
        },
        {
          "type": "table",
          "head": [
            "对比项",
            "X-CT 重构",
            "随机重建"
          ],
          "rows": [
            [
              "结构真实性",
              "高，就是这块材料",
              "统计特征相近，细节随机"
            ],
            [
              "能否单变量",
              "不能，换材料所有参数都变",
              "能，孔隙率、PTFE 含量逐个调"
            ],
            [
              "成本",
              "高，要样品还要机时",
              "低，纯程序"
            ],
            [
              "适合",
              "实验验证、特定材料",
              "结构参数影响研究"
            ]
          ]
        },
        {
          "type": "p",
          "text": "选法很简单。要研究“孔隙率从 0.6 降到 0.5 会怎样”，只能用随机重建，因为 CT 换一块材料所有参数都变了；要验证实验或只关心某块真实材料，才用 CT。（p.139）"
        },
        {
          "type": "h3",
          "text": "1. 扩散层：纤维 + PTFE"
        },
        {
          "type": "p",
          "text": "扩散层（gas diffusion layer, GDL）是碳纤维一层层叠起来再压实的。厚 150–400 μm，纤维直径约 7 μm。孔分两种：小于 0.5 μm 的微孔走气，几十到上百微米的宏孔走水。表面还要疏水处理，接触角 100°–150°。（p.140）"
        },
        {
          "type": "p",
          "text": "重建就四步：平面内随机撒点连线，当纤维中心线；把线膨胀成直径 7 μm 的圆柱；重复到这一层孔隙率达标；叠够层数到目标厚度。书末附录有 C 语言代码，你可以改参数直接玩。（p.140–141）"
        },
        {
          "type": "figure",
          "svg": "<svg viewBox=\"0 0 640 320\">\n  <rect x=\"60\" y=\"58\" width=\"520\" height=\"200\" fill=\"none\" stroke=\"var(--line)\"/>\n  <circle cx=\"100\" cy=\"86\" r=\"22\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"393\" cy=\"129\" r=\"22\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"552\" cy=\"185\" r=\"22\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"167\" cy=\"215\" r=\"23\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"458\" cy=\"112\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"195\" cy=\"115\" r=\"24\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"494\" cy=\"209\" r=\"16\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"306\" cy=\"192\" r=\"19\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"217\" cy=\"139\" r=\"25\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"494\" cy=\"146\" r=\"20\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"470\" cy=\"110\" r=\"17\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"235\" cy=\"140\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"541\" cy=\"153\" r=\"23\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"191\" cy=\"149\" r=\"25\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"469\" cy=\"130\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"482\" cy=\"188\" r=\"16\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"362\" cy=\"98\" r=\"23\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"273\" cy=\"188\" r=\"18\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"265\" cy=\"143\" r=\"20\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"528\" cy=\"148\" r=\"15\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"204\" cy=\"104\" r=\"22\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"89\" cy=\"126\" r=\"18\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"282\" cy=\"116\" r=\"24\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"310\" cy=\"164\" r=\"24\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"373\" cy=\"188\" r=\"15\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"345\" cy=\"150\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"397\" cy=\"127\" r=\"20\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"533\" cy=\"114\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"510\" cy=\"174\" r=\"15\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"457\" cy=\"231\" r=\"20\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"175\" cy=\"168\" r=\"22\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"490\" cy=\"169\" r=\"23\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"126\" cy=\"222\" r=\"16\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"200\" cy=\"151\" r=\"24\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"231\" cy=\"211\" r=\"18\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"90\" cy=\"132\" r=\"23\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"363\" cy=\"211\" r=\"18\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"89\" cy=\"122\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"314\" cy=\"181\" r=\"25\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/><circle cx=\"405\" cy=\"103\" r=\"21\" fill=\"var(--ink-2)\" fill-opacity=\"0.22\" stroke=\"var(--ink-2)\"/>\n  <ellipse cx=\"430\" cy=\"180\" rx=\"34\" ry=\"26\" fill=\"none\" stroke=\"var(--water)\" stroke-dasharray=\"5 4\"/>\n  <text x=\"430\" y=\"184\" text-anchor=\"middle\" font-size=\"11\" fill=\"var(--water)\">孔隙</text>\n  <line x1=\"146\" y1=\"60\" x2=\"112\" y2=\"72\" stroke=\"var(--line)\"/>\n  <text x=\"60\" y=\"44\" font-size=\"11\" fill=\"var(--ink)\">灰圆 = 固体骨架</text>\n  <text x=\"60\" y=\"288\" font-size=\"11\" fill=\"var(--ink-2)\">LB 拿到的只是数字矩阵：1 = 固体，0 = 流体</text>\n  <text x=\"60\" y=\"308\" font-size=\"11\" fill=\"var(--ink-2)\">不需要贴体网格，也不需要重新生成几何</text>\n</svg>",
          "caption": "随机堆积的多孔介质截面。灰圆是固体骨架，空白是孔隙；LB 拿到的就是这样一个 0/1 数字矩阵，不需要贴体网格。（p.141、p.153）"
        },
        {
          "type": "p",
          "text": "聚四氟乙烯（PTFE）的分布比纤维更阴险。同样浸渍，空气干燥会让 PTFE 堆在一侧——水在毛细力下带着它往上跑；真空干燥则沿厚度均匀。这直接改变孔隙率沿厚度的曲线，也改变水从哪一侧突破。（p.142–144）"
        },
        {
          "type": "h3",
          "text": "2. 微孔层与催化层"
        },
        {
          "type": "p",
          "text": "微孔层（micro porous layer, MPL）厚 10–100 μm，孔隙率 30%–50%，碳球 10–100 nm。它有两套孔：小于 500 nm 的微孔只走气，5–15 μm 的宏观裂缝才是液态水的主通道。所以重建微孔层时可以只画裂缝，省一大笔算力。（p.145–146）"
        },
        {
          "type": "p",
          "text": "催化层（catalyst layer, CL）最难：厚 5–10 μm，铂颗粒 2–5 nm，碳载体 10–100 nm，孔只有 100 nm 左右。三种相——孔、电子相、电解质相——都得摆对位置。（p.147）"
        },
        {
          "type": "key",
          "title": "QSGS 方法",
          "text": "四参数随机生长法：先按概率撒生长核，再让各相以给定概率向相邻格点生长，直到达到目标体积分数。多个相依次长，后长的相要“抢地盘”时用条件概率控制。特别适合重建催化层这种多相多孔结构。"
        },
        {
          "type": "p",
          "text": "QSGS 的思路就是“种子 + 生长”。碳载体先长，铂粉限制在碳载体相邻格点上（保证有效接触），电解质最后长，还要保证连通。（p.147–149）"
        },
        {
          "type": "formula",
          "html": "γ<sub>Pt</sub> = ε<sub>Pt</sub>ρ<sub>Pt</sub>δ",
          "note": "式(4-30)　γ_Pt 铂载量（mg·cm⁻²），ε_Pt 铂体积分数，ρ_Pt 铂密度，δ 催化层厚度。铂载量要求相同时，厚度减半就得把体积分数加倍。"
        },
        {
          "type": "p",
          "text": "重建的代价是网格。书里的算例：2000×200×200 nm 的催化层，用 2 nm 的格子就是 1000×100×100。（p.149–150）"
        },
        {
          "type": "example",
          "title": "算一算：跨尺度到底差多少",
          "blocks": [
            {
              "type": "p",
              "text": "催化层重建域 2000 nm × 200 nm × 200 nm，网格 2 nm："
            },
            {
              "type": "formula",
              "html": "1000 × 100 × 100 = 1.0×10<sup>7</sup> 个格点",
              "note": "网格量　一千万个格点，才只是 2 μm 宽的一小块催化层。"
            },
            {
              "type": "p",
              "text": "想分辨 2–5 nm 的铂颗粒，格子还得降到 1 nm，格点数立刻变成 8 倍，也就是 8×10⁷。"
            },
            {
              "type": "p",
              "text": "而流道是毫米级，和铂颗粒差 6 个数量级。没人用一个模型算完整个电池，只能分区、分工具，在交界面上交换边界条件——这就是“多尺度结构很难在同一尺度模型中同时考虑”。（p.121）"
            }
          ]
        }
      ]
    },
    {
      "id": "4.3.3",
      "title": "4.3.3 VOF 方法在多孔介质内的应用",
      "blocks": [
        {
          "type": "p",
          "text": "VOF 能进多孔介质吗？能，但只到扩散层这一级。扩散层孔直径几十微米，Kn 远小于 0.01，连续介质假设还站得住。（p.151）"
        },
        {
          "type": "example",
          "title": "算一算：Kn 到底卡在哪",
          "blocks": [
            {
              "type": "p",
              "text": "常温常压空气的分子平均自由程 λ ≈ 68 nm。Kn = λ/d，d 是孔径。"
            },
            {
              "type": "formula",
              "html": "Kn = <span class=\"fr\"><span class=\"nu\">λ</span><span class=\"de\">d</span></span>",
              "note": "克努森数定义　λ 是分子平均自由程，d 是流动的特征长度（这里取孔径）。"
            },
            {
              "type": "p",
              "text": "扩散层宏孔 d = 50 μm：Kn = 68 nm ÷ 50 μm ≈ 1.4×10⁻³，远小于 0.01，连续介质成立，VOF 可以用。"
            },
            {
              "type": "p",
              "text": "催化层孔 d = 100 nm：Kn ≈ 0.68，早过了 0.1，气体已经“感觉不到”壁面是连续的，宏观方程失效。"
            },
            {
              "type": "p",
              "text": "同一条判据，把 VOF 和 LB 的适用边界切得干干净净。"
            }
          ]
        },
        {
          "type": "p",
          "text": "用 VOF 算扩散层有几个实操要点：网格要细到边界不出现明显锯齿；导入后孔隙是流体区，纤维和流道脊是固体区；不关心传热和电子传输时，固体格子不参与迭代，只当边界。（p.151–152）"
        },
        {
          "type": "p",
          "text": "有个漂亮的结果：流道和扩散层之间的交叉流动（cross flow）。四条路径——沿流道走、流道间横穿、从底部渗入流向邻道、从底部直接进本道。（p.152）"
        },
        {
          "type": "p",
          "text": "规律也符合直觉：高压流道压差大，靠近脊的液滴更容易穿下去；扩散层越疏水，毛细阻力越大，水越难突破；加大邻道压差（比如加长蛇形流道）能促进交叉流动。（p.152）"
        },
        {
          "type": "callout",
          "kind": "warn",
          "title": "微孔层和催化层不要用 VOF",
          "text": "孔只有几十到一百纳米，Kn 上去了，连续性假设失效；而且相变常被忽略或按固定速率处理，电化学也只是 Butler-Volmer 源项，微观机理进不去。（p.153）"
        }
      ]
    },
    {
      "id": "4.3.4",
      "title": "4.3.4 格子玻尔兹曼方法在多孔介质内的应用",
      "blocks": [
        {
          "type": "p",
          "text": "轮到 LB 上场。它在多孔介质里有三块地盘：预测有效物性（渗透率、有效扩散系数、热导率）、算孔隙尺度的水热传输、算催化层里的电极动力学。（p.153）"
        },
        {
          "type": "h3",
          "text": "1. 反弹格式：无滑移的极简实现"
        },
        {
          "type": "key",
          "title": "反弹格式",
          "text": "粒子撞到固体格点后沿来路返回，速度统计平均为零，无滑移边界就这么实现了。半反弹把壁面放在格点之间，有二阶精度。它只看局部，不用贴体网格，所以特别适合各向异性、极不规则的骨架。"
        },
        {
          "type": "p",
          "text": "为什么 LB 天生适合多孔？几何在这里退化成一句判断：“这片格点是固体还是流体”。不用贴体网格，就不必为每个孔隙生成边界层网格——那正是 VOF 在多孔介质里最费时间的一步。（p.153–154）"
        },
        {
          "type": "p",
          "text": "更妙的是它只看邻居，天生适合并行；几何就是数字矩阵，CT 图像二值化后能直接喂进去。这就是它能从微米孔一路做到纳米孔的原因。（p.153）"
        },
        {
          "type": "h3",
          "text": "2. 先看谁在主导"
        },
        {
          "type": "p",
          "text": "多孔介质里反而更简单。先用四个无量纲数看看谁说了算：Re、Ca、Bo、We。（p.156）"
        },
        {
          "type": "formula",
          "html": "Re = <span class=\"fr\"><span class=\"nu\">ρ<sub>2</sub><i>u</i><sub>2</sub><i>D</i></span><span class=\"de\">μ<sub>2</sub></span></span>，　Ca = <span class=\"fr\"><span class=\"nu\">μ<sub>2</sub><i>u</i><sub>2</sub></span><span class=\"de\">σ</span></span>，　Bo = <span class=\"fr\"><span class=\"nu\">(ρ<sub>2</sub> − ρ<sub>1</sub>)<i>gD</i><sup>2</sup></span><span class=\"de\">σ</span></span>，　We = <span class=\"fr\"><span class=\"nu\">ρ<sub>2</sub><i>u</i><sub>2</sub><sup>2</sup><i>D</i></span><span class=\"de\">σ</span></span>",
          "note": "下标 1 空气、2 液态水，D 特征长度（m），u 速度（m·s⁻¹），σ 表面张力系数　四个数各比一对力：Re 惯性/黏性，Ca 黏性/表面张力，Bo 重力/表面张力，We 惯性/表面张力。"
        },
        {
          "type": "example",
          "title": "算一算：扩散层里谁说了算",
          "blocks": [
            {
              "type": "p",
              "text": "用书上的取值：液态水表观速度 u = 1×10⁻⁵ m·s⁻¹，特征长度取孔径 D = 50 μm，σ = 0.072 N·m⁻¹，水 ρ = 1000 kg·m⁻³、μ = 1×10⁻³ Pa·s。"
            },
            {
              "type": "list",
              "ordered": false,
              "items": [
                "Re = 1000×10⁻⁵×5×10⁻⁵ ÷ 10⁻³ = 5×10⁻⁴",
                "Ca = 10⁻³×10⁻⁵ ÷ 0.072 ≈ 1.4×10⁻⁷",
                "Bo = (1000 − 1.2)×9.8×(5×10⁻⁵)² ÷ 0.072 ≈ 3.4×10⁻⁴",
                "We = 1000×(10⁻⁵)²×5×10⁻⁵ ÷ 0.072 ≈ 6.9×10⁻¹¹"
              ]
            },
            {
              "type": "p",
              "text": "和书里给的 5.3×10⁻⁴、1.3×10⁻⁷、3.4×10⁻⁴、6.9×10⁻¹¹ 对得上（小差异来自取值精度）。四个数都远小于 1。"
            },
            {
              "type": "p",
              "text": "这说明孔里的水由表面张力主导，惯性、黏性、重力都可以忽略——所以原始 Shan-Chen 就够用，不用去追真实物性。（p.156）"
            }
          ]
        },
        {
          "type": "p",
          "text": "结论很干脆：孔里的水就是被毛细压差推着走。所以不需要真实密度比 836、黏度比 51，原始 Shan-Chen 就够，水蒸气和相变也能先放一边。（p.156–157）"
        },
        {
          "type": "p",
          "text": "对照流道就明白了：流道的毛细数大得多，表面张力不再独大，密度比和黏度比就必须当真。同一套 LB，流道里要改模型，孔里不用——这就是尺度带来的差别。（p.156–157）"
        },
        {
          "type": "h3",
          "text": "3. 传热与电化学"
        },
        {
          "type": "p",
          "text": "要算传热，就再加一个分布函数：f 管质量，g 管温度，这叫双分布函数（DDF）。温度场的松弛时间 τ_T 对应热扩散率，和 τ 对应黏度的道理一样。（p.160）"
        },
        {
          "type": "formula",
          "html": "<i>g</i><sub>α</sub>(<i>x</i> + <i>e</i><sub>α</sub>Δ<i>t</i>, <i>t</i> + Δ<i>t</i>) = <i>g</i><sub>α</sub>(<i>x</i>, <i>t</i>) − <span class=\"fr\"><span class=\"nu\">1</span><span class=\"de\">τ<sub>T</sub></span></span>[<i>g</i><sub>α</sub>(<i>x</i>, <i>t</i>) − <i>g</i><sub>α</sub><sup>eq</sup>(<i>x</i>, <i>t</i>)] + <i>S</i><sub>T</sub>",
          "note": "式(4-31)　g_α 是温度分布函数，τ_T 是温度场的松弛时间（对应热扩散率），S_T 是热源项。结构和式(4-11)完全一样，只是松弛时间换了。"
        },
        {
          "type": "p",
          "text": "要算电化学，就把反应塞进壁面。思路五步：重建结构 → 解 LB 拿流场和浓度 → 用 Butler-Volmer 算局部电流 → 换算成氧气消耗、水的生成 → 修改壁面反弹后的分布函数。（p.161–162）"
        },
        {
          "type": "formula",
          "html": "<i>r</i> = <span class=\"fr\"><span class=\"nu\"><i>j</i></span><span class=\"de\">4<i>F</i></span></span>，　<i>j</i> = <i>a j</i><sub>ref</sub><span class=\"fr\"><span class=\"nu\">ρ<sub>O₂</sub></span><span class=\"de\">ρ<sub>O₂</sub><sup>ref</sup></span></span>[exp(<span class=\"fr\"><span class=\"nu\">α<sub>f</sub><i>F</i>η</span><span class=\"de\"><i>R</i><sub>L</sub><i>T</i></span></span>) − exp(−<span class=\"fr\"><span class=\"nu\">α<sub>r</sub><i>F</i>η</span><span class=\"de\"><i>R</i><sub>L</sub><i>T</i></span></span>)]",
          "note": "式(4-33)　r 反应速率（mol·m⁻³·s⁻¹），j 局部电流密度（A·m⁻²），F 法拉第常数（96485 C·mol⁻¹），j_ref 参考电流密度，ρ(O₂) 与 ρ_ref(O₂) 是局部与参考氧密度，α_f、α_r 正/逆向传递系数，η 活化过电势（V），R_L 气体常数，T 温度（K），a 结构修正系数。每 4 个电子对应 1 个 O₂，所以 r = j/(4F)。"
        },
        {
          "type": "formula",
          "html": "<i>f</i><sub>O₂,3</sub> = (1 − <i>s</i><sub>O₂</sub>)<i>f</i><sub>O₂,1</sub>",
          "note": "式(4-37)　f 是分布函数，下标 1 和 3 是一对相反方向，s_O₂ 是撞壁后被消耗的氧气比例。氧气按比例被吃掉，剩下的沿原路弹回；水汽按同样比例加上去。"
        },
        {
          "type": "p",
          "text": "结果值得记住：电解质和铂载量增加，三相界面变多，但孔也变小、氧气更难进；碳载体直径增大，氧气扩散和铂利用率都受益。催化层设计就是在“多放催化剂”和“别把路堵死”之间找平衡。（p.165）"
        },
        {
          "type": "p",
          "text": "有序电极是下一步方向。而更完整的模型，还得把真实物性、液态水、传热统统装进来——目前这三样基本还是分开做的。（p.165）"
        },
        {
          "type": "table",
          "head": [
            "对比项",
            "VOF",
            "LB"
          ],
          "rows": [
            [
              "连续性假设",
              "要求 Kn 小（约 &lt;0.01）",
              "不受限，可到纳米孔"
            ],
            [
              "能用在哪",
              "流道、扩散层（孔径几十 μm）",
              "扩散层、微孔层、催化层"
            ],
            [
              "边界处理",
              "贴体网格，边界要够光顺",
              "反弹格式，只看格点类型"
            ],
            [
              "相变与电化学",
              "常被忽略或按固定速率、源项处理",
              "可耦合表面反应与双分布函数传热"
            ],
            [
              "代价",
              "高分辨率时网格量爆炸",
              "时间步小，靠并行加速"
            ]
          ]
        },
        {
          "type": "keypoints",
          "items": [
            "选工具看尺度：Kn 小用连续介质（NS/VOF），Kn 大用介观（LB）；分子模拟在燃料电池里基本用不上。",
            "VOF 的软肋在界面：γ 只给比例，曲率靠二阶差分，误差直接变成寄生流；接触角是动态还是静态，决定液滴能不能动。",
            "LB 的两步循环里，τ 同时是黏度和稳定性旋钮：ν = c_s²(τ − 1/2)。",
            "流道与多孔介质的差别不在几何，在毛细数：流道 Ca 大，密度比、黏度比必须当真；孔里 Ca 极小，表面张力独大，原始 Shan-Chen 就够。",
            "多孔介质模拟有一半工作是造结构：GDL 用纤维叠层，MPL 抓宏观裂缝，CL 用 QSGS 长三相。",
            "LB 的电化学靠改壁面：Butler-Volmer 给局部电流，换算成氧气消耗与水的生成，直接写进反弹后的分布函数。"
          ]
        }
      ]
    }
  ],
  "quiz": [
    {
      "q": "同样用原始 Shan-Chen 模型，为什么在催化层孔里够用、在流道里不够用？",
      "options": [
        "催化层温度更高，水的黏度更低",
        "流道里是液滴，孔里是水膜，物理过程不同",
        "催化层孔径小，表面张力独大，密度比和黏度比的影响可以忽略",
        "流道网格更粗，对精度要求本来就低"
      ],
      "answer": 2,
      "explain": "差在毛细数量级：孔里 Ca≈10⁻⁷，黏性远小于表面张力；流道 Ca 大得多，密度比 836、黏度比 51 就必须当真。"
    },
    {
      "q": "VOF 界面附近常见的寄生流（虚假速度），根源是什么？",
      "options": [
        "进出口边界条件给错了",
        "界面重构带来的曲率误差，使表面张力在数值上无法自平衡",
        "时间步长取得太大",
        "液滴本身在自发振动"
      ],
      "answer": 1,
      "explain": "表面张力项是 σκ，κ 是 γ 的二阶导数；界面只有 1–2 格厚，差分会放大误差，界面附近就凭空出现小涡。"
    },
    {
      "q": "LB 里把松弛时间 τ 从 0.6 调到 0.9，物理上相当于什么？",
      "options": [
        "黏度变大，流体更“稠”",
        "密度变大",
        "表面张力变大",
        "格子尺寸变大"
      ],
      "answer": 0,
      "explain": "ν = c_s²(τ−1/2)，τ 就是黏度开关。所以“调黏度会不会把密度也带歪”才是判断力耦合机制好坏的关键指标。"
    },
    {
      "q": "DNS 的总网格量大致随 Re_p^2.25 增长。脉动雷诺数从 1000 增到 2000，网格数约变成几倍？",
      "options": [
        "约 2 倍",
        "约 8 倍",
        "约 4.8 倍",
        "不变，只影响时间步"
      ],
      "answer": 2,
      "explain": "2^2.25 ≈ 4.76。误以为每个方向翻倍、三维再乘 8 就会选错；实际上 Re 涨一倍，总格点约 4.8 倍。"
    },
    {
      "q": "想研究“只把扩散层孔隙率从 0.6 降到 0.5，液态水传输怎么变”，该用哪种结构？",
      "options": [
        "对同一块材料做 X-CT 扫描",
        "随机重建，只改孔隙率这一个参数",
        "直接引用文献里的 CT 图像",
        "用均匀多孔介质假设，把孔隙率当参数调"
      ],
      "answer": 1,
      "explain": "CT 材料唯一，换一块结构参数全变，做不了单变量；均匀化又丢掉了结构信息。随机重建的价值就在参数可以一个一个拧。"
    },
    {
      "q": "为什么反弹格式特别适合多孔介质里的 LB 模拟？",
      "options": [
        "它能自动加密网格",
        "它比有限体积法高一个精度量级",
        "它能直接输出渗透率",
        "边界只是局部判断，不用贴体网格，天然适应各向异性骨架"
      ],
      "answer": 3,
      "explain": "固体和流体只用一个 0/1 矩阵区分，粒子撞墙原路返回就实现了无滑移。CT 图像二值化后可以直接当几何用。"
    }
  ],
  "terms": [
    {
      "t": "流体体积法",
      "en": "volume of fluid, VOF",
      "d": "用每个网格内的液相体积分数 γ 描述界面：γ=1 全液相、0 全气相。守恒好、存储省，但必须配界面重构（PLIC）才画得清界面形状。"
    },
    {
      "t": "水平集方法",
      "en": "level-set method",
      "d": "把界面写成虚拟函数 φ 的零等值面，法向和曲率可直接求导。处理拓扑变化容易，但要反复重新初始化，宏观量不易守恒。"
    },
    {
      "t": "分段线性界面计算",
      "en": "piecewise linear interface calculation, PLIC",
      "d": "在界面网格内用一条直线切出液体占据的部分，斜率由相邻网格的 γ 梯度估计。Fluent 等商业软件的 VOF 模块默认搭配它。"
    },
    {
      "t": "格子玻尔兹曼方法",
      "en": "lattice Boltzmann method, LBM",
      "d": "把流体离散成格点上的分布函数 f，每步只做碰撞和迁移。黏度由松弛时间给出，边界用反弹处理，天然适合并行。"
    },
    {
      "t": "伪势模型",
      "en": "pseudopotential model, Shan-Chen",
      "d": "给每个组分或相定义一个伪势 ψ(ρ)，相邻格点的 ψ 相互吸引。作用力强度超过临界值，气液自动分离，无需求解界面位置。"
    },
    {
      "t": "反弹格式",
      "en": "bounce-back / half-way bounce-back",
      "d": "粒子撞到固体格点后沿来路返回，速度统计平均为零，实现无滑移。半反弹把壁面放在格点中间，具有二阶精度。"
    },
    {
      "t": "克努森数",
      "en": "Knudsen number, Kn",
      "d": "分子平均自由程与特征长度之比。常温常压空气 λ≈68 nm；Kn 远小于 0.01 可用连续介质方程，接近或大于 0.1 必须换介观或分子方法。"
    },
    {
      "t": "动态接触角",
      "en": "dynamic contact angle",
      "d": "运动液滴的接触角随接触线速度变化，介于前进角与后退角之间。常用毛细数 Ca=μU_cl/σ 关联，单位为度（°）。"
    },
    {
      "t": "直接数值模拟",
      "en": "direct numerical simulation, DNS",
      "d": "不做雷诺平均、不建湍流模型，直接解 NS 方程。网格要小到 Kolmogorov 尺度，总格点数约随 Re_p^2.25 增长。"
    },
    {
      "t": "四参数随机生长法",
      "en": "quartet structure generation set, QSGS",
      "d": "先按概率撒生长核，再让各相以给定概率向邻点生长，直到达到目标体积分数。适合重建催化层这类多相多孔结构。"
    }
  ],
  "extend": [
    {
      "tag": "定量计算",
      "q": "同一滴水，在扩散层 50 μm 的孔里和在 1 mm 的流道里，命运不同。取气流 10 m·s⁻¹、液滴直径 0.5 mm、空气黏度 1.8×10⁻⁵ Pa·s、密度 1.2 kg·m⁻³、表面张力 0.072 N·m⁻¹，算流道的 Ca、We、Bo，和孔里的 1.3×10⁻⁷、6.9×10⁻¹¹、3.4×10⁻⁴ 比。哪些判据真的翻了结论，哪些其实没翻？",
      "hints": [
        "Ca 用气相的黏度和气流速度：Ca = μ_g u_g / σ，别拿液态水的黏度套。",
        "Bo 只看浮力和表面张力，和流速无关：Bo = Δρ g D² / σ。",
        "三个数都算完再回答：是“全都要当真”，还是只有某一个翻了？"
      ],
      "answer": "Ca = 1.8×10⁻⁵×10/0.072 ≈ 2.5×10⁻³，约为孔里的 2×10⁴ 倍；We = 1.2×10²×5×10⁻⁴/0.072 ≈ 0.83，比孔里大约 10¹⁰ 倍；Bo = 998×9.8×(5×10⁻⁴)²/0.072 ≈ 0.034，只大 100 倍，仍远小于 1。所以翻盘的是惯性和黏性剪切：流道里液滴会被吹变形，孔里 We 只有 10⁻¹¹，连形都变不了；重力在两种尺度下都可以不管。“流道里什么都得当真”是错的——只有 Ca、We 从可忽略变成同量级，模型才需要升级到真实密度比和动态接触角。",
      "to": [
        {
          "ch": "ch2",
          "sec": "2.2.1"
        },
        {
          "ch": "ch5",
          "sec": "5.2.1"
        }
      ]
    },
    {
      "tag": "概念深挖",
      "q": "为了提高排水，你们刚给一批扩散层换了更高浓度的 PTFE 乳液，接触角从 120° 拉到 150°，测试全部合格。按“越疏水越不沾水”的直觉，水应该更容易被吹走。可实验里水淹反而更早出现——为什么？",
      "hints": [
        "液态水要离开扩散层，靠的不是“被排斥”，而是毛细压差把它从孔口顶出去。",
        "想想疏水孔的进入压差：θ 越大，水要挤进这个孔，需要的压差是变大还是变小？",
        "书里还有一个细节：疏水程度的“快速切换”和“整体更强疏水”，效果不一样。"
      ],
      "answer": "疏水只解决“不润湿骨架”，不解决“把水送出去”。水要排走必须先从孔口突破进入流道，而疏水孔的进入压差随接触角增大而升高：θ 越大，毛细阻力越大，水越难突破，于是被锁在扩散层里，局部饱和度反而上升。书里还有一层更反直觉的：PTFE 分布不均造成的亲疏水交替，比整体更强的疏水更有利于水在平面内和厚度方向“滚动”排出。所以排水设计的目标不是把接触角做到最大，而是让突破压差和毛细驱动力匹配；真正决定成败的常常是 PTFE 的空间分布，不是那个平均值。太亲水又会让水铺膜堵孔，两头都不讨好。",
      "to": [
        {
          "ch": "ch2",
          "sec": "2.4.3"
        },
        {
          "ch": "ch5",
          "sec": "5.2.1"
        }
      ]
    },
    {
      "tag": "工程设计",
      "q": "手上只有一块 5% PTFE 的扩散层样品和它的 CT 数据，你们要预测 8% 会怎样，但没法制样。同事 A 说：直接在 CT 图像上把碳纤维加粗，孔隙率就降下来了；同事 B 说：用随机重建把统计参数标定到这块样品，再单独改 PTFE。两条路都能出结果，你选哪条，凭什么？",
      "hints": [
        "先问自己：你要回答的是“平均传输系数怎么变”，还是“水会不会找到一条贯通路径”？",
        "加粗纤维改掉的不只是孔隙率，还有孔径分布、迂曲度和 PTFE 的位置。",
        "如果两种效应混在一起，你测到的差值归因给谁？"
      ],
      "answer": "先看问题属于哪一类。平均量——有效扩散系数、渗透率——走 B：B 能把孔隙率、纤维直径、取向分别标定到这块 CT 的统计量，再只动 PTFE，变量是干净的。A 的毛病是加粗纤维同时改了孔径分布、迂曲度和 PTFE 位置，测到的差值没法归因。但渗流类问题（水能不能找到贯通路径、首次突破在哪个孔）统计等价不够：这类结果由最薄弱的连通处决定，B 给的是一个“平均上像、关键通道不对”的结构。这时只能回到 A，用最小扰动（只改 PTFE 覆盖、不动纤维），并声明混进了哪些变量。",
      "to": [
        {
          "ch": "ch3",
          "sec": "3.6.1"
        },
        {
          "ch": "ch3",
          "sec": "3.6.3"
        }
      ]
    },
    {
      "tag": "科研前沿",
      "q": "有人提议：把流道、扩散层、催化层放进同一个网格一次算完，省掉耦合的麻烦。组里有人真试过把单电池网格加密到催化层量级，算了一个月还没出结果。空间上差 4 个数量级你已经知道了——那为什么二十多年过去，多尺度耦合仍然是“尚未解决”？难点到底在哪？",
      "hints": [
        "先估时间：LBM 的时间步在 0.1 μs 量级，而单电池的动态过程要看秒。",
        "再想界面：交界面上真正需要交换的是什么量？微观模型给的又是什么量？",
        "最后问一句：水淹会不会反过来改变你刚算出来的有效扩散系数？"
      ],
      "answer": "不是算力，是“怎么把两个尺度接上”。空间差 4 个数量级、三维 10¹² 个格点，那只是贵。真正卡住的是两件事。一是时间：LBM 时间步在 0.1 μs 量级，看 1 s 的过程就是 10⁷ 步，乘起来不可承受。二是界面条件：宏观模型要边界值（通量、温度、电流），微观模型给统计平均量，两者没有唯一换算。更麻烦的是双向依赖——水淹改变孔隙占用，孔隙占用改变有效扩散系数，又反过来改宏观水分布。只做单向传递，会锁死在错误参数上。所以前沿问题是“如何定义并闭合界面条件”，不是“造更大的机器”。",
      "to": [
        {
          "ch": "ch5",
          "sec": "5.1"
        },
        {
          "ch": "ch2",
          "sec": "2.4.4"
        }
      ]
    },
    {
      "tag": "定量计算",
      "q": "20 °C 的水，ν = 1.0×10⁻⁶ m²·s⁻¹。你先用 Δx = 20 μm、Δt = 40 μs 算流道，得到 τ = 0.8，跑得很稳。现在为了看清 5 μm 的细节，网格加密到 10 μm，时间步你懒得改。算一下新的 τ。这个数意味着什么，怎么补救，代价多大？",
      "hints": [
        "格子黏度 ν_lat = ν·Δt/Δx²；Δx 减半，Δx² 变成四分之一。",
        "τ = 0.5 + ν_lat/c_s²，D2Q9 里 c_s² = 1/3，所以 τ − 0.5 = 3ν_lat。",
        "想保持 τ 不变，Δt 得跟着 Δx² 走——三维里这一步的代价是几次方？"
      ],
      "answer": "原来 ν_lat = 1.0×10⁻⁶×4×10⁻⁵/(2×10⁻⁵)² = 0.1，τ = 0.5 + 0.3 = 0.8。加密到 10 μm、Δt 不动：ν_lat = 0.1/4 = 0.025，τ = 0.5 + 0.075 = 0.575。稳定裕度 τ−0.5 只剩原来的四分之一；再加密一倍就贴近 0.5，BGK 开始振荡。补救只有一条正路：Δt 跟着 Δx² 缩，把 τ 钉住。代价是三维里每加密一倍，格子 ×8、步数 ×4，总量 ×32——不是 8 倍。所以 LBM 的网格独立性检查不能只加密网格，否则测到的不是收敛，是数值耗散变了。",
      "to": [
        {
          "ch": "ch5",
          "sec": "5.2.7"
        },
        {
          "ch": "ch5",
          "sec": "5.2.1"
        }
      ]
    },
    {
      "tag": "概念深挖",
      "q": "你把流道 VOF 的网格加密一倍，液滴脱离时刻从 12 ms 变成 11.2 ms，差 7%；再加密一倍变成 11.0 ms，差 2%。老师说这还不能算收敛。为什么？到底该盯哪个量，才敢说“网格无关”？",
      "hints": [
        "VOF 的误差不在解方程，在“界面到底在哪”——γ 只有 1–2 格厚，曲率是二阶差分。",
        "寄生流会随网格变，但它主要污染局部速度场，不一定会改变积分量。",
        "如果接触角模型没跟着网格标定，你收敛到的可能是一个稳定的错解。"
      ],
      "answer": "因为你在看一个事件时刻，而事件时刻对界面重构最敏感。γ 只有 1–2 格厚，曲率是它的二阶差分，网格一变，曲率误差和寄生流全跟着变，脱离时刻自然漂，这不等于流场收敛。要判网格无关，盯积分量和事件量的组合：液滴体积的守恒误差、突破孔口的临界压差、稳态压降，再配上脱离时刻。这些量对寄生流不敏感，序列才有意义。经验上还要守住两条：界面始终压在 1–2 个格子里，液滴直径至少跨十几格。否则加密只是把“糊”做得更贵——8 倍格子，加上 CFL 限制的时间步，总代价约 16 倍。",
      "to": [
        {
          "ch": "ch5",
          "sec": "5.2.7"
        },
        {
          "ch": "ch3",
          "sec": "3.5.1"
        }
      ]
    }
  ]
};
