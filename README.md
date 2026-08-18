# AI 双周会汇报 Skill

把 AI 项目计划、进展、交付证据、问题取舍和下一步计划，整理为适合设计团队双周会展示的深色科技风汇报。

它面向设计团队的 AI 实践：不把「使用了工具」当作成果，而是把每个动作落到可检查的交付物、证据和下一步验证上。

## 能生成什么

- 固定 `1920 × 1080` 的 HTML 汇报页，内容过多时自动拆页而非缩小文字。
- 黑底、荧光绿为主线的工程控制台视觉：状态标签、能力路径、阶段时间轴、证据卡与风险提示。
- 清晰区分年度目标、已完成、验证中、受阻和下一步，避免把计划写成已完成事实。
- 适合导入 Figma 的语义化内容块标记，便于继续编辑。

## 适用场景

- AI 设计系统、组件库、页面模式或工作流建设的双周同步。
- 多个项目、Skill、Agent、自动化实验的进度归纳。
- 需要向团队说明「本期变化—证据—缺口—下一步」的阶段性汇报。

## 使用方式

将本目录放入 Codex Skills 目录后，在对话中使用：

```text
使用 $ai-biweekly-report，将以下计划、本期进展和交付证据整理成双周会汇报。
```

准备材料时，建议提供：周期、一句话结论、北极星目标、本期动作与交付物、可验证证据、问题与取舍、下一步动作及待采集数据。详见 [内容映射](references/content-mapping.md)。

## 输出示例

以下为真实生成的 4 页样例，展示从「页面模式地图」到 Form 专项训练和跨平台复用计划的叙事链路。

![双周会结论页](examples/screenshots/01-biweekly-summary.png)

![B 端页面模式地图](examples/screenshots/02-page-pattern-map.png)

![Form 生成链路训练](examples/screenshots/03-form-training.png)

![复用计划](examples/screenshots/04-reuse-plan.png)

## 目录说明

```text
├── SKILL.md                     # 主流程与交付检查清单
├── agents/openai.yaml            # Skill 元数据
├── assets/template.html          # 1920 × 1080 HTML 模板
├── references/content-mapping.md # 内容结构、状态词典与数据纪律
├── references/style-system.md    # 视觉系统与排版规则
└── examples/screenshots/         # 真实生成样例
```

## 设计原则

1. 先明确目标与本期变化，再展示交付证据。
2. 每项进展按「动作 → 输出 → 证据 → 意义」表达。
3. 没有基线时不编造效率数据；计划数字必须明确标为目标值。
4. AI 负责结构化生成，设计师负责判断、取舍、精修与验收。

## License

供个人或团队内部的 AI 设计汇报工作流复用；如需对外分发，请先确认其中示例内容与品牌素材的使用范围。
