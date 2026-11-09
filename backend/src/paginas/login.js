/** Tela de entrada, cadastro de aluno e recuperação de senha — visual Nuvia. */
const { esc } = require('../util');

const SVG_EMAIL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v.5l-8 5.2-8-5.2v-.5Zm0 2.3 7.59 4.94a.75.75 0 0 0 .82 0L20 9.05v7.2A2.75 2.75 0 0 1 17.25 19H6.75A2.75 2.75 0 0 1 4 16.25v-7.2Z"/></svg>`;

const SVG_LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A1.75 1.75 0 0 1 20 11.75v7.5A1.75 1.75 0 0 1 18.25 21H5.75A1.75 1.75 0 0 1 4 19.25v-7.5A1.75 1.75 0 0 1 5.75 10H7Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 3a1.5 1.5 0 0 0-.75 2.8V18h1.5v-2.2A1.5 1.5 0 0 0 12 13Z"/></svg>`;

const SVG_EYE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12s3.3-6 9.8-6 9.8 6 9.8 6-3.3 6-9.8 6-9.8-6-9.8-6Zm9.8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>`;

const SVG_PERSON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2c-4.1 0-7.4 2.3-7.4 5.1 0 .5.4.9.9.9h13c.5 0 .9-.4.9-.9 0-2.8-3.3-5.1-7.4-5.1Z"/></svg>`;

const SVG_CODE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 6.6a1 1 0 0 1 1.4 1.4L7.9 11l2.9 3a1 1 0 1 1-1.4 1.4l-3.6-3.7a1 1 0 0 1 0-1.4l3.6-3.7Zm5.2 0a1 1 0 0 0-1.4 1.4L16.1 11l-2.9 3a1 1 0 1 0 1.4 1.4l3.6-3.7a1 1 0 0 0 0-1.4l-3.6-3.7Z"/></svg>`;

const SVG_GOOGLE = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;

const SVG_GITHUB = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>`;

const ICONES = { email: SVG_EMAIL, senha: SVG_LOCK, nome: SVG_PERSON, codigo: SVG_CODE, resposta: SVG_LOCK };

function campo(id, tipo, rotulo, extra = '', placeholder = ' ') {
  const icone = ICONES[id] || '';
  const ehSenha = tipo === 'password';
  const botaoOlho = ehSenha
    ? `<button class="show-password" type="button" data-toggle-password="${id}" aria-label="Mostrar senha" aria-pressed="false">${SVG_EYE}</button>`
    : '';
  return `
    <label for="${id}">${rotulo}</label>
    <div class="field">
      ${icone}
      <input type="${tipo}" id="${id}" name="${id}" placeholder="${esc(placeholder)}" ${extra} required>
      ${botaoOlho}
    </div>`;
}

function campoComLinkSenha(id, rotulo, extra = '', link = '') {
  return `
    <div class="password-label">
      <label for="${id}">${rotulo}</label>
      ${link}
    </div>
    <div class="field">
      ${SVG_LOCK}
      <input type="password" id="${id}" name="${id}" placeholder="Digite sua senha" ${extra} required>
      <button class="show-password" type="button" data-toggle-password="${id}" aria-label="Mostrar senha" aria-pressed="false">${SVG_EYE}</button>
    </div>`;
}

function botoesSociais() {
  return `
    <div class="divider"><span></span><small>ou</small><span></span></div>
    <div class="social-row">
      <a class="google-btn" href="/entrar/google">
        <span class="google-g" aria-hidden="true">G</span> Continuar com Google
      </a>
      <a class="google-btn" href="/entrar/github">
        <span class="github-g" aria-hidden="true">${SVG_GITHUB}</span> Continuar com GitHub
      </a>
    </div>`;
}

function mensagensDoServidor(req) {
  const flash = (req && req.session && req.session.flash) || [];
  if (req && req.session) delete req.session.flash;
  if (!flash.length) return '';
  return `<div class="mensagens">${flash
    .map(
      (f) =>
        `<div class="mensagem ${f.tipo === 'erro' ? 'erro' : 'ok'}" role="status">
          <span>${esc(f.texto)}</span>
          <button type="button" class="fechar-mensagem" aria-label="Fechar">×</button>
        </div>`
    )
    .join('')}</div>`;
}

function modoEntrar(req) {
  return {
    titulo: 'Bem-vindo de volta',
    subtitulo: 'Faça login para acessar sua conta.',
    conteudo: `
      ${mensagensDoServidor(req)}
      <form method="post" action="/entrar" class="form-login">
        ${campo('email', 'text', 'E-mail ou usuário', 'autocomplete="username" inputmode="email"', 'voce@exemplo.com')}
        ${campoComLinkSenha('senha', 'Senha', 'autocomplete="current-password"', '<a href="/recuperar">Esqueceu?</a>')}
        <div class="form-options">
          <label class="remember"><input type="checkbox" name="manter" value="1"> <span>Manter conectado</span></label>
        </div>
        <button class="submit-btn" type="submit">Entrar <span aria-hidden="true">↗</span></button>
      </form>
      ${botoesSociais()}
      <p class="signup">Ainda não tem uma conta? <a href="/cadastro">Criar conta</a></p>`,
  };
}

function modoCadastro(req, dados) {
  const email = dados && dados.email ? esc(dados.email) : '';
  return {
    titulo: 'Criar conta',
    subtitulo: 'Alunos: use o código da turma fornecido pela escola.',
    conteudo: `
      ${mensagensDoServidor(req)}
      <form method="post" action="/cadastro" class="form-login">
        ${campo('nome', 'text', 'Nome completo', 'autocomplete="name"', 'Como devemos chamar você?')}
        ${campo('email', 'email', 'E-mail', `autocomplete="email" inputmode="email" value="${email}"`, 'voce@exemplo.com')}
        ${campo('senha', 'password', 'Senha', 'minlength="6" autocomplete="new-password"', 'Crie uma senha com 6+ caracteres')}
        ${campo('codigo', 'text', 'Código da turma', 'autocomplete="off" autocapitalize="characters"', 'Ex.: 9A2026')}
        <button class="submit-btn" type="submit">Criar conta <span aria-hidden="true">↗</span></button>
      </form>
      <p class="voltar">Já tem uma conta? <a href="/entrar">Entrar</a></p>`,
  };
}

function modoRecuperar(req, dados) {
  if (!dados || !dados.pergunta) {
    return {
      titulo: 'Recuperar senha',
      subtitulo: 'Informe seu e-mail para começar.',
      conteudo: `
        ${mensagensDoServidor(req)}
        <form method="post" action="/recuperar/passo1" class="form-login">
          ${campo('email', 'email', 'E-mail', 'autocomplete="email" inputmode="email"', 'voce@exemplo.com')}
          <button class="submit-btn" type="submit">Continuar <span aria-hidden="true">↗</span></button>
        </form>
        <p class="voltar"><a href="/entrar">Voltar ao login</a></p>`,
    };
  }
  return {
    titulo: 'Nova senha',
    subtitulo: 'Responda a pergunta de segurança cadastrada.',
    conteudo: `
      ${mensagensDoServidor(req)}
      <form method="post" action="/recuperar/passo2" class="form-login">
        <input type="hidden" name="email" value="${esc(dados.email)}">
        <div class="recover-info">
          <small>E-mail</small>
          <strong>${esc(dados.email)}</strong>
        </div>
        <div class="question-box">${esc(dados.pergunta)}</div>
        ${campo('resposta', 'text', 'Sua resposta', 'autocomplete="off"', 'Digite sua resposta')}
        ${campo('senha', 'password', 'Nova senha', 'minlength="6" autocomplete="new-password"', 'Crie uma senha com 6+ caracteres')}
        <button class="submit-btn" type="submit">Redefinir senha <span aria-hidden="true">↗</span></button>
      </form>
      <p class="voltar"><a href="/entrar">Voltar ao login</a></p>`,
  };
}

function telaLogin({ modo, dados, req }) {
  let tela = modoEntrar(req);
  if (modo === 'cadastro') tela = modoCadastro(req, dados);
  if (modo === 'recuperar') tela = modoRecuperar(req, dados);

  const tituloPagina =
    modo === 'cadastro' ? 'Criar conta · Nuvia' : modo === 'recuperar' ? 'Recuperar senha · Nuvia' : 'Entrar · Nuvia';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#17132d">
<meta name="description" content="Entre na sua conta Nuvia.">
<title>${tituloPagina}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/login-nuvia.css">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nuvia">
</head>
<body>
  <main class="login-page">
    <div class="backdrop" aria-hidden="true"></div>

    <header class="topbar">
      <a class="brand" href="/" aria-label="Nuvia, página inicial">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span></span>
        <span>nuvia</span>
      </a>
      <span class="top-note">Seu espaço de aprendizado</span>
    </header>

    <section class="login-wrap" aria-labelledby="login-heading">
      <div class="intro">
        <span class="eyebrow"><span class="eyebrow-dot"></span> SEU CANTINHO DE ESTUDOS</span>
        <h1>Bom ter você<br><span>por aqui.</span></h1>
        <p>Entre e continue de onde sua jornada de aprendizado parou.</p>
      </div>

      <div class="glass-card">
        <div class="card-heading">
          <div class="mini-mark" aria-hidden="true">n.</div>
          <h2 id="login-heading">${tela.titulo}</h2>
          <p>${tela.subtitulo}</p>
        </div>
        ${tela.conteudo}
      </div>
    </section>

    <footer class="footer">
      <span>© 2026 Nuvia</span>
      <span class="footer-separator">•</span>
      <span>Um espaço tranquilo para aprender.</span>
    </footer>
  </main>

  <script>
    (function () {
      // Mostrar/ocultar senha
      document.querySelectorAll('[data-toggle-password]').forEach(function (botao) {
        var campo = document.getElementById(botao.getAttribute('data-toggle-password'));
        if (!campo) return;
        botao.addEventListener('click', function () {
          var oculta = campo.type === 'password';
          campo.type = oculta ? 'text' : 'password';
          botao.setAttribute('aria-pressed', String(oculta));
          botao.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');
        });
      });

      // Fechar mensagens do servidor
      document.addEventListener('click', function (evento) {
        var fechar = evento.target.closest('.fechar-mensagem');
        if (!fechar) return;
        var mensagem = fechar.closest('.mensagem');
        if (!mensagem) return;
        mensagem.classList.add('saindo');
        setTimeout(function () { mensagem.remove(); }, 200);
      });
      // Mensagens de sucesso somem sozinhas; erros continuam visíveis
      // até o usuário fechar (importante para diagnosticar login social).
      setTimeout(function () {
        document.querySelectorAll('.mensagem.ok').forEach(function (mensagem) {
          mensagem.classList.add('saindo');
          setTimeout(function () { mensagem.remove(); }, 200);
        });
      }, 8000);
    })();
  </script>
  <script src="/pwa.js" defer></script>
</body>
</html>`;
}

module.exports = { telaLogin };
