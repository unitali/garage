import test from 'node:test';
import assert from 'node:assert/strict';
import { backupData, backupId, backupKind } from '../src/lib/backup.ts';

test('backup: tipo pelo caminho, só caminhos do app', () => {
  assert.equal(backupKind('.'), 'prefs');
  assert.equal(backupKind('vehicles/v1'), 'vehicles');
  assert.equal(backupKind('vehicles/v1/entries/e1'), 'entries');
  assert.equal(backupKind('vehicles/v1/reminders/r1'), 'reminders');
  for (const p of ['..', '../x', 'vehicles/v1/fotos/f', 'segredos/x', 'vehicles/a/b']) assert.equal(backupKind(p), null, p);
});

test('backup: guarda só os campos que o app usa', () => {
  const v = { name: 'Palio', type: 'carro', initialOdometer: 1, createdAt: 2, odometerUpdatedAt: 3 };
  assert.deepEqual(backupData('vehicles/v1', v), { name: 'Palio', type: 'carro', initialOdometer: 1, createdAt: 2 });
  assert.throws(() => backupData('../x', v));
});

test('backup: id é a data de hoje em UTC + número da cópia', () => {
  assert.equal(backupId(new Date('2026-11-04T23:30:00-03:00'), 1), '20261105-1'); // já é dia 5 em UTC
  assert.equal(backupId(new Date('2026-01-09T10:00:00Z'), 3), '20260109-3');
});
