#!/usr/bin/env node
// Monta o release a partir dos commits da develop que ainda não estão na main.
// Usado pelas GitHub Actions em .github/workflows/release.yml — sem dependências.
//
//   node scripts/release.mjs prepare        → calcula a versão, atualiza package.json, package-lock.json
//                                             e CHANGELOG.md, grava RELEASE_NOTES.md; imprime a versão
//                                             (ou nada, se não há o que lançar)
//   node scripts/release.mjs notes <versão> → imprime a seção da versão no CHANGELOG.md

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.RELEASE_BASE ?? 'origin/main';
const HEAD = process.env.RELEASE_HEAD ?? 'HEAD';
const REPO_URL = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
  : null;

// Conventional Commits → seção do changelog. `feature:` aceito como sinônimo de `feat:`.
const SECTIONS = [
  { title: '✨ Novidades', types: ['feat', 'feature'] },
  { title: '🐛 Correções', types: ['fix'] },
  { title: '⚡ Desempenho', types: ['perf'] },
  { title: '🔧 Manutenção', types: ['refactor', 'style', 'chore', 'docs', 'test', 'build', 'ci', 'revert'] },
];
const OTHER = '📝 Outras alterações';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/** Commits em HEAD que não estão em BASE (sem merges e sem os próprios commits de release). */
function pendingCommits() {
  const raw = git('log', `${BASE}..${HEAD}`, '--no-merges', '--format=%H%x1f%s%x1f%b%x1e');
  return raw
    .split('\x1e')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [hash, subject, body = ''] = r.split('\x1f');
      const m = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
      return {
        hash,
        type: m ? m[1].toLowerCase() : null,
        scope: m?.[2] ?? null,
        breaking: !!m?.[3] || /^BREAKING[ -]CHANGE:/m.test(body),
        text: m ? m[4] : subject,
      };
    })
    .filter((c) => !(c.type === 'chore' && c.scope === 'release'));
}

function nextVersion(current, commits) {
  const [major, minor, patch] = current.split('.').map(Number);
  // Em 0.x, mudança incompatível sobe o número do meio (convenção do semver para versões iniciais)
  if (commits.some((c) => c.breaking)) return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  if (commits.some((c) => c.type === 'feat' || c.type === 'feature')) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function notesFor(version, previous, commits) {
  const today = new Date().toISOString().slice(0, 10);
  const compare = REPO_URL ? `${REPO_URL}/compare/v${previous}...v${version}` : null;
  const lines = [`## ${compare ? `[${version}](${compare})` : version} (${today})`, ''];

  const groups = new Map();
  for (const c of commits) {
    const section = SECTIONS.find((s) => s.types.includes(c.type))?.title ?? OTHER;
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(c);
  }
  for (const title of [...SECTIONS.map((s) => s.title), OTHER]) {
    const list = groups.get(title);
    if (!list) continue;
    lines.push(`### ${title}`, '');
    for (const c of list) {
      const short = c.hash.slice(0, 7);
      const ref = REPO_URL ? `([${short}](${REPO_URL}/commit/${c.hash}))` : `(${short})`;
      lines.push(`- ${c.breaking ? '**⚠️ incompatível:** ' : ''}${c.scope ? `**${c.scope}:** ` : ''}${c.text} ${ref}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function prepare() {
  const commits = pendingCommits();
  if (commits.length === 0) return; // nada a lançar: não imprime versão

  // a versão de partida é a que está na main (a develop pode ter sido sincronizada depois)
  const current = JSON.parse(git('show', `${BASE}:package.json`)).version;
  const version = nextVersion(current, commits);
  const notes = notesFor(version, current, commits);

  const pkg = readJson('package.json');
  pkg.version = version;
  writeJson('package.json', pkg);

  if (existsSync('package-lock.json')) {
    const lock = readJson('package-lock.json');
    lock.version = version;
    if (lock.packages?.['']) lock.packages[''].version = version;
    writeJson('package-lock.json', lock);
  }

  // versões anteriores: tudo a partir do primeiro "## " (o cabeçalho é reescrito)
  const existing = existsSync('CHANGELOG.md') ? readFileSync('CHANGELOG.md', 'utf8') : '';
  const firstEntry = existing.search(/^## /m);
  const previousEntries = firstEntry < 0 ? '' : existing.slice(firstEntry);
  const header = '# Changelog\n\nTodas as versões do Unitali Garage, geradas a partir dos commits.\n\n';
  writeFileSync('CHANGELOG.md', `${header}${notes}\n${previousEntries}`.trimEnd() + '\n');
  writeFileSync('RELEASE_NOTES.md', notes);

  console.log(version);
}

function notes(version) {
  const changelog = readFileSync('CHANGELOG.md', 'utf8');
  const start = changelog.search(new RegExp(`^## \\[?${version.replace(/\./g, '\\.')}\\]?`, 'm'));
  if (start < 0) return console.log(`Versão ${version}`);
  const rest = changelog.slice(start);
  const end = rest.slice(3).search(/^## /m);
  // sem a linha do título: a Release do GitHub já mostra a versão
  console.log((end < 0 ? rest : rest.slice(0, end + 3)).split('\n').slice(1).join('\n').trim());
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'prepare') prepare();
else if (cmd === 'notes' && arg) notes(arg);
else {
  console.error('uso: node scripts/release.mjs prepare | notes <versão>');
  process.exit(1);
}
