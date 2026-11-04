#!/usr/bin/env node
// Restaura uma conta excluída pelo app ("Mais → Excluir conta"), a partir da cópia em
// trash/{uid}/backups/{bid}/docs. Uso de administrador (as regras não deixam o app ler a cópia).
//
//   node scripts/restore-account.mjs <uid>                 → lista os backups e o que seria restaurado
//   node scripts/restore-account.mjs <uid> --apply         → restaura o backup mais recente em users/{uid}
//   opções: --backup <id>  escolhe o backup · --to <uid>  restaura em outro usuário (ex: conta Google nova)
//
// Acesso: GOOGLE_ACCESS_TOKEN ou o login do Firebase CLI (scripts/google-auth.mjs).
// O backup não é apagado por este script — dá para restaurar de novo —, mas vale 90 dias (expireAt):
// depois disso scripts/purge-backups.mjs o apaga.

import { fileURLToPath } from 'node:url';
import { accessToken, projectId } from './google-auth.mjs';

const API = 'https://firestore.googleapis.com/v1';

// Caminhos que o app grava (os mesmos de src/lib/backup.ts e firestore.rules). Qualquer outro — "..",
// barra a mais, outra coleção — é recusado: é com ele que se monta o nome do documento restaurado.
const ID = '[A-Za-z0-9_-]{1,40}';
const VALID_PATH = new RegExp(`^(\\.|vehicles/${ID}(/(entries|reminders)/${ID})?)$`);
const VALID_UID = /^[A-Za-z0-9]{1,128}$/;

/** Gravações (API REST :commit) que recriam cada documento em users/{to}/{path}; "." é o próprio users/{to}. */
export function toWrites(docs, project, to) {
  if (!VALID_UID.test(to)) throw new Error(`uid inválido: ${to}`);
  const base = `projects/${project}/databases/(default)/documents/users/${to}`;
  return docs.map(({ path, data }) => {
    if (typeof path !== 'string' || !VALID_PATH.test(path)) throw new Error(`Caminho inválido no backup: ${JSON.stringify(path)}`);
    return { update: { name: path === '.' ? base : `${base}/${path}`, fields: data?.mapValue?.fields ?? {} } };
  });
}

/** "vehicles/a/entries/b" → "entries" (resumo do que será restaurado) */
export const kindOf = (path) => (path === '.' ? 'perfil' : path.split('/').at(-2));

async function main() {
  const args = process.argv.slice(2);
  const uid = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--backup' && args[args.indexOf(a) - 1] !== '--to');
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  if (!uid) {
    console.error('Uso: node scripts/restore-account.mjs <uid> [--backup <id>] [--to <uid>] [--apply]');
    process.exit(1);
  }
  const to = opt('--to') ?? uid;
  if (!VALID_UID.test(uid) || !VALID_UID.test(to)) throw new Error('uid inválido.');
  const project = projectId();
  const auth = { Authorization: `Bearer ${await accessToken()}` };
  const docsUrl = `${API}/projects/${project}/databases/(default)/documents`;

  async function list(path) {
    const out = [];
    let pageToken = '';
    do {
      const res = await fetch(`${docsUrl}/${path}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`, { headers: auth });
      if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
      const body = await res.json();
      out.push(...(body.documents ?? []));
      pageToken = body.nextPageToken ?? '';
    } while (pageToken);
    return out;
  }

  const backups = (await list(`trash/${uid}/backups`))
    .map((d) => ({
      id: d.name.split('/').at(-1),
      deletedAt: Number(d.fields.deletedAt?.integerValue ?? d.fields.deletedAt?.doubleValue ?? 0),
      email: d.fields.email?.stringValue ?? '',
      count: Number(d.fields.docs?.integerValue ?? 0),
      expireAt: d.fields.expireAt?.timestampValue,
    }))
    .sort((a, b) => b.deletedAt - a.deletedAt);
  if (backups.length === 0) {
    console.log(`Nenhum backup completo para ${uid}.`);
    return;
  }
  console.log('Backups (mais recente primeiro):');
  for (const b of backups) {
    const expires = b.expireAt ? `  expira em ${new Date(b.expireAt).toLocaleDateString('pt-BR')}` : '';
    console.log(`  ${b.id}  ${new Date(b.deletedAt).toLocaleString('pt-BR')}  ${b.email}  ${b.count} documentos${expires}`);
  }

  const chosen = opt('--backup') ? backups.find((b) => b.id === opt('--backup')) : backups[0];
  if (!chosen) throw new Error(`Backup ${opt('--backup')} não encontrado.`);
  const docs = (await list(`trash/${uid}/backups/${chosen.id}/docs`)).map((d) => ({
    path: d.fields.path.stringValue,
    data: d.fields.data,
  }));
  if (docs.length !== chosen.count) throw new Error(`Backup incompleto: ${docs.length} de ${chosen.count} documentos.`);

  const byKind = {};
  for (const d of docs) byKind[kindOf(d.path)] = (byKind[kindOf(d.path)] ?? 0) + 1;
  console.log(`\nBackup ${chosen.id} → users/${to}:`, byKind);

  if (!args.includes('--apply')) {
    console.log('\nNada gravado. Para restaurar, rode de novo com --apply.');
    return;
  }
  const writes = toWrites(docs, project, to);
  for (let i = 0; i < writes.length; i += 450) {
    const res = await fetch(`${docsUrl}:commit`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: writes.slice(i, i + 450) }),
    });
    if (!res.ok) throw new Error(`Falha ao gravar: ${res.status} ${await res.text()}`);
  }
  console.log(`\nRestaurados ${writes.length} documentos em users/${to}. O backup continua guardado.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
