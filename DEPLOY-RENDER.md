# 🚀 Publicar o Nuvia no Render.com

Este guia deixa o sistema online, com banco PostgreSQL e PWA instalável.
O repositório já inclui o arquivo [`render.yaml`](render.yaml), que cria o site
e o banco automaticamente.

---

## 1. Pré-requisitos

- Conta no [Render](https://render.com) (pode entrar com GitHub).
- Conta no GitHub com o repositório do projeto.
- O repositório precisa estar **público** (requisito do trabalho) e com o
  código atualizado.

---

## 2. Enviar o código para o GitHub

No terminal, dentro da pasta do projeto:

```bash
git add .
git commit -m "PWA, CRUD completo e deploy no Render"
git push origin main
```

> O arquivo `.env` **não** é enviado (está no `.gitignore`). Nunca suba senhas
> ou chaves para o repositório.

Se o repositório ainda não existir no GitHub:

```bash
# crie um repositório vazio em https://github.com/new (sem README)
git remote add origin https://github.com/SEU-USUARIO/sistemax.git
git branch -M main
git push -u origin main
```

Para deixar público: **GitHub → Settings → General → Danger Zone → Change
repository visibility → Public**.

---

## 3. Criar no Render (Blueprint — recomendado)

1. Entre em <https://dashboard.render.com>.
2. Clique em **New → Blueprint**.
3. Conecte o GitHub e escolha o repositório do Nuvia.
4. O Render lê o `render.yaml` e mostra:
   - **nuvia** (Web Service, Node)
   - **nuvia-db** (PostgreSQL)
5. Preencha as variáveis pedidas:
   - `ADMIN_EMAIL` — e-mail do administrador.
   - `ADMIN_SENHA` — senha forte (mínimo 8 caracteres).
   - `SITE_URL` — deixe em branco por enquanto; preencha depois com a URL final.
   - Credenciais OAuth (opcional; pode deixar em branco).
6. Clique em **Apply**. Aguarde o build (alguns minutos).

Ao terminar, o Render mostra um endereço como:

```
https://nuvia.onrender.com
```

Abra esse endereço e entre com o `ADMIN_EMAIL` / `ADMIN_SENHA`.

---

## 4. Ajustar a URL pública

1. No Render, abra o serviço **nuvia** → **Environment**.
2. Edite `SITE_URL` para a URL final, **sem barra no final**:

```
https://nuvia.onrender.com
```

3. Salve. O Render reinicia o serviço sozinho.

> Sem `SITE_URL`, o sistema usa automaticamente o endereço da requisição.
> Definir a variável evita erros nos retornos do login social.

---

## 5. Login social no Render (opcional)

Os provedores precisam aceitar o novo endereço de retorno:

| Provedor | URL de callback para cadastrar |
|---|---|
| Google | `https://SUA-URL.onrender.com/entrar/google/callback` |
| GitHub | `https://SUA-URL.onrender.com/entrar/github/callback` |

- **GitHub:** Settings → Developer settings → OAuth Apps → Nuvia →
  *Authorization callback URL*.
- **Google:** Google Cloud Console → Credenciais → seu cliente OAuth →
  *URIs de redirecionamento autorizados*.

Depois preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no Render → Environment.

O login por e-mail/senha funciona sem essas variáveis.

---

## 6. Verificar se está tudo certo

| Teste | Endereço |
|---|---|
| Saúde do sistema e banco | `https://SUA-URL.onrender.com/saude` |
| Login | `https://SUA-URL.onrender.com/` |
| Cadastro de aluno | `https://SUA-URL.onrender.com/cadastro` |
| Manifesto PWA | `https://SUA-URL.onrender.com/manifest.webmanifest` |
| Service Worker | `https://SUA-URL.onrender.com/sw.js` |

No `/saude` deve aparecer:

```json
{ "ok": true, "ambiente": "producao", "oauth": { "google": false, "github": true } }
```

---

## 7. Instalar como aplicativo (PWA)

- **Android/Chrome:** abra o site → menu ⋮ → **Instalar app** (ou toque no
  botão **Instalar app** que aparece no canto da tela).
- **iPhone/iPad (Safari):** botão **Compartilhar** → **Adicionar à Tela de
  Início**.
- **Computador (Chrome/Edge):** ícone de instalação na barra de endereço.

O app abre em tela cheia, com ícone próprio e funcionamento offline básico
(página “Sem conexão” quando a internet cai).

---

## 8. Plano gratuito do Render — atenção

- O serviço **hiberna** após alguns minutos sem acesso; o primeiro acesso
  depois disso pode levar ~30–60 segundos.
- O PostgreSQL gratuito do Render expira após **30 dias**. Para o trabalho
  durar mais, use:
  - **Neon** (<https://neon.tech>) ou **Supabase** (gratuitos), ou
  - um plano pago do Render.
- Para usar um banco externo, no Render → Environment:
  - remova/ignore o `DATABASE_URL` do banco interno;
  - defina `DATABASE_URL` com a URL do Neon/Supabase;
  - defina `PG_SSL=true`.

---

## 9. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Build falha em `npm ci` | `package-lock.json` desatualizado | rode `npm install`, faça commit do lock |
| Site sobe mas dá erro 503 em `/saude` | banco inacessível | confira `DATABASE_URL` e `PG_SSL` |
| “Defina SESSION_SECRET…” | variável ausente/curta | use o valor gerado pelo Render (32+ caracteres) |
| Login some ao navegar | `SITE_URL`/proxy | confira `SITE_URL` e `trust proxy` |
| OAuth volta para localhost | callback antigo no provedor | atualize a URL no Google/GitHub |
| Upload falha | limite de tamanho | ajuste `LIMITE_ENTREGA_MB` |
| Dados somem ao reiniciar | usando disco local em produção | confirme que o banco está no PostgreSQL |

---

## 10. Checklist do trabalho

- [x] Cadastro, consulta, edição e exclusão de dados (CRUD)
- [x] Integração com PostgreSQL (schema automático)
- [x] Persistência de dados (inclusive arquivos e fotos no banco)
- [x] `manifest.webmanifest` + Service Worker
- [x] Instalação em dispositivos móveis (PWA)
- [x] Interface visual e responsividade (temas e layout existentes)
- [x] Organização do código (backend/frontend, rotas e páginas separadas)
- [ ] Link público do Render (preencher após o deploy)
- [ ] Link do repositório público no GitHub (preencher após publicar)

Preencha os dois últimos itens aqui e no `README.md`:

```
Site:   https://SUA-URL.onrender.com
GitHub: https://github.com/SEU-USUARIO/sistemax
```
