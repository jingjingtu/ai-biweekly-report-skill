# HTML 输出规范

## 推荐流程

1. 依据 [输入契约](input-contract.md) 创建 UTF-8 JSON。
2. 若需要精确叙事，先生成 `pages[]`；否则让渲染器从业务对象生成基础页面。
3. 运行：

```bash
node scripts/render-report.mjs input.json output.html
node scripts/validate-report.mjs output.html
```

4. 浏览器可用时，`slides` 以 1920 × 1080 视口逐页检查；`long-scroll` 以 1920px 宽检查整卷和每个章节。静态校验不能替代溢出、重叠和整体观感检查。

输入 `meta.format` 决定画布：省略时为 `slides`；设置为 `long-scroll` 时输出连续长卷。`meta.narrativeMode` 决定内容顺序；B 端验证使用 [B 端内容标准](b-end-content-standard.md)。视觉原型与长卷构图见 [视觉样例审查](sample-standard.md)。

## Layout Profile

- `cover-summary`：大结论与少量指标或路径，最多 3 个辅助模块。
- `single-focus`：一张主模块与可选说明区。
- `two-column`：左侧约 60%，右侧约 40%。
- `three-card-matrix`：三张同级卡与一张全宽支撑模块。
- `timeline-evidence`：阶段路径、证据和下一步。
- `feedback-loop`：观众反馈任务为主，团队处理流程为辅。

一页只使用一个主布局。放不下时拆页或更换 Layout Profile，不压缩到 24px 以下。

## 页面与内容块

- `slides` 的每个 `.page` 固定为 1920 × 1080。
- `long-scroll` 的 `.page` 作为连续章节：宽 1920px、高度完全由内容决定、无外部页面缝隙；不能用固定最小高度制造空白。
- `slides` 页头、主体和页脚保持稳定；页码必须是 `01 / 04` 格式。`long-scroll` 使用 `01 / 04` 作为章节编号，允许隐藏重复页脚文字。
- 每个 block 和重复卡片必须有唯一 `data-figma-block`。
- 文本由渲染器转义；不要把用户材料作为未经处理的 HTML 插入。
- 页面眉题、品牌名、周期和阶段来自输入，不能硬编码特定团队名称。
- 颜色表达内容类别，状态使用独立标签。

## 自动拆分边界

`slides` 会拆分超过单页容量的重复卡片和指标；`long-scroll` 保留用户定义的章节，并允许章节自然增高。渲染器无法可靠判断所有自然语言造成的视觉高度，渲染后必须运行校验，并在浏览器中检查长标题、长段落和中英文混排。

## 导出

模板包含打印分页和背景保留规则。导出 PDF 或图片时仍需确认：

- 页面比例未缩放；
- 背景色与描边保留；
- 字体已加载或使用可接受的回退字体；
- 每页页码与总页数一致；
- 没有浏览器默认页眉页脚。

导出 `long-scroll` 图片时使用完整文档高度；导出 PDF 时可按章节分页，但不能在卡片、截图或标题中间强制断开。
