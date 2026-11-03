// Acesso às APIs do Google para os scripts de administração (restore-account, test-rules).
// Usa GOOGLE_ACCESS_TOKEN (ex: `gcloud auth print-access-token`) ou o login do Firebase CLI (`firebase login`).

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export async function accessToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;
  // login do Firebase CLI (o mesmo do `firebase deploy`): troca o refresh token por um access token
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: cfg.tokens.refresh_token,
      // cliente OAuth público do Firebase CLI (o mesmo que vem no código aberto do firebase-tools)
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Sem acesso: rode \`firebase login\` ou defina GOOGLE_ACCESS_TOKEN (${res.status})`);
  return (await res.json()).access_token;
}

/** id do projeto Firebase (.firebaserc) */
export const projectId = () => JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8')).projects.default;
