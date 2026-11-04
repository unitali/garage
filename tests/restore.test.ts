import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error script .mjs sem tipos
import { kindOf, toWrites } from '../scripts/restore-account.mjs';

test('restaurar: cada cópia volta para o mesmo caminho em users/{uid}', () => {
  const data = { mapValue: { fields: { name: { stringValue: 'Palio' } } } };
  const writes = toWrites(
    [
      { path: '.', data: { mapValue: { fields: { alertKm: { integerValue: '1000' } } } } },
      { path: 'vehicles/v1', data },
      { path: 'vehicles/v1/entries/e1', data: { mapValue: {} } },
    ],
    'garage-22523',
    'novo',
  );
  const base = 'projects/garage-22523/databases/(default)/documents/users/novo';
  assert.deepEqual(
    writes.map((w: { update: { name: string } }) => w.update.name),
    [base, `${base}/vehicles/v1`, `${base}/vehicles/v1/entries/e1`],
  );
  assert.deepEqual(writes[1].update.fields, data.mapValue.fields);
  assert.deepEqual(writes[2].update.fields, {}); // documento vazio continua existindo
  assert.deepEqual(['.', 'vehicles/v1', 'vehicles/v1/reminders/r1'].map(kindOf), ['perfil', 'vehicles', 'reminders']);
});

test('restaurar: recusa caminho que não é do app', () => {
  const bad = ['..', '../outro/vehicles/v1', 'vehicles/v1/../../x', 'segredos/x', 'vehicles/v1/fotos/f1', 'vehicles//entries/e', '/vehicles/v1', '', 'vehicles/v1/entries/e1/x/y'];
  for (const path of bad) assert.throws(() => toWrites([{ path, data: {} }], 'p', 'novo'), /Caminho inválido/, path);
  assert.throws(() => toWrites([{ path: '.', data: {} }], 'p', '../x'), /uid inválido/);
});
