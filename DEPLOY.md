# Deploy público do Nuvia (Vercel + PostgreSQL)

> 🟣 **Recomendado para o trabalho: Render.com.** O projeto já inclui
> `render.yaml` (site + PostgreSQL juntos) e o passo a passo em
> [`DEPLOY-RENDER.md`](DEPLOY-RENDER.md). O guia abaixo continua válido para
> quem preferir a Vercel.

Este guia explica o que já foi preparado no projeto e exatamente o que você
precisa fazer para colocar o Nuvia online. **Nada foi publicado** até agora.

---

## 1. Análise do projeto

| Item | Situação |
| --- | --- |
| Framework | Node.js + **Express 5** (renderização das páginas em JavaScript, sem framework de front-end) |
| Gerenciador de pacotes | **npm** (`package-lock.json`) |
| Banco de dados | **PostgreSQL** (`pg` + `connect-pg-simple`) |
| Autenticação | Sessões no PostgreSQL, senha com **scrypt + salt**, perguntas de segurança, OAuth Google/GitHub |
| Uploads | `multer` — agora guardados no **próprio PostgreSQL** (BYTEA) |
| Estáticos | `frontend/` servido pelo Express (CSS, JS, imagens, GIF do login) |
| Banco local | `embedded-postgres` (porta 5433) — **só funciona localmente** |
| Deploy | Vercel, com `api/index.js` + `vercel.json` |

### O que só funcionava localmente (e foi resolvido)

1. **PostgreSQL embutido** — na Vercel não existe. O projeto passou a detectar
   `VERCEL=1` e a usar somente o PostgreSQL externo.
2. **Disco para uploads** — na Vercel o disco é temporário. Entregas e fotos
   agora são gravadas no banco (`arquivo_dados`, `foto_dados`).
3. **Seed de demonstração** — nunca roda em produção. Em produção, o primeiro
   administrador é criado pelas variáveis `ADMIN_*`.
4. **Sessões** — continuam no PostgreSQL, funcionando entre instâncias.
5. **Arquivos estáticos** — incluídos no bundle da função via `includeFiles`
   em `vercel.json`.

---

## 2. O que já foi configurado

- `vercel.json` — todas as rotas (inclusive acessos diretos como
  `/configuracoes`) vão para o Express; `frontend/**` e `schema.sql` entram no
  bundle. A região padrão da Vercel é usada; veja a seção 7 para ajustá-la.
- `api/index.js` — entrada serverless que prepara o banco uma vez por instância
  e entrega as requisições ao Express.
- `backend/src/db.js` — detecção automática de produção (`VERCEL=1`), SSL para
  banco externo e pool pequeno para serverless.
- `backend/src/criarBanco.js` — schema idempotente, **sem seed em produção**,
  limpeza de sessões vencidas e criação opcional do admin inicial.
- `backend/src/app.js` — exige `SESSION_SECRET` forte em produção, cabeçalhos de
  segurança, rota `/saude`, fotos servidas do banco.
- Uploads de entregas e fotos persistentes no PostgreSQL.
- Limite de upload configurável (`LIMITE_ENTREGA_MB`, padrão **4 MB** em
  produção por causa do limite de ~4,5 MB da Vercel).
- `.env.exemplo` com todas as variáveis de produção documentadas.
- Login social Google/GitHub pronto (ver `COMO-CONFIGURAR-LOGIN-SOCIAL.md`).

---

## 3. Privacidade e permissões

- **Público:** `/` (login), `/cadastro` e `/recuperar`.
- **Protegido:** `/aluno`, `/professor`, `/admin`, `/configuracoes` e
  `/arquivos/...` exigem sessão; cada perfil só vê os próprios dados.
- Download de entrega só é liberado para o aluno dono, o professor da matéria
  ou o administrador.
- Fotos de perfil usam nomes aleatórios gerados pelo sistema.

---

## 4. Contas e credenciais necessárias (você precisa criar)

1. **Conta na Vercel** — <https://vercel.com/signup> (pode entrar com GitHub).
2. **Conta em um PostgreSQL gerenciado.** Recomendado: **Neon**
   (<https://neon.tech>) ou **Supabase** (<https://supabase.com>).
   - Crie um projeto/banco.
   - Copie a **connection string** (URL). Na Neon, prefira a URL **pooled**
     (contém `-pooler`), ideal para serverless.
   - Guarde usuário, senha, host, porta e nome do banco.
3. **Repositório no GitHub** com este projeto (a Vercel importa de lá).
4. **Opcional:** apps OAuth do Google e GitHub (passo a passo em
   `COMO-CONFIGURAR-LOGIN-SOCIAL.md`).

> Nunca envie `.env`, senhas ou chaves por chat, print ou commit. As credenciais
> vão somente no painel da Vercel.

---

## 5. Passo a passo do deploy

### 5.1 Subir o código para o GitHub

```bash
git add .
git commit -m "Prepara deploy na Vercel"
git push origin main
```

### 5.2 Criar o banco (Neon, exemplo)

1. Crie o projeto na região **South America (São Paulo)** se disponível — assim
   fica perto da função `gru1` da Vercel.
2. Copie a URL no formato:
   ```
   postgresql://USUARIO:SENHA@HOST/BANCO?sslmode=require
   ```
3. Não é preciso rodar SQL manualmente: o schema é criado no primeiro acesso.

### 5.3 Importar na Vercel

1. Em <https://vercel.com/new>, importe o repositório do GitHub.
2. Framework preset: **Other** (deixe o build padrão).
3. Em **Environment Variables**, cadastre (Production e Preview):

| Variável | Exemplo / observação |
| --- | --- |
| `DATABASE_URL` | URL do PostgreSQL externo (com `sslmode=require`) |
| `PG_SSL` | `true` |
| `SESSION_SECRET` | string aleatória com **32+ caracteres** |
| `SITE_URL` | `https://seu-projeto.vercel.app` |
| `ADMIN_EMAIL` | e-mail do primeiro administrador |
| `ADMIN_SENHA` | senha forte (8+ caracteres) |
| `ADMIN_NOME` | nome exibido (opcional) |
| `LIMITE_ENTREGA_MB` | `4` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | opcional |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | opcional |

Gere o segredo com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Clique em **Deploy**. A Vercel gera uma URL de **Preview** para o primeiro
   deploy e, depois, a URL de produção `https://SEU-PROJETO.vercel.app`.
5. **Confirme antes de promover para produção.** O deploy inicial pode ser
   usado como prévia para testar.

### 5.4 Depois do primeiro deploy

1. Abra `https://SEU-PROJETO.vercel.app/saude` → deve responder
   `{"ok":true,"ambiente":"producao"}`.
2. Entre com o admin criado por `ADMIN_EMAIL` / `ADMIN_SENHA`.
3. Crie uma turma, um professor e uma matéria pelo painel admin.
4. Teste o cadastro de um aluno pela tela de cadastro (divisória **Aluno**): confirme o e-mail pelo link, peça o código da turma e entre na turma com o código.
5. Teste envio de trabalho, download e foto de perfil.
6. Atualize as URLs de callback do Google/GitHub com o domínio final.

---

## 6. Como obter o endereço público

- **Produção:** `https://SEU-PROJETO.vercel.app` (aparece em
  *Project → Domains*). Você pode trocar por um domínio próprio depois.
- **Prévia:** cada deploy/branch gera uma URL do tipo
  `https://seu-projeto-git-branch-usuario.vercel.app`.
- **Redeploy:** ao mudar variáveis de ambiente, use
  *Deployments → Redeploy* para aplicar.

---

## 7. Limites e decisões importantes

- **Uploads:** a Vercel limita o corpo da requisição a ~4,5 MB. Por isso o
  padrão em produção é 4 MB. Para arquivos maiores seria necessário usar
  armazenamento externo (S3/R2/Vercel Blob) com upload direto do navegador.
- **Banco:** use a URL *pooled* do provedor para não esgotar conexões.
- **Sessões:** ficam no PostgreSQL; o site pode escalar para várias instâncias.
- **Região:** o `vercel.json` não fixa região, então vale o padrão da Vercel
  (`iad1`, EUA). Escolha o banco na mesma região para reduzir latência. Se
  quiser a função em São Paulo, adicione `"regions": ["gru1"]` ao
  `vercel.json` (confirme se o seu plano permite) e hospede o banco em
  `sa-east-1`.
- **Seed:** em produção nunca é executado, mesmo com banco vazio.
- **Admin:** só é criado se ainda não existir nenhum admin e se `ADMIN_*`
  estiver definido. Depois de criar, você pode remover `ADMIN_SENHA` do painel.
- **Logs:** erros aparecem em *Vercel → Deployments → Functions → Logs*.

---

## 8. Checklist

### Configurado no código

- [x] Entrada serverless `api/index.js`
- [x] `vercel.json` com rewrite total e arquivos estáticos incluídos
- [x] Detecção automática de produção na Vercel
- [x] Schema criado automaticamente, sem seed em produção
- [x] Admin inicial via `ADMIN_*`
- [x] Sessões persistentes no PostgreSQL
- [x] Uploads e fotos persistentes no banco
- [x] Limite de upload compatível com a Vercel
- [x] `SESSION_SECRET` obrigatório em produção
- [x] Rotas pessoais protegidas por login/perfil
- [x] Login Google/GitHub implementado
- [x] `.env.exemplo` atualizado
- [x] Rota de diagnóstico `/saude`

### Falta você fazer

- [ ] Criar o PostgreSQL externo (Neon/Supabase) e copiar a URL
- [ ] Subir o projeto para o GitHub
- [ ] Importar na Vercel
- [ ] Cadastrar as variáveis de ambiente
- [ ] Fazer o deploy de prévia e testar
- [ ] (Opcional) configurar OAuth Google/GitHub
- [ ] Confirmar a promoção para produção

---

## 9. Testes já realizados localmente

- Login, cadastro e recuperação funcionando.
- Simulação de produção (`VERCEL=1`) com `api/index.js`: `/`, `/cadastro`
  e `/saude` responderam 200; `/configuracoes` redirecionou para o login.
- Upload de entrega: arquivo gravado no banco e baixado idêntico.
- Foto de perfil: gravada no banco e servida corretamente em `/fotos/...`.
- Nenhum erro de sintaxe nos arquivos alterados.
