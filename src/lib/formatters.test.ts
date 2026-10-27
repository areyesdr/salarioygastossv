import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUSD,
  formatSignedUSD,
  parseUSDCurrency,
  formatHours,
} from './formatters.ts';

describe('formatters - Formato Monetario USA (USD)', () => {
  it('formats standard US currency with dollar prefix, thousands comma, and 2 decimals', () => {
    assert.equal(formatUSD(408.8), '$408.80');
    assert.equal(formatUSD(1000), '$1,000.00');
    assert.equal(formatUSD(1500), '$1,500.00');
    assert.equal(formatUSD(1234567.89), '$1,234,567.89');
    assert.equal(formatUSD(0), '$0.00');
  });

  it('formats negative amounts with standard US negative sign prefix', () => {
    assert.equal(formatUSD(-30), '-$30.00');
    assert.equal(formatUSD(-1250.75), '-$1,250.75');
  });

  it('formats signed USD values correctly', () => {
    assert.equal(formatSignedUSD(150), '+$150.00');
    assert.equal(formatSignedUSD(-50), '-$50.00');
    assert.equal(formatSignedUSD(0), '$0.00');
  });

  it('parses US currency inputs and European comma decimals cleanly', () => {
    assert.equal(parseUSDCurrency('$1,500.00'), 1500);
    assert.equal(parseUSDCurrency('1,500.50'), 1500.5);
    assert.equal(parseUSDCurrency('408.80'), 408.8);
    assert.equal(parseUSDCurrency('408,80'), 408.8);
    assert.equal(parseUSDCurrency(''), 0);
    assert.equal(parseUSDCurrency('abc'), 0);
  });

  it('formats hours and minutes cleanly', () => {
    assert.equal(formatHours(0), '0h');
    assert.equal(formatHours(0.5), '30 min');
    assert.equal(formatHours(8), '8h');
    assert.equal(formatHours(8.5), '8h 30m');
  });
});
