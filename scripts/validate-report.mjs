#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error('validate-report: ' + message);
  process.exit(1);
}

const reportPath = process.argv[2];
if (!reportPath) {
  fail('usage: node scripts/validate-report.mjs <report.html>');
}

let html;
try {
  html = fs.readFileSync(reportPath, 'utf8');
} catch (error) {
  fail('cannot read report: ' + error.message);
}

const errors = [];
const warnings = [];
const pages = [...html.matchAll(/<main class="page" data-page="(\d{2})"/g)].map((match) => match[1]);
const pageNumbers = [...html.matchAll(/data-page-number="(\d{2} \/ \d{2})"/g)].map((match) => match[1]);
const blockNames = [...html.matchAll(/data-figma-block="([^"]+)"/g)].map((match) => match[1].trim());
const expectedTotal = String(pages.length).padStart(2, '0');
const format = html.match(/data-report-format="([^"]+)"/)?.[1] || 'slides';
const narrativeMode = html.match(/data-narrative-mode="([^"]+)"/)?.[1] || 'status-summary';
const sampleArchetype = html.match(/data-sample-archetype="([^"]*)"/)?.[1] || '';
const sampleArchetypes = new Set(['strategy-progress', 'capability-roadmap', 'capability-system', 'portfolio-operations', 'b-end-transformation', 'gallery-case']);
const narrativeModes = new Set(['status-summary', 'b-end-validation']);

if (!pages.length) errors.push('no .page nodes found');
if (!['slides', 'long-scroll'].includes(format)) errors.push('unsupported report format: ' + format);
if (!narrativeModes.has(narrativeMode)) errors.push('unsupported narrative mode: ' + narrativeMode);
if (sampleArchetype && !sampleArchetypes.has(sampleArchetype)) errors.push('unsupported sample archetype: ' + sampleArchetype);
if (!/\.page\s*\{[\s\S]*?width:\s*1920px;[\s\S]*?height:\s*1080px;/m.test(html)) {
  errors.push('base .page is not explicitly fixed to 1920x1080');
}
if (format === 'long-scroll') {
  if (!/\.format-long-scroll\s+\.page\s*\{[\s\S]*?height:\s*auto;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*visible;/m.test(html)) {
    errors.push('long-scroll pages are not configured for auto height');
  }
  if (!/body\.format-long-scroll\s*\{[\s\S]*?width:\s*1920px;[\s\S]*?padding:\s*0;/m.test(html)) {
    errors.push('long-scroll body is not a continuous 1920px canvas');
  }
}

pages.forEach((page, index) => {
  const expected = String(index + 1).padStart(2, '0');
  if (page !== expected) errors.push('page sequence mismatch: expected ' + expected + ', got ' + page);
});

if (pageNumbers.length !== pages.length) {
  errors.push('page number count does not match page count');
}
pageNumbers.forEach((number, index) => {
  const expected = String(index + 1).padStart(2, '0') + ' / ' + expectedTotal;
  if (number !== expected) errors.push('invalid page number: expected ' + expected + ', got ' + number);
});

if (!blockNames.length) errors.push('no data-figma-block attributes found');
if (blockNames.some((name) => !name)) errors.push('empty data-figma-block found');
const duplicateBlocks = [...new Set(blockNames.filter((name, index) => blockNames.indexOf(name) !== index))];
if (duplicateBlocks.length) errors.push('duplicate data-figma-block: ' + duplicateBlocks.join(', '));

if (/\{\{[A-Z0-9_]+\}\}/.test(html)) errors.push('unreplaced template variable found');
if (/\bLorem\b/i.test(html)) errors.push('Lorem placeholder found');
if (/\bXX%\b/i.test(html)) errors.push('XX% placeholder found');
if (/xx月xx日/i.test(html)) errors.push('date placeholder found');

const fontSizes = [...html.matchAll(/font-size:\s*(\d+)px/g)].map((match) => Number(match[1]));
if (fontSizes.some((size) => size < 20)) errors.push('font size below 20px found');
if (fontSizes.some((size) => size >= 20 && size < 24)) {
  warnings.push('20–23px font found; confirm it is used only for a non-narrative status label');
}

const actualMetrics = [...html.matchAll(/<article class="metric"[^>]*data-metric-kind="actual"[^>]*>/g)].map((match) => match[0]);
actualMetrics.forEach((tag, index) => {
  if (!/data-source="[^"]+"/.test(tag) || !/data-as-of="[^"]+"/.test(tag)) {
    errors.push('actual metric ' + (index + 1) + ' is missing source or as-of date');
  }
});

if (!/@media print/.test(html)) warnings.push('print styles are missing');

if (warnings.length) {
  warnings.forEach((warning) => console.warn('Warning: ' + warning));
}
if (errors.length) {
  errors.forEach((error) => console.error('Error: ' + error));
  process.exit(1);
}

console.log('Validation passed: ' + path.resolve(reportPath));
console.log('Format: ' + format + '; Narrative: ' + narrativeMode + '; ' + (format === 'long-scroll' ? 'Sections' : 'Pages') + ': ' + pages.length + '; Figma blocks: ' + blockNames.length);
