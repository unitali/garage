#!/usr/bin/env node
// Restaura uma conta excluída pelo app ("Mais → Excluir conta"), a partir da cópia em
// trash/{uid}/backups/{bid}/docs. Uso de administrador (as regras não deixam o app ler a cópia).
//
//   node scripts/restore-account.mjs <uid>                 → lista os backups e o que seria restaurado
//   node scripts/restore-account.mjs <uid> --apply         → restaura o backup mais recente em users/{uid}
//   opções: --backup <id>  escolhe o backup · --to <uid>  restaura em outro usuário (ex: conta Google nova)
//
// Acesso: GOOGLE_ACCESS_TOKEN (ex: `gcloud auth print-access-token`) ou o login do Firebase CLI
// (`firebase login`). O backup não é apagado — dá para restaurar de novo.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://firestore.googleapis.com/v1';

/** Gravações (API REST :commit) que recriam cada documento em users/{to}/{path}; "." é o próprio users/{to}. */
export function toWrites(docs, project, to) {
  const base = `projects/${project}/databases/(default)/documents/users/${to}`;
  return docs.map(({ path, data }) => ({
    update: { name: path === '.' ? base : `${base}/${path}`, fields: data?.mapValue?.fields ?? {} },
  }));
}

/** "vehicles/a/entries/b" → "entries" (resumo do que será restaurado) */
export const kindOf = (path) => (path === '.' ? 'perfil' : path.split('/').at(-2));

async function token() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;
  // login do Firebase CLI (o mesmo do `firebase deploy`): troca o refresh token por um access token
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: cfg.tokens.refresh_token,
      // cliente OAuth público do Firebase CLI
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Sem acesso: rode \`firebase login\` ou defina GOOGLE_ACCESS_TOKEN (${res.status})`);
  return (await res.json()).access_token;
}

async function main() {
  const args = process.argv.slice(2);
  const uid = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--backup' && args[args.indexOf(a) - 1] !== '--to');
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  if (!uid) {
    console.error('Uso: node scripts/restore-account.mjs <uid> [--backup <id>] [--to <uid>] [--apply]');
    process.exit(1);
  }
  const to = opt('--to') ?? uid;
  const project = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8')).projects.default;
  const auth = { Authorization: `Bearer ${await token()}` };
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
    }))
    .sort((a, b) => b.deletedAt - a.deletedAt);
  if (backups.length === 0) {
    console.log(`Nenhum backup completo para ${uid}.`);
    return;
  }
  console.log('Backups (mais recente primeiro):');
  for (const b of backups) console.log(`  ${b.id}  ${new Date(b.deletedAt).toLocaleString('pt-BR')}  ${b.email}  ${b.count} documentos`);

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
