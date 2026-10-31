/** Página "Calendário do mês": grade mensal, próximas tarefas, progresso e legenda. */
const { esc, dataBR, corDe } = require('../util');
const { ilustracaoCalendario, patinha } = require('./ilustracoes');

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
    : `<span class="cal-proxima-titulo">${esc(ev.titulo)}</span>`;
  return `
  <li class="cal-proxima">
    <i class="ponto ${t.classe}"></i>
    <div class="cal-proxima-corpo">
      ${titulo}
      <small>${esc(ev.materia || '')} · ${d.getDate()} ${MESES_CURTO[d.getMonth()]}${ev.prazo ? ' · ' + horaDe(ev.prazo) : ''}</small>
    </div>
  </li>`;
}

/** Formulário do professor para marcar prova/evento no mês. */
function formEvento(materias) {
  const opcoesTipo = Object.entries(TIPOS)
    .filter(([, v]) => v.classe !== 'entrega') // "Entrega" é criada na matéria
    .map(([id, v]) => `<option value="${id}">${v.icone} ${v.rotulo}</option>`)
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
        <input type="text" id="cal-titulo" name="titulo" placeholder=" " maxlength="160" required>
        <label for="cal-titulo">Título (ex.: Prova de Matemática — 1º bimestre)</label>
      </div>
      <div class="campo">
        <textarea id="cal-descricao" name="descricao" placeholder=" " rows="2" maxlength="2000"></textarea>
        <label for="cal-descricao">Conteúdo / observações (opcional)</label>
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
  <header class="cal-mes-cabecalho">
    <div class="cal-mes-titulo">
      <span class="cal-mes-icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zm0-12H5V6h14z"/></svg>
      </span>
      <div>
        <h1>Calendário</h1>
        <p>Organize seus estudos e não perca nenhum prazo!</p>
      </div>
    </div>
    <div class="cal-mes-acoes">
      <a class="cal-mes-nav" href="${linkAnterior}" aria-label="Mês anterior">‹</a>
      <span class="cal-mes-nome">${MESES[mes]} ${ano}</span>
      <a class="cal-mes-nav" href="${linkProximo}" aria-label="Próximo mês">›</a>
      ${professor ? formEvento(materias) : ''}
      <span class="cal-mes-estrela" aria-hidden="true">☆</span>
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
        <span class="cal-proximas-estrela" aria-hidden="true">☆</span>
      </header>
      <ul class="cal-proximas-lista">
        ${
          proximas.length
            ? proximas.map((ev) => proximaTarefa(ev, professor)).join('')
            : '<li class="cal-proximas-vazio">Nada marcado por aqui ainda 🌱</li>'
        }
      </ul>
      <a class="cal-ver-todas" href="#lista-eventos">Ver todas as tarefas →</a>
    </section>

    <section class="cal-motivacional">
      <p>Pequenos passos<br>também são grandes<br>conquistas!</p>
      ${patinha()}
    </section>

    <div class="cal-ilustracoes">
      ${ilustracaoCalendario()}
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
          <li class="cal-lista-item">
            <i class="ponto ${t.classe}"></i>
            <div class="cal-lista-corpo">
              ${titulo}
              <small>${esc(ev.materia || '')} · ${dataBR(ev.prazo)} ${horaDe(ev.prazo) ? 'às ' + horaDe(ev.prazo) : ''}</small>
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
            : 'Quando o professor publicar trabalhos ou marcar provas, eles aparecem aqui.'
        }</p></div>`;

  return `
  <div class="cal-mes-layout">
    <section class="cal-mes-cartao">
      ${cabecalho}
      ${gradeMes({ ano, mes, porDia, professor })}
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
  </section>`;
}

module.exports = { paginaCalendario, chaveDia, MESES, TIPOS };
