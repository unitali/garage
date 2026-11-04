# Changelog

Todas as versões do Unitali Garage, geradas a partir dos commits.

## [0.6.1](https://github.com/unitali/garage/compare/v0.6.0...v0.6.1) (2026-11-04)

### 🐛 Correções

- **seguranca:** CSP e HSTS; proxy /__/auth só com os arquivos do login ([cdc906d](https://github.com/unitali/garage/commit/cdc906d03e17d25ec82c4d25b887a349ebd801a9))
- **seguranca:** cache do aparelho apagado ao sair; conta confirmada antes de excluir; excluir conta remove o login ([7ad38bf](https://github.com/unitali/garage/commit/7ad38bfa1072f6d385606bb61fd32affa7e88bb8))
- **seguranca:** cópia da conta com limites, expiração e caminho validado; datas e createdAt nas regras ([af5ecef](https://github.com/unitali/garage/commit/af5ecefb55064884fa7bdfd1f0bba0365870b59a))
- **pwa:** botão Instalar nunca fica sem resposta ([8a29902](https://github.com/unitali/garage/commit/8a29902a3d9c4402493280ce4bbde1ff6aa47285))

### 🔧 Manutenção

- actions fixadas por SHA, permissões mínimas, PR guard valida o branch; scripts de instalação bloqueados ([901fae6](https://github.com/unitali/garage/commit/901fae6a7811b02d17ac76c931f9442e5a1a0150))

## [0.6.0](https://github.com/unitali/garage/compare/v0.5.0...v0.6.0) (2026-11-04)

### ✨ Novidades

- **marca:** só o logo.png arredondado; ícone do app instalado igual a ele ([d273633](https://github.com/unitali/garage/commit/d27363362a94503cc1c0aa4411f73e50acf98403))
- **marca:** logo com os cantos arredondados do desenho ([6334bd7](https://github.com/unitali/garage/commit/6334bd71aa50641a3df1516f766ea11881b36a60))
- **marca:** logo novo inteiro, sem fundo, padding nem margem ([402505a](https://github.com/unitali/garage/commit/402505a4692e6649ed9a2130314254c496336629))
- **lembretes:** cores calculadas pelo aviso — amarelo em 50%, vermelho em 10% e vencido ([736a83a](https://github.com/unitali/garage/commit/736a83a39cce3e623cc032b35e3bf73d6e25900a))
- **lembretes:** aviso com 100/200/500/1.000 km e 2 semanas, 1, 3 ou 6 meses ([2fd3973](https://github.com/unitali/garage/commit/2fd397376cafa018cdb1190c23cbb7495a90fe84))
- **ui:** pop-up do app no lugar de confirm()/alert() do navegador ([10673a9](https://github.com/unitali/garage/commit/10673a91d76b80d5798e322ac25ee046b6f4881f))
- **veiculos:** máscara de placa — Mercosul e antiga (Brasil), pronta para outros países ([6b5d4eb](https://github.com/unitali/garage/commit/6b5d4ebd2776437960a63ba2bc4848036b8a3b0e))
- **select:** busca opcional e ação fixa no rodapé ("Adicionar…" sempre visível) ([2505152](https://github.com/unitali/garage/commit/2505152fdb7adb0802ca709c397d66d5a00942af))
- **ui:** componente Select no lugar do <select> nativo; tipo de veículo com ícones ([2bd581a](https://github.com/unitali/garage/commit/2bd581acee6a85989c3332d41612f472cf3bbeda))

### 🐛 Correções

- update logo ([b7f91d1](https://github.com/unitali/garage/commit/b7f91d1dd9d7317da191bacdbb8f4e463de2f915))
- **adicionar:** painel abre acima da barra de baixo; o + vira × para fechar ([30d6845](https://github.com/unitali/garage/commit/30d6845f60759de445fb9642cb1029a48dfb9814))

### 🔧 Manutenção

- **css:** tokens.css junto no styles.css ([e57c55f](https://github.com/unitali/garage/commit/e57c55f6af3b8414b59f1852379d149f24a7a032))
- **alertas:** amarelo (amber) no lugar do laranja — verde, amarelo e vermelho ([928cfb5](https://github.com/unitali/garage/commit/928cfb5beec9c32e8252d359384d84031c23fbd0))

## [0.5.0](https://github.com/unitali/garage/compare/v0.4.0...v0.5.0) (2026-11-03)

### ✨ Novidades

- **inicio:** "Últimos registros" mostra os últimos 30 dias ([b3ebdf9](https://github.com/unitali/garage/commit/b3ebdf909ceac6df5e9f4cde0e0f32ce808cecd8))
- **conta:** "Excluir conta" com confirmação; cópia guardada para restaurar ([ebea5b9](https://github.com/unitali/garage/commit/ebea5b91b566a89ea9ed8b6c97526a4c31be5c1c))
- **mais:** menu único — Veículos, Lembretes, Serviços, Despesas e Sair ([d03cf56](https://github.com/unitali/garage/commit/d03cf563bfe6a659a7ebcb4eb6e7a59268eaf4b0))
- **mais:** configurações direto no Mais; sai a calculadora ([574fe61](https://github.com/unitali/garage/commit/574fe61b8df399a79ca5142cf123bf160cf8ffb3))
- **abastecer:** calculadora etanol x gasolina no formulário, com "Usar" ([670c973](https://github.com/unitali/garage/commit/670c973bf4b79fe0666f54b20b84b9ec2386c082))
- **adicionar:** Abastecer na grade no lugar de "Atualizar km"; sai o botão azul ([2a6f25c](https://github.com/unitali/garage/commit/2a6f25c41ddd865506578c0252c7ad16b2dc82c6))
- **historico:** só o que já aconteceu; parcelados e recorrentes vão para Lembretes ([1493b28](https://github.com/unitali/garage/commit/1493b2882b1deb5cf8b5a07c826f2b3b9195e75f))
- **ui:** cabeçalho único em todas as telas, com nome da tela e veículo grande ([4c20c07](https://github.com/unitali/garage/commit/4c20c07474fa37d49422353e60ecfe1e19678415))
- **inicio:** cabeçalho só com logo e veículo (sem hodômetro e "Atualizar km") ([1865d15](https://github.com/unitali/garage/commit/1865d1533e43f0bf0a9ecc7ede16f37e42212f3e))
- **inicio:** carrossel dos lembretes com arraste e indicador de posição ([537bb3e](https://github.com/unitali/garage/commit/537bb3e46d9f04923f77579de9edc2811ec7acc0))
- **inicio:** contas entram nos cards de lembrete; remove "A vencer" ([fa80d91](https://github.com/unitali/garage/commit/fa80d916936b53f8a972405d706a230ea570e42c))
- **lembretes:** cards de manutenção na tela inicial com verde, laranja e vermelho ([c215fe7](https://github.com/unitali/garage/commit/c215fe7575962a3986df9aa063f287270c0aa7a6))
- **ui:** redesign — barra inferior, painel Adicionar, Início, Histórico e Lembretes ([c20dcdb](https://github.com/unitali/garage/commit/c20dcdbeb936ffd519bd12cbbedcce6c31e1e75e))
- **calc:** resumo da tela inicial e do histórico (src/lib/summary.ts) ([7a7d0b3](https://github.com/unitali/garage/commit/7a7d0b3c4cb7690792de149879de49d3e44d8406))
- **app:** atalhos Despesa e Calculadora (etanol x gasolina) ([b22f04c](https://github.com/unitali/garage/commit/b22f04ccc11230a97e54d4091af3c693f6866cc8))
- **despesas:** "Pago" em toda despesa; verde só quando paga ([ebd8afb](https://github.com/unitali/garage/commit/ebd8afb369aa1e8b48147ac6358119b365159800))
- **historico:** conta paga com borda verde e marca "pago" ([8ad11d4](https://github.com/unitali/garage/commit/8ad11d4a9bb33309f3989b9499f70dfcaeae35a9))
- **config:** salvar nas configurações volta para a tela inicial ([52252ab](https://github.com/unitali/garage/commit/52252ab8a1a0bc0b4fac9745d8c29070570f1174))
- **despesas:** contas do mês como lembrete, com botão Pago ([d578ab4](https://github.com/unitali/garage/commit/d578ab40d34348be0a7bcad29b541d5089c3c864))
- **despesas:** cota única, parcelado e recorrente com vencimentos editáveis ([90a260d](https://github.com/unitali/garage/commit/90a260d54278b01ad56245728f5d8932118b6f51))
- **config:** lembretes só gravam no botão Salvar ([c656734](https://github.com/unitali/garage/commit/c656734c0187eb585f0aec344aeef6a963316015))
- **lembretes:** cores verde/laranja/vermelho configuráveis ([d959eac](https://github.com/unitali/garage/commit/d959eac9b1537a569fee9beec6365f22ed9aef67))
- **lembretes:** no topo do histórico só os perto de vencer, com antecedência configurável ([8949565](https://github.com/unitali/garage/commit/89495650d4aa57537279cde9caae7c02ed101e7c))
- **servico:** lembretes também ao editar; só Observações (sem Descrição) ([c4f8880](https://github.com/unitali/garage/commit/c4f8880ec282e24dbd6fedd221f9b6ae6bfcb3c2))
- **servico:** título no serviço e itens listados no card ([10c449f](https://github.com/unitali/garage/commit/10c449f5e3506ddaafa855e0ba0ee4997616380d))
- **servico:** item e valor na mesma linha ([b91bcea](https://github.com/unitali/garage/commit/b91bcea456b3c0fcaed7c736eed6fe92923d8208))
- **servico:** lembrete opcional da próxima troca em cada item ([dabe953](https://github.com/unitali/garage/commit/dabe95330326623500535f5bd0b9311d88a5ffc8))
- **servico:** troca de óleo com intervalo obrigatório e lembrete automático ([b85df53](https://github.com/unitali/garage/commit/b85df53bbb9b5a693688b848176dd2dded2cfe16))
- **servico:** vários itens no mesmo serviço, com total somado ([909b8fb](https://github.com/unitali/garage/commit/909b8fb7bb66c400aabc738880866d1c7967f8e4))
- **historico:** categoria como título do card e descrição embaixo ([7f00bb2](https://github.com/unitali/garage/commit/7f00bb2efe9be0b7f2027aceb56b616f5d049a32))
- **categorias:** serviços e despesas personalizados por conta ([d597373](https://github.com/unitali/garage/commit/d59737328652643477943fc1d2b667cce6664478))
- **forms:** máscaras de km e de valores ([c80787c](https://github.com/unitali/garage/commit/c80787cfebe83761ee5f8aa35dab191e55a421c1))

### 🐛 Correções

- update ([50ea2d6](https://github.com/unitali/garage/commit/50ea2d6ec08f1756423ddc785ff6f9e01b205989))
- **seguranca:** regras do Firestore validam caminho e formato; testes das regras ([878496f](https://github.com/unitali/garage/commit/878496fd1c1b6026a975a5cf1a7102e5bf402254))
- **config:** avisa quando o tipo já existe; meta mobile-web-app-capable ([ce797c1](https://github.com/unitali/garage/commit/ce797c1801aaf36246edeb167a45c36ca853faad))
- **pwa:** nome do app instalado só "Unitali Garage" ([d3f6e97](https://github.com/unitali/garage/commit/d3f6e97bc3d2d57055d698180c897fb0776569cd))
- **deps:** minimatch 11 (GHSA-g3hv-75wg-m249) ([f053b79](https://github.com/unitali/garage/commit/f053b79e14a1bb4341a14a281c4bc21f36aacb15))

### ⚡ Desempenho

- **dados:** assinaturas compartilhadas em memória e gravação só do que mudou ([df7cd46](https://github.com/unitali/garage/commit/df7cd46187c44fe36473326a59703f3eb182e62c))
- **dados:** carrega uma vez e mantém em memória; não grava o que não mudou ([b042153](https://github.com/unitali/garage/commit/b042153be2d8ffc16d7dba37dc940d656d2d2933))

### 🔧 Manutenção

- code review — correções, código morto e organização ([fc47be1](https://github.com/unitali/garage/commit/fc47be1df3025ea7c59e14b8aa173ba5b5ed314b))
- **estilos:** cores do Tailwind direto no código; tokens só para a marca ([5f63656](https://github.com/unitali/garage/commit/5f63656bb7abc4123d13525546d4af4f72c09647))
- **tokens:** cores da paleta do Tailwind (hex só na marca e na faixa) ([9998e3e](https://github.com/unitali/garage/commit/9998e3e9dc92328091beefd9e7752c3ca32d35f5))
- **mais:** opções num só bloco, sem títulos; sem o "Perfil" repetido ([c353d4a](https://github.com/unitali/garage/commit/c353d4ae58b1937bb4314a6b1c741ecb8e8ef5cd))
- **abastecimento:** gasolina vermelha e etanol verde nos cards ([a6d5bca](https://github.com/unitali/garage/commit/a6d5bca8bedfc95a2af6cf4e139a7b9f4d8e2cad))
- **parcelas:** rótulo "parcela X de N" num lugar só (summary.ts) ([f33b159](https://github.com/unitali/garage/commit/f33b15968d68a51913764ebc5a7ec20c1e29dc04))
- **historico:** filtros com ícone em cima (cores do tipo) e nome embaixo, com rolagem lateral ([1e87e81](https://github.com/unitali/garage/commit/1e87e817a331356f9723fd169bb211a7063e4329))
- **historico:** filtros menores, todos numa linha ([3a6db26](https://github.com/unitali/garage/commit/3a6db26f78338aeccf977cfbb3959528a4e47a67))
- ignora *.tsbuildinfo ([9465ded](https://github.com/unitali/garage/commit/9465dedac12256524262eecc265e98b794987730))
- tokens de design (src/styles/tokens.css) e fonte Inter ([0fb20b9](https://github.com/unitali/garage/commit/0fb20b9b31afd9791114c349846a102aed8ff619))

## [0.4.0](https://github.com/unitali/garage/compare/v0.3.0...v0.4.0) (2026-11-03)

### ✨ Novidades

- **login:** baixar o app antes de entrar e login direto pelo app ([e288f54](https://github.com/unitali/garage/commit/e288f54aa27e976de2a46190c0895af9002bfdd4))

### 🔧 Manutenção

- um workflow por evento, sem execuções duplicadas ([987ee39](https://github.com/unitali/garage/commit/987ee39c57523ea2de6b75a3191b11e78b7ee5b6))

## [0.3.0](https://github.com/unitali/garage/compare/v0.2.0...v0.3.0) (2026-11-03)

### ✨ Novidades

- **config:** aba Configurações com Perfil e Veículos ([5eb2781](https://github.com/unitali/garage/commit/5eb2781cda84f9ce0a194bdd9e603997ddd0c5ef))

### 🔧 Manutenção

- Vercel só faz build da release (preview) e da main (produção) ([240223f](https://github.com/unitali/garage/commit/240223fa023bd3a2b025a0d2a93d66c09b532555))

## [0.2.0](https://github.com/unitali/garage/compare/v0.1.0...v0.2.0) (2026-11-03)

### ✨ Novidades

- **perfil:** mostra a versão do app ([31b00be](https://github.com/unitali/garage/commit/31b00be8979f5fbff0b803c04525ffa06963d72a))

### 🔧 Manutenção

- só o PR de release entra na main ([ede0eb1](https://github.com/unitali/garage/commit/ede0eb1f91a714e4e3b757e13798a649f9b0c4e7))
- deploy sem resumo de audit/fund na instalação ([357f449](https://github.com/unitali/garage/commit/357f449b9ec760ce49b9c1caf9536f66fc55aa8b))
- limpa avisos do deploy na Vercel ([8f10b49](https://github.com/unitali/garage/commit/8f10b49eea4a0cfa9e75150ee80c8e949970f63c))
- fluxo de release com PR chore(release) develop → main ([6d7587b](https://github.com/unitali/garage/commit/6d7587b7016867974a447bc2faddf4f41f8ed9c1))
