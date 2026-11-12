# Como configurar o login com Google e GitHub

O código do login social já está pronto no projeto. Falta apenas criar as
credenciais nos sites do Google e do GitHub e colocá-las nas variáveis de
ambiente. Nenhuma senha ou chave fica salva no repositório.

> **Como funciona:** o usuário clica em “Continuar com Google” ou
> “Continuar com GitHub”, autoriza no provedor e o Nuvia procura uma conta
> com **o mesmo e-mail verificado**. Por segurança, contas novas não são
> criadas automaticamente: o aluno precisa primeiro criar a conta pelo
> `/cadastro` (sem código). Depois disso, poderá entrar com o
> Google/GitHub usando o mesmo e-mail.

---

## 1. Google

1. Acesse <https://console.cloud.google.com/> e crie (ou escolha) um projeto.
2. No menu, vá em **APIs e serviços → Tela de permissão OAuth**.
   - Tipo de usuário: **Externo**.
   - Preencha nome do app (`Nuvia`), e-mail de suporte e contatos.
   - Em **Escopos**, adicione `openid`, `email` e `profile`.
   - Em **Usuários de teste** (enquanto o app estiver em modo de teste),
     adicione os e-mails que poderão entrar.
3. Vá em **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**.
   - Tipo: **Aplicativo da Web**.
   - **URIs de redirecionamento autorizados** — adicione exatamente:
     ```
     http://localhost:3000/entrar/google/callback
     ```
     e, quando tiver o endereço público:
     ```
     https://SEU-DOMINIO/entrar/google/callback
     ```
     (na Vercel costuma ser `https://seu-projeto.vercel.app/entrar/google/callback`).
4. Copie o **ID do cliente** e a **Chave secreta do cliente** e coloque no `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
   > ⚠️ **Atenção:** no `.env` local do projeto essas duas variáveis estão
   > vazias neste momento. Cole os valores acima e reinicie (`npm start`)
   > — sem isso o botão "Continuar com Google" mostra "ainda não foi
   > configurado", mesmo que tudo esteja certo no console do Google.
   > Se você usa o site publicado (Render), configure as mesmas variáveis
   > no painel do serviço e faça um **Redeploy**.

> Enquanto o app estiver em modo de teste no Google, somente os e-mails
> adicionados em “Usuários de teste” conseguem entrar. Para abrir para toda a
> escola, publique o app na tela de permissão OAuth. O Google pode pedir
> verificação — para uso interno, o modo de teste com os e-mails da escola
> costuma ser suficiente.

---

## 2. GitHub

1. Acesse <https://github.com/settings/developers> → **OAuth Apps → New OAuth App**.
2. Preencha:
   - **Application name:** `Nuvia`
   - **Homepage URL:** `http://localhost:3000` (depois troque pelo domínio público)
   - **Authorization callback URL:**
     ```
     http://localhost:3000/entrar/github/callback
     ```
     e, em produção:
     ```
     https://SEU-DOMINIO/entrar/github/callback
     ```
     (o GitHub aceita **uma** URL por app; para ter local e produção ao mesmo
     tempo, crie dois OAuth Apps: “Nuvia Dev” e “Nuvia”.)
3. Clique em **Generate a new client secret**.
4. Copie o **Client ID** e o **Client secret** para o `.env`:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

---

## 3. Variáveis de ambiente

No `.env` local (ou nas *Environment Variables* da Vercel):

```
SITE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

- `SITE_URL` precisa ser o endereço **exato** pelo qual o site é acessado
  (sem barra no final). É com ele que o `redirect_uri` é montado.
- Se preferir definir a URL de retorno manualmente, use
  `GOOGLE_REDIRECT_URI` e `GITHUB_REDIRECT_URI`.
- Depois de alterar o `.env`, reinicie o servidor (`npm start`).
- Para conferir se ficou tudo certo (sem mostrar segredos), rode:
  ```
  npm run verificar-oauth
  ```
  Ele mostra quais provedores estão configurados e a URL de callback exata.
- Na Vercel, alterar uma variável exige **Redeploy** para valer.

---

## 4. Testar

1. Crie uma conta de aluno em `/cadastro` usando um e-mail que você controla
   (ex.: o mesmo e-mail da sua conta Google/GitHub). O e-mail do provedor
   precisa ser o **mesmo** da conta Nuvia (é assim que o vínculo acontece).
2. Confirme o e-mail pelo link recebido (o sistema só mostra a opção de
   pedir o código da turma depois disso).
3. Saia e clique em **Continuar com Google** (ou GitHub).
4. Autorize. Você deve voltar logado no painel do aluno (ou do professor).

Se aparecer “Não encontramos uma conta Nuvia com o e-mail …”, significa que
não existe conta com aquele e-mail — crie primeiro pelo `/cadastro` (as
divisórias "Aluno" e "Professor" usam o mesmo fluxo de login social).

Se aparecer “ainda não foi configurado”, alguma das variáveis está vazia ou o
servidor não foi reiniciado.

> **GitHub: "redirect_uri is not associated with this application"** — o
> GitHub aceita o login apenas para a URL cadastrada no OAuth App. Para o
> endereço local ser `http://localhost:3000`, a **Authorization callback
> URL** precisa ser exatamente `http://localhost:3000/entrar/github/callback`.
> Para produção (HTTPS), crie um segundo OAuth App com a callback do domínio
> público — os ids são diferentes.

---

## 5. Segurança

- O fluxo usa `state` aleatório para evitar CSRF.
- Só aceitamos e-mail **verificado** pelo provedor.
- O vínculo com o provedor fica gravado em `oauth_google_id` / `oauth_github_id`
  (criados automaticamente pelo `schema.sql`).
- O e-mail do provedor é comparado com o e-mail da conta Nuvia; por isso,
  mantenha o e-mail atualizado no perfil.
- Nunca comite o `.env` nem cole as chaves em issues ou capturas de tela.
