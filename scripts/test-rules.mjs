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
const prefs = { alertKm: 1000, alertDays: 14, alertMonths: 1, urgentKm: 200, urgentDays: 7, serviceCategories: ['Lavagem'], expenseCategories: [] };

// "agora" de todos os casos (request.time): o id do backup precisa ser a data de hoje
const NOW = '2026-11-04T12:00:00Z';
const B = `trash/${U}/backups/20261104-1`;
const expireAt = '2027-02-01T12:00:00Z'; // ~89 dias depois de NOW
const meta = { uid: U, email: 'a@b.c', name: 'A', deletedAt: 1762257600000, docs: 3, expireAt };
// get() da capa do backup, simulado (a API de testes não tem banco)
const withMeta = { mocks: [{ function: 'get', args: [{ exactValue: `/databases/(default)/documents/${B}` }], result: { value: { data: meta } } }] };
const backupDoc = (path, data, extra = {}) => ({ path, data, expireAt, ...extra });

/** [descrição, esperado, uid (null = sem login), caminho, método, dados novos?, dados atuais?, { mocks }?] */
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
  ['guarda a capa do backup ao excluir conta', 'ALLOW', U, B, 'create', meta],
  ['guarda o veículo no backup', 'ALLOW', U, `${B}/docs/0`, 'create', backupDoc('vehicles/v1', vehicle), null, withMeta],
  ['guarda um registro no backup', 'ALLOW', U, `${B}/docs/1`, 'create', backupDoc('vehicles/v1/entries/e1', fuel), null, withMeta],
  ['guarda as preferências no backup', 'ALLOW', U, `${B}/docs/2`, 'create', backupDoc('.', prefs), null, withMeta],
  ['edita registro mantendo createdAt', 'ALLOW', U, `${V}/entries/e1`, 'update', { ...fuel, amount: 210 }, fuel],

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
  ['data com mês 99', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, date: '9999-99-99' }],
  ['data com dia 32', 'DENY', U, `${V}/entries/x`, 'create', { ...fuel, date: '2026-01-32' }],
  ['muda o createdAt do registro', 'DENY', U, `${V}/entries/e1`, 'update', { ...fuel, createdAt: 1 }, fuel],
  ['muda o createdAt do veículo', 'DENY', U, V, 'update', { ...vehicle, createdAt: 1 }, vehicle],
  ['muda o createdAt do lembrete', 'DENY', U, `${V}/reminders/r1`, 'update', { ...reminder, createdAt: 2 }, reminder],
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
  ['ler o backup', 'DENY', U, B, 'get'],
  ['apagar o backup', 'DENY', U, B, 'delete'],
  ['alterar o backup', 'DENY', U, B, 'update', { ...meta, docs: 5000 }, meta],
  ['backup em nome de outro', 'DENY', U, 'trash/outro/backups/20261104-1', 'create', { ...meta, uid: 'outro' }],

  // backup com limites: data de hoje, até 3 por dia, até 5.000 documentos, expira, formato do original
  ['backup com id que não é a data de hoje', 'DENY', U, `trash/${U}/backups/20261103-1`, 'create', meta],
  ['4º backup no mesmo dia', 'DENY', U, `trash/${U}/backups/20261104-4`, 'create', meta],
  ['backup com id livre', 'DENY', U, `trash/${U}/backups/qualquer`, 'create', meta],
  ['backup com mais de 5.000 documentos', 'DENY', U, B, 'create', { ...meta, docs: 5001 }],
  ['backup vazio', 'DENY', U, B, 'create', { ...meta, docs: 0 }],
  ['backup sem expiração', 'DENY', U, B, 'create', (({ expireAt: _, ...m }) => m)(meta)],
  ['backup que expira em 1 ano', 'DENY', U, B, 'create', { ...meta, expireAt: '2027-11-04T12:00:00Z' }],
  ['backup com campo a mais', 'DENY', U, B, 'create', { ...meta, extra: 'x'.repeat(1000) }],
  ['documento além do declarado na capa', 'DENY', U, `${B}/docs/3`, 'create', backupDoc('vehicles/v1', vehicle), null, withMeta],
  ['documento com id não numérico', 'DENY', U, `${B}/docs/abc`, 'create', backupDoc('vehicles/v1', vehicle), null, withMeta],
  ['documento com caminho "../"', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('../outro/vehicles/v1', vehicle), null, withMeta],
  ['documento com caminho fora do app', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('segredos/x', vehicle), null, withMeta],
  ['documento com caminho de registro e dados de veículo', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('vehicles/v1/entries/e1', vehicle), null, withMeta],
  ['documento com dados enormes', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('vehicles/v1', { ...vehicle, name: 'x'.repeat(5000) }), null, withMeta],
  ['documento com dados livres', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('vehicles/v1', { qualquer: 'coisa' }), null, withMeta],
  ['documento com outra expiração', 'DENY', U, `${B}/docs/0`, 'create', backupDoc('vehicles/v1', vehicle, { expireAt: '2027-03-01T00:00:00Z' }), null, withMeta],
  ['documento de backup de outro', 'DENY', 'intruso', `${B}/docs/0`, 'create', backupDoc('vehicles/v1', vehicle), null, withMeta],
];

const testCases = CASES.map(([, expectation, uid, path, method, data, existing, opts]) => ({
  expectation,
  request: {
    auth: uid ? { uid } : null,
    path: `/databases/(default)/documents/${path}`,
    method,
    time: NOW,
    ...(data ? { resource: { data } } : {}),
  },
  ...(existing ? { resource: { data: existing } } : {}),
  ...(opts?.mocks ? { functionMocks: opts.mocks } : {}),
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
