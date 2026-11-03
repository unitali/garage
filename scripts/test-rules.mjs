#!/usr/bin/env node
// Testa firestore.rules sem publicar nada: a API de testes do Firebase avalia as regras do arquivo
// contra os casos abaixo (cada usuário só nos próprios dados, formato de cada documento, o resto negado).
//
//   npm run test:rules        (precisa de `firebase login` ou GOOGLE_ACCESS_TOKEN)

import { readFileSync } from 'node:fs';
import { accessToken, projectId } from './google-auth.mjs';

const U = 'dono';
const V = `users/${U}/vehicles/v1`;

const vehicle = { name: 'Palio 2011', type: 'carro', plate: 'ABC1D23', initialOdometer: 150000, odometer: 197035, createdAt: 1762000000000 };
const fuel = {
  kind: 'fuel', date: '2026-11-03', odometer: 197000, amount: 208.2, category: 'Combustível', description: '', notes: 'Posto',
  createdAt: 1762190000000, fuelType: 'Gasolina', liters: 33.1, pricePerLiter: 6.29, fullTank: true,
};
const service = {
  kind: 'service', date: '2026-11-03', odometer: null, amount: 300, category: 'Troca de óleo', description: '', notes: '',
  createdAt: 1762190000001, title: 'Revisão', items: [{ category: 'Troca de óleo', amount: 200 }, { category: 'Filtros', amount: 100 }],
};
const parcel = {
  kind: 'expense', date: '2026-12-19', odometer: null, amount: 146.35, category: 'Seguro', description: '', notes: '',
  createdAt: 1762190000002, series: { id: 's1', type: 'recurring', index: 2, count: 24 }, paid: false,
};
const reminder = { title: 'Troca de óleo', intervalKm: 10000, intervalMonths: 12, lastKm: 196300, lastDate: '2026-10-05', createdAt: 1 };
const prefs = { alertKm: 1000, alertMonths: 1, urgentKm: 200, urgentDays: 7, serviceCategories: ['Lavagem'], expenseCategories: [] };

/** [descrição, esperado, uid (null = sem login), caminho, método, dados novos?, dados atuais?] */
const CASES = [
  // o dono usa o app normalmente
  ['cria veículo', 'ALLOW', U, V, 'create', vehicle],
  ['atualiza km do veículo', 'ALLOW', U, V, 'update', { ...vehicle, odometer: 197500 }, vehicle],
  ['lê o veículo', 'ALLOW', U, V, 'get'],
  ['exclui o veículo', 'ALLOW', U, V, 'delete', null, vehicle],
  ['cria abastecimento', 'ALLOW', U, `${V}/entries/e1`, 'create', fuel],
  ['cria serviço com itens', 'ALLOW', U, `${V}/entries/e2`, 'create', service],
  ['cria parcela', 'ALLOW', U, `${V}/entries/e3`, 'create', parcel],
  ['marca parcela como paga', 'ALLOW', U, `${V}/entries/e3`, 'update', { ...parcel, paid: true }, parcel],
  ['cria lembrete', 'ALLOW', U, `${V}/reminders/r1`, 'create', reminder],
  ['lembrete só por tempo', 'ALLOW', U, `${V}/reminders/r2`, 'create', { ...reminder, intervalKm: null, lastKm: null, lastDate: null }],
  ['salva preferências', 'ALLOW', U, `users/${U}`, 'create', prefs],
  ['guarda backup ao excluir conta', 'ALLOW', U, `trash/${U}/backups/b1`, 'create', { uid: U, email: 'a@b.c', name: 'A', deletedAt: 1, docs: 3 }],
  ['guarda documento do backup', 'ALLOW', U, `trash/${U}/backups/b1/docs/d1`, 'create', { path: 'vehicles/v1', data: vehicle }],

  // ninguém mexe nos dados de outra pessoa
  ['outro usuário lê o veículo', 'DENY', 'intruso', V, 'get'],
  ['outro usuário lista os registros', 'DENY', 'intruso', `${V}/entries/e1`, 'list'],
  ['outro usuário altera o veículo', 'DENY', 'intruso', V, 'update', { ...vehicle, name: 'meu' }, vehicle],
  ['outro usuário cria registro no carro alheio', 'DENY', 'intruso', `${V}/entries/x`, 'create', fuel],
  ['outro usuário exclui registro', 'DENY', 'intruso', `${V}/entries/e1`, 'delete', null, fuel],
  ['sem login lê', 'DENY', null, V, 'get'],
  ['sem login cria', 'DENY', null, `${V}/entries/x`, 'create', fuel],

  // só o formato esperado
  ['registro com campo a mais', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, admin: true }],
  ['tipo de registro inválido', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, kind: 'hack' }],
  ['data inválida', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, date: 'ontem' }],
  ['valor negativo', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, amount: -5 }],
  ['valor como texto', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, amount: '100' }],
  ['título com mais de 60', 'DENY', U, `${V}/entries/x`, 'create', { ...service, title: 'x'.repeat(61) }],
  ['veículo de tipo inválido', 'DENY', U, V, 'create', { ...vehicle, type: 'aviao' }],
  ['veículo sem nome', 'DENY', U, V, 'create', { ...vehicle, name: '' }],
  ['lembrete com campo a mais', 'DENY', U, `${V}/reminders/x`, 'create', { ...reminder, x: 1 }],
  ['preferência desconhecida', 'DENY', U, `users/${U}`, 'update', { ...prefs, isAdmin: true }, prefs],

  // nada fora dos caminhos do app
  ['coleção inventada no usuário', 'DENY', U, `users/${U}/segredos/x`, 'create', { a: 1 }],
  ['coleção inventada no veículo', 'DENY', U, `${V}/fotos/x`, 'create', { a: 1 }],
  ['coleção na raiz', 'DENY', U, 'config/x', 'create', { a: 1 }],
  ['ler o backup', 'DENY', U, `trash/${U}/backups/b1`, 'get'],
  ['apagar o backup', 'DENY', U, `trash/${U}/backups/b1`, 'delete'],
  ['backup em nome de outro', 'DENY', U, 'trash/outro/backups/b1', 'create', { uid: 'outro', docs: 1 }],
];

const testCases = CASES.map(([, expectation, uid, path, method, data, existing]) => ({
  expectation,
  request: {
    auth: uid ? { uid } : null,
    path: `/databases/(default)/documents/${path}`,
    method,
    ...(data ? { resource: { data } } : {}),
  },
  ...(existing ? { resource: { data: existing } } : {}),
}));

const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId()}:test`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: { files: [{ name: 'firestore.rules', content: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }] },
    testSuite: { testCases },
  }),
});
if (!res.ok) throw new Error(`API de testes: ${res.status} ${await res.text()}`);
const { testResults } = await res.json();

let failed = 0;
testResults.forEach((r, i) => {
  const ok = r.state === 'SUCCESS';
  if (!ok) failed++;
  console.log(`${ok ? '✔' : '✖'} ${CASES[i][1] === 'ALLOW' ? 'permite' : 'nega'}: ${CASES[i][0]}`);
});
console.log(`\n${testResults.length - failed}/${testResults.length} casos ok`);
process.exit(failed ? 1 : 0);
