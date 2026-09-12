#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STATUS = new Set(['DONE', 'VERIFY', 'BLOCKED', 'NEXT', 'BASELINE']);
const TONES = new Set(['primary', 'engineering', 'validation', 'risk']);
const BLOCK_TYPES = new Set(['statement', 'cards', 'metrics', 'path', 'note']);
const FORMATS = new Set(['slides', 'long-scroll']);
const SAMPLE_ARCHETYPES = new Set(['strategy-progress', 'capability-roadmap', 'capability-system', 'portfolio-operations', 'b-end-transformation', 'gallery-case']);
const NARRATIVE_MODES = new Set(['status-summary', 'b-end-validation']);

function fail(message) {
  console.error('render-report: ' + message);
  process.exit(1);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function safeColor(value) {
  const color = String(value || '#00F58A');
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#00F58A';
}

function clampColumns(value, fallback) {
  const columns = Number(value);
  if (!Number.isInteger(columns)) return fallback;
  return Math.min(4, Math.max(2, columns));
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function textFromProgress(item) {
  if (item.body) return item.body;
  return [item.action, item.output, item.evidence, item.meaning].filter(Boolean).join(' → ');
}

function textFromAction(item) {
  if (item.body) return item.body;
  const delivery = item.deliverable ? '交付物：' + item.deliverable : '';
  const acceptance = item.acceptance ? '验收：' + item.acceptance : '';
  return [delivery, acceptance].filter(Boolean).join('；');
}

function actionMeta(item) {
  const owner = item.owner || '责任人待确认';
  const dueDate = item.dueDate || '时间待确认';
  return owner + ' · ' + dueDate;
}

function cardFromBusinessItem(item, kind) {
  const base = {
    label: item.label || item.status || kind,
    title: item.title || '待确认事项',
    status: STATUS.has(item.status) ? item.status : '',
    tone: TONES.has(item.tone) ? item.tone : (kind === 'RISK' ? 'risk' : 'primary')
  };
  if (kind === 'PROGRESS') {
    return { ...base, body: textFromProgress(item), meta: item.evidence || '' };
  }
  if (kind === 'NEXT') {
    return { ...base, body: textFromAction(item), meta: actionMeta(item) };
  }
  return {
    ...base,
    body: item.body || item.impact || '内容待确认',
    meta: item.owner || item.decisionBy || ''
  };
}

function joinedText(parts) {
  return parts.filter(Boolean).join('；');
}

function bEndCard(item, kind) {
  const base = {
    title: item.title || item.name || '待确认事项',
    status: STATUS.has(item.status) ? item.status : 'VERIFY'
  };
  if (kind === 'PROBLEM') {
    return {
      ...base,
      label: 'PROBLEM',
      body: joinedText([item.context, item.symptom, item.impact]),
      meta: item.evidence || '证据待补充',
      tone: 'risk'
    };
  }
  if (kind === 'ROOT CAUSE') {
    return {
      ...base,
      label: 'ROOT CAUSE',
      body: item.rootCause || '根因待确认',
      meta: item.evidence || '',
      tone: 'engineering'
    };
  }
  if (kind === 'RULE') {
    return {
      ...base,
      label: 'EXECUTABLE RULE',
      body: joinedText([item.rule, item.implementation]),
      meta: item.acceptance ? '验收：' + item.acceptance : (item.evidence || ''),
      tone: 'engineering'
    };
  }
  if (kind === 'VALIDATION') {
    return {
      ...base,
      label: 'VALIDATION',
      body: joinedText([
        item.scope ? '范围：' + item.scope : '',
        item.result ? '结果：' + item.result : '',
        item.failure ? '失败点：' + item.failure : '',
        item.newRule ? '新增规则：' + item.newRule : ''
      ]),
      meta: item.evidence || '',
      tone: 'validation'
    };
  }
  return {
    ...base,
    label: 'REUSABLE ASSET',
    body: joinedText([
      item.type ? '类型：' + item.type : '',
      item.scope ? '范围：' + item.scope : '',
      item.entry ? '入口：' + item.entry : ''
    ]),
    meta: item.evidence || '',
    tone: 'primary'
  };
}

function pushCardPages(pages, items, options) {
  chunks(items, 3).forEach((group, index) => {
    pages.push({
      title: index === 0 ? options.title : options.title + '（续 ' + index + '）',
      subtitle: options.subtitle,
      layout: options.layout || 'three-card-matrix',
      blocks: [{
        type: 'cards',
        name: options.name,
        columns: Math.min(3, Math.max(2, group.length)),
        items: group.map((item) => bEndCard(item, options.kind))
      }]
    });
  });
}

function bEndValidationPages(data) {
  const meta = data.meta || {};
  const pages = [];
  const firstBlocks = [{
    type: 'statement',
    name: '本期变化',
    label: 'CURRENT SHIFT',
    title: data.conclusion || data.title || '本期能力变化待确认',
    body: data.northStar ? '长期目标：' + data.northStar : (data.subtitle || ''),
    tone: 'primary'
  }];

  if (meta.decisionNeeded) {
    firstBlocks.push({
      type: 'note',
      name: '待决策事项',
      label: 'DECISION NEEDED',
      title: meta.decisionNeeded,
      body: meta.reportGoal || ''
    });
  }

  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  if (metrics.length) {
    firstBlocks.push({ type: 'metrics', name: '验证口径', columns: Math.min(4, metrics.length), items: metrics.slice(0, 4) });
  }
  pages.push({
    title: data.title || 'B 端 AI 验证汇报',
    subtitle: data.subtitle || '说明本轮变化、问题、规则、复验和能力沉淀。',
    layout: 'cover-summary',
    blocks: firstBlocks
  });

  const findings = Array.isArray(data.problemFindings) ? data.problemFindings : [];
  pushCardPages(pages, findings, {
    title: data.problemSummary || '本轮实验暴露了哪些问题',
    subtitle: '先还原场景、症状和影响，再判断解决方式。',
    name: '问题证据',
    kind: 'PROBLEM'
  });
  pushCardPages(pages, findings.filter((item) => item.rootCause), {
    title: data.rootCauseSummary || '问题背后的规则与架构缺口',
    subtitle: '区分表面症状、规则缺失、平台差异和架构边界。',
    name: '根因判断',
    kind: 'ROOT CAUSE'
  });

  pushCardPages(pages, Array.isArray(data.ruleChanges) ? data.ruleChanges : [], {
    title: data.ruleSummary || '把本轮判断写成可执行规则',
    subtitle: '规则必须落到配置、契约、样板、门禁或 Skill 结构。',
    name: '规则化解决',
    kind: 'RULE',
    layout: 'timeline-evidence'
  });

  pushCardPages(pages, Array.isArray(data.validationRounds) ? data.validationRounds : [], {
    title: data.validationSummary || '复验规则是否真正生效',
    subtitle: '说明范围、结果、失败点和新增规则。',
    name: '复验结果',
    kind: 'VALIDATION',
    layout: 'timeline-evidence'
  });

  pushCardPages(pages, Array.isArray(data.reusableAssets) ? data.reusableAssets : [], {
    title: data.assetSummary || '本轮沉淀了哪些可再次调用的能力',
    subtitle: '单张成功页面不算复用资产，必须给出范围与入口。',
    name: '能力沉淀',
    kind: 'ASSET',
    layout: 'portfolio-progress'
  });

  const nextActions = Array.isArray(data.nextActions) ? data.nextActions : [];
  chunks(nextActions, 3).forEach((items, index) => {
    const blocks = [{
      type: 'cards',
      name: '下一轮验证',
      columns: Math.min(3, Math.max(2, items.length)),
      items: items.map((item) => cardFromBusinessItem(item, 'NEXT'))
    }];
    if (index === 0 && Array.isArray(data.asks) && data.asks.length) {
      blocks.push({
        type: 'path',
        name: '协作入口',
        items: data.asks.map((item) => item.title || item.body || String(item))
      });
    }
    pages.push({
      title: index === 0 ? '下一轮只验证尚未闭环的边界' : '下一轮验证（续 ' + index + '）',
      subtitle: '动作必须由本轮问题推出，并包含交付物和验收口径。',
      layout: 'timeline-evidence',
      blocks
    });
  });

  return pages;
}

function statusSummaryPages(data) {
  const meta = data.meta || {};
  const pages = [];
  const firstBlocks = [{
    type: 'statement',
    name: '本期结论',
    label: 'CONCLUSION',
    title: data.conclusion || data.title || '本期结论待确认',
    body: data.northStar ? '北极星：' + data.northStar : (data.subtitle || '补充支撑结论的事实与证据。'),
    tone: 'primary'
  }];

  if (meta.decisionNeeded) {
    firstBlocks.push({
      type: 'note',
      name: '待决策事项',
      label: 'DECISION NEEDED',
      title: meta.decisionNeeded,
      body: meta.reportGoal || ''
    });
  }

  const metricGroups = chunks(Array.isArray(data.metrics) ? data.metrics : [], 4);
  if (metricGroups[0]?.length) {
    firstBlocks.push({
      type: 'metrics',
      name: '关键指标',
      columns: metricGroups[0].length,
      items: metricGroups[0]
    });
  }

  pages.push({
    title: data.title || 'AI 双周会汇报',
    subtitle: data.subtitle || meta.reportGoal || '',
    layout: 'cover-summary',
    blocks: firstBlocks
  });

  metricGroups.slice(1).forEach((items, index) => {
    pages.push({
      title: '关键指标（续 ' + (index + 1) + '）',
      subtitle: '区分目标、实际结果与待采集基线。',
      layout: 'three-card-matrix',
      blocks: [{ type: 'metrics', name: '关键指标续页', columns: items.length, items }]
    });
  });

  chunks(Array.isArray(data.progress) ? data.progress : [], 3).forEach((items, index) => {
    pages.push({
      title: index === 0 ? '本期推进与证据' : '本期推进与证据（续 ' + index + '）',
      subtitle: '每项进展说明动作、产出、证据和意义。',
      layout: 'three-card-matrix',
      blocks: [{
        type: 'cards',
        name: '本期推进',
        columns: 3,
        items: items.map((item) => cardFromBusinessItem(item, 'PROGRESS'))
      }]
    });
  });

  const issues = [
    ...(Array.isArray(data.tradeoffs) ? data.tradeoffs.map((item) => ({ ...item, label: item.label || 'TRADEOFF' })) : []),
    ...(Array.isArray(data.risks) ? data.risks.map((item) => ({ ...item, label: item.label || 'RISK', tone: item.tone || 'risk' })) : [])
  ];
  chunks(issues, 3).forEach((items, index) => {
    pages.push({
      title: index === 0 ? '问题、风险与取舍' : '问题、风险与取舍（续 ' + index + '）',
      subtitle: '明确边界、影响和处理选择。',
      layout: 'three-card-matrix',
      blocks: [{
        type: 'cards',
        name: '问题与取舍',
        columns: 3,
        items: items.map((item) => cardFromBusinessItem(item, item.label || 'RISK'))
      }]
    });
  });

  chunks(Array.isArray(data.nextActions) ? data.nextActions : [], 3).forEach((items, index) => {
    const blocks = [{
      type: 'cards',
      name: '下期动作',
      columns: 3,
      items: items.map((item) => cardFromBusinessItem(item, 'NEXT'))
    }];
    if (index === 0 && Array.isArray(data.asks) && data.asks.length) {
      blocks.push({
        type: 'path',
        name: '协作诉求',
        items: data.asks.map((item) => item.title || item.body || String(item))
      });
    }
    pages.push({
      title: index === 0 ? '下一周期验证动作' : '下一周期验证动作（续 ' + index + '）',
      subtitle: '每项动作包含责任人、期限、交付物或验收口径。',
      layout: 'timeline-evidence',
      blocks
    });
  });

  return pages;
}

function autoPages(data) {
  const narrativeMode = data.meta?.narrativeMode || 'status-summary';
  return narrativeMode === 'b-end-validation' ? bEndValidationPages(data) : statusSummaryPages(data);
}

function expandPages(pages, format) {
  if (format === 'long-scroll') {
    return pages.map((page) => ({
      ...page,
      blocks: (Array.isArray(page.blocks) ? page.blocks : []).map((block) => {
        if (!Array.isArray(block.items) || !['cards', 'metrics'].includes(block.type)) return block;
        return {
          ...block,
          columns: clampColumns(block.columns, block.type === 'metrics' ? 4 : 3)
        };
      })
    }));
  }
  const expanded = [];
  pages.forEach((page) => {
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    const repeaters = blocks.filter((block) => {
      if (!Array.isArray(block.items)) return false;
      return block.type === 'cards' || block.type === 'metrics';
    });
    const fixed = blocks.filter((block) => !repeaters.includes(block));
    const groups = repeaters.map((block) => {
      const columns = clampColumns(block.columns, block.type === 'metrics' ? 4 : 3);
      return chunks(block.items, columns).map((items) => ({ ...block, columns, items }));
    });
    const pageCount = Math.max(1, ...groups.map((group) => group.length));
    for (let index = 0; index < pageCount; index += 1) {
      const continued = index > 0;
      expanded.push({
        ...page,
        title: continued ? (page.title || '页面') + '（续 ' + index + '）' : page.title,
        blocks: [
          ...(continued ? [] : fixed),
          ...groups.map((group) => group[index]).filter(Boolean)
        ]
      });
    }
  });
  return expanded;
}

function toneClass(tone) {
  return TONES.has(tone) && tone !== 'primary' ? ' tone-' + tone : '';
}

function renderCard(item, blockId) {
  const status = STATUS.has(item.status) ? item.status : '';
  const statusHtml = status
    ? '<span class="status mono" data-status="' + escapeHtml(status) + '">' + escapeHtml(status) + '</span>'
    : '';
  const metaHtml = item.meta ? '<p class="card-meta">' + escapeHtml(item.meta) + '</p>' : '';
  return [
    '<article class="card' + toneClass(item.tone) + '" data-figma-block="' + escapeHtml(blockId) + '">',
    '<div class="card-header">',
    '<span class="card-label mono">' + escapeHtml(item.label || 'ITEM') + '</span>',
    statusHtml,
    '</div>',
    '<h3>' + escapeHtml(item.title || '待确认') + '</h3>',
    '<p>' + escapeHtml(item.body || '内容待确认') + '</p>',
    metaHtml,
    '</article>'
  ].join('');
}

function renderMetric(item, blockId) {
  const kind = ['target', 'actual', 'baseline'].includes(item.kind) ? item.kind : 'baseline';
  const source = item.source || '';
  const asOf = item.asOf || '';
  const meta = kind === 'target'
    ? 'TARGET'
    : kind === 'actual'
      ? [source, asOf].filter(Boolean).join(' · ')
      : '待采集基线';
  return [
    '<article class="metric" data-figma-block="' + escapeHtml(blockId) + '"',
    ' data-metric-kind="' + escapeHtml(kind) + '"',
    ' data-source="' + escapeHtml(source) + '"',
    ' data-as-of="' + escapeHtml(asOf) + '">',
    '<div class="metric-value">' + escapeHtml(item.value || (kind === 'baseline' ? '待采集' : '待确认')) + '</div>',
    '<div class="metric-label">' + escapeHtml(item.label || '指标') + '</div>',
    '<div class="metric-meta">' + escapeHtml(meta) + '</div>',
    '</article>'
  ].join('');
}

function renderBlock(block, pageNumber, blockIndex) {
  if (!BLOCK_TYPES.has(block.type)) {
    throw new Error('unsupported block type: ' + block.type);
  }
  const name = String(block.name || '内容块').trim();
  const baseId = String(pageNumber).padStart(2, '0') + ' / ' + name + ' / ' + String(blockIndex + 1).padStart(2, '0');
  if (block.type === 'statement') {
    return [
      '<section class="block statement' + toneClass(block.tone) + '" data-figma-block="' + escapeHtml(baseId) + '">',
      '<div class="block-label mono">' + escapeHtml(block.label || 'SUMMARY') + '</div>',
      '<h2>' + escapeHtml(block.title || '结论待确认') + '</h2>',
      '<p>' + escapeHtml(block.body || '') + '</p>',
      '</section>'
    ].join('');
  }
  if (block.type === 'note') {
    return [
      '<section class="block note" data-figma-block="' + escapeHtml(baseId) + '">',
      '<div class="block-label mono">' + escapeHtml(block.label || 'NOTE') + '</div>',
      '<h2>' + escapeHtml(block.title || '待确认') + '</h2>',
      '<p>' + escapeHtml(block.body || '') + '</p>',
      '</section>'
    ].join('');
  }
  if (block.type === 'path') {
    const items = Array.isArray(block.items) ? block.items : [];
    return [
      '<section class="path" data-figma-block="' + escapeHtml(baseId) + '">',
      items.map((item, index) => {
        const arrow = index < items.length - 1 ? '<span class="path-arrow">→</span>' : '';
        return '<span>' + escapeHtml(typeof item === 'string' ? item : item.title || item.label || '') + '</span>' + arrow;
      }).join(''),
      '</section>'
    ].join('');
  }
  const items = Array.isArray(block.items) ? block.items : [];
  const columns = clampColumns(block.columns, block.type === 'metrics' ? 4 : 3);
  const childHtml = items.map((item, index) => {
    const childId = baseId + ' / ' + String(index + 1).padStart(2, '0') + ' ' + (item.title || item.label || '项目');
    return block.type === 'metrics' ? renderMetric(item, childId) : renderCard(item, childId);
  }).join('');
  return '<section class="' + block.type + ' cols-' + columns + '" data-figma-block="' + escapeHtml(baseId) + '">' + childHtml + '</section>';
}

function renderPage(page, index, total, meta) {
  const number = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  return [
    '<main class="page" data-page="' + String(index + 1).padStart(2, '0') + '" data-layout="' + escapeHtml(page.layout || 'single-focus') + '">',
    '<div class="page-shell">',
    '<header class="report-header" data-figma-group="01 页头">',
    '<div class="title-group">',
    '<div class="eyebrow mono">&gt; ' + escapeHtml(meta.eyebrow || (meta.brandName || 'AI Design') + ' / biweekly.md') + '</div>',
    '<h1>' + escapeHtml(page.title || '页面标题待确认') + '</h1>',
    '<p class="subtitle">' + escapeHtml(page.subtitle || '') + '</p>',
    '</div>',
    '<div class="meta">',
    '<span class="tag">' + escapeHtml(meta.period || '周期待确认') + '</span>',
    '<span class="tag">' + escapeHtml(meta.currentStage || '阶段待确认') + '</span>',
    '</div>',
    '</header>',
    '<section class="stage" data-figma-group="02 核心内容">',
    blocks.map((block, blockIndex) => renderBlock(block, index + 1, blockIndex)).join(''),
    '</section>',
    '<footer class="report-footer" data-figma-group="99 页脚">',
    '<span>' + escapeHtml(meta.footerLeft || meta.brandName || 'AI 双周会') + '</span>',
    '<span class="page-number mono" data-page-number="' + number + '">' + number + '</span>',
    '</footer>',
    '</div>',
    '</main>'
  ].join('');
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  fail('usage: node scripts/render-report.mjs <input.json> <output.html>');
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (error) {
  fail('cannot read input JSON: ' + error.message);
}

const meta = data.meta || {};
const format = meta.format || 'slides';
if (!FORMATS.has(format)) fail('unsupported format: ' + format);
const narrativeMode = meta.narrativeMode || 'status-summary';
if (!NARRATIVE_MODES.has(narrativeMode)) fail('unsupported narrativeMode: ' + narrativeMode);
const sampleArchetype = meta.sampleArchetype || '';
if (sampleArchetype && !SAMPLE_ARCHETYPES.has(sampleArchetype)) {
  fail('unsupported sampleArchetype: ' + sampleArchetype);
}
const rawPages = Array.isArray(data.pages) && data.pages.length ? data.pages : autoPages(data);
let pages;
try {
  pages = expandPages(rawPages, format);
  pages.forEach((page) => {
    (page.blocks || []).forEach((block) => {
      if (!BLOCK_TYPES.has(block.type)) throw new Error('unsupported block type: ' + block.type);
    });
  });
} catch (error) {
  fail(error.message);
}

if (!pages.length) fail('no pages generated');
if (Number.isInteger(meta.pageBudget) && pages.length > meta.pageBudget) {
  console.warn('render-report: generated ' + pages.length + ' pages, exceeding pageBudget ' + meta.pageBudget + '; content was preserved');
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(scriptDirectory, '..', 'assets', 'template.html');
const template = fs.readFileSync(templatePath, 'utf8');
const html = template
  .replace('{{REPORT_TITLE}}', escapeHtml(data.title || 'AI 双周会汇报'))
  .replace('{{BRAND_COLOR}}', safeColor(meta.brandColor))
  .replace('{{BODY_CLASS}}', format === 'long-scroll' ? 'format-long-scroll' : 'format-slides')
  .replace('{{REPORT_FORMAT}}', format)
  .replace('{{NARRATIVE_MODE}}', narrativeMode)
  .replace('{{SAMPLE_ARCHETYPE}}', escapeHtml(sampleArchetype))
  .replace('{{REFERENCE_SAMPLES}}', escapeHtml(Array.isArray(meta.referenceSamples) ? meta.referenceSamples.join(' | ') : ''))
  .replace('{{PAGES}}', pages.map((page, index) => renderPage(page, index, pages.length, meta)).join('\n'));

fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log('Rendered ' + pages.length + ' ' + (format === 'long-scroll' ? 'section(s)' : 'page(s)') + ' to ' + path.resolve(outputPath));
