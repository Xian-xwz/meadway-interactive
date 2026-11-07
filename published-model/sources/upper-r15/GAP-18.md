# GAP-18｜Lot 1｜室内非承重上横档

本轮拟用：**单根90×45 SG8上横档**；中央表8.15最小候选：{'section_width_mm': 90, 'section_vertical_thickness_mm': 35}。
**来源核实与计算已执行；工程确认待定，未写CAD。**

- 位置：A101/PDF14 / RUN-027；模型构件：GAP-18-LINTEL-0, GAP-18-LINTEL-1
- 原墙边净跨：1545.000 mm；模型承托柱内面净跨：1545.000 mm；计算跨度：1550 mm。
- 分类依据：A101/A201室内隔墙；厂家屋架支承布置在外墙/分户LBW线，已提供普通单榀详图为两端支承。未将穿过隔墙上方的底弦当中间支座。
- 建筑墙实体：FF-W058, FF-W073, FF-W074, FF-W230
- CAD源句柄：BLOCKIFIED:DBACB/overall:DBACB/131/5be4e7fe, BLOCKIFIED:DBACB/overall:DBACB/132/1abf2a1f, BLOCKIFIED:DBACB/overall:DBACB/138/80df0d24, BLOCKIFIED:DBACB/overall:DBACB/139/ed46a4eb, BLOCKIFIED:DBACB/overall:DBACB/639/40c98b7a, BLOCKIFIED:DBACB/overall:DBACB/640/bceeaba5, BLOCKIFIED:DBACB/overall:DBACB/71/266faaad, BLOCKIFIED:DBACB/overall:DBACB/77/23743f61
- 厂家墙图元：室内隔墙位于厂家两端支承墙之间，见普通单榀支座表
- 上部屋架：L1-3-S2-313, L1-3-S2-312, L1-3-S2-314
- PS1：本组第1/5页；坡度20°、普通屋架名义900mm、屋面雪荷载0Pa；SG8、Low。
- 覆盖材料Longrun 6kg/m²，局部防水层+17mm夹板18kg/m²；轻屋面定义≤20kg/m²。天花12.7kg/m²另列；这些资料不等于完整G/Q/W特征荷载。
- 屋架按厂家两端支承，天花由屋架底弦承担；该隔墙不增设中间支座。上横档只按自身墙框/门洞构造路线选型。

剩余条件：
- 按非承重墙顶连接实施；屋架挠曲空间及墙顶固定属于连接阶段，不是本洞上部新增屋架支承。
- 门袋厂家吊轨及上框固定独立核，按门袋+通行口连续净跨选型。
- 真实顶板/窗头标高与连续连接独立核实；梁选型不是工程批准。

来源审计SHA256：ffc49f39df6730acb273a5c53cb0c78411e001ea5ceab4c039a9aa6a69bb14cf。
中央结果SHA256：38c9643e6587bbfccfe84a14a2c8370c7d30cde80047da30dfd3b1a2c3993773。
详见本地source-audit.json、design-facts.json及all-openings.design-stages.json；原件保持。
