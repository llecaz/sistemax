/** Tela de entrada, cadastro de aluno e recuperação de senha — visual Nuvia. */
const { esc } = require('../util');
const { decoracao } = require('./decoracoes');

const SVG_EMAIL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v.5l-8 5.2-8-5.2v-.5Zm0 2.3 7.59 4.94a.75.75 0 0 0 .82 0L20 9.05v7.2A2.75 2.75 0 0 1 17.25 19H6.75A2.75 2.75 0 0 1 4 16.25v-7.2Z"/></svg>`;

const SVG_LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.25A1.75 1.75 0 0 1 20 11.75v7.5A1.75 1.75 0 0 1 18.25 21H5.75A1.75 1.75 0 0 1 4 19.25v-7.5A1.75 1.75 0 0 1 5.75 10H7Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 3a1.5 1.5 0 0 0-.75 2.8V18h1.5v-2.2A1.5 1.5 0 0 0 12 13Z"/></svg>`;

const SVG_EYE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12s3.3-6 9.8-6 9.8 6 9.8 6-3.3 6-9.8 6-9.8-6-9.8-6Zm9.8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>`;

const SVG_EYE_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.3 3.3a1 1 0 0 1 1.4 0l16 16a1 1 0 1 1-1.4 1.4l-2.6-2.6A11 11 0 0 1 12 20c-6.5 0-9.8-6-9.8-6a17 17 0 0 1 4-4.7L3.3 4.7a1 1 0 0 1 0-1.4Zm5 6.4A15 15 0 0 0 4.5 14c1 1.3 3.6 4 7.5 4 1.6 0 3.1-.5 4.4-1.3l-1.7-1.7a3.5 3.5 0 0 1-4.6-4.6L8.3 9.7Zm4.8-4.6c.9.1 1.8.4 2.6.9L18 8.3l2.1-2.1a17 17 0 0 0-6.3-3.8 1 1 0 0 0-1.3.9v1.7h.6ZM21.8 14a18 18 0 0 1-2.5 2.9l-2.8-2.8a17 17 0 0 0 2-2.1c-1-1.3-3.6-4-7.5-4h-.4L8.1 5.1A12 12 0 0 1 12 4c6.5 0 9.8 6 9.8 6 .2.3.2.7 0 1Z"/></svg>`;

const SVG_PERSON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4A4.2 4.2 0 0 0 12 12Zm0 2c-4.1 0-7.4 2.3-7.4 5.1 0 .5.4.9.9.9h13c.5 0 .9-.4.9-.9 0-2.8-3.3-5.1-7.4-5.1Z"/></svg>`;

const SVG_BOOK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5A2.5 2.5 0 0 1 8.5 2H20v15.5H8.7a.8.8 0 0 0-.7.5L6 20.6V4.5Zm2 1.5v11a.8.8 0 0 0 .6.9c1-.4 2.3-.6 5.4-.6H18V5h-9a.5.5 0 0 0-.5.5V6Z"/></svg>`;

const SVG_GOOGLE = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;

const SVG_GITHUB = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>`;

/** Ambiente de produção? (mesma regra usada no banco) */
const EM_PRODUCAO =
  process.env.AMBIENTE === 'producao' ||
  process.env.VERCEL === '1' ||
  process.env.RENDER === 'true';

/** Cartões das contas demo: Aluna e Professora são públicas no README do site publicado. */
const CONTAS_DEMO = [
  { rotulo: 'Aluna', email: 'ana@escola.com', senha: 'aluno123', tom: 'rosa' },
  { rotulo: 'Professora', email: 'maria@escola.com', senha: 'prof123', tom: 'verde' },
  { rotulo: 'Admin', email: 'admin@escola.com', senha: 'admin123', tom: 'lilas', localSomente: true },
];

/** Cartões exibidos na tela de entrar (autofill ao clicar). */
function demoCards() {
  const oculto = process.env.MOSTRAR_DEMO === '0' || process.env.MOSTRAR_DEMO === 'false';
  if (oculto) return '';
  const contas = CONTAS_DEMO.filter((c) => !c.localSomente || !EM_PRODUCAO);
  if (!contas.length) return '';
  const botoes = contas
    .map(
      (c) => `
      <button class="nv-demo-card nv-demo-card--${c.tom}" type="button" data-demo-email="${esc(c.email)}" data-demo-senha="${esc(c.senha)}" aria-label="Entrar como ${esc(c.rotulo)} (demo)">
        <span class="nv-demo-avatar" aria-hidden="true">${esc(c.rotulo.charAt(0))}</span>
        <span class="nv-demo-info">
          <strong>${esc(c.rotulo)}</strong>
          <small>${esc(c.email)}</small>
          <small class="nv-demo-senha" aria-hidden="true">senha: ${esc(c.senha)}</small>
        </span>
        <span class="nv-demo-seta" aria-hidden="true">↗</span>
      </button>`
    )
    .join('');
  return `
    <div class="nv-demo" aria-label="Contas de demonstração">
      <span class="nv-demo-rotulo"><span aria-hidden="true">✦</span> contas demo</span>
      <div class="nv-demo-lista">${botoes}</div>
    </div>`;
}

const ICONES = { email: SVG_EMAIL, senha: SVG_LOCK, nome: SVG_PERSON, resposta: SVG_LOCK, turma: SVG_BOOK };

/** Campo com rótulo flutuante, ícone e botão de mostrar/ocultar senha. */
function campo(id, tipo, rotulo, extra = '', placeholder = ' ', nome) {
  const name = nome || id;
  const icone = ICONES[nome || id] || '';
  const ehSenha = tipo === 'password';
  const botaoOlho = ehSenha
    ? `<button class="nv-eye" type="button" data-toggle-password="${id}" aria-label="Mostrar senha" aria-pressed="false">
        <span class="nv-eye-on">${SVG_EYE}</span>
        <span class="nv-eye-off">${SVG_EYE_OFF}</span>
      </button>`
    : '';
  return `
    <div class="nv-field">
      <span class="nv-field-icon" aria-hidden="true">${icone}</span>
      <input type="${tipo}" id="${id}" name="${name}" placeholder=" " ${extra} required>
      <label for="${id}">${rotulo}</label>
      ${botaoOlho}
    </div>`;
}

function campoSelect(id, name, rotulo, opcoes) {
  return `
    <div class="nv-field nv-field--select">
      <span class="nv-field-icon" aria-hidden="true">${SVG_BOOK}</span>
      <select id="${id}" name="${name}" required>
        <option value="" selected></option>
        ${opcoes}
      </select>
      <label for="${id}">${rotulo}</label>
    </div>`;
}

function botoesSociais() {
  return `
    <div class="nv-divider"><span></span><small>ou continue com</small><span></span></div>
    <div class="nv-social">
      <a class="nv-social-btn" href="/entrar/google">
        <span class="nv-social-icon" aria-hidden="true">${SVG_GOOGLE}</span>
        <span>Google</span>
      </a>
      <a class="nv-social-btn" href="/entrar/github">
        <span class="nv-social-icon" aria-hidden="true">${SVG_GITHUB}</span>
        <span>GitHub</span>
      </a>
    </div>`;
}

function mensagensDoServidor(req) {
  const flash = (req && req.session && req.session.flash) || [];
  if (req && req.session) delete req.session.flash;
  if (!flash.length) return '';
  return `<div class="nv-messages">${flash
    .map(
      (f) =>
        `<div class="nv-message ${f.tipo === 'erro' ? 'erro' : 'ok'}" role="status">
          <span>${esc(f.texto)}</span>
          <button type="button" class="nv-message-close" aria-label="Fechar">×</button>
        </div>`
    )
    .join('')}</div>`;
}

function modoEntrar(req) {
  return {
    titulo: 'Entrar',
    subtitulo: 'Use sua conta da escola para continuar',
    conteudo: `
      ${mensagensDoServidor(req)}
      <form method="post" action="/entrar" class="nv-form">
        ${campo('email', 'text', 'E-mail ou usuário', 'autocomplete="username" inputmode="email"', 'voce@exemplo.com')}
        ${campo('senha', 'password', 'Senha', 'autocomplete="current-password"', 'Digite sua senha')}
        <div class="nv-options">
          <label class="nv-check"><input type="checkbox" name="manter" value="1"><span>Lembrar de mim</span></label>
          <a href="/recuperar">Esqueceu sua senha?</a>
        </div>
        <button class="nv-submit" type="submit">
          <span class="nv-submit-paw" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 21 })}</span>
          <span>Entrar</span>
          <span class="nv-submit-arrow" aria-hidden="true">↗</span>
        </button>
      </form>
      ${demoCards()}
      ${botoesSociais()}
      <p class="nv-signup">Ainda não tem uma conta? <a href="/cadastro">Cadastre-se</a></p>`,
  };
}

function modoCadastro(req, dados) {
  const email = dados && dados.email ? esc(dados.email) : '';
  const tipo = dados && dados.tipo === 'professor' ? 'professor' : 'aluno';
  const turmas = (dados && Array.isArray(dados.turmas) ? dados.turmas : [])
    .map((t) => `<option value="${Number(t.id)}">${esc(t.nome)}</option>`)
    .join('');
  const disciplinas = dados && Array.isArray(dados.disciplinas) ? dados.disciplinas : [];
  const dominio = dados && dados.dominio ? esc(dados.dominio) : 'escola.com';
  const checkboxes = disciplinas
    .map(
      (d) => `<label class="nv-materia"><input type="checkbox" name="materias" value="${Number(d.id)}"><span>${esc(d.nome)}</span></label>`
    )
    .join('');

  return {
    titulo: 'Criar conta',
    subtitulo: 'Escolha o seu perfil e crie a sua conta Nuvia',
    conteudo: `
      ${mensagensDoServidor(req)}
      <div class="nv-tabs">
        <input class="nv-tab-radio" type="radio" name="tipo-conta" id="tab-aluno"${tipo === 'aluno' ? ' checked' : ''}>
        <input class="nv-tab-radio" type="radio" name="tipo-conta" id="tab-professor"${tipo === 'professor' ? ' checked' : ''}>
        <div class="nv-tab-labels" role="tablist" aria-label="Tipo de conta">
          <label class="nv-tab nv-tab--aluno" for="tab-aluno" role="tab">Aluno</label>
          <label class="nv-tab nv-tab--professor" for="tab-professor" role="tab">Professor</label>
        </div>

        <form method="post" action="/cadastro/aluno" class="nv-form nv-form--cadastro nv-form--aluno">
          <p class="nv-cadastro-legenda">Crie sua conta de aluno com o e-mail da escola. Depois de confirmar o e-mail, você pede o código da turma escolhida.</p>
          ${campo('aluno-nome', 'text', 'Nome completo', 'autocomplete="name"', 'Como devemos chamar você?', 'nome')}
          ${campo('aluno-email', 'email', 'E-mail institucional da escola', `autocomplete="email" inputmode="email" value="${email}"`, `nome@${dominio}`, 'email')}
          <p class="nv-campo-dica">Use o seu e-mail da escola, como <strong>nome@${dominio}</strong>. É para lá que enviamos a confirmação e o código da turma.</p>
          ${campo('aluno-senha', 'password', 'Senha', 'minlength="6" autocomplete="new-password"', 'Crie uma senha com 6+ caracteres', 'senha')}
          ${campo('aluno-confirmacao', 'password', 'Confirmar senha', 'minlength="6" autocomplete="new-password"', 'Repita a senha', 'confirmacao')}
          ${campoSelect('aluno-turma', 'turma', 'Turma que você quer entrar', turmas)}
          <button class="nv-submit" type="submit">
            <span class="nv-submit-paw" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 21 })}</span>
            <span>Criar minha conta de aluno</span>
            <span class="nv-submit-arrow" aria-hidden="true">↗</span>
          </button>
        </form>

        <form method="post" action="/cadastro/professor" class="nv-form nv-form--cadastro nv-form--professor">
          <p class="nv-cadastro-legenda">Crie sua conta de professor e escolha as matérias que você leciona.</p>
          ${campo('professor-nome', 'text', 'Nome completo', 'autocomplete="name"', 'Como devemos chamar você?', 'nome')}
          ${campo('professor-email', 'email', 'E-mail', `autocomplete="email" inputmode="email" value="${email}"`, 'voce@exemplo.com', 'email')}
          ${campo('professor-senha', 'password', 'Senha', 'minlength="6" autocomplete="new-password"', 'Crie uma senha com 6+ caracteres', 'senha')}
          ${campo('professor-confirmacao', 'password', 'Confirmar senha', 'minlength="6" autocomplete="new-password"', 'Repita a senha', 'confirmacao')}
          <fieldset class="nv-materias">
            <legend>Matérias que você leciona <small>(escolha pelo menos uma)</small></legend>
            <div class="nv-materias-lista">
              ${checkboxes}
            </div>
          </fieldset>
          <button class="nv-submit" type="submit">
            <span class="nv-submit-paw" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 21 })}</span>
            <span>Criar minha conta de professor</span>
            <span class="nv-submit-arrow" aria-hidden="true">↗</span>
          </button>
        </form>
      </div>
      <p class="nv-signup">Já tem uma conta? <a href="/entrar">Entrar</a></p>`,
  };
}

function modoRecuperar(req, dados) {
  if (!dados || !dados.pergunta) {
    return {
      titulo: 'Recuperar senha',
      subtitulo: 'Informe seu e-mail para começar.',
      conteudo: `
        ${mensagensDoServidor(req)}
        <form method="post" action="/recuperar/passo1" class="nv-form">
          ${campo('email', 'email', 'E-mail', 'autocomplete="email" inputmode="email"', 'voce@exemplo.com')}
          <button class="nv-submit" type="submit">
            <span class="nv-submit-paw" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 21 })}</span>
            <span>Continuar</span>
            <span class="nv-submit-arrow" aria-hidden="true">↗</span>
          </button>
        </form>
        <p class="nv-signup"><a href="/entrar">Voltar ao login</a></p>`,
    };
  }
  return {
    titulo: 'Nova senha',
    subtitulo: 'Responda a pergunta de segurança cadastrada.',
    conteudo: `
      ${mensagensDoServidor(req)}
      <form method="post" action="/recuperar/passo2" class="nv-form">
        <input type="hidden" name="email" value="${esc(dados.email)}">
        <div class="nv-recover-info">
          <small>E-mail</small>
          <strong>${esc(dados.email)}</strong>
        </div>
        <div class="nv-question">${esc(dados.pergunta)}</div>
        ${campo('resposta', 'text', 'Sua resposta', 'autocomplete="off"', 'Digite sua resposta')}
        ${campo('senha', 'password', 'Nova senha', 'minlength="6" autocomplete="new-password"', 'Crie uma senha com 6+ caracteres')}
        <button class="nv-submit" type="submit">
          <span class="nv-submit-paw" aria-hidden="true">${decoracao('nuvia-paw-print-white', { pasta: 'accessories', tamanho: 21 })}</span>
          <span>Redefinir senha</span>
          <span class="nv-submit-arrow" aria-hidden="true">↗</span>
        </button>
      </form>
      <p class="nv-signup"><a href="/entrar">Voltar ao login</a></p>`,
  };
}

/** Cena do quartinho de estudos — toda feita com os recortes em pixel art. */
function cenaLogin() {
  const d = decoracao;
  return `
  <section class="nv-scene" aria-hidden="true">
    <span class="nv-scene-wall"></span>
    <span class="nv-scene-floor"></span>

    ${d('nuvia-window-night', { pasta: 'accessories', tamanho: '46%', classe: 'nv-scene-window' })}
    ${d('nuvia-plant-hanging', { pasta: 'plants', tamanho: '20%', classe: 'nv-scene-hanging' })}
    ${d('nuvia-wall-hanging-cat', { pasta: 'accessories', tamanho: '14%', classe: 'nv-scene-frame' })}
    ${d('nuvia-bookshelf', { pasta: 'stationery', tamanho: '26%', classe: 'nv-scene-shelf' })}
    ${d('nuvia-plant-flowers', { pasta: 'plants', tamanho: '14%', classe: 'nv-scene-flowers' })}
    ${d('nuvia-laptop', { pasta: 'stationery', tamanho: '31%', classe: 'nv-scene-laptop' })}
    ${d('nuvia-books-stack', { pasta: 'stationery', tamanho: '25%', classe: 'nv-scene-books' })}
    ${d('nuvia-cat-sleeping-pillow', { pasta: 'cats', tamanho: '26%', classe: 'nv-scene-cat' })}
    ${d('nuvia-mug-cat', { pasta: 'accessories', tamanho: '10.5%', classe: 'nv-scene-mug' })}
    ${d('nuvia-plant-small-pot', { pasta: 'plants', tamanho: '8.5%', classe: 'nv-scene-small-plant' })}
    ${d('nuvia-plant-potted', { pasta: 'plants', tamanho: '18%', classe: 'nv-scene-plant' })}

    <span class="nv-sparkle nv-sparkle--1">✦</span>
    <span class="nv-sparkle nv-sparkle--2">✧</span>
    <span class="nv-sparkle nv-sparkle--3">✦</span>
    <span class="nv-sparkle nv-sparkle--4">✧</span>

    <div class="nv-scene-card">
      <span class="nv-scene-card-star" aria-hidden="true">✦</span>
      <p class="nv-scene-card-title">Seu cantinho de estudos ♡</p>
      <p class="nv-scene-card-text">Organize suas ideias, acompanhe suas atividades e aproveite seu ritmo.</p>
    </div>
  </section>`;
}

function telaLogin({ modo, dados, req }) {
  // O modo decide QUAL tela é montada — apenas ela consome o flash da sessão
  // (cada função de modo chama mensagensDoServidor, que apaga o flash).
  // Antes, `modoEntrar` era sempre executado e consumia o flash antes das
  // outras telas, fazendo as mensagens sumirem no cadastro e na recuperação.
  let tela;
  if (modo === 'cadastro') tela = modoCadastro(req, dados);
  else if (modo === 'recuperar') tela = modoRecuperar(req, dados);
  else tela = modoEntrar(req);

  const tituloPagina =
    modo === 'cadastro' ? 'Criar conta · Nuvia' : modo === 'recuperar' ? 'Recuperar senha · Nuvia' : 'Entrar · Nuvia';
  const d = decoracao;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#17132d">
<meta name="description" content="Entre na sua conta Nuvia — seu cantinho de estudos.">
<title>${tituloPagina}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/login-nuvia.css">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nuvia">
</head>
<body class="tela-login">
  <main class="nv-page">
    <div class="nv-glow" aria-hidden="true"></div>

    <div class="nv-frame">
      <span class="nv-corner nv-corner--tl" aria-hidden="true">${d('nuvia-bow-pink', { pasta: 'accessories', tamanho: 58, rotacao: -14 })}</span>
      <span class="nv-corner nv-corner--tr" aria-hidden="true">${d('nuvia-bow-purple', { pasta: 'accessories', tamanho: 58, rotacao: 14 })}</span>
      <span class="nv-corner nv-corner--bl" aria-hidden="true">${d('nuvia-bow-purple', { pasta: 'accessories', tamanho: 48, rotacao: 9 })}</span>
      <span class="nv-corner nv-corner--br" aria-hidden="true">${d('nuvia-bow-pink', { pasta: 'accessories', tamanho: 48, rotacao: -9 })}</span>

      <header class="nv-topbar">
        <a class="nv-brand" href="/" aria-label="Nuvia, página inicial">
          <span class="nv-brand-cat" aria-hidden="true">${d('nuvia-cat-peeking', { pasta: 'cats', tamanho: 34 })}</span>
          <span class="nv-brand-text">
            <span class="nv-brand-name">nuvia</span>
            <span class="nv-brand-tag">escola &amp; estudos</span>
          </span>
        </a>
        <span class="nv-top-note">Seu espaço de aprendizado <span aria-hidden="true">♡</span></span>
      </header>

      <div class="nv-shell">
        ${cenaLogin()}

        <section class="nv-panel" aria-labelledby="nv-heading">
          <div class="nv-panel-inner">
            <div class="nv-panel-glow" aria-hidden="true"></div>

            <header class="nv-hero">
              <span class="nv-hero-spark nv-hero-spark--l" aria-hidden="true">✦</span>
              <span class="nv-hero-spark nv-hero-spark--r" aria-hidden="true">✧</span>
              <span class="nv-hero-cat" aria-hidden="true">${d('nuvia-cat-peeking', { pasta: 'cats', tamanho: 74 })}</span>
              <p class="nv-wordmark">Nuvia</p>
              <p class="nv-welcome">Bem-vindo(a) de volta! ${d('nuvia-heart-pink-small', { pasta: 'celestial', tamanho: 15 })}</p>
            </header>

            <div class="nv-form-head">
              <span class="nv-eyebrow">seu cantinho de estudos</span>
              <h1 id="nv-heading">${tela.titulo}</h1>
              <p>${tela.subtitulo}</p>
            </div>

            ${tela.conteudo}
          </div>
        </section>
      </div>

      <footer class="nv-footer">
        <span class="nv-footer-line" aria-hidden="true"></span>
        <span class="nv-footer-paw" aria-hidden="true">${d('nuvia-paw-print', { pasta: 'accessories', tamanho: 18 })}</span>
        <p>Um pequeno passo de cada vez <span aria-hidden="true">♡</span></p>
        <span class="nv-footer-paw" aria-hidden="true">${d('nuvia-paw-print', { pasta: 'accessories', tamanho: 18 })}</span>
        <span class="nv-footer-line" aria-hidden="true"></span>
      </footer>
    </div>
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
          botao.classList.toggle('aberto', oculta);
          botao.setAttribute('aria-pressed', String(oculta));
          botao.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');
        });
      });

      // Fechar mensagens do servidor
      document.addEventListener('click', function (evento) {
        var fechar = evento.target.closest('.nv-message-close');
        if (!fechar) return;
        var mensagem = fechar.closest('.nv-message');
        if (!mensagem) return;
        mensagem.classList.add('saindo');
        setTimeout(function () { mensagem.remove(); }, 180);
      });

      // Cartões demo: preenchem e-mail e senha ao clicar
      document.addEventListener('click', function (evento) {
        var card = evento.target.closest('.nv-demo-card');
        if (!card) return;
        var email = document.getElementById('email');
        var senha = document.getElementById('senha');
        if (email) email.value = card.getAttribute('data-demo-email') || '';
        if (senha) {
          senha.value = card.getAttribute('data-demo-senha') || '';
          senha.dispatchEvent(new Event('input', { bubbles: true }));
        }
        card.classList.add('nv-demo-card--ok');
        window.setTimeout(function () { card.classList.remove('nv-demo-card--ok'); }, 900);
        [email, senha].forEach(function (campo) {
          if (!campo) return;
          var campoPai = campo.closest('.nv-field');
          if (!campoPai) return;
          campoPai.classList.add('nv-field--preenchido');
          window.setTimeout(function () { campoPai.classList.remove('nv-field--preenchido'); }, 1200);
        });
      });
      setTimeout(function () {
        document.querySelectorAll('.nv-message.ok').forEach(function (mensagem) {
          mensagem.classList.add('saindo');
          setTimeout(function () { mensagem.remove(); }, 180);
        });
      }, 8000);
    })();
  </script>
  <script src="/pwa.js" defer></script>
</body>
</html>`;
}

module.exports = { telaLogin };
