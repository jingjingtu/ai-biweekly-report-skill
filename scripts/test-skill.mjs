#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const skillDirectory = path.resolve(scriptDirectory, '..');
const skillPath = path.join(skillDirectory, 'SKILL.md');
const content = fs.readFileSync(skillPath, 'utf8');
const errors = [];

const visualReferences = [
  ['assets/visual-references/other-team/01-strategy-progress.png', 1920, 6251],
  ['assets/visual-references/other-team/02-capability-roadmap.png', 1920, 6667],
  ['assets/visual-references/other-team/03-capability-system.png', 1920, 8919],
  ['assets/visual-references/other-team/04-portfolio-operations.png', 1920, 9245],
  ['assets/visual-references/other-team/05-b-end-transformation.png', 1920, 10004],
  ['assets/visual-references/b-end-history/01-background.png', 1920, 13327],
  ['assets/visual-references/b-end-history/02-experiment-loop.png', 1920, 10654],
  ['assets/visual-references/b-end-history/03-system-overview.png', 1920, 8925],
  ['assets/visual-references/b-end-history/04-skill-architecture.png', 1920, 7189],
  ['assets/visual-references/b-end-history/05-monthly-validation.png', 1920, 13327],
  ['assets/visual-references/b-end-history/06-cross-platform.png', 1920, 11038],
  ['assets/visual-references/b-end-history/07-content-area.png', 1920, 12841],
  ['assets/visual-references/user-style-extensions/01-gradient-capability-sink.png', 1402, 1298],
  ['assets/visual-references/user-style-extensions/02-gradient-delivery-flow.png', 1014, 1460],
  ['assets/visual-references/user-style-extensions/03-branch-connector-logic.png', 1342, 618],
  ['assets/visual-references/user-style-extensions/04-gradient-evidence-cards.png', 834, 1400],
  ['assets/visual-references/user-style-extensions/05-skill-coverage-network.png', 1062, 1610],
  ['assets/visual-references/user-style-extensions/06-timeline-skill-cluster.png', 970, 1278]
];

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a' || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a valid PNG');
  }
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatter) {
  errors.push('SKILL.md frontmatter is missing');
} else {
  const name = frontmatter[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    errors.push('invalid skill name');
  }
  if (!description || description.length > 1024 || /[<>]/.test(description)) {
    errors.push('invalid skill description');
  }
}

if (/^\s*\[TODO:[^\]]*\]\s*$/m.test(content)) errors.push('unfinished TODO placeholder found');

visualReferences.forEach(([relativePath, expectedWidth, expectedHeight]) => {
  const filePath = path.join(skillDirectory, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push('missing visual reference: ' + relativePath);
    return;
  }
  try {
    const [width, height] = readPngDimensions(filePath);
    if (width !== expectedWidth || height !== expectedHeight) {
      errors.push('visual reference dimensions changed: ' + relativePath + ' expected ' + expectedWidth + 'x' + expectedHeight + ', got ' + width + 'x' + height);
    }
  } catch (error) {
    errors.push('invalid visual reference ' + relativePath + ': ' + error.message);
  }
});

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'tmp') return [];
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

markdownFiles(skillDirectory).forEach((documentPath) => {
  const document = fs.readFileSync(documentPath, 'utf8');
  const localLinks = [...document.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target && !/^[a-z]+:/i.test(target));
  localLinks.forEach((target) => {
    if (!fs.existsSync(path.resolve(path.dirname(documentPath), target))) {
      errors.push('missing linked file in ' + path.relative(skillDirectory, documentPath) + ': ' + target);
    }
  });
});

if (errors.length) {
  errors.forEach((error) => console.error('Error: ' + error));
  process.exit(1);
}

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-biweekly-report-test-'));
const outputPath = path.join(temporaryDirectory, 'sample-report.html');
const render = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'render-report.mjs'),
  path.join(skillDirectory, 'examples', 'sample-report.json'),
  outputPath
], { encoding: 'utf8' });
process.stdout.write(render.stdout);
process.stderr.write(render.stderr);
if (render.status !== 0) process.exit(render.status || 1);

const validate = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  outputPath
], { encoding: 'utf8' });
process.stdout.write(validate.stdout);
process.stderr.write(validate.stderr);
if (validate.status !== 0) process.exit(validate.status || 1);

const html = fs.readFileSync(outputPath, 'utf8');
if (html.includes('<特殊字符>')) {
  console.error('Error: special characters were not escaped');
  process.exit(1);
}
if (!html.includes('&lt;特殊字符&gt;')) {
  console.error('Error: escaped special-character sample is missing');
  process.exit(1);
}

const sample = JSON.parse(fs.readFileSync(path.join(skillDirectory, 'examples', 'sample-report.json'), 'utf8'));
sample.meta.pageBudget = 12;
sample.progress = Array.from({ length: 7 }, (_, index) => ({
  title: '密集进展 ' + (index + 1),
  action: '执行动作',
  output: '交付物',
  evidence: '验证记录 ' + (index + 1),
  meaning: '形成可追溯结果',
  status: index % 2 === 0 ? 'DONE' : 'VERIFY',
  tone: index % 2 === 0 ? 'engineering' : 'validation'
}));
const denseInputPath = path.join(temporaryDirectory, 'dense-input.json');
const denseOutputPath = path.join(temporaryDirectory, 'dense-report.html');
fs.writeFileSync(denseInputPath, JSON.stringify(sample, null, 2), 'utf8');
const denseRender = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'render-report.mjs'),
  denseInputPath,
  denseOutputPath
], { encoding: 'utf8' });
process.stdout.write(denseRender.stdout);
process.stderr.write(denseRender.stderr);
if (denseRender.status !== 0) process.exit(denseRender.status || 1);

const denseValidate = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  denseOutputPath
], { encoding: 'utf8' });
process.stdout.write(denseValidate.stdout);
process.stderr.write(denseValidate.stderr);
if (denseValidate.status !== 0) process.exit(denseValidate.status || 1);

const denseHtml = fs.readFileSync(denseOutputPath, 'utf8');
const densePages = [...denseHtml.matchAll(/<main class="page"/g)].length;
if (densePages < 6 || !denseHtml.includes(String(densePages).padStart(2, '0') + ' / ' + String(densePages).padStart(2, '0'))) {
  console.error('Error: dense input did not split into consistently numbered pages');
  process.exit(1);
}

const invalidMetricPath = path.join(temporaryDirectory, 'invalid-metric.html');
fs.writeFileSync(
  invalidMetricPath,
  html.replace(/data-metric-kind="actual" data-source="[^"]+" data-as-of="[^"]+"/, 'data-metric-kind="actual" data-source="" data-as-of=""'),
  'utf8'
);
const invalidMetricValidation = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  invalidMetricPath
], { encoding: 'utf8' });
if (invalidMetricValidation.status === 0) {
  console.error('Error: invalid actual metric unexpectedly passed validation');
  process.exit(1);
}

const undersizedTextPath = path.join(temporaryDirectory, 'undersized-text.html');
fs.writeFileSync(
  undersizedTextPath,
  html.replace('font-size: 24px;', 'font-size: 23px;'),
  'utf8'
);
const undersizedTextValidation = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  undersizedTextPath
], { encoding: 'utf8' });
if (undersizedTextValidation.status === 0) {
  console.error('Error: 23px visible text unexpectedly passed validation');
  process.exit(1);
}

const longScrollInput = JSON.parse(JSON.stringify(sample));
longScrollInput.meta.format = 'long-scroll';
longScrollInput.meta.sampleArchetype = 'strategy-progress';
longScrollInput.pages = [{
  title: '标准样例长卷测试',
  subtitle: '同一章节允许重复卡片自然换行，不拆成多个 16:9 页面。',
  layout: 'portfolio-progress',
  blocks: [{
    type: 'cards',
    name: '组合进度',
    columns: 3,
    items: Array.from({ length: 7 }, (_, index) => ({
      label: index < 3 ? 'DONE' : 'NEXT',
      title: '能力条目 ' + (index + 1),
      body: '用于验证长卷章节保持连续并允许自然增高。',
      status: index < 3 ? 'DONE' : 'NEXT',
      tone: index % 2 === 0 ? 'engineering' : 'validation'
    }))
  }]
}];
const longScrollInputPath = path.join(temporaryDirectory, 'long-scroll-input.json');
const longScrollOutputPath = path.join(temporaryDirectory, 'long-scroll-report.html');
fs.writeFileSync(longScrollInputPath, JSON.stringify(longScrollInput, null, 2), 'utf8');
const longScrollRender = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'render-report.mjs'),
  longScrollInputPath,
  longScrollOutputPath
], { encoding: 'utf8' });
process.stdout.write(longScrollRender.stdout);
process.stderr.write(longScrollRender.stderr);
if (longScrollRender.status !== 0) process.exit(longScrollRender.status || 1);

const longScrollValidation = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  longScrollOutputPath
], { encoding: 'utf8' });
process.stdout.write(longScrollValidation.stdout);
process.stderr.write(longScrollValidation.stderr);
if (longScrollValidation.status !== 0) process.exit(longScrollValidation.status || 1);

const longScrollHtml = fs.readFileSync(longScrollOutputPath, 'utf8');
const longScrollSections = [...longScrollHtml.matchAll(/<main class="page"/g)].length;
if (longScrollSections !== 1 || !longScrollHtml.includes('data-report-format="long-scroll"') || !longScrollHtml.includes('data-sample-archetype="strategy-progress"')) {
  console.error('Error: long-scroll format did not preserve a single continuous section');
  process.exit(1);
}

const bEndOutputPath = path.join(temporaryDirectory, 'sample-b-end-report.html');
const bEndRender = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'render-report.mjs'),
  path.join(skillDirectory, 'examples', 'sample-b-end-report.json'),
  bEndOutputPath
], { encoding: 'utf8' });
process.stdout.write(bEndRender.stdout);
process.stderr.write(bEndRender.stderr);
if (bEndRender.status !== 0) process.exit(bEndRender.status || 1);

const bEndValidation = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'validate-report.mjs'),
  bEndOutputPath
], { encoding: 'utf8' });
process.stdout.write(bEndValidation.stdout);
process.stderr.write(bEndValidation.stderr);
if (bEndValidation.status !== 0) process.exit(bEndValidation.status || 1);

const bEndHtml = fs.readFileSync(bEndOutputPath, 'utf8');
const bEndSequence = [
  '本轮实验暴露了哪些问题',
  '问题背后的规则与架构缺口',
  '把本轮判断写成可执行规则',
  '复验规则是否真正生效',
  '本轮沉淀了哪些可再次调用的能力',
  '下一轮只验证尚未闭环的边界'
];
const bEndPositions = bEndSequence.map((heading) => bEndHtml.indexOf(heading));
if (!bEndHtml.includes('data-narrative-mode="b-end-validation"') || !bEndHtml.includes('本月验证进展.png | 跨设备与平台补全.png') || bEndPositions.some((position) => position < 0)) {
  console.error('Error: B-end validation narrative metadata or required sections are missing');
  process.exit(1);
}
if (bEndPositions.some((position, index) => index > 0 && position <= bEndPositions[index - 1])) {
  console.error('Error: B-end validation narrative order is incorrect');
  process.exit(1);
}
if (bEndHtml.includes('本期推进与证据')) {
  console.error('Error: B-end validation fell back to the generic progress narrative');
  process.exit(1);
}

const invalidNarrativeInput = JSON.parse(JSON.stringify(sample));
invalidNarrativeInput.meta.narrativeMode = 'unsupported-mode';
const invalidNarrativeInputPath = path.join(temporaryDirectory, 'invalid-narrative-input.json');
const invalidNarrativeOutputPath = path.join(temporaryDirectory, 'invalid-narrative-report.html');
fs.writeFileSync(invalidNarrativeInputPath, JSON.stringify(invalidNarrativeInput, null, 2), 'utf8');
const invalidNarrativeRender = spawnSync(process.execPath, [
  path.join(scriptDirectory, 'render-report.mjs'),
  invalidNarrativeInputPath,
  invalidNarrativeOutputPath
], { encoding: 'utf8' });
if (invalidNarrativeRender.status === 0) {
  console.error('Error: unsupported narrative mode unexpectedly rendered');
  process.exit(1);
}

fs.rmSync(temporaryDirectory, { recursive: true, force: true });
console.log('Skill smoke test passed');
