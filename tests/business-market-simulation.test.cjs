'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function scanDeclarationEnd(source, start, stopAtSemicolon) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth++;
    else if (char === '}' || char === ']' || char === ')') depth--;
    else if (stopAtSemicolon && char === ';' && depth === 0) return index + 1;
  }
  return -1;
}

function extractFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected app function ' + name);
  const bodyStart = app.indexOf('{', start);
  assert.notEqual(bodyStart, -1, 'expected function body for ' + name);
  const end = scanDeclarationEnd(app, bodyStart, false);
  assert.notEqual(end, -1, 'expected function end for ' + name);
  return app.slice(start, end);
}

function extractDeclaration(name) {
  const start = app.indexOf('const ' + name + ' =');
  assert.notEqual(start, -1, 'expected app declaration ' + name);
  const end = scanDeclarationEnd(app, start, true);
  assert.notEqual(end, -1, 'expected declaration end for ' + name);
  return app.slice(start, end);
}

const declarations = [
  'BUSINESS_PRODUCT_CATALOG',
  'BUSINESS_INDUSTRY_PROFILES',
  'BUSINESS_RIVAL_SECTORS',
  'clamp'
].map(extractDeclaration);

const runtimeFunctions = [
  'businessRivalSectorKey',
  'businessRivalHash',
  'businessRivalIdentity',
  'createBusinessRivals',
  'normalizeBusinessRivals',
  'advanceBusinessRivals',
  'summarizeBusinessRivals',
  'reconcileBusinessRivalShares',
  'businessIndustryProfile',
  'businessMarketSnapshot',
  'businessProductMarketSnapshot',
  'simulateBusinessProducts'
].map(extractFunction);

const harnessSource = String.raw