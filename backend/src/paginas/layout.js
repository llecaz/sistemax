/** Layout geral: topo, gaveta lateral, mensagens e páginas completas. */
const { esc, iniciais } = require('../util');
const { temaDe, scriptTemas } = require('../temas');

const NOME_SISTEMA = 'Classroom Escolar';

function iconeLogo(tamanho = 30) {
  return `<svg class="logo-icone" width="${tamanho}" height="${tamanho}" viewBox="0 0 40 40" aria-hidden="true">
    <rect x="2" y="7" width="36" height="27" rx="5" fill="#1e8e3e"/>
    <rect x="8" y="13" width="24" height="12" rx="2" fill="#ffffff"/>
    <rect x="18" y="26" width="4" height="5" fill="#ffffff"/>
    <rect x="14" y="31" width="12" height="2.5" rx="1.2" fill="#ffffff"/>
    <circle cx="14" cy="19" r="3.2" fill="#fbbc04"/>
    <circle cx="26" cy="19" r="3.2" fill="#fbbc04"/>
  </svg>`;
}

/** Avatar circular: mostra a foto ou as iniciais com cor fixa. */
function avatar(usuario, classe = '') {
  if (!usuario) return '';
  const cor = usuario.email || usuario.nome || '';
  let corCss = '#1e88e5';
  try {
    corCss = require('../util').corDe(cor).claro;
  } catch {}
  const conteudo = usuario.foto
    ? `<img src="/fotos/${esc(usuario.foto)}" alt="${esc(usuario.nome)}">`
    : `<span style="background:${corCss}">${esc(iniciais(usuario.nome))}</span>`;
  return `<span class="avatar ${classe}">${conteudo}</span>`;
}

function itemGaveta(href, texto, ativo, icone, extra = '') {
  return `<a class="gaveta-item ${ativo ? 'ativo' : ''}" href="${href}" ${extra}>
    <span class="gaveta-icone">${icone}</span><span>${texto}</span>
  </a>`;
}

const IC = {
  casa: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>`,
  engrenagem: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="m19.4 13-.1-1 .1-1 2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-3.8l-.4 2.5c-.6.2-1.2.6-1.7 1l-2.4-1-2 3.4 2 1.6-.1 1 .1 1-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.4 2.5h3.8l.4-2.5c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>`,
  sair: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2h-2v2H5V5h10v2zm4-2v14h-2v-2h-2v2h2v2h2v2h2v-2h2V9h-2V7h-2z"/></svg>`,
  pasta: `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"/></svg>`,
  lua: `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12.3 4.9a7.1 7.1 0 1 0 6.8 9.4 7.1 7.1 0 0 1-6.8-9.4"/></svg>`,
  sol: `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
};

function topo(usuario, ativa) {
  const iconeTema = `<span class="tema-icone sol">${IC.sol}</span><span class="tema-icone lua">${IC.lua}</span>`;
  return `
  <header class="topo">
    <button class="icone-botao" id="btn-menu" aria-label="Abrir menu">
      <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
    </button>
    <a class="marca" href="${homeDo(usuario)}">${iconeLogo()}<span>${NOME_SISTEMA}</span></a>
    <div class="topo-acoes">
      <button class="icone-botao" id="btn-tema" title="Alternar tema (claro/escuro)" aria-label="Alternar tema">${iconeTema}</button>
      <a class="icone-botao" href="/configuracoes" title="Configurações" aria-label="Configurações">${IC.engrenagem}</a>
      ${usuario ? `<a class="avatar-link" href="/configuracoes" title="${esc(usuario.nome)}">${avatar(usuario)}</a>` : ''}
    </div>
  </header>`;
}

function gaveta(usuario) {
  const tipo = usuario ? usuario.tipo : '';
  let itens = '';
  if (tipo === 'aluno') {
    itens += itemGaveta('/aluno', 'Início', true, IC.casa);
    itens += itemGaveta('/configuracoes', 'Configurações', false, IC.engrenagem);
  } else if (tipo === 'professor') {
    itens += itemGaveta('/professor', 'Início', true, IC.casa);
    itens += itemGaveta('/configuracoes', 'Configurações', false, IC.engrenagem);
  } else {
    itens += itemGaveta('/admin', 'Painel administrativo', true, IC.pasta);
    itens += itemGaveta('/configuracoes', 'Configurações', false, IC.engrenagem);
  }
  return `
  <div class="sobreposicao" id="sobreposicao"></div>
  <nav class="gaveta" id="gaveta" aria-label="Menu principal">
    <div class="gaveta-topo">
      <a class="marca" href="${homeDo(usuario)}">${iconeLogo(26)}<span>${NOME_SISTEMA}</span></a>
      <button class="icone-botao" id="btn-fechar" aria-label="Fechar menu">
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>
      </button>
    </div>
    ${usuario ? `<div class="gaveta-usuario">${avatar(usuario, 'pequeno')}<div><strong>${esc(usuario.nome)}</strong><small>${esc(usuario.email)}</small></div></div>` : ''}
    <div class="gaveta-lista">${itens}</div>
    <form method="post" action="/sair" class="gaveta-rodape">
      <button type="submit" class="gaveta-item"><span class="gaveta-icone">${IC.sair}</span><span>Sair</span></button>
    </form>
  </nav>`;
}

function mensagens(req) {
  const flash = (req.session && req.session.flash) || [];
  if (req.session) delete req.session.flash;
  const avisoUrl = req.query && req.query.aviso;
  if (avisoUrl === 'Precisa_fazer_login') flash.push({ tipo: 'erro', texto: 'Faça login para continuar.' });
  if (!flash.length) return '';
  return `<div class="mensagens">${flash
    .map(
      (f) =>
        `<div class="mensagem ${f.tipo === 'erro' ? 'erro' : 'ok'}" role="alert">
           <span>${esc(f.texto)}</span>
           <button type="button" class="fechar-mensagem" aria-label="Fechar">×</button>
         </div>`
    )
    .join('')}</div>`;
}

function homeDo(usuario) {
  if (!usuario) return '/';
  return usuario.tipo === 'admin' ? '/admin' : usuario.tipo === 'professor' ? '/professor' : '/aluno';
}

/** Página HTML completa com topo + gaveta + conteúdo. */
function pagina({ titulo, usuario, corpo, req, ativa = '' }) {
  // Tema salvo na conta (sessão) — o servidor já renderiza com ele, sem "piscar".
  const tema = temaDe((req.session && req.session.usuario && req.session.usuario.tema) || (usuario && usuario.tema));
  return `<!DOCTYPE html>
<html lang="pt-BR" data-tema="${tema.id}" data-tema-modo="${tema.modo}" data-tema-salvo="${tema.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · ${NOME_SISTEMA}</title>
${scriptTemas()}
<script>window.SISTEMA_LOGADO = true;</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/estilo.css">
<link rel="stylesheet" href="/temas.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='9' fill='%231e8e3e'/><rect x='8' y='13' width='24' height='12' rx='2' fill='white'/></svg>">
</head>
<body>
${topo(usuario, ativa)}
${gaveta(usuario)}
<main class="conteudo">
${mensagens(req)}
${corpo}
</main>
<script src="/app.js"></script>
</body>
</html>`;
}

module.exports = { pagina, avatar, iconeLogo, NOME_SISTEMA, homeDo, IC };
