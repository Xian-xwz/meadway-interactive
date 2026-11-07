# GAP-33｜Lot 4｜山墙承重过梁包络

本轮拟用：**2/140×45 SG8**；中央表8.9最小候选：140x90。
**来源核实与计算已执行；工程确认待定，未写CAD。**

- 位置：A201/PDF23 / RUN-042；模型构件：GAP-33-LINTEL-0, GAP-33-LINTEL-1
- 原墙边净跨：1510.000 mm；模型承托柱内面净跨：1510.000 mm；计算跨度：1510 mm。
- 分类依据：厂家山墙位置/固定和BRANZ对应包络，逐洞详见受荷尺寸。
- 建筑墙实体：FF-W129, FF-W130, FF-W131, FF-W132, FF-W133
- CAD源句柄：BLOCKIFIED:DBACB/overall:DBACB/288/f7570b5b, BLOCKIFIED:DBACB/overall:DBACB/292/dd9728ff, BLOCKIFIED:DBACB/overall:DBACB/293/bd21bd7f, BLOCKIFIED:DBACB/overall:DBACB/294/d2ccb546, BLOCKIFIED:DBACB/overall:DBACB/295/28f2af26, PDF-boundary-FF-B-2
- 厂家墙图元：162 2.1.External Walls, 163 2.1.External Walls
- 上部屋架：L4-6-S9-3DF, L4-6-S4-3E9, L4-6-S4-3E8
- PS1：本组第1/5页；坡度20°、普通屋架名义900mm、屋面雪荷载0Pa；SG8、Low。
- 覆盖材料Longrun 6kg/m²，局部防水层+17mm夹板18kg/m²；轻屋面定义≤20kg/m²。天花12.7kg/m²另列；这些资料不等于完整G/Q/W特征荷载。
- 山墙：L4-6-S9-3DF；下一榀：L4-6-S4-3E9，距离0.9000m。
- 外伸长度包络：0.5750m；受荷尺寸包络1.0250m；取原表2m档。
- 挑檐原图句柄：36B, 36C, 36D, 36E, 36F, 370, 371, 372
- 本洞直接调用既有中央表选择器；原薄节点只支持普通屋架，本轮未修改节点或已装Skill。

剩余条件：
- 厂家缺该山墙自跨洞口设计页；本次采用有竖向荷载的山墙过梁包络，未认定双片为girder。
- 真实顶板/窗头标高与连续连接独立核实；梁选型不是工程批准。
- 山墙实际竖向传力按短柱/墙架分布构造完成；相邻屋架最大间距已核≤1.2m，厂家自行跨洞能力未证明。
- 双拼全长、全厚承托、钉排和山墙抗风连接另核；本轮不套用普通MiTek固定类别。
- 柱脚下实际楼板边梁/搁栅/封堵和下层支承属于连续连接阶段；本次表格结果不包含其验算。

来源审计SHA256：ffc49f39df6730acb273a5c53cb0c78411e001ea5ceab4c039a9aa6a69bb14cf。
中央结果SHA256：38c9643e6587bbfccfe84a14a2c8370c7d30cde80047da30dfd3b1a2c3993773。
详见本地source-audit.json、design-facts.json及all-openings.design-stages.json；原件保持。
