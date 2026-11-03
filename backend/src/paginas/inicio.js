/** Página inicial (painel) do aluno e do professor. */
const { esc, dataBR, dataHoraBR, decorrido, corDe, iniciais } = require('../util');
const { classificar } = require('../regras');
const { TIPOS, chaveDia } = require('./calendario');
const { decoracao } = require('./decoracoes');

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

/** "Sexta-feira, 30 de outubro". */
function dataLonga(d) {
  const dia = DIAS_LONGO[d.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}

/** Primeiro nome para a saudação. */
function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

/** Cartão de número no cabeçalho. */
function statCard(valor, rotulo, destaque = false) {
  return `<div class="ini-resumo-item${destaque ? ' destaque' : ''}">
    <strong>${valor}</strong><span>${rotulo}</span>
  </div>`;
}

/** Barra de progresso simples. */
function barra(percentual, cor) {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)));
  return `<div class="ini-barra"><i style="width:${pct}%${cor ? `;background:${cor}` : ''}"></i></div>`;
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

/** Mini-calendário do mês atual, com bolinhas por tipo de atividade. */
function miniCalendario({ eventos, base, ano, mes }) {
  const porDia = eventosDoMes(eventos, ano, mes);
  const primeiro = new Date(ano, mes, 1);
  const offset = primeiro.getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hojeChave = chaveDia(new Date());

  const anterior = new Date(ano, mes - 1, 1);
  const proximo = new Date(ano, mes + 1, 1);
  const link = (d) => `${base}?ano=${d.getFullYear()}&mes=${d.getMonth() + 1}`;

  let celulas = '';
  for (let i = 0; i < offset; i++) celulas += '<div class="ini-cal-dia fora"></div>';
  for (let d = 1; d <= diasNoMes; d++) {
    const chave = chaveDia(new Date(ano, mes, d));
    const doDia = porDia[chave] || [];
    const pontos = doDia
      .slice(0, 3)
      .map((ev) => `<i class="ponto ${(TIPOS[ev.tipo] || TIPOS.trabalho).classe}"></i>`)
      .join('');
    celulas += `<div class="ini-cal-dia ${chave === hojeChave ? 'hoje' : ''} ${doDia.length ? 'tem' : ''}"${
      doDia.length ? ` title="${doDia.length} atividade${doDia.length > 1 ? 's' : ''}"` : ''
    }><span>${d}</span>${pontos ? `<span class="ini-cal-pontos">${pontos}</span>` : ''}</div>`;
  }
  const total = offset + diasNoMes;
  const restante = (7 - (total % 7)) % 7;
  for (let i = 0; i < restante; i++) celulas += '<div class="ini-cal-dia fora"></div>';

  return `
  <section class="ini-painel ini-cal-painel">
    <header class="ini-cal-topo">
      <h2>${MESES[mes]} ${ano}</h2>
      <div class="ini-cal-nav">
        <a href="${link(anterior)}" aria-label="Mês anterior">‹</a>
        <a href="${link(proximo)}" aria-label="Próximo mês">›</a>
      </div>
    </header>
    <div class="ini-cal">
      ${DIAS_CURTO.map((d) => `<span class="ini-cal-semana">${d}</span>`).join('')}
      ${celulas}
    </div>
    <a class="ini-cal-ver" href="${base}">Ver calendário do mês →</a>
  </section>`;
}

/** Lista "Próximas" (coluna direita). */
function proximasTarefas(eventos, base) {
  const agora = Date.now();
  const proximas = eventos
    .filter((ev) => ev.prazo && new Date(ev.prazo).getTime() >= agora)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 4);

  const itens = proximas.length
    ? proximas
        .map((ev) => {
          const t = TIPOS[ev.tipo] || TIPOS.trabalho;
          const d = new Date(ev.prazo);
          return `<li class="ini-proxima">
            <i class="ponto ${t.classe}"></i>
            <div class="ini-proxima-corpo">
              <span>${esc(ev.titulo)}</span>
              <small>${esc(ev.materia || '')} · ${d.getDate()} ${MESES_CURTO[d.getMonth()]}${
                ev.prazo ? ' · ' + dataHoraBR(ev.prazo).slice(11) : ''
              }</small>
            </div>
          </li>`;
        })
        .join('')
    : '<li class="ini-vazio-lista">Nada marcado por aqui ainda.</li>';

  return `
  <section class="ini-painel ini-proximas-painel">
    <header class="ini-painel-topo"><h2>Próximas tarefas</h2></header>
    <ul class="ini-proximas">${itens}</ul>
    <a class="ini-cal-ver" href="${base}">Ver todas →</a>
  </section>`;
}

/** Cartão ilustrado da lateral. */
function cartaoDica() {
  return `
  <section class="ini-painel ini-dica">
    ${decoracao('moon', { pasta: 'celestial', tamanho: 44, classe: 'deco--lua' })}
    ${decoracao('sparkle-purple', { pasta: 'celestial', tamanho: 24, classe: 'deco--estrela' })}
    ${decoracao('cat-sleeping', {
      pasta: 'cats',
      tamanho: 200,
      alt: 'Gatinho dormindo em uma almofada rosa',
    })}
    <p>Um passo de cada vez. Organize a semana e deixe espaço para descansar.</p>
  </section>`;
}

/* -------------------------------- Aluno -------------------------------- */

const ABAS_ALUNO = [
  ['todas', 'Todas'],
  ['afazer', 'A fazer'],
  ['entregues', 'Entregues'],
  ['corrigidas', 'Corrigidas'],
];

function ehTrabalho(a) {
  return (a.tipo || 'trabalho') === 'trabalho';
}

/** Filtra as atividades do aluno conforme a aba. */
function filtrarTarefas(atividades, aba) {
  return atividades.filter((a) => {
    if (aba === 'todas') return true;
    if (!ehTrabalho(a)) return false;
    const s = classificar(a);
    if (aba === 'afazer') return !s.temEntrega;
    if (aba === 'entregues') return s.temEntrega && !s.corrigido;
    if (aba === 'corrigidas') return s.corrigido;
    return true;
  });
}

function contagensTarefas(atividades) {
  const c = { todas: atividades.length, afazer: 0, entregues: 0, corrigidas: 0 };
  atividades.forEach((a) => {
    if (!ehTrabalho(a)) return;
    const s = classificar(a);
    if (!s.temEntrega) c.afazer++;
    else if (s.corrigido) c.corrigidas++;
    else c.entregues++;
  });
  return c;
}

/** Selo de status de uma atividade do aluno. */
function seloAluno(a) {
  if (!ehTrabalho(a)) {
    const t = TIPOS[a.tipo] || TIPOS.trabalho;
    return `<span class="chip ${t.classe}">${t.rotulo}</span>`;
  }
  const s = classificar(a);
  if (s.corrigido) return '<span class="chip corrigido">Corrigido</span>';
  if (s.temEntrega) return '<span class="chip aguardando">Entregue</span>';
  if (s.atrasado) return '<span class="chip atrasado">Atrasado</span>';
  return '<span class="chip pendente">A fazer</span>';
}

function listaTarefasAluno(atividades, aba) {
  const visiveis = filtrarTarefas(atividades, aba);
  if (!visiveis.length) {
    return `<li class="ini-vazio-lista">${
      aba === 'todas' ? 'Nenhuma atividade publicada ainda.' : 'Nada nesta aba por enquanto.'
    }</li>`;
  }
  return visiveis
    .slice(0, 8)
    .map((a) => {
      const cor = corDe(a.materia || '').claro;
      const href = ehTrabalho(a) ? `/aluno/trabalho/${a.id}` : '/aluno/calendario';
      return `<li class="ini-tarefa">
        <span class="ini-tarefa-cor" style="background:${cor}"></span>
        <div class="ini-tarefa-corpo">
          <a href="${href}">${esc(a.titulo)}</a>
          <small>${esc(a.materia || '')} · ${
            a.prazo ? dataHoraBR(a.prazo) : 'Sem data marcada'
          }</small>
        </div>
        ${seloAluno(a)}
      </li>`;
    })
    .join('');
}

/** Linha de matéria com progresso de entregas do aluno. */
function linhaMateriaAluno(m) {
  const cor = corDe(m.materia).claro;
  const total = Number(m.total_trabalhos || 0);
  const entregues = Number(m.entregues || 0);
  const pct = total ? (entregues / total) * 100 : 0;
  return `<li class="ini-materia">
    <span class="ini-materia-icone" style="background:${cor}">${esc(iniciais(m.materia))}</span>
    <div class="ini-materia-info">
      <a href="/aluno/materia/${m.vinculo_id}">${esc(m.materia)}</a>
      <small>${esc(m.professor || 'Professor não definido')} · ${
        total ? `${entregues} de ${total} trabalho${total > 1 ? 's' : ''} entregue${entregues === 1 ? '' : 's'}` : 'Nenhum trabalho publicado'
      }</small>
      ${barra(pct, cor)}
    </div>
    <span class="ini-materia-pct">${Math.round(pct)}%</span>
  </li>`;
}

/** Painel inicial do aluno. */
function paginaInicioAluno({ usuario, materias, atividades, eventos, aba = 'todas' }) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const contagens = contagensTarefas(atividades);

  const abas = ABAS_ALUNO.map(
    ([chave, rotulo]) => `<a class="aba ${aba === chave ? 'ativa' : ''}" href="?aba=${chave}#tarefas" role="tab">
      ${rotulo}<span class="aba-contagem">${contagens[chave] || 0}</span>
    </a>`
  ).join('');

  return `
  <div class="ini-app">
  <header class="ini-cabecalho">
    <div class="ini-saudacao">
      <span class="ini-selo">meu cantinho de estudos</span>
      <p class="ini-data">${dataLonga(agora)}</p>
      <div class="ini-saudacao-topo">
        <h1>${saudacao()}, ${esc(primeiroNome(usuario.nome))}!</h1>
        ${decoracao('cat-face', { pasta: 'cats', tamanho: 42 })}
      </div>
      <p class="descricao">${
        esc(usuario.turma_nome || 'Sem turma definida')
      } · ${contagens.afazer ? `${contagens.afazer} tarefa${contagens.afazer > 1 ? 's' : ''} para fazer` : 'Tudo em dia por aqui'}</p>
    </div>
    ${decoracao('sparkle-peach', {
      pasta: 'celestial',
      tamanho: 30,
      top: '4px',
      right: '356px',
      opacidade: 0.7,
      ocultarEm: 'tablet',
    })}
    ${decoracao('heart-pink', {
      pasta: 'celestial',
      tamanho: 22,
      top: '42px',
      right: '390px',
      opacidade: 0.65,
      ocultarEm: 'tablet',
    })}
    <div class="ini-resumo">
      ${statCard(contagens.afazer, 'a fazer', contagens.afazer > 0)}
      ${statCard(contagens.entregues, 'aguardando correção')}
      ${statCard(contagens.corrigidas, 'corrigidas')}
    </div>
  </header>

  <div class="ini-grade">
    <div class="ini-principal">
      <section class="ini-painel" id="tarefas">
        <header class="ini-painel-topo">
          <h2>Minhas tarefas</h2>
          <a class="ini-link-suave" href="/aluno/calendario">Calendário do mês</a>
        </header>
        <nav class="abas" role="tablist">${abas}</nav>
        <ul class="ini-tarefas">${listaTarefasAluno(atividades, aba)}</ul>
      </section>

      <section class="ini-painel" id="materias">
        <header class="ini-painel-topo">
          <h2>Minhas matérias</h2>
          <span class="descricao">${materias.length} matéria${materias.length === 1 ? '' : 's'}</span>
        </header>
        <ul class="ini-materias">${
          materias.length
            ? materias.map(linhaMateriaAluno).join('')
            : '<li class="ini-vazio-lista">Sua turma ainda não tem matérias cadastradas.</li>'
        }</ul>
      </section>
    </div>

    <aside class="ini-lateral">
      ${miniCalendario({ eventos, base: '/aluno/calendario', ano, mes })}
      ${proximasTarefas(eventos, '/aluno/calendario')}
      ${cartaoDica()}
    </aside>
  </div>
  </div>`;
}

/* ------------------------------ Professor ------------------------------ */

/** Linha de matéria com progresso de correções do professor. */
function linhaMateriaProfessor(m) {
  const cor = corDe(m.materia).claro;
  const pendentes = Number(m.pendentes || 0);
  const totalEntregas = Number(m.entregas || 0);
  const corrigidas = Math.max(0, totalEntregas - pendentes);
  const pct = totalEntregas ? (corrigidas / totalEntregas) * 100 : 0;
  return `<li class="ini-materia">
    <span class="ini-materia-icone" style="background:${cor}" title="${esc(m.turma)}">${esc(codigoTurma(m.turma))}</span>
    <div class="ini-materia-info">
      <a href="/professor/materia/${m.vinculo_id}">${esc(m.materia)} <span class="ini-turma">${esc(m.turma)}</span></a>
      <small>${Number(m.alunos || 0)} aluno${Number(m.alunos || 0) === 1 ? '' : 's'} · ${
        totalEntregas
          ? `${corrigidas} de ${totalEntregas} entrega${totalEntregas > 1 ? 's' : ''} corrigida${corrigidas === 1 ? '' : 's'}`
          : 'Nenhuma entrega recebida'
      }</small>
      ${barra(pct)}
    </div>
    <span class="ini-materia-pct">${pendentes ? `${pendentes} a corrigir` : 'Em dia'}</span>
  </li>`;
}

/** "9º Ano A" → "9A" (usado no selo da matéria do professor). */
function codigoTurma(nome) {
  const numero = (String(nome || '').match(/\d+/) || [''])[0];
  const letra = (String(nome || '').match(/([A-Za-z])\s*$/) || ['', ''])[1];
  return numero && letra ? `${numero}${letra.toUpperCase()}` : iniciais(nome);
}

/** Lista de entregas aguardando correção. */
function listaCorrecoes(entregas) {
  if (!entregas.length) {
    return '<li class="ini-vazio-lista">Nenhuma entrega aguardando correção. Tudo em dia!</li>';
  }
  return entregas
    .map((e) => {
      const cor = corDe(e.materia || '').claro;
      return `<li class="ini-tarefa">
        <span class="ini-avatar" style="background:${cor}">${esc(iniciais(e.aluno))}</span>
        <div class="ini-tarefa-corpo">
          <a href="/professor/atividade/${e.atividade_id}">${esc(e.titulo)}</a>
          <small>${esc(e.aluno)} · ${esc(e.materia)} (${esc(e.turma)}) · ${decorrido(e.enviado_em)}</small>
        </div>
        ${e.atrasada ? '<span class="chip atrasado">Fora do prazo</span>' : '<span class="chip aguardando">Nova</span>'}
      </li>`;
    })
    .join('');
}

/** Painel inicial do professor. */
function paginaInicioProfessor({ usuario, materias, entregas, eventos }) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const pendentes = materias.reduce((soma, m) => soma + Number(m.pendentes || 0), 0);
  const totalEntregas = materias.reduce((soma, m) => soma + Number(m.entregas || 0), 0);
  const totalAtividades = materias.reduce((soma, m) => soma + Number(m.atividades || 0), 0);

  return `
  <div class="ini-app">
  <header class="ini-cabecalho">
    <div class="ini-saudacao">
      <span class="ini-selo">meu cantinho de estudos</span>
      <p class="ini-data">${dataLonga(agora)}</p>
      <div class="ini-saudacao-topo">
        <h1>${saudacao()}, ${esc(primeiroNome(usuario.nome))}!</h1>
        ${decoracao('cat-face', { pasta: 'cats', tamanho: 42 })}
      </div>
      <p class="descricao">${
        pendentes ? `${pendentes} entrega${pendentes > 1 ? 's' : ''} esperando correção` : 'Nenhuma entrega pendente por aqui'
      }</p>
    </div>
    ${decoracao('sparkle-peach', {
      pasta: 'celestial',
      tamanho: 30,
      top: '4px',
      right: '356px',
      opacidade: 0.7,
      ocultarEm: 'tablet',
    })}
    ${decoracao('heart-pink', {
      pasta: 'celestial',
      tamanho: 22,
      top: '42px',
      right: '390px',
      opacidade: 0.65,
      ocultarEm: 'tablet',
    })}
    <div class="ini-resumo">
      ${statCard(pendentes, 'a corrigir', pendentes > 0)}
      ${statCard(materias.length, 'matérias')}
      ${statCard(totalAtividades, 'atividades')}
    </div>
  </header>

  <div class="ini-grade">
    <div class="ini-principal">
      <section class="ini-painel" id="correcoes">
        <header class="ini-painel-topo">
          <h2>Entregas para corrigir</h2>
          <a class="ini-link-suave" href="/professor/calendario">Calendário do mês</a>
        </header>
        <ul class="ini-tarefas">${listaCorrecoes(entregas)}</ul>
      </section>

      <section class="ini-painel" id="materias">
        <header class="ini-painel-topo">
          <h2>Minhas matérias</h2>
          <span class="descricao">${materias.length} vínculo${materias.length === 1 ? '' : 's'} · ${totalEntregas} entrega${totalEntregas === 1 ? '' : 's'}</span>
        </header>
        <ul class="ini-materias">${
          materias.length
            ? materias.map(linhaMateriaProfessor).join('')
            : '<li class="ini-vazio-lista">Nenhuma matéria atribuída a você.</li>'
        }</ul>
      </section>
    </div>

    <aside class="ini-lateral">
      ${miniCalendario({ eventos, base: '/professor/calendario', ano, mes })}
      ${proximasTarefas(eventos, '/professor/calendario')}
      ${cartaoDica()}
    </aside>
  </div>
  </div>`;
}

module.exports = { paginaInicioAluno, paginaInicioProfessor };
