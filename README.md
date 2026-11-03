# Unitali Garage

PWA simples para controlar manutenções, abastecimentos e despesas de vários veículos — inspirado no Drivvo, sem as partes que não fazem falta.

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS v4 · Firebase Auth (Google) · Firestore com cache offline · vite-plugin-pwa · deploy na Vercel.

## O que faz

- **Vários veículos** (carro, moto/scooter, bike elétrica…), cada um com seu histórico.
- **Abastecimentos** — valor total + preço/litro calcula os litros; consumo pelo método do tanque cheio (abastecimentos parciais no meio entram no trecho). Recarga elétrica em kWh.
- **Serviços** (troca de óleo, pneus, freios…) e **despesas** (IPVA, seguro, multa…), com categoria e descrição.
- **Lembretes por km e/ou meses** — vale o que vencer primeiro. "Em breve" com 10% do intervalo de km (mín. 300 km) ou 30 dias. Ao registrar um serviço dá para concluir um lembrete, ou tocar em **Feito** direto na lista.
- **Resumo**: gasto no mês/ano, consumo médio e último, custo por km (tudo incluído) e de combustível por km, alertas.
- **Offline**: abre sem internet, salva localmente e sincroniza quando a rede volta (mesmo se o app for fechado no meio). Uma faixa no topo avisa quando está sem conexão e quando as alterações foram enviadas.
- **App instalável**: card "Instalar o app" na lista de veículos (botão no Android/Chrome, instruções no iPhone).
- **Atualizações**: o app procura versão nova a cada hora e ao voltar para ele; quando há, aparece "Nova versão disponível · Atualizar".

## Estrutura no Firestore

```
users/{uid}/vehicles/{vid}                  name, type, plate, initialOdometer, odometer, createdAt
users/{uid}/vehicles/{vid}/entries/{id}     kind (fuel|service|expense), date (YYYY-MM-DD), odometer, amount,
                                            category, description, notes, [liters, pricePerLiter, fuelType, fullTank]
users/{uid}/vehicles/{vid}/reminders/{id}   title, intervalKm, intervalMonths, lastKm, lastDate
```

Abastecimentos, serviços e despesas ficam numa coleção só (`entries`) — o histórico sai de uma única query e os cálculos são feitos no cliente (o volume de um veículo pessoal é pequeno). Nenhum índice composto é necessário.

## 1. Firebase

1. Crie um projeto em <https://console.firebase.google.com>.
2. **Authentication → Sign-in method** → ative **Google**.
3. **Firestore Database** → criar banco (modo produção, região `southamerica-east1`).
4. Em **Firestore → Regras**, cole o conteúdo de [`firestore.rules`](firestore.rules) e publique (ou `firebase deploy --only firestore:rules`).
5. **Configurações do projeto → Seus apps → Web (`</>`)** → registre o app e copie a configuração.

## 2. Rodar local

```bash
cp .env.example .env.local   # preencha com os dados do passo 5
npm install
npm run dev                  # http://localhost:5173
npm test                     # testes dos cálculos (consumo, lembretes, datas, números)
```

Em dev use `VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com`. `localhost` já vem autorizado no Firebase Auth.

## 3. Deploy na Vercel

1. Suba o repositório e importe na Vercel (framework detectado: Vite).
2. Em **Settings → Environment Variables**, adicione as mesmas `VITE_FIREBASE_*` do `.env.local`.
3. No Firebase: **Authentication → Settings → Authorized domains** → adicione `seu-app.vercel.app` (e seu domínio próprio, se tiver).

### Login no celular (recomendado)

Safari e o PWA instalado bloqueiam cookies de terceiros, e o login pode falhar quando o `authDomain` é `*.firebaseapp.com`. O `vercel.json` já traz um proxy que serve o handler do Firebase no seu próprio domínio:

1. Em `vercel.json`, troque `SEU-PROJETO` pelo ID do seu projeto Firebase.
2. Na Vercel, defina `VITE_FIREBASE_AUTH_DOMAIN=seu-app.vercel.app` (o domínio do app, sem `https://`).
3. No **Google Cloud Console → APIs e serviços → Credenciais → OAuth 2.0 Client (Web client, criado pelo Firebase)**, adicione em *URIs de redirecionamento autorizados*: `https://seu-app.vercel.app/__/auth/handler`.

O service worker já ignora `/__/*`, então o proxy não é interceptado pelo cache do PWA.

## Instalar no celular

- **Android (Chrome):** abrir o site → menu ⋮ → *Instalar app*.
- **iPhone (Safari):** compartilhar → *Adicionar à Tela de Início*.

## Versões e releases

```
feature/* ──PR──▶ develop ──(automático)──▶ PR "chore(release): vX.Y.Z" ──merge──▶ main
                                                                          └─▶ tag + Release + develop sincronizada
```

- Todo trabalho entra na **develop** (push direto ou PR). A **main** só recebe código pelo PR de release.
- A cada push na develop, o [`release-pr.yml`](.github/workflows/release-pr.yml) cria ou atualiza o PR **`chore(release): vX.Y.Z`** (branch `release` → `main`) com a versão nova no `package.json` e o [`CHANGELOG.md`](CHANGELOG.md). Ele vai acumulando tudo até o merge.
- No **merge** (use *Create a merge commit*), o [`publish.yml`](.github/workflows/publish.yml) cria a tag `vX.Y.Z`, publica a Release no GitHub, faz o merge da main de volta na develop e recalcula o próximo PR de release.
- PR aberto para a main por engano é tratado pelo [`pr-guard.yml`](.github/workflows/pr-guard.yml): `develop → main` é fechado e apontado para o PR de release; de outro branch, o destino vira a develop.
- A versão aparece no app, em **Configurações → Versão**.
- Na Vercel, só `release` (preview) e `main` (produção) fazem build — `ignoreCommand` no [`vercel.json`](vercel.json).

**Mensagens de commit** ([Conventional Commits](https://www.conventionalcommits.org/pt-br/)) definem a versão e as seções do changelog:

| Prefixo | Exemplo | Versão |
|---|---|---|
| `feat:` | `feat(home): aba de despesas` | 0.**X**.0 |
| `fix:` | `fix: ordem do histórico por km` | 0.0.**X** |
| `perf:` `refactor:` `docs:` `chore:` `ci:` `test:` `style:` | `docs: fluxo de release` | 0.0.**X** |
| `!` ou `BREAKING CHANGE:` | `feat!: novo formato dos dados` | 0.**X**.0 enquanto for 0.x, depois **X**.0.0 |

O cálculo fica em [`scripts/release.mjs`](scripts/release.mjs), sem dependências. O [`ci.yml`](.github/workflows/ci.yml) roda testes e build em PR para a develop e em push na develop.

## Estrutura do código

```
src/
  firebase.ts        inicialização (Auth + Firestore com cache persistente)
  auth.tsx           contexto de login, Google com popup e fallback para redirect
  db.ts              caminhos e gravações (sem await: funciona offline)
  hooks.ts           assinaturas em tempo real (onSnapshot)
  lib/calc.ts        consumo, custos, status dos lembretes
  lib/dates.ts       datas 'YYYY-MM-DD' sem problema de fuso
  lib/format.ts      R$, km, números no formato brasileiro
  pages/             Lista de veículos, Detalhe (Resumo/Histórico/Lembretes), formulários
tests/calc.test.ts   testes com node:test
```

## Ideias para depois

- Exportar/importar CSV (inclusive importar o backup do Drivvo).
- Notificação push de lembrete vencendo (Cloud Functions + FCM, ou Cloud Scheduler).
- Gráfico de gasto por mês e de consumo ao longo do tempo.
- Foto de nota fiscal no Firebase Storage.
