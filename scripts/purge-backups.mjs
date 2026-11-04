#!/usr/bin/env node
// Apaga as cópias de contas excluídas que já venceram (expireAt no passado) — o expurgo de
// trash/{uid}/backups/{bid}. Faz o papel da política de TTL, que o Firestore só oferece no plano pago.
//
//   node scripts/purge-backups.mjs           → lista o que venceu (não apaga nada)
//   node scripts/purge-backups.mjs --apply   → apaga as cópias vencidas (capa + documentos)
//
// Acesso: GOOGLE_ACCESS_TOKEN ou o login do Firebase CLI (scripts/google-auth.mjs).

import { accessToken, projectId } from './google-auth.mjs';

const project = projectId();
const root = `projects/${project}/databases/(default)/documents`;
const API = 'https://firestore.googleapis.com/v1';
const headers = { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' };

async function call(path, body) {
  const res = await fetch(`${API}/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Todos os documentos de um grupo de coleções (sem filtro no servidor: dispensa índice; o volume é pequeno). */
async function group(collectionId, parent = root) {
  const rows = await call(`${parent}:runQuery`, { structuredQuery: { from: [{ collectionId, allDescendants: true }] } });
  return rows.filter((r) => r.document).map((r) => r.document);
}

const now = Date.now();
const expired = (await group('backups')).filter((d) => {
  const at = d.fields?.expireAt?.timestampValue;
  return at && Date.parse(at) < now; // sem expireAt (cópias antigas): fica, para decidir à mão
});

if (expired.length === 0) {
  console.log('Nenhuma cópia vencida.');
  process.exit(0);
}
for (const b of expired) console.log(`  ${b.name.slice(root.length + 1)}  venceu em ${new Date(b.fields.expireAt.timestampValue).toLocaleDateString('pt-BR')}`);

if (!process.argv.includes('--apply')) {
  console.log(`\n${expired.length} cópia(s) vencida(s). Nada apagado — rode com --apply para apagar.`);
  process.exit(0);
}

let deleted = 0;
for (const b of expired) {
  const docs = await group('docs', b.name);
  const names = [...docs.map((d) => d.name), b.name]; // documentos antes da capa
  for (let i = 0; i < names.length; i += 450) {
    await call(`${root.split('/documents')[0]}/documents:batchWrite`, { writes: names.slice(i, i + 450).map((name) => ({ delete: name })) });
  }
  deleted += names.length;
}
console.log(`\nApagadas ${expired.length} cópia(s) (${deleted} documentos).`);
