import { test } from 'node:test';
import assert from 'node:assert/strict';
import { periodLabel } from '../src/lib/format.ts';

test('prazo em dias no jeito de falar', () => {
  assert.equal(periodLabel(7), '1 semana');
  assert.equal(periodLabel(14), '2 semanas');
  assert.equal(periodLabel(30), '1 mês');
  assert.equal(periodLabel(90), '3 meses');
  assert.equal(periodLabel(180), '6 meses');
  assert.equal(periodLabel(10), '10 dias');
});
