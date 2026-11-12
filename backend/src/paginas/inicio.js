/** Painel inicial (dashboard) do aluno e do professor — visual SaaS lavanda. */
const { esc, dataHoraBR, decorrido, corDe, iniciais } = require('../util');
const { classificar } = require('../regras');
const { TIPOS, chaveDia } = require('./calendario');

const DIAS_LONGO = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** "Bom dia" / "Boa tarde" / "Boa noite". */
function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

/** "Terça-feira, 10 de novembro". */
function dataLonga(d) {
  const dia = DIAS_LONGO[d.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}

/** "10 de novembro de 2026". */
function dataCompleta(d) {
  return `${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

/** Primeiro nome para a saudação. */
function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

function capitalizar(texto) {
  const t = String(texto || '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* ------------------------------ Ícones ------------------------------ */

const svg = (conteudo, tamanho = 20) =>
  `<svg viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`;

const ICO = {
  check: svg('<path d="m5 12 4.5 4.5L19 7"/>', 15),
  send: svg('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/>', 15),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 15),
  alert: svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>', 15),
  tarefa: svg('<rect x="3" y="4" width="18" height="16" rx="4"/><path d="m8 12 2.5 2.5L16 9"/>', 18),
  livro: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>', 18),
  calendario: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>', 20),
  lista: svg('<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>', 18),
  seta: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 15),
  setaEsq: svg('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>', 16),
  setaDir: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>', 16),
};

/* ------------------------------ Matérias ------------------------------ */

const CORES_MATERIA = [
  { cor: '#7c5ce6', fundo: '#f0ebff' },
  { cor: '#e2557f', fundo: '#fdeef3' },
  { cor: '#3b82f6', fundo: '#eaf2ff' },
  { cor: '#2f9e6e', fundo: '#e9f8f0' },
  { cor: '#d97706', fundo: '#fff4e3' },
  { cor: '#0e9aa7', fundo: '#e6f8f8' },
];

const ICONE_MATERIA = {
  matematica: svg('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h2M14 12h2M8 17h2M14 17h2"/>', 22),
  portugues: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>', 22),
  ciencias: svg('<path d="M9 3h6M10 3v6l-5 8.5A2.2 2.2 0 0 0 6.9 21h10.2a2.2 2.2 0 0 0 1.9-3.5L14 9V3"/><path d="M8 15h8"/>', 22),
  historia: svg('<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10h18L12 3 3 10Z"/>', 22),
  geografia: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>', 22),
  idiomas: svg('<path d="M4 5h10M9 3v2c0 4.5-2.2 7.5-6 9"/><path d="M6 9c1.5 2.5 4 4.3 7 5"/><path d="m14 21 4-10 4 10M15.5 17h5"/>', 22),
  artes: svg('<path d="M12 3a9 9 0 0 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h6.5A2.5 2.5 0 0 0 21 9.5C21 5.9 17 3 12 3Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.5" r="1"/><circle cx="15" cy="6.5" r="1"/>', 22),
  esporte: svg('<path d="M6.5 6.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 21l-3-7-3 2v5M6 21l2-6 4-2 3 3 3-1"/>', 22),
  padrao: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>', 22),
};

function iconeMateria(nome) {
  const n = String(nome || '').toLowerCase();
  if (/matem/.test(n)) return ICONE_MATERIA.matematica;
  if (/portug|literat|reda/.test(n)) return ICONE_MATERIA.portugues;
  if (/cienc|biolog|quim|fisic/.test(n)) return ICONE_MATERIA.ciencias;
  if (/hist/.test(n)) return ICONE_MATERIA.historia;
  if (/geo/.test(n)) return ICONE_MATERIA.geografia;
  if (/ingl|espanh|idioma|franc/.test(n)) return ICONE_MATERIA.idiomas;
  if (/arte|desenho|musica/.test(n)) return ICONE_MATERIA.artes;
  if (/educa.*fisic|esporte/.test(n)) return ICONE_MATERIA.esporte;
  return ICONE_MATERIA.padrao;
}

function corDaMateria(nome) {
  const texto = String(nome || '');
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  return CORES_MATERIA[hash % CORES_MATERIA.length];
}

/* ------------------------------ Tarefas ------------------------------ */

const ABAS_ALUNO = [
  ['todas', 'Todas'],
  ['afazer', 'A fazer'],
  ['entregues', 'Entregues'],
  ['corrigidas', 'Corrigidas'],
];

function ehTrabalho(a) {
  return (a.tipo || 'trabalho') === 'trabalho';
}

/** Situação visual da atividade: corrigida, entregue, pendente ou atrasada. */
function statusAtividade(a) {
  if (ehTrabalho(a)) {
    const s = classificar(a);
    if (s.corrigido) return 'corrigida';
    if (s.temEntrega) return 'entregue';
    if (s.atrasado) return 'atrasada';
    return 'pendente';
  }
  if (a.prazo && new Date(a.prazo).getTime() < Date.now()) return 'atrasada';
  return 'pendente';
}

const STATUS_INFO = {
  corrigida: { rotulo: 'Corrigida', icone: ICO.check },
  entregue: { rotulo: 'Entregue', icone: ICO.send },
  pendente: { rotulo: 'Pendente', icone: ICO.clock },
  atrasada: { rotulo: 'Atrasada', icone: ICO.alert },
};

function filtrarTarefas(atividades, aba) {
  return atividades.filter((a) => {
    if (aba === 'todas') return true;
    const st = statusAtividade(a);
    if (aba === 'afazer') return st === 'pendente' || st === 'atrasada';
    if (aba === 'entregues') return st === 'entregue';
    if (aba === 'corrigidas') return st === 'corrigida';
    return true;
  });
}

function contagensTarefas(atividades) {
  const c = { todas: atividades.length, afazer: 0, entregues: 0, corrigidas: 0 };
  atividades.forEach((a) => {
    const st = statusAtividade(a);
    if (st === 'pendente' || st === 'atrasada') c.afazer++;
    else if (st === 'corrigida') c.corrigidas++;
    else if (st === 'entregue') c.entregues++;
  });
  return c;
}

function filtrarBusca(lista, busca, campos) {
  const termo = String(busca || '').trim().toLowerCase();
  if (!termo) return lista;
  return lista.filter((item) =>
    campos.some((campo) => String(item[campo] || '').toLowerCase().includes(termo))
  );
}

/** Quantos dias faltam para o prazo (negativo = atrasada). */
function diasParaPrazo(prazo) {
  if (!prazo) return null;
  const alvo = new Date(prazo);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
}

function seloStatus(a) {
  const st = statusAtividade(a);
  const info = STATUS_INFO[st];
  let extra = '';
  if (st === 'pendente' || st === 'atrasada') {
    const d = diasParaPrazo(a.prazo);
    if (d !== null) {
      if (d === 0) extra = 'vence hoje';
      else if (d === 1) extra = 'vence amanhã';
      else if (d > 1) extra = `vence em ${d}d`;
      else if (d === -1) extra = 'atrasada 1 dia';
      else extra = `atrasada ${-d}d`;
    }
  }
  const title = a.prazo ? ` title="Prazo: ${dataHoraBR(a.prazo)}"` : '';
  return `<span class="dash-status dash-status--${st}"${title}>${info.icone}${info.rotulo}${
    extra ? `<em class="dash-status-extra">${extra}</em>` : ''
  }</span>`;
}

function linkTarefa(a, perfil) {
  if (ehTrabalho(a)) {
    return perfil === 'professor' ? `/professor/atividade/${a.id}` : `/aluno/trabalho/${a.id}`;
  }
  return perfil === 'professor' ? '/professor/calendario' : '/aluno/calendario';
}

function listaTarefasAluno(atividades, aba, busca, perfil = 'aluno') {
  const visiveis = filtrarTarefas(filtrarBusca(atividades, busca, ['titulo', 'materia']), aba);
  if (!visiveis.length) {
    return `<li class="dash-vazio">${ICO.tarefa}<span>${
      busca ? 'Nenhuma tarefa encontrada para esta busca.' : aba === 'todas' ? 'Nenhuma atividade publicada ainda.' : 'Nada nesta aba por enquanto.'
    }</span></li>`;
  }
  return visiveis
    .slice(0, 8)
    .map((a) => {
      const st = statusAtividade(a);
      return `<li class="dash-tarefa dash-tarefa--${st}">
        <span class="dash-tarefa-barra" aria-hidden="true"></span>
        <div class="dash-tarefa-corpo">
          <a class="dash-tarefa-titulo" href="${linkTarefa(a, perfil)}">${esc(a.titulo)}</a>
          <span class="dash-tarefa-meta">${esc(a.materia || 'Sem matéria')} · ${
            a.prazo ? dataHoraBR(a.prazo) : 'Sem data marcada'
          }</span>
        </div>
        ${seloStatus(a)}
      </li>`;
    })
    .join('');
}

/* ------------------------------ Calendário ------------------------------ */

function eventosDoMes(eventos, ano, mes) {
  const mapa = {};
  eventos.forEach((ev) => {
    if (!ev.prazo) return;
    const d = new Date(ev.prazo);
    if (d.getFullYear() !== ano || d.getMonth() !== mes) return;
    (mapa[chaveDia(d)] = mapa[chaveDia(d)] || []).push(ev);
  });
  return mapa;
}

function miniCalendario({ eventos, base, ano, mes, busca = '' }) {
  const porDia = eventosDoMes(eventos, ano, mes);
  const primeiro = new Date(ano, mes, 1);
  const offset = primeiro.getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hojeChave = chaveDia(new Date());

  const anterior = new Date(ano, mes - 1, 1);
  const proximo = new Date(ano, mes + 1, 1);
  const link = (d) => {
    const params = new URLSearchParams();
    params.set('ano', d.getFullYear());
    params.set('mes', d.getMonth() + 1);
    if (busca) params.set('q', busca);
    return `${base}?${params.toString()}#calendario`;
  };

  let celulas = '';
  for (let i = 0; i < offset; i++) celulas += '<span class="dash-cal-dia fora"></span>';
  for (let d = 1; d <= diasNoMes; d++) {
    const chave = chaveDia(new Date(ano, mes, d));
    const doDia = porDia[chave] || [];
    const pontos = doDia
      .slice(0, 3)
      .map((ev) => `<i class="ponto ${(TIPOS[ev.tipo] || TIPOS.trabalho).classe}"></i>`)
      .join('');
    celulas += `<span class="dash-cal-dia ${chave === hojeChave ? 'hoje' : ''} ${
      doDia.length ? 'tem' : ''
    }"${doDia.length ? ` title="${doDia.length} atividade${doDia.length > 1 ? 's' : ''}"` : ''}>
      <span class="dash-cal-num">${d}</span>
      ${pontos ? `<span class="dash-cal-pontos">${pontos}</span>` : ''}
    </span>`;
  }
  const total = offset + diasNoMes;
  const restante = (7 - (total % 7)) % 7;
  for (let i = 0; i < restante; i++) celulas += '<span class="dash-cal-dia fora"></span>';

  const paramsCompleto = new URLSearchParams();
  paramsCompleto.set('ano', ano);
  paramsCompleto.set('mes', mes + 1);

  return `
  <section class="dash-card dash-calendario" id="calendario">
    <header class="dash-card-topo dash-cal-topo">
      <div class="dash-card-titulo">
        <span class="dash-icone dash-icone--roxo">${ICO.calendario}</span>
        <h2>Calendário</h2>
      </div>
      <div class="dash-cal-nav">
        <a href="${link(anterior)}" aria-label="Mês anterior">${ICO.setaEsq}</a>
        <a href="${link(proximo)}" aria-label="Próximo mês">${ICO.setaDir}</a>
      </div>
    </header>
    <p class="dash-cal-mes">${MESES[mes]} ${ano}</p>
    <div class="dash-cal-grade">
      ${DIAS_CURTO.map((d) => `<span class="dash-cal-semana">${d}</span>`).join('')}
      ${celulas}
    </div>
    <a class="dash-cal-botao" href="${base}/calendario?${paramsCompleto.toString()}">
      ${ICO.calendario}<span>Ver calendário completo</span>${ICO.seta}
    </a>
  </section>`;
}

/* ------------------------------ Semana ------------------------------ */

/** Faixa "sua semana": os próximos 7 dias com as atividades de cada um. */
function plannerSemana(eventos, base = '/aluno') {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const porDia = {};
  eventos.forEach((ev) => {
    if (!ev.prazo) return;
    const d = new Date(ev.prazo);
    (porDia[chaveDia(d)] = porDia[chaveDia(d)] || []).push(ev);
  });

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const doDia = (porDia[chaveDia(d)] || []).slice(0, 3);
    const nome = DIAS_CURTO[d.getDay()];
    const primeiro = doDia[0];
    dias.push(`<a class="dash-week-dia ${i === 0 ? 'hoje' : ''} ${doDia.length ? 'tem' : ''}" href="${base}/calendario?ano=${d.getFullYear()}&mes=${d.getMonth() + 1}#calendario" title="${
      doDia.length ? `${doDia.length} atividade${doDia.length > 1 ? 's' : ''}` : 'Dia livre'
    }">
      <span class="dash-week-nome">${nome}</span>
      <strong>${String(d.getDate()).padStart(2, '0')}</strong>
      <span class="dash-week-pontos">${doDia
        .map((ev) => `<i class="ponto ${(TIPOS[ev.tipo] || TIPOS.trabalho).classe}"></i>`)
        .join('')}</span>
      <small>${primeiro ? esc(primeiro.titulo) : 'livre'}</small>
    </a>`);
  }

  return `
  <section class="dash-week" aria-label="Sua semana">
    <header class="dash-week-topo">
      <div>
        <span class="dash-week-icone">${ICO.calendario}</span>
        <h2>Sua semana</h2>
      </div>
      <a class="dash-ver" href="${base}/calendario">Ver calendário ${ICO.seta}</a>
    </header>
    <div class="dash-week-dias">${dias.join('')}</div>
  </section>`;
}

/* ------------------------------ Modo foco ------------------------------ */

/** Modo foco no painel: mostra o mesmo cronômetro global e abre a página dedicada. */
function cartaoFoco() {
  return `
  <section class="dash-card dash-foco" data-foco aria-label="Modo foco">
    <header class="dash-card-topo">
      <div class="dash-card-titulo">
        <span class="dash-icone dash-icone--roxo">${ICO.clock}</span>
        <h2>Modo foco</h2>
      </div>
      <span class="dash-contagem" data-foco-sessao>25 min</span>
    </header>
    <div class="dash-foco-corpo">
      <a class="dash-foco-link" href="/foco" aria-label="Abrir o Modo foco">
        <span class="dash-foco-tempo" data-foco-tempo>25:00</span>
        <span class="dash-foco-barra" aria-hidden="true"><i data-foco-barra></i></span>
      </a>
      <div class="dash-foco-botoes">
        <button type="button" class="dash-foco-btn principal" data-foco-acao="alternar" data-foco-alternar aria-pressed="false">Começar</button>
        <button type="button" class="dash-foco-btn" data-foco-acao="zerar">Zerar</button>
        <a class="dash-foco-btn" href="/foco">Abrir</a>
      </div>
      <small class="dash-foco-dica">O cronômetro continua mesmo em outras páginas.</small>
    </div>
  </section>`;
}

/** Próximas atividades com prazo a partir de agora. */
function proximasTarefas(eventos, base, perfil = 'aluno', busca = '') {
  const agora = Date.now();
  const filtrados = filtrarBusca(eventos, busca, ['titulo', 'materia']);
  const proximas = filtrados
    .filter((ev) => ev.prazo && new Date(ev.prazo).getTime() >= agora)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 4);

  const itens = proximas.length
    ? proximas
        .map((ev) => {
          const d = new Date(ev.prazo);
          const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `<li class="dash-prox-item">
            <a href="${linkTarefa(ev, perfil)}">
              <span class="dash-prox-ponto ${(TIPOS[ev.tipo] || TIPOS.trabalho).classe}"></span>
              <span class="dash-prox-corpo">
                <strong>${esc(ev.titulo)}</strong>
                <small>${esc(ev.materia || 'Sem matéria')} · ${d.getDate()} ${MESES_CURTO[d.getMonth()]} · ${hora}</small>
              </span>
            </a>
          </li>`;
        })
        .join('')
    : `<li class="dash-vazio">${ICO.lista}<span>Nada marcado por aqui ainda.</span></li>`;

  return `
  <section class="dash-card dash-proximas">
    <header class="dash-card-topo">
      <div class="dash-card-titulo">
        <span class="dash-icone dash-icone--roxo">${ICO.lista}</span>
        <h2>Próximas Tarefas</h2>
      </div>
      <a class="dash-ver" href="${base}/calendario">Ver todas ${ICO.seta}</a>
    </header>
    <ul class="dash-prox-lista">${itens}</ul>
  </section>`;
}

/* ------------------------------ Cabeçalho ------------------------------ */

function cabecalho({ usuario, subtitulo, agora }) {
  return `
  <div class="dash-topo">
    <section class="dash-banner">
      <div class="dash-banner-texto">
        <h1>${saudacao()}, ${esc(primeiroNome(usuario.nome))}!</h1>
        <p>${esc(subtitulo)}</p>
      </div>
    </section>
    <aside class="dash-data-card">
      <span class="dash-data-icone">${ICO.calendario}</span>
      <div class="dash-data-texto">
        <strong>${dataCompleta(agora)}</strong>
        <span>${capitalizar(DIAS_LONGO[agora.getDay()])}</span>
      </div>
    </aside>
  </div>`;
}

function barra(percentual, cor) {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)));
  return `<span class="dash-materia-barra"><i style="width:${pct}%${cor ? `;background:${cor}` : ''}"></i></span>`;
}

/* -------------------------------- Aluno -------------------------------- */

function cartaoMateriaAluno(m) {
  const media = m.media === null || m.media === undefined ? null : Number(m.media);
  const total = Number(m.total_trabalhos || 0);
  const entregues = Number(m.entregues || 0);
  const pct = media !== null ? Math.min(100, media * 10) : total ? (entregues / total) * 100 : 0;
  const tema = corDaMateria(m.materia);
  const meta =
    media !== null
      ? `Média: ${media.toFixed(1).replace('.', ',')}`
      : total
        ? `${entregues}/${total} entregues`
        : 'Sem atividades';
  return `<a class="dash-materia" href="/aluno/materia/${m.vinculo_id}" style="--mat-cor:${tema.cor};--mat-fundo:${tema.fundo}">
    <span class="dash-materia-icone">${iconeMateria(m.materia)}</span>
    <span class="dash-materia-nome">${esc(m.materia)}</span>
    <span class="dash-materia-meta">${meta}</span>
    ${barra(pct)}
  </a>`;
}

/** Painel inicial do aluno. */
function paginaInicioAluno({ usuario, materias, atividades, eventos, aba = 'todas', busca = '', ano, mes }) {
  const agora = new Date();
  const anoCal = Number.isInteger(ano) ? ano : agora.getFullYear();
  const mesCal = Number.isInteger(mes) ? mes : agora.getMonth();
  const q = String(busca || '').trim();
  const contagens = contagensTarefas(filtrarBusca(atividades, q, ['titulo', 'materia']));
  const materiasVisiveis = filtrarBusca(materias, q, ['materia', 'professor']);

  const filtros = ABAS_ALUNO.map(([chave, rotulo]) => {
    const params = new URLSearchParams();
    if (chave !== 'todas') params.set('aba', chave);
    if (q) params.set('q', q);
    const href = `${params.toString() ? `?${params.toString()}` : ''}#tarefas`;
    return `<a class="dash-filtro ${aba === chave ? 'ativa' : ''}" href="${href}" role="tab" aria-selected="${aba === chave}"${aba === chave ? ' aria-current="page"' : ''}>
      ${rotulo}<span>${contagens[chave] || 0}</span>
    </a>`;
  }).join('');

  return `
  <div class="ini-app dash-app">
    ${cabecalho({ usuario, subtitulo: 'Continue estudando, você consegue!', agora })}

    ${
      q
        ? `<p class="dash-busca-aviso">Resultados para <strong>“${esc(q)}”</strong> · <a href="/aluno">limpar busca</a></p>`
        : ''
    }

    ${plannerSemana(eventos, '/aluno')}

    <div class="dash-grade">
      <div class="dash-col">
        <section class="dash-card" id="tarefas">
          <header class="dash-card-topo">
            <div class="dash-card-titulo">
              <span class="dash-icone dash-icone--roxo">${ICO.tarefa}</span>
              <h2>Minhas Tarefas</h2>
            </div>
            <a class="dash-ver" href="?aba=todas#tarefas">Ver todas ${ICO.seta}</a>
          </header>
          <nav class="dash-filtros" role="tablist" aria-label="Filtrar tarefas">${filtros}</nav>
          <ul class="dash-tarefas">${listaTarefasAluno(atividades, aba, q)}</ul>
        </section>

        <section class="dash-card" id="materias">
          <header class="dash-card-topo">
            <div class="dash-card-titulo">
              <span class="dash-icone dash-icone--roxo">${ICO.livro}</span>
              <h2>Minhas Matérias</h2>
            </div>
            <span class="dash-contagem">${materiasVisiveis.length} matéria${materiasVisiveis.length === 1 ? '' : 's'}</span>
          </header>
          <div class="dash-materias">${
            materiasVisiveis.length
              ? materiasVisiveis.map(cartaoMateriaAluno).join('')
              : `<p class="dash-vazio">${ICO.livro}<span>${
                  q ? 'Nenhuma matéria encontrada para esta busca.' : 'Sua turma ainda não tem matérias cadastradas.'
                }</span></p>`
          }</div>
        </section>
      </div>

      <aside class="dash-col dash-col-lateral">
        ${miniCalendario({ eventos, base: '/aluno', ano: anoCal, mes: mesCal, busca: q })}
        ${cartaoFoco()}
        ${proximasTarefas(eventos, '/aluno', 'aluno', q)}
      </aside>
    </div>
  </div>`;
}

/* ------------------------------ Professor ------------------------------ */

function listaCorrecoes(entregas) {
  if (!entregas.length) {
    return `<li class="dash-vazio">${ICO.check}<span>Nenhuma entrega aguardando correção. Tudo em dia!</span></li>`;
  }
  return entregas
    .map((e) => {
      const cor = corDe(e.aluno || '').claro;
      return `<li class="dash-tarefa dash-tarefa--${e.atrasada ? 'atrasada' : 'entregue'}">
        <span class="dash-tarefa-barra" aria-hidden="true"></span>
        <span class="dash-avatar" style="background:${cor}">${esc(iniciais(e.aluno))}</span>
        <div class="dash-tarefa-corpo">
          <a class="dash-tarefa-titulo" href="/professor/atividade/${e.atividade_id}">${esc(e.titulo)}</a>
          <span class="dash-tarefa-meta">${esc(e.aluno)} · ${esc(e.materia)} (${esc(e.turma)}) · ${decorrido(e.enviado_em)}</span>
        </div>
        <span class="dash-status dash-status--${e.atrasada ? 'atrasada' : 'entregue'}">${
          e.atrasada ? ICO.alert + 'Fora do prazo' : ICO.send + 'Nova'
        }</span>
      </li>`;
    })
    .join('');
}

function cartaoMateriaProfessor(m) {
  const pendentes = Number(m.pendentes || 0);
  const totalEntregas = Number(m.entregas || 0);
  const corrigidas = Math.max(0, totalEntregas - pendentes);
  const pct = totalEntregas ? (corrigidas / totalEntregas) * 100 : 0;
  const tema = corDaMateria(m.materia);
  return `<a class="dash-materia" href="/professor/materia/${m.vinculo_id}" style="--mat-cor:${tema.cor};--mat-fundo:${tema.fundo}">
    <span class="dash-materia-icone">${iconeMateria(m.materia)}</span>
    <span class="dash-materia-nome">${esc(m.materia)}</span>
    <span class="dash-materia-meta">${esc(m.turma)} · ${
      totalEntregas ? `${corrigidas}/${totalEntregas} corrigidas` : 'Sem entregas'
    }</span>
    ${barra(pct)}
    <span class="dash-materia-badge">${pendentes ? `${pendentes} a corrigir` : 'Em dia'}</span>
  </a>`;
}

/** Painel inicial do professor. */
function paginaInicioProfessor({ usuario, materias, entregas, eventos, busca = '', ano, mes }) {
  const agora = new Date();
  const anoCal = Number.isInteger(ano) ? ano : agora.getFullYear();
  const mesCal = Number.isInteger(mes) ? mes : agora.getMonth();
  const q = String(busca || '').trim();
  const pendentes = materias.reduce((soma, m) => soma + Number(m.pendentes || 0), 0);
  const materiasVisiveis = filtrarBusca(materias, q, ['materia', 'turma']);
  const entregasVisiveis = filtrarBusca(entregas, q, ['titulo', 'materia', 'aluno', 'turma']);

  return `
  <div class="ini-app dash-app">
    ${cabecalho({
      usuario,
      subtitulo: pendentes
        ? `Você tem ${pendentes} entrega${pendentes > 1 ? 's' : ''} esperando correção.`
        : 'Acompanhe suas turmas e mantenha as correções em dia.',
      agora,
    })}

    ${
      q
        ? `<p class="dash-busca-aviso">Resultados para <strong>“${esc(q)}”</strong> · <a href="/professor">limpar busca</a></p>`
        : ''
    }

    ${plannerSemana(eventos, '/professor')}

    <div class="dash-grade">
      <div class="dash-col">
        <section class="dash-card" id="correcoes">
          <header class="dash-card-topo">
            <div class="dash-card-titulo">
              <span class="dash-icone dash-icone--roxo">${ICO.tarefa}</span>
              <h2>Entregas para corrigir</h2>
            </div>
            <span class="dash-contagem">${pendentes} pendente${pendentes === 1 ? '' : 's'}</span>
          </header>
          <ul class="dash-tarefas">${listaCorrecoes(entregasVisiveis)}</ul>
        </section>

        <section class="dash-card" id="materias">
          <header class="dash-card-topo">
            <div class="dash-card-titulo">
              <span class="dash-icone dash-icone--roxo">${ICO.livro}</span>
              <h2>Minhas Matérias</h2>
            </div>
            <span class="dash-contagem">${materiasVisiveis.length} vínculo${materiasVisiveis.length === 1 ? '' : 's'}</span>
          </header>
          <div class="dash-materias">${
            materiasVisiveis.length
              ? materiasVisiveis.map(cartaoMateriaProfessor).join('')
              : `<p class="dash-vazio">${ICO.livro}<span>${
                  q ? 'Nenhuma matéria encontrada para esta busca.' : 'Nenhuma matéria atribuída a você.'
                }</span></p>`
          }</div>
        </section>
      </div>

      <aside class="dash-col dash-col-lateral">
        ${miniCalendario({ eventos, base: '/professor', ano: anoCal, mes: mesCal, busca: q })}
        ${cartaoFoco()}
        ${proximasTarefas(eventos, '/professor', 'professor', q)}
      </aside>
    </div>
  </div>`;
}

/* ----------------------------- Notificações ----------------------------- */

function notificacoesAluno(atividades) {
  const itens = [];
  atividades.forEach((a) => {
    const st = statusAtividade(a);
    const href = linkTarefa(a, 'aluno');
    if (st === 'atrasada') {
      itens.push({
        tipo: 'atrasada',
        titulo: 'Atividade atrasada',
        texto: `${a.titulo} · ${a.materia || 'Sem matéria'}`,
        quando: a.prazo,
        href,
      });
    } else if (st === 'pendente' && a.prazo) {
      itens.push({
        tipo: 'pendente',
        titulo: 'Prazo se aproximando',
        texto: `${a.titulo} · ${a.materia || 'Sem matéria'}`,
        quando: a.prazo,
        href,
      });
    } else if (st === 'entregue') {
      itens.push({
        tipo: 'entregue',
        titulo: 'Entrega enviada',
        texto: `${a.titulo} · aguardando correção`,
        quando: a.enviado_em,
        href,
      });
    } else if (st === 'corrigida') {
      itens.push({
        tipo: 'corrigida',
        titulo: 'Atividade corrigida',
        texto: `${a.titulo}${a.nota !== null && a.nota !== undefined ? ` · Nota ${a.nota}` : ''}`,
        quando: a.enviado_em,
        href,
      });
    }
  });
  return itens;
}

function notificacoesProfessor(entregas) {
  return entregas.map((e) => ({
    tipo: e.atrasada ? 'atrasada' : 'entregue',
    titulo: e.atrasada ? 'Entrega fora do prazo' : 'Nova entrega recebida',
    texto: `${e.aluno} · ${e.titulo} · ${e.materia} (${e.turma})`,
    quando: e.enviado_em,
    href: `/professor/atividade/${e.atividade_id}`,
  }));
}

function paginaNotificacoes({ usuario, atividades = [], entregas = [], perfil = 'aluno' }) {
  const itens = (perfil === 'professor' ? notificacoesProfessor(entregas) : notificacoesAluno(atividades))
    .sort((a, b) => new Date(b.quando || 0) - new Date(a.quando || 0))
    .slice(0, 30);

  return `
  <div class="dash-app dash-notificacoes-pagina">
    <div class="dash-titulo-pagina">
      <h1>Notificações</h1>
      <p>Avisos sobre prazos, entregas e correções da sua conta.</p>
    </div>

    <section class="dash-card">
      <ul class="dash-notif-lista">${
        itens.length
          ? itens
              .map(
                (item) => `<li class="dash-notif dash-notif--${item.tipo}">
                  <span class="dash-notif-icone">${STATUS_INFO[item.tipo] ? STATUS_INFO[item.tipo].icone : ICO.clock}</span>
                  <div class="dash-notif-corpo">
                    <a href="${item.href}">${esc(item.titulo)}</a>
                    <span>${esc(item.texto)}</span>
                  </div>
                  <small>${item.quando ? dataHoraBR(item.quando) : ''}</small>
                </li>`
              )
              .join('')
          : `<li class="dash-vazio">${ICO.notificacoes || ICO.lista}<span>Nenhuma notificação por aqui.</span></li>`
      }</ul>
    </section>
  </div>`;
}

module.exports = { paginaInicioAluno, paginaInicioProfessor, paginaNotificacoes };
