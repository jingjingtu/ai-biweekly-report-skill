# 输入契约

## 最小字段

先从用户材料中提取下列字段；缺失字段使用空数组或“待确认”，不要编造：

```json
{
  "meta": {
    "period": "2026.09.01–09.14",
    "audience": "mixed",
    "reportGoal": "同步本期验证结果并确定下期优先级",
    "decisionNeeded": "是否进入真实项目试点",
    "outputMode": "html",
    "format": "slides",
    "narrativeMode": "status-summary",
    "sampleArchetype": "strategy-progress",
    "referenceSamples": [],
    "pageBudget": 4,
    "brandName": "AI Design",
    "eyebrow": "AI Design / biweekly.md",
    "currentStage": "VERIFY",
    "footerLeft": "AI 设计专项"
  },
  "title": "从样板生成，推进到真实项目验证",
  "subtitle": "本期完成生成链路，下一步验证复用边界。",
  "conclusion": "生成能力已经可运行，但尚未形成真实项目中的稳定复用证据。",
  "northStar": "让高频设计工作形成可复用、可验证的 AI 协作能力",
  "metrics": [],
  "problemFindings": [],
  "ruleChanges": [],
  "validationRounds": [],
  "reusableAssets": [],
  "progress": [],
  "tradeoffs": [],
  "risks": [],
  "dependencies": [],
  "asks": [],
  "nextActions": []
}
```

允许的 `audience`：`management`、`project-team`、`mixed`。

允许的 `outputMode`：`content`、`html`、`figma`、`all`。

允许的 `format`：

- `slides`：固定 1920 × 1080 独立页面，默认值。
- `long-scroll`：1920px 宽连续长卷，章节高度按内容增长。

允许的 `narrativeMode`：

- `status-summary`：普通双周进展与决策同步，默认值。
- `b-end-validation`：B 端组件、页面、平台或 Skill 的验证闭环；规则见 [B 端历史汇报内容标准](b-end-content-standard.md)。

允许的 `sampleArchetype`：`strategy-progress`、`capability-roadmap`、`capability-system`、`portfolio-operations`、`b-end-transformation`、`gallery-case`。只有用户指定标准样例或内容确实匹配时才填写；选择规则见 [标准样例审查](sample-standard.md)。

`referenceSamples` 记录当前任务实际采用的参考文件名或链接，用于说明版式依据，不赋予其中数字、图片或品牌资产新的使用权限。

允许的状态：`DONE`、`VERIFY`、`BLOCKED`、`NEXT`、`BASELINE`。

## 业务对象

### progress[]

```json
{
  "title": "完成组件映射",
  "action": "梳理高频组件与页面模式",
  "output": "组件映射表",
  "evidence": "文件路径、链接或截图说明",
  "meaning": "减少下一轮页面生成中的重复判断",
  "status": "DONE",
  "tone": "engineering"
}
```

### B 端验证对象

`problemFindings[]` 记录问题现场：`title`、`context`、`symptom`、`evidence`、`impact`、`rootCause`、`status`。

`ruleChanges[]` 记录经验如何变为可执行能力：`title`、`problem`、`rule`、`implementation`、`acceptance`、`evidence`、`status`。

`validationRounds[]` 记录一轮验证：`title`、`scope`、`hypothesis`、`result`、`failure`、`newRule`、`evidence`、`status`。

`reusableAssets[]` 记录可再次调用的沉淀：`name`、`type`、`scope`、`entry`、`evidence`、`status`。单张成功页面不能单独算作复用资产。

### metrics[]

```json
{
  "label": "真实项目覆盖",
  "value": "2 个",
  "kind": "actual",
  "asOf": "2026-09-12",
  "source": "项目验证记录",
  "status": "VERIFY"
}
```

`kind` 只能是：

- `target`：计划或目标值，页面中显示 `TARGET`。
- `actual`：有来源和统计截止日期的实际值。
- `baseline`：待建立基线，不展示推测数字。

### tradeoffs[] / risks[] / asks[]

每项至少包含 `title` 和 `body`。风险建议增加 `impact` 与 `owner`；需要会议推动的事项建议增加 `decisionBy`。

### nextActions[]

```json
{
  "title": "进入真实项目试点",
  "deliverable": "完成 2 个真实页面并记录返工原因",
  "acceptance": "页面通过设计验收且形成问题清单",
  "owner": "设计系统小组",
  "dueDate": "2026-09-26",
  "status": "NEXT"
}
```

## 自定义页面

未提供 `pages` 时，渲染器根据结论、指标、进展、问题和下一步生成 3–5 页基础叙事。需要精确控制页面时传入：

```json
{
  "pages": [
    {
      "title": "本期判断",
      "subtitle": "一句话解释为什么得出这个判断",
      "layout": "cover-summary",
      "blocks": [
        {
          "type": "statement",
          "name": "本期结论",
          "label": "CONCLUSION",
          "title": "生成链路已跑通",
          "body": "下一步验证真实项目中的复用质量。",
          "tone": "primary"
        },
        {
          "type": "cards",
          "name": "关键进展",
          "columns": 3,
          "items": [
            {
              "label": "DONE",
              "title": "完成结构定义",
              "body": "形成页面骨架与字段规则。",
              "status": "DONE",
              "tone": "engineering"
            }
          ]
        }
      ]
    }
  ]
}
```

支持的 block 类型：`statement`、`cards`、`metrics`、`path`、`note`。每个 block 必须有可读的 `name`；渲染器用它生成唯一 `data-figma-block`。

## 事实与证据检查

- 实际指标必须同时存在 `value`、`source` 和 `asOf`。
- 没有基线时写“待采集基线”，不能从完成任务数量推算效率百分比。
- 证据可以是文件、页面、截图、测试结果或用户确认；“已经优化”“体验更好”不是证据。
- 会议中需要推进的事项放入 `decisionNeeded` 或 `asks[]`，不要埋在普通进展卡中。
- 下一步没有负责人或期限时允许生成，但必须标为“责任人待确认”或“时间待确认”。
