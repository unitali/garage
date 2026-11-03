import test from 'node:test';
import assert from 'node:assert/strict';
import { sameDoc } from '../src/lib/same.ts';

test('salvar sem mudar nada não grava (ignora id, ordem das chaves e undefined)', () => {
  const saved = { id: 'e1', date: '2026-11-01', amount: 208.2, items: [{ category: 'Óleo', amount: 10 }], fullTank: true };
  assert.equal(sameDoc(saved, { fullTank: true, amount: 208.2, date: '2026-11-01', items: [{ amount: 10, category: 'Óleo' }], title: undefined }), true);
  assert.equal(sameDoc(saved, { date: '2026-11-01', amount: 208.3, items: [{ category: 'Óleo', amount: 10 }], fullTank: true }), false);
  assert.equal(sameDoc(saved, { date: '2026-11-01', amount: 208.2, fullTank: true }), false); // tirar um campo também é mudança
  assert.equal(sameDoc(null, { a: 1 }), false); // novo: sempre grava
});

test('merge: só os campos enviados contam', () => {
  const vehicle = { id: 'v1', name: 'Palio', odometer: 1000, plate: 'ABC1D23' };
  assert.equal(sameDoc(vehicle, { name: 'Palio', odometer: 1000 }, true), true);
  assert.equal(sameDoc(vehicle, { name: 'Palio 2011', odometer: 1000 }, true), false);
});
