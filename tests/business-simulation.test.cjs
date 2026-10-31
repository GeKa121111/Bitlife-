'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function extractFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, 'expected app function ' + name);
  const end = app.indexOf('\nfunction ', start + 1);
  assert.notEqual(end, -1, 'expected following function after ' + name);
  return app.slice(start, end);
}

const runtimeFunctions = [
  'businessTaxLiability',
  'businessUsesSeparateTreasury',
  'businessTreasuryBalance',
  'adjustBusinessTreasury',
  'businessCreditBalance',
  'recordBusinessFinancialReport',
  'simulateBusinessEntityYear'
].map(extractFunction).join('\n\n');

const harnessSource = String.raw