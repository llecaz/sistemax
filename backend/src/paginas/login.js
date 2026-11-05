/** Tela de login estilo Google: entrar, criar conta de aluno e recuperar senha. */
const { esc } = require('../util');
const { NOME_SISTEMA } = require('./layout');
const { decoracao } = require('./decoracoes');
const { TEMA_PADRAO, temaDe, scriptTemas } = require('../temas');

/* Ícones em pixel art feitos com traços grossos, no mesmo lilás da interface. */
const SVG_CADEADO = `<svg class="campo-icone-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="1.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><path d="M12 16.7v1.5"/></svg>`;

const SVG_OLHO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.2"/></svg>`;

const SVG_GOOGLE = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;

const SVG_GITHUB = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>`;

function campo(id, tipo, rotulo, extra = '') {
  const ehEmail = tipo === 'email';
  const ehSenha = tipo === 'password';
  const icone = ehEmail
    ? decoracao('nuvia-envelope-heart', { pasta: 'accessories', tamanho: 23, classe: 'campo-icone-img' })
    : ehSenha
      ? SVG_CADEADO
      : '';
  const botaoOlho = ehSenha
    ? `<button type="button" class="campo-olho" data-ver-senha="${id}" aria-label="Mostrar senha" aria-pressed="false" title="Mostrar senha">${SVG_OLHO}<span class="campo-olho-risco" aria-hidden="true"></span></button>`
    : '';
  return `
  <div class="campo${icone ? ' campo--icone' : ''}">
    ${icone ? `<span class="campo-icone" aria-hidden="true">${icone}</span>` : ''}
    <input type="${tipo}" id="${id}" name="${id}" placeholder=" " ${extra} required>
    <label for="${id}">${rotulo}</label>
    ${botaoOlho}
  </div>`;
}

function botao(texto) {
  return `<button class="btn primario grande login-btn" type="submit">
    <span class="login-btn-pata" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 25 })}</span>
    <span>${texto}</span>
  </button>`;
}

function botoesSociais() {
  return `<div class="login-sociais" aria-label="Outras formas de entrar">
    <a class="login-social" href="/entrar/google" aria-label="Entrar com Google">
      <span class="login-social-icone" aria-hidden="true">${SVG_GOOGLE}</span>
      <span>Google</span>
    </a>
    <a class="login-social" href="/entrar/github" aria-label="Entrar com GitHub">
      <span class="login-social-icone" aria-hidden="true">${SVG_GITHUB}</span>
      <span>GitHub</span>
    </a>
  </div>`;
}

function separadorCadastro() {
  return `<div class="login-separador" aria-hidden="true">
    <span class="login-separador-linha"></span>
    ${decoracao('nuvia-bow-purple', { pasta: 'accessories', tamanho: 34, classe: 'login-separador-laco' })}
    <span class="login-separador-linha"></span>
  </div>`;
}

function modoEntrar() {
  return `
  <h1>Entrar</h1>
  <p class="subtitulo">Use sua conta da escola para continuar</p>
  <form method="post" action="/entrar" class="form-login">
    ${campo('email', 'email', 'E-mail')}
    ${campo('senha', 'password', 'Senha')}
    <div class="linha-opcoes">
      <label class="checkbox"><input type="checkbox" name="manter" value="1"> <span>Lembrar de mim</span></label>
      <a class="link" href="/recuperar">Esqueceu sua senha?</a>
    </div>
    ${botao('Entrar')}
    ${botoesSociais()}
    ${separadorCadastro()}
    <p class="rodape-form">Ainda não tem uma conta? <a class="link" href="/cadastro">Cadastre-se</a></p>
  </form>`;
}

function modoCadastro() {
  return `
  <h1>Criar conta</h1>
  <p class="subtitulo">Alunos: informe o código da turma fornecido pela escola</p>
  <form method="post" action="/cadastro" class="form-login">
    ${campo('nome', 'text', 'Nome completo')}
    ${campo('email', 'email', 'E-mail')}
    ${campo('senha', 'password', 'Senha', 'minlength="6"')}
    ${campo('codigo', 'text', 'Código da turma', 'autocapitalize="characters"')}
    ${botao('Criar conta')}
    <p class="rodape-form">Já tem conta? <a class="link" href="/">Entrar</a></p>
  </form>`;
}

function modoRecuperar(dados) {
  if (!dados || !dados.pergunta) {
    return `
    <h1>Recuperar senha</h1>
    <p class="subtitulo">Informe seu e-mail para começar</p>
    <form method="post" action="/recuperar/passo1" class="form-login">
      ${campo('email', 'email', 'E-mail')}
      ${botao('Continuar')}
      <p class="rodape-form"><a class="link" href="/">Voltar ao login</a></p>
    </form>`;
  }
  return `
  <h1>Recuperar senha</h1>
  <p class="subtitulo">Responda a pergunta de segurança cadastrada</p>
  <form method="post" action="/recuperar/passo2" class="form-login">
    <input type="hidden" name="email" value="${esc(dados.email)}">
    <div class="perguntinha">
      <small>E-mail</small>
      <strong>${esc(dados.email)}</strong>
    </div>
    <div class="campo-pergunta">
      <span>${esc(dados.pergunta)}</span>
    </div>
    ${campo('resposta', 'text', 'Sua resposta')}
    ${campo('senha', 'password', 'Nova senha', 'minlength="6"')}
    ${botao('Redefinir senha')}
    <p class="rodape-form"><a class="link" href="/">Voltar ao login</a></p>
  </form>`;
}

/** Cena da mesa de estudos montada só com recortes da cartela Nuvia. */
function cenaLogin() {
  return `
  <section class="login-cena" aria-hidden="true">
    <span class="login-cena-chao"></span>
    ${decoracao('nuvia-window-night', { pasta: 'accessories', tamanho: '44%', classe: 'login-cena-janela' })}
    ${decoracao('nuvia-plant-hanging', { pasta: 'plants', tamanho: '20%', classe: 'login-cena-pendente' })}
    ${decoracao('nuvia-wall-hanging-cat', { pasta: 'accessories', tamanho: '15%', classe: 'login-cena-quadro' })}
    ${decoracao('nuvia-bookshelf', { pasta: 'stationery', tamanho: '27%', classe: 'login-cena-estante' })}
    ${decoracao('nuvia-plant-flowers', { pasta: 'plants', tamanho: '15%', classe: 'login-cena-flores' })}
    ${decoracao('nuvia-laptop', { pasta: 'stationery', tamanho: '32%', classe: 'login-cena-notebook' })}
    ${decoracao('nuvia-books-stack', { pasta: 'stationery', tamanho: '26%', classe: 'login-cena-livros' })}
    ${decoracao('nuvia-cat-sleeping-pillow', { pasta: 'cats', tamanho: '26%', classe: 'login-cena-gato' })}
    ${decoracao('nuvia-mug-cat', { pasta: 'accessories', tamanho: '11%', classe: 'login-cena-caneca' })}
    ${decoracao('nuvia-plant-small-pot', { pasta: 'plants', tamanho: '9%', classe: 'login-cena-plantinha' })}
    ${decoracao('nuvia-plant-potted', { pasta: 'plants', tamanho: '19%', classe: 'login-cena-planta' })}
    ${decoracao('nuvia-sparkle-orange', { pasta: 'celestial', tamanho: 34, classe: 'login-cena-brilho login-cena-brilho--1' })}
    ${decoracao('nuvia-sparkle-purple', { pasta: 'celestial', tamanho: 28, classe: 'login-cena-brilho login-cena-brilho--2' })}
    ${decoracao('nuvia-star-yellow-small', { pasta: 'celestial', tamanho: 26, classe: 'login-cena-brilho login-cena-brilho--3' })}
    <div class="login-cena-placa">
      ${decoracao('nuvia-sparkle-orange-small', { pasta: 'celestial', tamanho: 18, classe: 'login-cena-placa-brilho login-cena-placa-brilho--1' })}
      <p class="login-cena-placa-titulo">Seu cantinho de estudos <span aria-hidden="true">♡</span></p>
      <p class="login-cena-placa-texto">Organize suas ideias, acompanhe<br>suas atividades e aproveite seu ritmo.</p>
      ${decoracao('nuvia-sparkle-purple-small', { pasta: 'celestial', tamanho: 16, classe: 'login-cena-placa-brilho login-cena-placa-brilho--2' })}
    </div>
  </section>`;
}

function telaLogin({ modo, dados, req }) {
  const flash = (req.session && req.session.flash) || [];
  if (req.session) delete req.session.flash;

  let conteudo = modoEntrar();
  if (modo === 'cadastro') conteudo = modoCadastro();
  if (modo === 'recuperar') conteudo = modoRecuperar(dados);

  const titulo =
    modo === 'cadastro' ? 'Criar conta · ' : modo === 'recuperar' ? 'Recuperar senha · ' : '';
  const mensagens = flash.length
    ? `<div class="mensagens">${flash
        .map(
          (f) =>
            `<div class="mensagem ${f.tipo === 'erro' ? 'erro' : 'ok'}"><span>${esc(f.texto)}</span>
             <button type="button" class="fechar-mensagem" aria-label="Fechar">×</button></div>`
        )
        .join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR" data-tema="clean-minimal" data-tema-modo="claro" data-tema-visitante="1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}${NOME_SISTEMA}</title>
${scriptTemas()}
<script>
  (function () {
    var PADRAO = ${JSON.stringify(TEMA_PADRAO)};
    var LEGADO = { claro: 'clean-minimal', escuro: 'dark-minimal' }; // temas antigos do site
    var mapa = {};
    (window.SISTEMA_TEMAS || []).forEach(function (x) { mapa[x.id] = x; });
    var t = null;
    try { t = localStorage.getItem('tema'); } catch (e) {}
    t = LEGADO[t] || t;
    if (!mapa[t]) {
      // Visitante sem tema salvo: respeita a preferência de esquema do sistema
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-minimal' : PADRAO;
      if (!mapa[t]) t = PADRAO;
    }
    document.documentElement.setAttribute('data-tema', t);
    document.documentElement.setAttribute('data-tema-modo', mapa[t] ? mapa[t].modo : 'claro');
    try { localStorage.setItem('tema', t); } catch (e) {}

    // Modo escuro apenas do login: não troca o tema salvo na conta.
    var modoLogin = null;
    try { modoLogin = localStorage.getItem('nuvia-login-modo'); } catch (e) {}
    if (modoLogin !== 'claro' && modoLogin !== 'escuro') {
      modoLogin = mapa[t] && mapa[t].modo === 'escuro' ? 'escuro' : 'claro';
    }
    document.documentElement.setAttribute('data-login-modo', modoLogin);
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Pixelify+Sans:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/estilo.css">
<link rel="stylesheet" href="/temas.css">
<link rel="stylesheet" href="/decoracoes.css">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/favicon.png">
</head>
<body class="tela-login">
  <div class="login-pagina">
    <main class="login-shell">
      ${cenaLogin()}
      <section class="login-cartao">
        <button class="alternar-tema" id="btn-tema" type="button" title="Ativar modo escuro" aria-label="Ativar modo escuro" aria-pressed="false">
          <span class="tema-icone sol">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
          </span>
          <span class="tema-icone lua">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12.3 4.9a7.1 7.1 0 1 0 6.8 9.4 7.1 7.1 0 0 1-6.8-9.4"/></svg>
          </span>
        </button>

        <header class="login-hero">
          ${decoracao('nuvia-sparkle-orange-small', { pasta: 'celestial', tamanho: 20, classe: 'login-hero-brilho login-hero-brilho--esq' })}
          ${decoracao('nuvia-star-yellow-small', { pasta: 'celestial', tamanho: 18, classe: 'login-hero-brilho login-hero-brilho--dir' })}
          <span class="login-hero-gato">${decoracao('nuvia-cat-peeking', { pasta: 'cats', tamanho: 86 })}</span>
          <p class="login-nome">Nuvia</p>
          <p class="login-bemvindo">Bem-vindo(a) de volta!
            ${decoracao('nuvia-heart-pink-small', { pasta: 'celestial', tamanho: 15, classe: 'login-hero-coracao' })}
          </p>
        </header>

        ${mensagens}
        ${conteudo}

        ${decoracao('nuvia-sparkle-orange-small', { pasta: 'celestial', tamanho: 24, classe: 'login-brilho login-brilho--1' })}
        ${decoracao('nuvia-sparkle-purple-small', { pasta: 'celestial', tamanho: 20, classe: 'login-brilho login-brilho--2' })}
        ${decoracao('nuvia-star-yellow-small', { pasta: 'celestial', tamanho: 22, classe: 'login-brilho login-brilho--3' })}
        ${decoracao('nuvia-heart-pink-small', { pasta: 'celestial', tamanho: 18, classe: 'login-brilho login-brilho--4' })}

      </section>

      ${decoracao('nuvia-bow-pink', { pasta: 'accessories', tamanho: 64, classe: 'login-laco login-laco--tl', rotacao: -18, ocultarEm: 'mobile' })}
      ${decoracao('nuvia-bow-purple', { pasta: 'accessories', tamanho: 64, classe: 'login-laco login-laco--tr', rotacao: 18, ocultarEm: 'mobile' })}
      ${decoracao('nuvia-bow-purple', { pasta: 'accessories', tamanho: 56, classe: 'login-laco login-laco--bl', rotacao: 10, ocultarEm: 'mobile' })}
      ${decoracao('nuvia-bow-pink', { pasta: 'accessories', tamanho: 56, classe: 'login-laco login-laco--br', rotacao: -10, ocultarEm: 'mobile' })}

      ${decoracao('nuvia-sparkle-orange-small', { pasta: 'celestial', tamanho: 24, classe: 'login-moldura-brilho login-moldura-brilho--1' })}
      ${decoracao('nuvia-sparkle-purple-small', { pasta: 'celestial', tamanho: 20, classe: 'login-moldura-brilho login-moldura-brilho--2' })}
    </main>

    <footer class="login-rodape">
      <span class="login-rodape-linha" aria-hidden="true"></span>
      <span class="login-rodape-pata" aria-hidden="true">${decoracao('nuvia-paw-print', { pasta: 'accessories', tamanho: 22 })}</span>
      <p class="login-rodape-frase">Um pequeno passo de cada vez <span aria-hidden="true">♡</span></p>
      <span class="login-rodape-pata" aria-hidden="true">${decoracao('nuvia-paw-print', { pasta: 'accessories', tamanho: 22 })}</span>
      <span class="login-rodape-linha" aria-hidden="true"></span>
    </footer>
  </div>
  <script src="/app.js"></script>
  <script>
    /* Lua/sol: alterna apenas o visual do login, sem trocar o tema do sistema. */
    (function () {
      var raiz = document.documentElement;
      var botao = document.getElementById('btn-tema');
      if (!botao) return;
      function atualizar() {
        var escuro = raiz.getAttribute('data-login-modo') === 'escuro';
        var rotulo = escuro ? 'Ativar modo claro' : 'Ativar modo escuro';
        botao.setAttribute('aria-pressed', String(escuro));
        botao.setAttribute('aria-label', rotulo);
        botao.setAttribute('title', rotulo);
      }
      atualizar();
      botao.addEventListener('click', function (evento) {
        evento.preventDefault();
        evento.stopPropagation();
        var escuro = raiz.getAttribute('data-login-modo') !== 'escuro';
        raiz.setAttribute('data-login-modo', escuro ? 'escuro' : 'claro');
        try { localStorage.setItem('nuvia-login-modo', escuro ? 'escuro' : 'claro'); } catch (e) {}
        atualizar();
      });
    })();
  </script>
  <script>
    (function () {
      var botao = document.querySelector('[data-ver-senha]');
      if (!botao) return;
      var campo = document.getElementById(botao.getAttribute('data-ver-senha'));
      if (!campo) return;
      botao.addEventListener('click', function () {
        var oculta = campo.type === 'password';
        campo.type = oculta ? 'text' : 'password';
        botao.classList.toggle('campo-olho--aberto', oculta);
        botao.setAttribute('aria-pressed', String(oculta));
        var rotulo = oculta ? 'Ocultar senha' : 'Mostrar senha';
        botao.setAttribute('aria-label', rotulo);
        botao.setAttribute('title', rotulo);
      });
    })();
  </script>
</body>
</html>`;
}

module.exports = { telaLogin };
