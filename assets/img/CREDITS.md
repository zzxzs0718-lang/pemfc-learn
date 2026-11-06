# 图片与数据图来源

本站所有图片只使用**可授权**素材，逐条记录出处；数据图由本项目用 matplotlib 自行生成。

## 照片（Wikimedia Commons）

| 文件 | 用途 | 作者 | 许可 | 来源页 |
|---|---|---|---|---|
| photo-mirai.jpg | 第 1 章：量产燃料电池乘用车 | Maurizio Pesce（Milan, Italia） | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Toyota_Mirai_Fuel_Cell_Vehicle_(16677266299).jpg |
| photo-ze-bus.jpg | 第 7 章：燃料电池客车（NASA 零排放交通示范） | NASA | No known copyright restrictions（Commons 标注 No restrictions） | https://commons.wikimedia.org/wiki/File:KSC-99PP-1252_2.jpg |

使用时均已按许可要求在图注中署名。若需转载，请沿用上述许可条款。

## 数据图（本项目生成）

| 文件 | 内容 | 生成脚本 |
|---|---|---|
| fig-coldstart-{light,dark}.svg / .pdf | 冷启动窗口：起始温度 × 初始含水量，含"有无辅助加热"两条边界 | `_work/make_figs.py` |
| fig-polarization-{light,dark}.svg / .pdf | 极化曲线三段损失分解 | 同上 |
| fig-waterflux-{light,dark}.svg / .pdf | 膜内净水通量方向图（电流密度 × 膜厚） | 同上 |

三张图都基于**教学简化模型**（集总热容、Springer 水传输关联式、Tafel 型极化），用于说明趋势与量级，不作为设计依据。简化点写在各图图注里。