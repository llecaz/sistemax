/** Página "Calendário do mês": grade mensal, próximas tarefas, progresso e legenda. */
const { esc, dataBR } = require('../util');
const { homeDo, avatar } = require('./layout');

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

/** Celula de um evento dentro da grade. */
function pilulaEvento(ev, professor) {
  const t = tipoDe(ev);
  const classe = `cal-pilula ${t.classe}`;
  const conteudo = `<span class="cal-pilula-titulo">${esc(ev.titulo)}</span>
    ${ev.prazo ? `<span class="cal-pilula-hora">${horaDe(ev.prazo)}</span>` : ''}`;
  // Prova/evento não tem tela de entrega: no aluno fica só informativo.
  if ((ev.tipo || 'trabalho') !== 'trabalho' && !professor) {
    return `<span class="${classe}" title="${esc(ev.titulo)} — ${esc(ev.materia || '')}">${conteudo}</span>`;
  }
  const href = professor
    ? ev.tipo === 'trabalho'
      ? `/professor/atividade/${ev.id}`
      : `/professor/materia/${ev.vinculo_id || ''}`
    : `/aluno/trabalho/${ev.id}`;
  return `<a class="${classe}" href="${href}" title="${esc(ev.titulo)} — ${esc(ev.materia || '')}">${conteudo}</a>`;
}

/** Grade do mês com as atividades marcadas. */
function gradeMes({ ano, mes, porDia, professor }) {
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
    celulas += `
    <div class="cal-dia ${hoje ? 'hoje' : ''} ${lista.length ? 'com-eventos' : ''}" data-dia="${k}">
      <div class="cal-dia-topo">
        <span class="cal-num">${d}</span>
        ${lista.some((ev) => ev.tipo === 'avaliacao') ? '<span class="cal-marca-prova" title="Tem prova">★</span>' : ''}
      </div>
      <div class="cal-dia-eventos">
        ${visiveis.map((ev) => pilulaEvento(ev, professor)).join('')}
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
function proximaTarefa(ev, professor) {
  const t = tipoDe(ev);
  const d = new Date(ev.prazo);
  const ehTrabalho = (ev.tipo || 'trabalho') === 'trabalho';
  const href = professor
    ? ehTrabalho
      ? `/professor/atividade/${ev.id}`
      : `/professor/materia/${ev.vinculo_id || ''}`
    : `/aluno/trabalho/${ev.id}`;
  const titulo = ehTrabalho || professor
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
function barraLateral({ usuario, professor }) {
  const raiz = homeDo(usuario);
  return `
  <aside class="lofi-rail">
    <a class="lofi-marca" href="${raiz}">
      <span class="lofi-logo">${logoPixel()}</span>
      <span class="lofi-marca-texto"><strong>Classroom</strong><small>study room</small></span>
    </a>

    <div class="lofi-usuario">
      ${avatar(usuario, 'pequeno')}
      <div><strong>${esc(usuario.nome)}</strong><small>${esc(
        professor ? 'sala dos professores' : usuario.turma_nome || 'estudante'
      )}</small></div>
    </div>

    <nav class="lofi-nav" aria-label="Menu do calendário">
      ${itemNav(raiz, 'Início', 'inicio')}
      ${itemNav(raiz, professor ? 'Turmas' : 'Matérias', 'materias')}
      ${itemNav('#lista-eventos', 'Atividades', 'atividades')}
      ${itemNav(professor ? '/professor/calendario' : '/aluno/calendario', 'Calendário', 'calendario', true)}
      ${itemNav('/configuracoes', 'Perfil', 'perfil')}
    </nav>

    <div class="lofi-rail-cantinho" aria-hidden="true">
      <span class="lofi-rail-quote">um passo<br>de cada vez</span>
      <img src="/img/lofi/estante.svg" alt="" width="150">
    </div>

    <div class="lofi-rail-deco" aria-hidden="true">
      <img class="lofi-deco-lua" src="/img/lofi/lua-estrelas.svg" alt="">
      <img class="lofi-deco-planta" src="/img/lofi/plantinha.svg" alt="">
    </div>

    <div class="lofi-player" id="lofi-player">
      <div class="lofi-player-topo">
        <span class="lofi-disco" aria-hidden="true">♪</span>
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

/** Página completa do calendário do mês. */
function paginaCalendario({ usuario, eventos, ano, mes, professor, materias = [] }) {
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
  const concluidas = professor
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
      <img class="lofi-lua-mini" src="/img/lofi/lua-estrelas.svg" alt="" width="80">
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
            ? proximas.map((ev) => proximaTarefa(ev, professor)).join('')
            : `<li class="lofi-proximas-vazio"><img src="/img/lofi/plantinha.svg" alt="" width="52"><span>Nada marcado por aqui ainda.</span></li>`
        }
      </ul>
      <a class="lofi-ver" href="#lista-eventos">ver todas as tarefas →</a>
    </section>

    <section class="lofi-card lofi-motivacional">
      <p>Pequenos passos<br>também são grandes<br>conquistas!</p>
      <img src="/img/lofi/gato-almofada.svg" width="164" alt="Gatinho descansando em uma almofada rosa">
    </section>

    <div class="lofi-ilustracao">
      <img src="/img/lofi/gato-livros.svg" alt="Gatinho dormindo em cima de uma pilha de livros" width="100%">
    </div>

    <div class="lofi-luar">
      <img src="/img/lofi/lua-estrelas.svg" alt="" width="110">
      <span>boa noite de estudos</span>
    </div>
  </aside>`;

  const listaCompleta = doMes.length
    ? doMes
        .map((ev) => {
          const t = tipoDe(ev);
          const ehTrabalho = (ev.tipo || 'trabalho') === 'trabalho';
          const href = professor
            ? ehTrabalho
              ? `/professor/atividade/${ev.id}`
              : `/professor/materia/${ev.vinculo_id || ''}`
            : `/aluno/trabalho/${ev.id}`;
          const titulo =
            ehTrabalho || professor
              ? `<a href="${href}">${esc(ev.titulo)}</a>`
              : `<strong>${esc(ev.titulo)}</strong>`;
          return `
          <li class="lofi-lista-item">
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
        <img src="/img/lofi/gato-almofada.svg" alt="Gatinho descansando em uma almofada" width="150">
        <div><h3>Nada marcado neste mês</h3>
        <p>${
          professor
            ? 'Use "+ Adicionar evento" para marcar uma prova, projeto ou evento.'
            : 'Quando o professor publicar trabalhos ou marcar provas, eles aparecem aqui.'
        }</p></div>
      </div>`;

  return `
  <div class="lofi-app">
    ${barraLateral({ usuario, professor })}

    <main class="lofi-main">
      <header class="lofi-topo">
        <div class="lofi-topo-texto">
          <span class="lofi-selo">meu cantinho de estudos</span>
          <h1>Calendário</h1>
          <p>Organize seus estudos e não perca nenhum prazo.</p>
        </div>
        <img class="lofi-cantinho" src="/img/lofi/cantinho.svg" width="192" alt="Cantinho de estudo com livros, caneca e plantinha">
      </header>

      <section class="lofi-calendario" aria-label="Calendário de ${MESES[mes]} de ${ano}">
        ${cabecalho}
        ${gradeMes({ ano, mes, porDia, professor })}
        ${rodape}
      </section>

      <section class="lofi-card lofi-lista-painel" id="lista-eventos">
        <header class="lofi-lista-topo">
          <h2>Atividades de ${MESES[mes]}</h2>
          <span>${total} atividade${total === 1 ? '' : 's'}</span>
        </header>
        <ul class="lofi-lista">${listaCompleta}</ul>
      </section>
    </main>

    ${lateral}
  </div>
  <script src="/lofi.js"></script>`;
}

module.exports = { paginaCalendario, chaveDia, MESES, TIPOS };
