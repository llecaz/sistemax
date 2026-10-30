/** Tela de login estilo Google: entrar, criar conta de aluno e recuperar senha. */
const { esc } = require('../util');
const { iconeLogo, NOME_SISTEMA } = require('./layout');
const { TEMA_PADRAO, temaDe, scriptTemas } = require('../temas');

function campo(id, tipo, rotulo, extra = '') {
  return `
  <div class="campo">
    <input type="${tipo}" id="${id}" name="${id}" placeholder=" " ${extra} required>
    <label for="${id}">${rotulo}</label>
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
      <label class="checkbox"><input type="checkbox" name="manter" value="1"> <span>Manter conectado</span></label>
      <a class="link" href="/recuperar">Esqueci a senha</a>
    </div>
    <button class="btn primario grande" type="submit">Entrar</button>
    <p class="rodape-form">Ainda não tem conta? <a class="link" href="/cadastro">Criar conta de aluno</a></p>
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
    <button class="btn primario grande" type="submit">Criar conta</button>
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
      <button class="btn primario grande" type="submit">Continuar</button>
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
    <button class="btn primario grande" type="submit">Redefinir senha</button>
    <p class="rodape-form"><a class="link" href="/">Voltar ao login</a></p>
  </form>`;
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
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/estilo.css">
<link rel="stylesheet" href="/temas.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='9' fill='%231e8e3e'/><rect x='8' y='13' width='24' height='12' rx='2' fill='white'/></svg>">
</head>
<body class="tela-login">
  <div class="login-cartao">
    <div class="login-topo">${iconeLogo(34)}<span>${NOME_SISTEMA}</span></div>
    <button class="alternar-tema" id="btn-tema" type="button" title="Alternar tema">
      <span class="tema-icone sol">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
      </span>
      <span class="tema-icone lua">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12.3 4.9a7.1 7.1 0 1 0 6.8 9.4 7.1 7.1 0 0 1-6.8-9.4"/></svg>
      </span>
    </button>
    ${mensagens}
    ${conteudo}
  </div>
  <script src="/app.js"></script>
</body>
</html>`;
}

module.exports = { telaLogin };
