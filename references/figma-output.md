# Figma 输出规范

仅在用户明确要求 Figma，且当前环境具备对应能力时读取本文件。Figma 阶段失败不得阻塞内容或 HTML 的交付。

## 原生结构

- `slides` 页面根节点：`Root Report Frame / <主题> / 01`，固定 1920 × 1080。
- `long-scroll` 只有一个根节点：`Root Report Frame / <主题> / Long Scroll`，固定宽 1920px、高度按所有章节总和自适应。它使用垂直 Auto Layout、`itemSpacing=0`，所有章节直接位于根节点内，不能把独立画板摆在 Section 中冒充一整块长图。
- `slides` 根节点包含 `Header`、`Main`、`Footer`；`long-scroll` 的每个章节是独立可编辑 Auto Layout Frame，节点名称体现布局职责并包含章节大标题与内容区。
- 使用用户 B 端历史稿样式时，每个章节使用同名 `Header / Left Aligned`，其眉题、`Section Title`、说明和一级内容容器绝对 `x` 坐标一致；默认均为根 Frame 内的 `x=80`。
- `Section`、`Module`、`Card`、`MetricCard`、`EvidenceCard`、`NextActionCard`、`TagGroup` 和 `FlowStep` 使用 Auto Layout Frame。
- 背景、描边、标题、正文、编号、状态和图标必须位于同一语义模块内。
- 只有点阵背景、跨模块连接线、遮罩和坐标线允许绝对定位，并命名为 `Overlay / ...`、`Connector / ...` 或 `Grid / ...`。
- HTML 导入后依据 `data-figma-block` 重建语义分组；不能交付散落在 Root 下的文字和矩形。

## Auto Layout 默认值

- 页面安全边距：水平 80px、垂直 64px。
- 卡片：垂直布局，`paddingTop=24`、`paddingBottom=24`、`paddingLeft=24`、`paddingRight=32`，`itemSpacing=16–24`。
- 三卡或标签组：水平布局，`itemSpacing=32`。
- 标签文字水平和垂直居中；同组标签保持同一高度。
- 页头状态和页脚页码右边界对齐到 1840px；页码使用固定宽度并右对齐。

## 文字节点

- 先加载字体，再设置 characters、fontSize 和 lineHeight，最后设置宽高。
- 所有可见文字都不小于 24px，包括眉题、状态、图注、编号、坐标和页脚；长卷章节大标题不小于 48px。
- 单行文字高度至少为 `fontSize + 8px`。
- 多行正文使用约 `fontSize × 1.6` 的行高并给足节点高度。
- 不允许 `height <= 1.5px` 的文字节点。

## 权限与失败处理

- 无编辑权限或工具不可用时停止 Figma 阶段，报告具体阻塞，并交付已有内容/HTML。
- 不覆盖已确认画板。用户要求新版或视觉探索时，在空白区域创建独立版本。
- 若使用可选的 HTML→Figma 或文字 QA 能力，先确认它在当前环境真实可用；不存在时执行本文件中的原生结构与节点检查。

## 交付前节点 QA

- Root 下没有大量直接散落的 TEXT、RECTANGLE 或 LINE。
- `slides` 所有内容位于 1920 × 1080 画面内；`long-scroll` 所有内容位于单一 1920px 宽根 Frame 内，章节连续且没有缝隙。
- 卡片、标签组和流程组可一键选中移动。
- 标签文字填满容器并居中。
- 页头状态与页脚页码右边界一致。
- 页码完整且总页数一致。
- 所有文字节点 `fontSize >= 24`，长卷章节标题 `fontSize >= 48`。
- 每章至少有一个主视觉锚点和一种结构型或证据型装饰；相邻章节的内容分栏、证据载体与装饰组合不完全相同，标题系统保持稳定。
- 汇总所有 `Section Title` 的绝对 `x` 坐标并去重；用户 B 端历史稿样式下结果必须只有一个值。章节标题 `textAlignHorizontal` 必须为 `LEFT`。
- 检查所有 `Section Title` 的文字分段填色：标准 B 端样式只允许主文字白和主绿；红色不得出现在 `fontSize >= 48px` 的标题分段中。
- 检查同级模块的绝对边界：共享网格的左/右边线必须完全一致，等列宽差值不超过 1px，状态标签右边线一致；不能只凭截图目测。
- 截图观感与节点结构均通过后才可宣布完成。
