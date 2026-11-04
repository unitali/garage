import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPlate, plateFormat, plateHint, plateMaxLength } from '../src/lib/plates.ts';

test('placa: máscara ao digitar (Brasil)', () => {
  assert.equal(maskPlate('abc1d23'), 'ABC1D23'); // Mercosul, sem hífen
  assert.equal(maskPlate('abc1234'), 'ABC-1234'); // antiga, com hífen
  assert.equal(maskPlate('ABC1'), 'ABC1'); // ainda serve para os dois: sem hífen
  assert.equal(maskPlate('ABC12'), 'ABC-12'); // 5º é número: antiga
  assert.equal(maskPlate('abc-1d23'), 'ABC1D23'); // hífen colado em placa Mercosul some
  assert.equal(maskPlate('1ab'), 'AB'); // começa com letra: o número é ignorado
  assert.equal(maskPlate('ABCD'), 'ABC'); // 4ª posição é número
  assert.equal(maskPlate('ABC1D234'), 'ABC1D23'); // não passa do tamanho
  assert.equal(maskPlate('epw 0h11'), 'EPW0H11');
});

test('placa: formato da placa completa', () => {
  assert.equal(plateFormat('ABC1D23')?.label, 'Mercosul');
  assert.equal(plateFormat('ABC-1234')?.label, 'antiga');
  assert.equal(plateFormat('ABC1D2'), null); // incompleta
  assert.equal(plateFormat('ABC1D2X'), null);
  assert.equal(plateHint(), 'Mercosul (ABC1D23) ou antiga (ABC-1234)');
  assert.equal(plateMaxLength(), 8);
});
