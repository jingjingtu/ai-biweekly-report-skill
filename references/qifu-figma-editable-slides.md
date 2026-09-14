# 奇富 Figma 可编辑画板预设

当用户要求“按我的双周会预设”时使用本预设。目标是可在 Figma 内继续编辑和复用的 B 端双周会，不是 HTML 网页、图片或缩略图替代品。

## 交付契约

- `outputMode` 固定为 `figma`；HTML 可以用于本地审阅或辅助构图，但不得作为最终交付物，也不得被表述为 Figma 已完成。
- `format` 固定为 `long-scroll`：**全卷只有一个根画板**，命名 `Root Report Frame / <主题> / Long Scroll`，宽 1920px、纵向 Auto Layout、`itemSpacing=0`，高度随章节内容自适应增长。所有章节直接位于该根画板内，章节之间连续衔接，不得用灰色缝隙拼页，也不得把独立画板摆进 Section 冒充整卷。
- 只有用户明确要求“分页 / PPT 式分页”时才改用 `slides`；明确要求 HTML 时才回到 HTML 输出。默认形态始终是单一连续根画板。
- 在用户指定的现有 Figma Page 的空白区域增量创建版本；不新建 Page、不覆盖、不移动、不删除已存在的内容。
- 写入前读取目标 Page、目标 Frame、已有文字/图标和可用空白区域。事实、数据和原稿文案保持不变；只在用户明确授权时补充汇报所需的新内容。
- 使用当前环境真实可用的 Figma 原生写入能力创建节点。第三方 HTML 导入、截图或图片只能作为辅助参考，不能替代原生 Frame 构建。
- Figma 无法写入、没有编辑权限，或节点 QA 未通过时，停止 Figma 阶段并明确报告“Figma 未完成”；不得以 HTML、图片或口头说明代替完成声明。

## 根画板与章节结构

- 根画板直接包含按叙事顺序垂直排列的章节 Frame，`itemSpacing=0`，靠章节自身的上下留白（80–160px）形成节奏。
- 每个章节 Frame 命名为 `Section / <章节名>`，其内使用同名 `Header / Left Aligned`：眉题、`Section Title`、说明和一级内容容器的绝对 `x` 坐标必须一致，默认 `x=80`；页头状态与页脚页码右边界对齐至 `x=1840`。
- 章节内除 `Header` 外的内容进入命名的 Auto Layout Frame，例如 `Hero / Asymmetric`、`Evidence / Problem Cards`、`Flow / Root Cause`、`Rules / Three Layers`、`Timeline / Validation`、`Portfolio / Assets`、`Roadmap / Milestones`。
- 所有 `Section`、`Module`、`Card`、`MetricCard`、`EvidenceCard`、`NextActionCard`、`TagGroup` 和 `FlowStep` 必须是可整体选中移动的 Auto Layout Frame；背景、描边、文字和状态留在同一语义模块内。
- 除命名为 `Overlay / ...`、`Connector / ...` 或 `Grid / ...` 的元素外，根画板下不得散落文字、矩形或线条。
- 所有可见文字不小于 24px；章节大标题不小于 48px，正文使用 24–28px。

## 章节预设

内容足够支撑完整 B 端验证叙事时，优先采用七章顺序：

1. `Hero / Asymmetric`：本期判断、关键指标和决策诉求。
2. `Evidence / Problem Cards`：问题证据和影响范围。
3. `Flow / Root Cause`：从症状到根因的因果链路。
4. `Rules / Three Layers`：可执行规则、Token 或规范分层。
5. `Timeline / Validation`：复验过程、通过条件与边界。
6. `Portfolio / Assets`：可复用资产、组件和 Skill 沉淀。
7. `Roadmap / Milestones`：下一步、负责人、期限和验收口径。

信息不足时可以合并或减少章节，但至少保留“本期判断 → 证据 → 规则/验证 → 下一步”的闭环，并说明合并原因。

- 完整叙事至少使用四种 Layout Profile；相邻章节不得复用相同的主体比例、阅读方向、证据载体和卡片骨架。
- 视觉锚点由真实证据、因果链、规则层级、验证时间线或里程碑承担；不能连续使用“标题 + 等宽卡片矩阵”填满全卷。
- 至少两章使用可读的深色渐变或分层表面；至少一章以时间轴、分支连接或汇聚节点表达真实逻辑；整卷不得退化为同色线框卡片的堆叠。
- 使用近黑、深绿、深蓝或紫黑的低对比表面建立层级；主绿表达主结论，紫表达工程化，青表达验证，粉色仅表达局部差异或例外。B 端报告不使用红色；必须扫描所有可见填充、描边、文字和渐变色标确认无红色。

## 完成门槛

仅在以下全部满足时才能宣布 Figma 完成：

- 根画板数量为 **1**，名称、1920px 宽度和位置可核对；全卷章节连续、无拼页缝隙、无独立画板间隔。
- 每个章节存在 `Header / Left Aligned`，主要模块为语义化 Auto Layout Frame；汇总所有 `Section Title` 的绝对 `x` 坐标，结果只有一个值，且 `textAlignHorizontal` 为 `LEFT`。
- 所有内容均在 1920px 宽根画板内；字号（正文 ≥24px、章节大标题 ≥48px）、左基线、页头/页脚右边界通过检查。
- 相邻章节的布局与证据载体确有差异，且至少一章使用真实的时间轴、分支连接或汇聚关系。
- 截图观感和节点结构均已检查，并报告目标 Figma 链接、根画板名称及节点 QA 结果。
