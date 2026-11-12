/** Página "Calendário do mês": grade mensal, próximas tarefas, progresso e legenda. */
const { esc, dataBR } = require('../util');
const { homeDo, avatar } = require('./layout');
const { decoracao } = require('./decoracoes');
const { temaOuPadrao } = require('../temas');

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_LONGO = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Tipos de atividade do calendário: rótulo e classe de cor. */
const TIPOS = {
  tarefa: { rotulo: 'Tarefa/Quiz', classe: 'tarefa', icone: '✎' },
  trabalho: { rotulo: 'Entrega', classe: 'entrega', icone: '📤' },
  avaliacao: { rotulo: 'Prova', classe: 'prova', icone: '📝' },
  projeto: { rotulo: 'Projeto', classe: 'projeto', icone: '💻' },
  evento: { rotulo: 'Evento', classe: 'evento', icone: '📌' },
};

function tipoDe(ev) {
  return TIPOS[ev.tipo] || TIPOS.trabalho;
}

/** Chave "aaaa-mm-dd" de uma data (fuso local). */
function chaveDia(d) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Hora "hh:mm" de uma data ISO. */
function horaDe(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

function ehHoje(d) {
  return chaveDia(new Date()) === chaveDia(d);
}

/** Agrupa eventos por dia (somente os que têm prazo). */
function eventosPorDia(eventos) {
  const mapa = {};
  eventos.forEach((ev) => {
    if (!ev.prazo) return;
    const k = chaveDia(new Date(ev.prazo));
    (mapa[k] = mapa[k] || []).push(ev);
  });
  return mapa;
}

/** Link de detalhe do evento conforme o perfil; admin e provas ficam informativos. */
function linkDoEvento(ev, usuario) {
  const perfil = usuario && usuario.tipo;
  const ehTrabalho = (ev.tipo || 'trabalho') === 'trabalho';
  if (perfil === 'aluno') return ehTrabalho ? `/aluno/trabalho/${ev.id}` : null;
  if (perfil === 'professor') {
    return ehTrabalho ? `/professor/atividade/${ev.id}` : `/professor/materia/${ev.vinculo_id || ''}`;
  }
  return null; // admin: o calendário é só de acompanhamento
}

const TIPOS_ROTULO = {
  tarefa: 'Tarefa/Quiz',
  trabalho: 'Entrega',
  avaliacao: 'Prova',
  projeto: 'Projeto',
  evento: 'Evento',
};

/** Serializa um evento para o modal do dia (blocos prontos com dia/hora, já no fuso do projeto). */
function eventoParaModal(ev, usuario) {
  const perfil = usuario && usuario.tipo;
  const d = new Date(ev.prazo);
  if (Number.isNaN(d.getTime())) return null;
  const ehTrabalho = (ev.tipo || 'trabalho') === 'trabalho';
  const base = {
    id: ev.id,
    tipo: ev.tipo || 'trabalho',
    tipoRotulo: TIPOS_ROTULO[ev.tipo] || TIPOS.trabalho.rotulo,
    titulo: ev.titulo || '',
    descricao: ev.descricao || '',
    materia: ev.materia || '',
    turma: ev.turma || null,
    diaSemana: DIAS_SEMANA_LONGO[d.getDay()],
    diaNumero: d.getDate(),
    mesNome: MESES[d.getMonth()],
    ano: d.getFullYear(),
    hora: horaDe(ev.prazo),
    href: linkDoEvento(ev, usuario),
    hrefRotulo: perfil === 'aluno' ? 'Ver e entregar' : perfil === 'professor' ? 'Abrir correção' : null,
  };
  if (perfil === 'aluno') {
    const prazoPassou = d.getTime() < Date.now();
    base.situacao = ev.entrega_id
      ? ev.nota != null
        ? `Corrigida · nota ${ev.nota}`
        : 'Entregue'
      : prazoPassou
        ? 'Atrasada'
        : 'Pendente';
    base.entregou = Boolean(ev.entrega_id);
    base.nota = ev.nota != null ? Number(ev.nota) : null;
  } else if (perfil === 'professor') {
    base.totalEntregas = Number(ev.total_entregas || 0);
    base.corrigidas = Number(ev.corrigidas || 0);
    base.alunosTurma = Number(ev.alunos_turma || 0);
  } else if (perfil === 'admin') {
    base.totalEntregas = Number(ev.total_entregas || 0);
  }
  return base;
}

/** Dados do mês para o modal (apenas eventos com prazo). Escape de "<" para uso seguro em <script>. */
function dadosModalEventos(eventos, usuario) {
  const lista = eventos
    .map((ev) => eventoParaModal(ev, usuario))
    .filter(Boolean);
  return JSON.stringify(lista).replace(/</g, '\\u003c');
}

/** Janela com os detalhes do dia (dia, data, hora, tipo, descrição e situação). */
function modalDia() {
  return `
  <dialog class="cal-dia-modal" id="cal-dia-modal" aria-labelledby="cal-dia-modal-titulo" aria-describedby="cal-modal-contador">
    <div class="cal-modal-interior">
      <button type="button" class="cal-modal-fechar" id="cal-modal-fechar" aria-label="Fechar">✕</button>
      <header class="cal-modal-topo">
        <span class="cal-modal-selo" id="cal-modal-selo">Segunda-feira</span>
        <h2 id="cal-dia-modal-titulo">1 de janeiro de 2026</h2>
        <p class="cal-modal-contador" id="cal-modal-contador">1 atividade neste dia</p>
      </header>
      <div class="cal-modal-eventos" id="cal-modal-eventos"></div>
      <footer class="cal-modal-rodape">
        <button type="button" class="btn primario" id="cal-modal-filtrar">Ver só este dia na lista</button>
        <button type="button" class="btn secundario" id="cal-modal-fechar-2">Fechar</button>
      </footer>
    </div>
  </dialog>`;
}

/** Celula de um evento dentro da grade. */
function pilulaEvento(ev, usuario) {
  const t = tipoDe(ev);
  const classe = `cal-pilula ${t.classe}`;
  const conteudo = `<span class="cal-pilula-titulo">${esc(ev.titulo)}</span>
    ${ev.prazo ? `<span class="cal-pilula-hora">${horaDe(ev.prazo)}</span>` : ''}`;
  const href = linkDoEvento(ev, usuario);
  if (!href) {
    return `<span class="${classe}" title="${esc(ev.titulo)} — ${esc(ev.materia || '')}">${conteudo}</span>`;
  }
  return `<a class="${classe}" href="${href}" title="${esc(ev.titulo)} — ${esc(ev.materia || '')}">${conteudo}</a>`;
}

/** Grade do mês com as atividades marcadas. */
function gradeMes({ ano, mes, porDia, usuario }) {
  const primeiro = new Date(ano, mes, 1);
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const offset = primeiro.getDay();

  const cabecalho = DIAS_SEMANA.map((n) => `<div class="cal-cabecalho-dia">${n}</div>`).join('');

  let celulas = '';
  // Dias do mês anterior (apenas "fantasma", sem conteúdo)
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = 0; i < offset; i++) {
    celulas += `<div class="cal-dia fora-do-mes"><span class="cal-num">${diasMesAnterior - offset + 1 + i}</span></div>`;
  }

  for (let d = 1; d <= diasNoMes; d++) {
    const data = new Date(ano, mes, d);
    const k = chaveDia(data);
    const lista = (porDia[k] || []).sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
    const hoje = ehHoje(data);
    const visiveis = lista.slice(0, 3);
    const resto = lista.length - visiveis.length;
    const filtroDia = lista.length
      ? `<button type="button" class="cal-num cal-num-botao" data-abrir-dia="${k}" aria-label="Ver detalhes de ${lista.length} ${lista.length === 1 ? 'atividade' : 'atividades'} de ${d}/${mes + 1}/${ano}">${d}</button>`
      : `<span class="cal-num">${d}</span>`;
    celulas += `
    <div class="cal-dia ${hoje ? 'hoje' : ''} ${lista.length ? 'com-eventos' : ''}" data-dia="${k}" data-eventos="${lista.length}">
      <div class="cal-dia-topo">
        ${filtroDia}
        ${lista.some((ev) => ev.tipo === 'avaliacao') ? '<span class="cal-marca-prova" title="Tem prova">★</span>' : ''}
      </div>
      <div class="cal-dia-eventos">
        ${visiveis.map((ev) => pilulaEvento(ev, usuario)).join('')}
        ${resto > 0 ? `<span class="cal-mais">+${resto} mais</span>` : ''}
      </div>
    </div>`;
  }

  // Completa a última semana
  const totalCelulas = offset + diasNoMes;
  const restante = (7 - (totalCelulas % 7)) % 7;
  for (let i = 1; i <= restante; i++) {
    celulas += `<div class="cal-dia fora-do-mes"><span class="cal-num">${i}</span></div>`;
  }

  return `<div class="cal-grade">${cabecalho}${celulas}</div>`;
}

/** Item da lista "Próximas tarefas" (coluna direita). */
function proximaTarefa(ev, usuario) {
  const t = tipoDe(ev);
  const d = new Date(ev.prazo);
  const href = linkDoEvento(ev, usuario);
  const titulo = href
    ? `<a href="${href}">${esc(ev.titulo)}</a>`
    : `<span class="lofi-proxima-titulo">${esc(ev.titulo)}</span>`;
  return `
  <li class="lofi-proxima">
    <i class="ponto ${t.classe}"></i>
    <div class="lofi-proxima-corpo">
      ${titulo}
      <small>${esc(ev.materia || '')} · ${d.getDate()} ${MESES_CURTO[d.getMonth()]}${ev.prazo ? ' · ' + horaDe(ev.prazo) : ''}</small>
    </div>
  </li>`;
}

/** Formulário do professor para marcar prova/evento no mês. */
function formEvento(materias) {
  const opcoesTipo = Object.entries(TIPOS)
    .filter(([, v]) => v.classe !== 'entrega') // "Entrega" é criada na matéria
    .map(([id, v]) => `<option value="${id}">${v.rotulo}</option>`)
    .join('');
  const opcoesMateria = materias
    .map((m) => `<option value="${m.vinculo_id}">${esc(m.materia)} · ${esc(m.turma)}</option>`)
    .join('');
  return `
  <details class="cal-add-evento" id="adicionar-evento">
    <summary class="cal-botao-evento">+ Adicionar evento</summary>
    <form method="post" action="/professor/atividade" class="form-interno cal-form-evento">
      <input type="hidden" name="voltar" value="calendario">
      <div class="campo">
        <label for="cal-tipo" class="acima">Tipo</label>
        <select id="cal-tipo" name="tipo" required>${opcoesTipo}</select>
      </div>
      <div class="campo">
        <label for="cal-vinculo" class="acima">Matéria e turma</label>
        <select id="cal-vinculo" name="vinculo_id" required>${opcoesMateria}</select>
      </div>
      <div class="campo">
        <label for="cal-titulo" class="acima">Título</label>
        <input type="text" id="cal-titulo" name="titulo" placeholder="Ex.: Prova de Matemática — 1º bimestre" maxlength="160" required>
      </div>
      <div class="campo">
        <label for="cal-descricao" class="acima">Conteúdo / observações (opcional)</label>
        <textarea id="cal-descricao" name="descricao" placeholder="O que vai cair na prova, materiais, avisos..." rows="2" maxlength="2000"></textarea>
      </div>
      <div class="campo linha-dupla">
        <label for="cal-prazo" class="acima">Data e hora</label>
        <input type="datetime-local" id="cal-prazo" name="prazo" required>
      </div>
      <div class="form-acoes">
        <button class="btn primario" type="submit">Salvar no calendário</button>
      </div>
    </form>
  </details>`;
}

/** Frases do rodapé (variam conforme o dia). */
const FRASES = [
  'Um passo de cada vez também leva longe.',
  'Comece pequeno: o importante é começar.',
  'Descansar também faz parte de estudar.',
  'Seu ritmo é válido. Continue.',
  'Cada página lida é uma vitória.',
  'Organização é carinho com o seu futuro.',
  'Hoje é um bom dia para avançar um pouquinho.',
];

/** Ícones em pixel art usados na navegação do calendário. */
function iconePixel(nome) {
  const formas = {
    inicio: '<path d="M6 1h1v1h1v1h1v1h1v1h1v6H1V6h1V5h1V4h1V3h1V2h1zM4 7v4h4V7z" fill-rule="evenodd"/>',
    materias: '<path d="M1 2h4v9H1zM6 3h5v8H6z" fill-rule="evenodd"/><path d="M2 3h2v1H2zM2 5h2v1H2z" fill="#2f2547"/>',
    atividades:
      '<path d="M2 1h8v10H2zM4 3h4v1H4zm0 2h4v1H4zm0 2h2v1H4z" fill-rule="evenodd"/>',
    calendario:
      '<path d="M2 2h2V1h2v1h3V1h2v1h1v9H1V2zm1 3v5h8V5zM3 3v1h1V3zm6 0v1h1V3z" fill-rule="evenodd"/>',
    perfil: '<path d="M4 1h4v1h1v1h1v4H9v1H3V7H2V3h1V2h1zM2 9h1v2H2zm2 0h1v2H4zm1 0h2v2H5zm3 0h2v2H8zm2 0h1v2h-1z"/>',
    sair: '<path d="M2 1h5v2H4v6h3v2H2zM8 3h1v2h2v2H9v2H8V7H6V5h2z"/>',
    estrela: '<path d="M5 0h2v2h2v2h2v2h-2v2H7v2H5V8H3V6H1V4h2V2h2z"/>',
  };
  return `<svg viewBox="0 0 12 12" width="16" height="16" aria-hidden="true" shape-rendering="crispEdges">${formas[nome] || formas.inicio}</svg>`;
}

/** Logo em pixel art: carinha de gatinho. */
function logoPixel() {
  return `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" shape-rendering="crispEdges">
    <rect x="3" y="5" width="4" height="5" fill="#f8e8d4"/>
    <rect x="17" y="5" width="4" height="5" fill="#f8e8d4"/>
    <rect x="4" y="7" width="2" height="2" fill="#eda1b5"/>
    <rect x="18" y="7" width="2" height="2" fill="#eda1b5"/>
    <rect x="5" y="9" width="14" height="11" fill="#f8e8d4"/>
    <rect x="7" y="9" width="2" height="2" fill="#4a3a63"/>
    <rect x="15" y="9" width="2" height="2" fill="#4a3a63"/>
    <rect x="9" y="13" width="6" height="1" fill="#f3bccb"/>
    <rect x="8" y="15" width="8" height="2" fill="#f3bccb"/>
    <rect x="6" y="15" width="2" height="1" fill="#eda1b5"/>
    <rect x="16" y="15" width="2" height="1" fill="#eda1b5"/>
    <rect x="10" y="18" width="4" height="1" fill="#d98aa6"/>
  </svg>`;
}

function itemNav(href, rotulo, icone, ativo = false, extra = '') {
  return `<a class="lofi-nav-item ${ativo ? 'ativo' : ''}" href="${href}" ${
    ativo ? 'aria-current="page"' : ''
  } ${extra}>
    <span class="lofi-nav-icone">${iconePixel(icone)}</span><span>${rotulo}</span>
  </a>`;
}

/** Barra lateral escura com navegação, decoração e player lo-fi. */
function barraLateral({ usuario }) {
  const raiz = homeDo(usuario);
  const perfil = usuario.tipo;
  const professor = perfil === 'professor';
  const admin = perfil === 'admin';
  const linkCalendario = admin ? '/admin/calendario' : professor ? '/professor/calendario' : '/aluno/calendario';
  const rotuloSecao = admin ? 'Painel' : professor ? 'Turmas' : 'Matérias';
  const descricaoPerfil = admin ? 'administração' : professor ? 'sala dos professores' : usuario.turma_nome || 'estudante';
  return `
  <aside class="lofi-rail">
    <a class="lofi-marca" href="${raiz}">
      <span class="lofi-logo">${logoPixel()}</span>
      <span class="lofi-marca-texto"><strong>Classroom</strong><small>study room</small></span>
    </a>

    <div class="lofi-usuario">
      ${avatar(usuario, 'pequeno')}
      <div><strong>${esc(usuario.nome)}</strong><small>${esc(descricaoPerfil)}</small></div>
    </div>

    <nav class="lofi-nav" aria-label="Menu do calendário">
      ${itemNav(raiz, 'Início', 'inicio')}
      ${itemNav(raiz, rotuloSecao, 'materias')}
      ${itemNav('#lista-eventos', 'Atividades', 'atividades')}
      ${itemNav(linkCalendario, 'Calendário', 'calendario', true)}
      ${itemNav('/configuracoes', 'Perfil', 'perfil')}
    </nav>

    <div class="lofi-rail-cantinho" aria-hidden="true">
      <span class="lofi-rail-quote">um passo<br>de cada vez</span>
      <div class="lofi-rail-estante">
        ${decoracao('nuvia-bookshelf', { pasta: 'stationery', tamanho: 140 })}
        ${decoracao('nuvia-plant-small-pot', { pasta: 'plants', tamanho: 40, classe: 'lofi-rail-planta' })}
      </div>
    </div>

    <div class="lofi-rail-deco" aria-hidden="true">
      ${decoracao('nuvia-moon', { pasta: 'celestial', tamanho: 54, classe: 'lofi-deco-lua' })}
      ${decoracao('nuvia-star-yellow', { pasta: 'celestial', tamanho: 30 })}
      ${decoracao('nuvia-heart-pink', { pasta: 'celestial', tamanho: 26 })}
    </div>

    <div class="lofi-player" id="lofi-player">
      <div class="lofi-player-topo">
        <span class="lofi-disco" aria-hidden="true">${decoracao('nuvia-cat-peeking', { pasta: 'cats', tamanho: 24 })}</span>
        <div class="lofi-player-info">
          <strong>lo-fi study</strong>
          <small id="lofi-player-status">toque para começar</small>
        </div>
        <button class="lofi-play" id="lofi-play" type="button" aria-label="Tocar música lo-fi" aria-pressed="false">▶</button>
      </div>
      <span class="lofi-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    </div>

    <form method="post" action="/sair" class="lofi-sair">
      <button type="submit">${iconePixel('sair')}<span>Sair</span></button>
    </form>
  </aside>`;
}

/** Página completa do calendário do mês no visual Lo-fi Night. */
function paginaCalendarioLofi({ usuario, eventos, ano, mes, materias = [], tema = 'nuvia' }) {
  const perfil = usuario.tipo;
  const professor = perfil === 'professor';
  const admin = perfil === 'admin';
  const staff = professor || admin;
  const porDia = eventosPorDia(eventos);
  const agora = new Date();
  const mesAtual = new Date(ano, mes, 1);

  const anterior = new Date(ano, mes - 1, 1);
  const proximo = new Date(ano, mes + 1, 1);
  const linkAnterior = `?ano=${anterior.getFullYear()}&mes=${anterior.getMonth() + 1}`;
  const linkProximo = `?ano=${proximo.getFullYear()}&mes=${proximo.getMonth() + 1}`;

  // Eventos do mês (para progresso e lista)
  const doMes = eventos
    .filter((ev) => {
      if (!ev.prazo) return false;
      const d = new Date(ev.prazo);
      return d.getFullYear() === ano && d.getMonth() === mes;
    })
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));

  const total = doMes.length;
  const concluidas = staff
    ? doMes.filter((ev) => new Date(ev.prazo).getTime() < agora.getTime()).length
    : doMes.filter((ev) => ev.entrega_id).length;
  const percentual = total ? Math.round((concluidas / total) * 100) : 0;

  // Próximas tarefas: a partir de hoje (ou todas do mês, se nada à frente)
  const futuros = eventos
    .filter((ev) => ev.prazo && new Date(ev.prazo).getTime() >= agora.getTime())
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
  const proximas = (futuros.length ? futuros : doMes).slice(0, 6);

  const hojeData = new Date();
  const frase = FRASES[hojeData.getDate() % FRASES.length];

  const cabecalho = `
  <header class="lofi-cal-cabecalho">
    <div class="lofi-mes-navegacao">
      <a class="lofi-mes-seta" href="${linkAnterior}" aria-label="Mês anterior">‹</a>
      <div class="lofi-mes-atual">
        <span>mês de estudos</span>
        <strong>${MESES[mes]} ${ano}</strong>
      </div>
      <a class="lofi-mes-seta" href="${linkProximo}" aria-label="Próximo mês">›</a>
    </div>
    <div class="lofi-cal-acoes">
      ${professor ? formEvento(materias) : ''}
      ${decoracao('nuvia-moon', { pasta: 'celestial', tamanho: 62, classe: 'lofi-lua-mini' })}
    </div>
  </header>`;

  const rodape = `
  <footer class="lofi-rodape">
    <div class="lofi-mini lofi-hoje">
      <span class="lofi-mini-rotulo">hoje</span>
      <strong>${hojeData.getDate()} de ${MESES[hojeData.getMonth()]}</strong>
      <p>“${esc(frase)}”</p>
    </div>
    <div class="lofi-mini">
      <div class="lofi-mini-topo">
        <span class="lofi-mini-rotulo">progresso do mês</span>
        <small>${concluidas}/${total} tarefas</small>
      </div>
      <div class="lofi-barra"><i style="width:${percentual}%"></i></div>
      <span class="lofi-percentual">${percentual}%</span>
    </div>
    <div class="lofi-mini lofi-legenda">
      <span class="lofi-mini-rotulo">legenda</span>
      <ul>
        <li><i class="ponto tarefa"></i> Tarefa/Quiz</li>
        <li><i class="ponto entrega"></i> Entrega</li>
        <li><i class="ponto prova"></i> Prova</li>
        <li><i class="ponto projeto"></i> Projeto</li>
        <li><i class="ponto evento"></i> Evento</li>
      </ul>
    </div>
  </footer>`;

  const lateral = `
  <aside class="lofi-aside">
    <section class="lofi-card lofi-proximas">
      <header class="lofi-card-topo">
        <h2>Próximas tarefas</h2>
        <span class="lofi-estrela" aria-hidden="true">✦</span>
      </header>
      <ul class="lofi-proximas-lista">
        ${
          proximas.length
            ? proximas.map((ev) => proximaTarefa(ev, usuario)).join('')
            : `<li class="lofi-proximas-vazio">${decoracao('nuvia-heart-pink', {
                pasta: 'celestial',
                tamanho: 40,
              })}<span>Nada marcado por aqui ainda.</span></li>`
        }
      </ul>
      <a class="lofi-ver" href="#lista-eventos">ver todas as tarefas →</a>
    </section>

    <section class="lofi-card lofi-motivacional">
      <p>Pequenos passos<br>também são grandes<br>conquistas!</p>
      ${decoracao('nuvia-cat-sleeping-pillow', {
        pasta: 'cats',
        tamanho: 184,
        alt: 'Gatinho dormindo em uma almofada rosa',
      })}
      ${decoracao('nuvia-plant-small-pot', {
        pasta: 'plants',
        tamanho: 44,
        classe: 'lofi-motivacional-planta',
      })}
      ${decoracao('nuvia-star-yellow-small', {
        pasta: 'celestial',
        tamanho: 24,
        classe: 'lofi-motivacional-estrela',
      })}
    </section>

    <div class="lofi-ilustracao lofi-ilustracao--nuvia">
      ${decoracao('nuvia-books-stack', {
        pasta: 'stationery',
        tamanho: '100%',
        classe: 'lofi-livros',
        alt: 'Pilha de livros lilás',
      })}
      ${decoracao('nuvia-cat-peeking', {
        pasta: 'cats',
        tamanho: 126,
        classe: 'lofi-gato-livros',
        alt: 'Gatinho espiando em cima dos livros',
      })}
    </div>

    <div class="lofi-luar">
      ${decoracao('nuvia-moon', { pasta: 'celestial', tamanho: 92 })}
      <span>boa noite de estudos</span>
    </div>
  </aside>`;

  const listaCompleta = doMes.length
    ? doMes
        .map((ev) => {
          const t = tipoDe(ev);
          const href = linkDoEvento(ev, usuario);
          const titulo = href
            ? `<a href="${href}">${esc(ev.titulo)}</a>`
            : `<strong>${esc(ev.titulo)}</strong>`;
          return `
          <li class="lofi-lista-item" data-dia="${chaveDia(new Date(ev.prazo))}">
            <i class="ponto ${t.classe}"></i>
            <div class="lofi-lista-corpo">
              ${titulo}
              <small>${esc(ev.materia || '')} · ${dataBR(ev.prazo)} ${horaDe(ev.prazo) ? 'às ' + horaDe(ev.prazo) : ''}</small>
            </div>
            <span class="lofi-etiqueta ${t.classe}">${t.rotulo}</span>
          </li>`;
        })
        .join('')
    : `<div class="lofi-lista-vazia">
        ${decoracao('nuvia-cat-peeking', {
          pasta: 'cats',
          tamanho: 150,
          alt: 'Gatinho espiando com as patinhas para fora',
        })}
        <div><h3>Nada marcado neste mês</h3>
        <p>${
          professor
            ? 'Use "+ Adicionar evento" para marcar uma prova, projeto ou evento.'
            : admin
              ? 'Quando os professores publicarem trabalhos ou marcarem provas, eles aparecem aqui.'
              : 'Quando o professor publicar trabalhos ou marcar provas, eles aparecem aqui.'
        }</p></div>
      </div>`;

  return `
  <div class="lofi-app" data-cal-tema="${esc(tema)}">
    ${barraLateral({ usuario })}

    <main class="lofi-main">
      <header class="lofi-topo">
        <div class="lofi-topo-texto">
          <span class="lofi-selo">meu cantinho de estudos</span>
          <h1>Calendário</h1>
          <p>Organize seus estudos e não perca nenhum prazo.</p>
        </div>
        ${decoracao('nuvia-cat-bow-sitting', {
          pasta: 'cats',
          tamanho: 136,
          classe: 'lofi-cantinho',
          alt: 'Gatinho sentado com um laço rosa',
        })}
        ${decoracao('nuvia-sparkle-orange', {
          pasta: 'celestial',
          tamanho: 34,
          classe: 'lofi-topo-brilho',
          top: '20px',
          right: '196px',
          opacidade: 0.8,
          ocultarEm: 'mobile',
        })}
        ${decoracao('nuvia-heart-pink', {
          pasta: 'celestial',
          tamanho: 24,
          classe: 'lofi-topo-coracao',
          top: '34px',
          right: '158px',
          opacidade: 0.85,
          ocultarEm: 'mobile',
        })}
      </header>

      <section class="lofi-calendario" aria-label="Calendário de ${MESES[mes]} de ${ano}">
        ${cabecalho}
        ${gradeMes({ ano, mes, porDia, usuario })}
        ${rodape}
      </section>

      <section class="lofi-card lofi-lista-painel" id="lista-eventos">
        <header class="lofi-lista-topo">
          <h2>Atividades de ${MESES[mes]}</h2>
          <span>${total} atividade${total === 1 ? '' : 's'}</span>
        </header>
        <ul class="lofi-lista">${listaCompleta}</ul>
        <div class="cal-filtro" id="filtro-dia" hidden>
          <span>Filtrado por <strong id="filtro-dia-texto"></strong></span>
          <button type="button" class="cal-filtro-limpar" id="filtro-dia-limpar">Mostrar todas ✕</button>
        </div>
      </section>

      <div class="lofi-canto" aria-hidden="true">
        ${decoracao('nuvia-plant-hanging', { pasta: 'plants', tamanho: 116, classe: 'lofi-canto-planta' })}
        ${decoracao('nuvia-books-stack', { pasta: 'stationery', tamanho: 180, classe: 'lofi-canto-livros' })}
        ${decoracao('nuvia-cat-sleeping-pillow', { pasta: 'cats', tamanho: 132, classe: 'lofi-canto-gato' })}
        ${decoracao('nuvia-moon', { pasta: 'celestial', tamanho: 42, classe: 'lofi-canto-lua' })}
        ${decoracao('nuvia-star-yellow-small', { pasta: 'celestial', tamanho: 28, classe: 'lofi-canto-estrela' })}
      </div>
    </main>

    ${lateral}
  </div>

  ${modalDia()}
  <script type="application/json" id="cal-eventos-json">${dadosModalEventos(eventos, usuario)}</script>
  <script src="/lofi.js"></script>
  <script src="/calendario-modal.js" defer></script>`;
}

/** Item "Próximas tarefas" no visual clássico. */
function proximaTarefaClassica(ev, usuario) {
  const t = tipoDe(ev);
  const d = new Date(ev.prazo);
  const href = linkDoEvento(ev, usuario);
  const titulo = href
    ? `<a href="${href}">${esc(ev.titulo)}</a>`
    : `<span class="cal-proxima-titulo">${esc(ev.titulo)}</span>`;
  return `
  <li class="cal-proxima">
    <i class="ponto ${t.classe}"></i>
    <div class="cal-proxima-corpo">
      ${titulo}
      <small>${esc(ev.materia || '')} · ${d.getDate()} ${MESES_CURTO[d.getMonth()]}${
        ev.prazo ? ' · ' + horaDe(ev.prazo) : ''
      }</small>
    </div>
  </li>`;
}

/** Página do calendário no visual clássico, usada pelos demais temas. */
function paginaCalendarioClassico({ usuario, eventos, ano, mes, materias = [], tema = 'nuvia' }) {
  const perfil = usuario.tipo;
  const professor = perfil === 'professor';
  const admin = perfil === 'admin';
  const staff = professor || admin;
  const porDia = eventosPorDia(eventos);
  const agora = new Date();

  const anterior = new Date(ano, mes - 1, 1);
  const proximo = new Date(ano, mes + 1, 1);
  const linkAnterior = `?ano=${anterior.getFullYear()}&mes=${anterior.getMonth() + 1}`;
  const linkProximo = `?ano=${proximo.getFullYear()}&mes=${proximo.getMonth() + 1}`;

  const doMes = eventos
    .filter((ev) => {
      if (!ev.prazo) return false;
      const d = new Date(ev.prazo);
      return d.getFullYear() === ano && d.getMonth() === mes;
    })
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));

  const total = doMes.length;
  const concluidas = staff
    ? doMes.filter((ev) => new Date(ev.prazo).getTime() < agora.getTime()).length
    : doMes.filter((ev) => ev.entrega_id).length;
  const percentual = total ? Math.round((concluidas / total) * 100) : 0;

  const futuros = eventos
    .filter((ev) => ev.prazo && new Date(ev.prazo).getTime() >= agora.getTime())
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
  const proximas = (futuros.length ? futuros : doMes).slice(0, 6);

  const hojeData = new Date();
  const frase = FRASES[hojeData.getDate() % FRASES.length];
  const subtitulo = admin
    ? 'Visão geral das atividades da escola.'
    : 'Organize seus estudos e não perca nenhum prazo!';

  const cabecalho = `
  <header class="cal-mes-cabecalho">
    <div class="cal-mes-titulo">
      <span class="cal-mes-icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zm0-12H5V6h14z"/></svg>
      </span>
      <div>
        <h1>Calendário</h1>
        <p>${subtitulo}</p>
      </div>
    </div>
    <div class="cal-mes-acoes">
      <a class="cal-mes-nav" href="${linkAnterior}" aria-label="Mês anterior">‹</a>
      <span class="cal-mes-nome">${MESES[mes]} ${ano}</span>
      <a class="cal-mes-nav" href="${linkProximo}" aria-label="Próximo mês">›</a>
      ${professor ? formEvento(materias) : ''}
      <span class="cal-mes-estrela" aria-hidden="true">✦</span>
    </div>
  </header>`;

  const rodape = `
  <footer class="cal-mes-rodape">
    <div class="cal-rodape-card cal-rodape-hoje">
      <strong>Hoje, ${hojeData.getDate()} de ${MESES[hojeData.getMonth()]}</strong>
      <p>“${esc(frase)}”</p>
    </div>
    <div class="cal-rodape-card cal-rodape-progresso">
      <div class="cal-progresso-topo">
        <strong>Progresso do mês</strong>
        <small>${concluidas}/${total} tarefas</small>
      </div>
      <div class="cal-barra"><i style="width:${percentual}%"></i></div>
      <span class="cal-percentual">${percentual}%</span>
    </div>
    <div class="cal-rodape-card cal-rodape-legenda">
      <strong>Legenda</strong>
      <ul>
        <li><i class="ponto tarefa"></i> Tarefa/Quiz</li>
        <li><i class="ponto entrega"></i> Entrega</li>
        <li><i class="ponto prova"></i> Prova</li>
        <li><i class="ponto projeto"></i> Projeto</li>
        <li><i class="ponto evento"></i> Evento</li>
      </ul>
    </div>
  </footer>`;

  const lateral = `
  <aside class="cal-lateral">
    <section class="cal-proximas">
      <header class="cal-proximas-topo">
        <h2>Próximas tarefas</h2>
        <span class="cal-proximas-estrela" aria-hidden="true">✦</span>
      </header>
      <ul class="cal-proximas-lista">
        ${
          proximas.length
            ? proximas.map((ev) => proximaTarefaClassica(ev, usuario)).join('')
            : '<li class="cal-proximas-vazio">Nada marcado por aqui ainda 🌱</li>'
        }
      </ul>
      <a class="cal-ver-todas" href="#lista-eventos">Ver todas as tarefas →</a>
    </section>

    <section class="cal-motivacional">
      <p>Pequenos passos<br>também são grandes<br>conquistas!</p>
    </section>

    <div class="cal-ilustracoes">
      <img class="cal-cena" src="/img/calendario-cena.png" width="320" height="150" alt="Ilustração de um gatinho dormindo sobre uma pilha de livros ao lado de uma plantinha">
    </div>
  </aside>`;

  const listaCompleta = doMes.length
    ? doMes
        .map((ev) => {
          const t = tipoDe(ev);
          const href = linkDoEvento(ev, usuario);
          const titulo = href
            ? `<a href="${href}">${esc(ev.titulo)}</a>`
            : `<strong>${esc(ev.titulo)}</strong>`;
          return `
          <li class="cal-lista-item" data-dia="${chaveDia(new Date(ev.prazo))}">
            <i class="ponto ${t.classe}"></i>
            <div class="cal-lista-corpo">
              ${titulo}
              <small>${esc(ev.materia || '')} · ${dataBR(ev.prazo)} ${
                horaDe(ev.prazo) ? 'às ' + horaDe(ev.prazo) : ''
              }${admin && ev.turma ? ' · ' + esc(ev.turma) : ''}</small>
            </div>
            <span class="cal-etiqueta ${t.classe}">${t.rotulo}</span>
          </li>`;
        })
        .join('')
    : `<div class="vazio"><div class="vazio-icone">🗓️</div>
        <h3>Nada marcado neste mês</h3>
        <p>${
          professor
            ? 'Use "+ Adicionar evento" para marcar uma prova, projeto ou evento.'
            : admin
              ? 'Quando os professores publicarem trabalhos ou marcarem provas, eles aparecem aqui.'
              : 'Quando o professor publicar trabalhos ou marcar provas, eles aparecem aqui.'
        }</p></div>`;

  return `
  <div class="cal-mes-layout" data-cal-tema="${esc(tema)}">
    <section class="cal-mes-cartao">
      ${cabecalho}
      ${gradeMes({ ano, mes, porDia, usuario })}
      ${rodape}
    </section>
    ${lateral}
  </div>

  <section class="painel cal-lista-painel" id="lista-eventos">
    <div class="painel-topo">
      <h2>Atividades de ${MESES[mes]}</h2>
      <span class="descricao">${total} atividade${total === 1 ? '' : 's'}</span>
    </div>
    <ul class="cal-lista">${listaCompleta}</ul>
    <div class="cal-filtro" id="filtro-dia" hidden>
      <span>Filtrado por <strong id="filtro-dia-texto"></strong></span>
      <button type="button" class="cal-filtro-limpar" id="filtro-dia-limpar">Mostrar todas ✕</button>
    </div>
  </section>

  ${modalDia()}
  <script type="application/json" id="cal-eventos-json">${dadosModalEventos(eventos, usuario)}</script>
  <script src="/calendario-modal.js" defer></script>`;
}

/**
 * O calendário é SEMPRE o visual clássico, fixo ao tema ativo — sem reações ao
 * Lofi Mode (que antes escondia a barra lateral e trocava a identidade inteira
 * da página, dando a sensação de "o tema mudar sozinho"). O visual novo fica
 * de fora até nova decisão — o calendário não muda mais por conta própria.
 */
function paginaCalendario({ usuario, eventos, ano, mes, materias = [], tema }) {
  const temaId = tema || temaOuPadrao(usuario && usuario.tema);
  return paginaCalendarioClassico({ usuario, eventos, ano, mes, materias, tema: temaId });
}

module.exports = { paginaCalendario, chaveDia, MESES, TIPOS };
