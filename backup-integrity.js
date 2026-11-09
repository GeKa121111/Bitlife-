(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HayahBackupIntegrity = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  function isRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    // Accept plain objects created in another JavaScript realm (for example, the isolated VM used by regression tests).
    return prototype === null || Object.getPrototypeOf(prototype) === null;
  }

  function stableJson(value) {
    if (value === null || typeof value !== 'object') {
      const serialized = JSON.stringify(value);
      return serialized === undefined ? 'null' : serialized;
    }
    if (Array.isArray(value)) {
      return '[' + value.map(item => stableJson(item)).join(',') + ']';
    }
    const keys = Object.keys(value).filter(key => value[key] !== undefined).sort();
    return '{' + keys.map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  }

  function checksumBundle(bundle) {
    if (!isRecord(bundle)) return null;
    const payload = Object.create(null);
    Object.keys(bundle).forEach(key => {
      if (key !== 'integrity') payload[key] = bundle[key];
    });
    const source = stableJson(payload);
    let hash = 0x811c9dc5;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function createIntegrity(bundle) {
    const checksum = checksumBundle(bundle);
    if (!checksum) throw new TypeError('invalid-backup-bundle');
    return { algorithm: 'FNV-1a-32', checksum };
  }

  function verifyIntegrity(bundle) {
    if (!isRecord(bundle)) return { present: false, valid: false, status: 'invalid-bundle' };
    if (!Object.prototype.hasOwnProperty.call(bundle, 'integrity')) {
      if (bundle.integrityRequired === true) {
        return { present: false, valid: false, status: 'missing' };
      }
      return { present: false, valid: true, status: 'legacy' };
    }
    const integrity = bundle.integrity;
    if (!isRecord(integrity) || integrity.algorithm !== 'FNV-1a-32' ||
        !/^[a-f0-9]{8}$/i.test(String(integrity.checksum || ''))) {
      return { present: true, valid: false, status: 'unsupported' };
    }
    const actual = checksumBundle(bundle);
    const expected = String(integrity.checksum).toLowerCase();
    const valid = actual === expected;
    return { present: true, valid, status: valid ? 'verified' : 'mismatch', actual, expected };
  }

  return Object.freeze({ stableJson, checksumBundle, createIntegrity, verifyIntegrity });
});
