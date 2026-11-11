/** Layout geral: sidebar fixa, barra superior, mensagens e páginas completas. */
const { esc, iniciais } = require('../util');
const { temaDe, scriptTemas } = require('../temas');

const NOME_SISTEMA = 'Classroom Escolar';

/** Logotipo minimalista: capelo de formatura em roxo. */
function iconeLogo(tamanho = 38) {
  return `<span class="logo-icone" style="width:${tamanho}px;height:${tamanho}px" aria-hidden="true">
    <svg viewBox="0 0 48 48" width="${tamanho}" height="${tamanho}" fill="currentColor">
      <path d="M24 6 3 16l21 10 21-10L24 6Zm-15 14.6v9.2C9 34.6 15.7 38 24 38s15-3.4 15-8.2v-9.2l-15 7.1-15-7.1Zm33 .9-6 2.9v7.4c0 1.2-.3 2.3-.9 3.2l4.3 2.1c1.6-1.5 2.6-3.4 2.6-5.3V21.5Z"/>
    </svg>
  </span>`;
}

/** Avatar circular: mostra a foto ou as iniciais com cor fixa. */
function avatar(usuario, classe = '') {
  if (!usuario) return '';
  const cor = usuario.email || usuario.nome || '';
  let corCss = '#7b5ce6';
  try {
    corCss = require('../util').corDe(cor).claro;
  } catch {}
  const conteudo = usuario.foto
    ? `<img src="/fotos/${esc(usuario.foto)}" alt="${esc(usuario.nome)}">`
    : `<span style="background:${corCss}">${esc(iniciais(usuario.nome))}</span>`;
  return `<span class="avatar ${classe}">${conteudo}</span>`;
}

function itemGaveta(href, texto, ativo, icone, extra = '', ponto = false) {
  return `<a class="gaveta-item ${ativo ? 'ativo' : ''}" href="${href}" ${extra}>
    <span class="gaveta-icone">${icone}</span>
    <span class="gaveta-texto">${texto}</span>
    ${ponto ? '<span class="gaveta-ponto" aria-hidden="true"></span>' : ''}
  </a>`;
}

const svg = (conteudo, tamanho = 20) =>
  `<svg viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`;

const IC = {
  casa: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  tarefas: svg('<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m8 12 2.5 2.5L16 9"/>'),
  materias: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>'),
  calendario: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
  notificacoes: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>'),
  engrenagem: svg('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'),
  sair: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'),
  busca: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  lua: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', 18),
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>', 18),
  seta: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 16),
  menu: svg('<path d="M3 6h18M3 12h18M3 18h18"/>', 22),
  fechar: svg('<path d="M18 6 6 18M6 6l12 12"/>', 22),
};

function homeDo(usuario) {
  if (!usuario) return '/';
  return usuario.tipo === 'admin' ? '/admin' : usuario.tipo === 'professor' ? '/professor' : '/aluno';
}

function notificacoesDo(usuario) {
  if (!usuario) return '/';
  if (usuario.tipo === 'professor') return '/professor/notificacoes';
  if (usuario.tipo === 'aluno') return '/aluno/notificacoes';
  return '/admin';
}

function rotuloPerfil(usuario) {
  if (!usuario) return '';
  if (usuario.tipo === 'professor') return 'Professor';
  if (usuario.tipo === 'admin') return 'Administrador';
  return usuario.turma_nome || 'Aluno';
}

function topo(usuario, ativa, req) {
  const q = (req && req.query && req.query.q) || '';
  const busca =
    usuario && usuario.tipo !== 'admin'
      ? `<form class="topo-busca" action="${homeDo(usuario)}" method="get" role="search">
          <span class="topo-busca-icone">${IC.busca}</span>
          <input type="search" name="q" value="${esc(q)}" placeholder="Buscar tarefas, matérias..." aria-label="Buscar tarefas e matérias">
        </form>`
      : '<div class="topo-busca-vazio"></div>';

  const sino =
    usuario && usuario.tipo !== 'admin'
      ? `<a class="icone-botao topo-sino" href="${notificacoesDo(usuario)}" title="Notificações" aria-label="Notificações">
          ${IC.notificacoes}<span class="topo-ponto" aria-hidden="true"></span>
        </a>`
      : '';

  return `
  <header class="topo">
    <button class="icone-botao topo-menu" id="btn-menu" aria-label="Abrir menu">${IC.menu}</button>
    ${busca}
    <div class="topo-acoes">
      ${sino}
      ${usuario ? `<a class="avatar-link topo-perfil" href="/configuracoes" title="${esc(usuario.nome)}">${avatar(usuario)}</a>` : ''}
      <form method="post" action="/sair" class="topo-sair">
        <button class="icone-botao" type="submit" title="Sair" aria-label="Sair">${IC.sair}</button>
      </form>
    </div>
  </header>`;
}

function gaveta(usuario, ativa = '') {
  const tipo = usuario ? usuario.tipo : '';
  let itens = '';
  if (tipo === 'aluno') {
    itens += itemGaveta('/aluno', 'Início', ativa === 'inicio', IC.casa);
    itens += itemGaveta('/aluno#tarefas', 'Minhas Tarefas', ativa === 'tarefas', IC.tarefas);
    itens += itemGaveta('/aluno#materias', 'Matérias', ativa === 'materias', IC.materias);
    itens += itemGaveta('/aluno/calendario', 'Calendário', ativa === 'calendario', IC.calendario);
    itens += itemGaveta('/aluno/notificacoes', 'Notificações', ativa === 'notificacoes', IC.notificacoes, '', true);
    itens += itemGaveta('/configuracoes', 'Configurações', ativa === 'config', IC.engrenagem);
  } else if (tipo === 'professor') {
    itens += itemGaveta('/professor', 'Início', ativa === 'inicio', IC.casa);
    itens += itemGaveta('/professor#correcoes', 'Correções', ativa === 'correcoes', IC.tarefas);
    itens += itemGaveta('/professor#materias', 'Matérias', ativa === 'materias', IC.materias);
    itens += itemGaveta('/professor/calendario', 'Calendário', ativa === 'calendario', IC.calendario);
    itens += itemGaveta('/professor/notificacoes', 'Notificações', ativa === 'notificacoes', IC.notificacoes, '', true);
    itens += itemGaveta('/configuracoes', 'Configurações', ativa === 'config', IC.engrenagem);
  } else {
    itens += itemGaveta('/admin', 'Painel administrativo', ativa === 'admin', IC.casa);
    itens += itemGaveta('/admin/calendario', 'Calendário', ativa === 'calendario', IC.calendario);
    itens += itemGaveta('/configuracoes', 'Configurações', ativa === 'config', IC.engrenagem);
  }

  return `
  <div class="sobreposicao" id="sobreposicao"></div>
  <nav class="gaveta" id="gaveta" aria-label="Menu principal">
    <div class="gaveta-topo">
      <a class="marca" href="${homeDo(usuario)}">
        ${iconeLogo(40)}
        <span class="marca-texto">Classroom<span>Escolar</span></span>
      </a>
      <button class="icone-botao btn-fechar" id="btn-fechar" aria-label="Fechar menu">${IC.fechar}</button>
    </div>

    <div class="gaveta-lista">${itens}</div>

    <div class="gaveta-base">
      <div class="gaveta-tema">
        <span class="gaveta-tema-rotulo">Tema</span>
        <button class="alternar-tema" id="btn-tema" type="button" title="Alternar tema claro/escuro" aria-label="Alternar tema claro/escuro">
          <span class="tema-opcao sol">${IC.sol}</span>
          <span class="tema-opcao lua">${IC.lua}</span>
        </button>
      </div>
      ${
        usuario
          ? `<a class="gaveta-perfil" href="/configuracoes" title="Abrir perfil">
              ${avatar(usuario, 'pequeno')}
              <span class="gaveta-perfil-info">
                <strong>${esc(usuario.nome)}</strong>
                <small>${esc(rotuloPerfil(usuario))}</small>
              </span>
              <span class="gaveta-perfil-seta">${IC.seta}</span>
            </a>`
          : ''
      }
    </div>
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

/**
 * Decoração e widgets exclusivos de temas — renderizados sempre no HTML e
 * visíveis apenas quando o tema correspondente está ativo (via CSS em
 * temas.css). Assim funcionam na pré-visualização da galeria de temas.
 * Hoje: Lo-fi Night (rádio lo-fi) e Moonroom (cantinho da lua).
 */
function decoracaoTema() {
  return `
<div class="tema-decoracao" aria-hidden="true">
  <div class="deco-lofi">
    <div class="deco-lofi-player">
      <span class="deco-lofi-nota">♫</span>
      <div class="deco-lofi-textos">
        <strong>lo-fi radio</strong>
        <small>estudando com chuvinha ✿</small>
      </div>
      <span class="deco-equalizador"><i></i><i></i><i></i><i></i></span>
    </div>
  </div>
  <div class="deco-moonroom">
    <div class="deco-moonroom-widget">
      <span class="deco-lua"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12.3 4.9a7.1 7.1 0 1 0 6.8 9.4 7.1 7.1 0 0 1-6.8-9.4"/></svg></span>
      <div class="deco-moonroom-textos">
        <strong>cantinho da lua</strong>
        <small>luz suave pra focar 🌙</small>
      </div>
      <i class="deco-estrela e1">✦</i>
      <i class="deco-estrela e2">✧</i>
      <i class="deco-estrela e3">✦</i>
    </div>
  </div>
</div>`;
}

/** Página HTML completa com topo + sidebar + conteúdo. */
function pagina({ titulo, usuario, corpo, req, ativa = '' }) {
  // Tema salvo na conta (sessão) — o servidor já renderiza com ele, sem "piscar".
  const tema = temaDe((req.session && req.session.usuario && req.session.usuario.tema) || (usuario && usuario.tema));
  // O CSS do Lo-fi Night só é carregado quando o tema está realmente aplicado.
  const cssLofi = tema.id === 'lo-fi-night' ? '<link rel="stylesheet" href="/lofi.css">' : '';
  // O painel inicial e as configurações usam classes próprias no body.
  const classeCorpo = /\bini-app\b/.test(corpo)
    ? ' class="pagina-inicio"'
    : /\bcfg-app\b/.test(corpo)
      ? ' class="pagina-config"'
      : '';
  // O dashboard segue o novo visual SaaS, sem os widgets decorativos antigos.
  const semDecoracao = ativa === 'inicio' || ativa === 'notificacoes';
  return `<!DOCTYPE html>
<html lang="pt-BR" data-tema="${tema.id}" data-tema-modo="${tema.modo}" data-tema-salvo="${tema.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · ${NOME_SISTEMA}</title>
${scriptTemas()}
<script>window.SISTEMA_LOGADO = true;</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/estilo.css">
<link rel="stylesheet" href="/temas.css">
<link rel="stylesheet" href="/decoracoes.css">
${cssLofi}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#7b5ce6">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Classroom Escolar">
</head>
<body data-pagina="${ativa}"${classeCorpo}>
${topo(usuario, ativa, req)}
${gaveta(usuario, ativa)}
<main class="conteudo">
${mensagens(req)}
${corpo}
</main>
${semDecoracao ? '' : decoracaoTema()}
<script src="/app.js"></script>
<script src="/pwa.js" defer></script>
</body>
</html>`;
}

module.exports = { pagina, avatar, iconeLogo, NOME_SISTEMA, homeDo, IC };
