/** Páginas do aluno: grade de matérias e trabalhos da matéria (com abas). */
const { esc, dataBR, dataHoraBR, decorrido, corDe, tamanhoLegivel } = require('../util');
const { classificar, abasDe, ROTULOS_ABA } = require('../regras');

function avatarProfessor(nome) {
  if (!nome) return `<span class="avatar pequeno"><span style="background:#9aa0a6">?</span></span>`;
  const cor = corDe(nome).claro;
  const partes = nome.trim().split(/\s+/);
  const ini = (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  return `<span class="avatar pequeno"><span style="background:${cor}">${esc(ini)}</span></span>`;
}

/** Grade de cards das matérias da turma do aluno. */
function gradeMaterias({ usuario, materias }) {
  const cards = materias
    .map((m) => {
      const cor = corDe(m.materia).claro;
      const total = Number(m.total || 0);
      const aguardando = Number(m.aguardando || 0);
      const linha =
        total === 0
          ? '<small>Nenhum trabalho publicado</small>'
          : `<small>${total} trabalho${total > 1 ? 's' : ''}</small>${
              aguardando ? `<small class="ponto">·</small><small class="destaque">${aguardando} aguardando correção</small>` : ''
            }`;
      return `
      <a class="card-materia" href="/aluno/materia/${m.vinculo_id}">
        <div class="card-faixa" style="background:${cor}">
          <span class="card-nome">${esc(m.materia)}</span>
        </div>
        <div class="card-corpo">
          ${avatarProfessor(m.professor)}
          <div class="card-textos">
            <span class="card-professor">${esc(m.professor || 'Professor não definido')}</span>
            <span class="card-info">${linha}</span>
          </div>
        </div>
      </a>`;
    })
    .join('');

  return `
  <div class="cabecalho-secao">
    <div>
      <h1>Minhas matérias</h1>
      <p class="descricao">${esc(usuario.turma_nome || 'Turma não definida')} · Ano letivo ${new Date().getFullYear()}</p>
    </div>
  </div>
  ${
    materias.length
      ? `<div class="grade-materias">${cards}</div>`
      : `<div class="vazio">
           <div class="vazio-icone">📚</div>
           <h3>Nenhuma matéria encontrada</h3>
           <p>Fale com a secretaria: sua turma ainda não tem matérias cadastradas.</p>
         </div>`
  }`;
}

function chipStatus(s) {
  if (s.corrigido) return `<span class="chip corrigido">Corrigido</span>`;
  if (s.atrasado && s.temEntrega) return `<span class="chip atrasado">Entregue fora do prazo</span>`;
  if (s.atrasado && !s.temEntrega) return `<span class="chip atrasado">Atrasado</span>`;
  if (s.aguardando) return `<span class="chip aguardando">Não corrigido</span>`;
  return `<span class="chip pendente">Ainda não entregue</span>`;
}

function blocoEntrega(a, s) {
  if (!s.temEntrega) return '';
  if (s.corrigido) {
    return `
    <div class="resultado">
      <div class="nota"><span class="nota-valor">${esc(String(a.nota))}</span><span class="nota-rotulo">nota</span></div>
      <div class="observacao">
        <strong>Observação do professor</strong>
        <p>${esc(a.observacao || 'Sem observações.')}</p>
        <small>Corrigido em ${dataHoraBR(a.corrigido_em)}</small>
      </div>
    </div>`;
  }
  return `
  <div class="entregue-em">
    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
    <span>Entregue <strong>${decorrido(a.enviado_em)}</strong> (${dataHoraBR(a.enviado_em)})</span>
    <span class="arquivo-enviado">${esc(a.arquivo_nome || '')} · ${tamanhoLegivel(a.arquivo_tamanho)}</span>
  </div>`;
}

function blocoAcoes(a, s, vinculoId) {
  const temNota = s.corrigido;
  if (temNota) {
    return `<div class="acoes-atividade">
      <a class="btn secundario" href="/arquivos/entrega/${a.entrega_id}">Baixar meu arquivo</a>
    </div>`;
  }
  const fora = s.foraDoPrazo;
  const rotulo = s.temEntrega ? 'Reenviar arquivo' : fora ? 'Entregar atrasado' : 'Entregar trabalho';
  return `
  <form class="form-entrega" method="post" action="/aluno/entregar/${a.id}" enctype="multipart/form-data"
        data-limite="15728640">
    <label class="seletor-arquivo">
      <input type="file" name="arquivo" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt" required>
      <span class="btn ${s.temEntrega ? 'secundario' : 'primario'}">${rotulo}</span>
      <span class="nome-arquivo"></span>
    </label>
    <button class="btn primario ocultar" type="submit">Enviar</button>
  </form>`;
}

function blocoPrazo(a, s) {
  if (!a.prazo) return `<span class="prazo neutro">Sem prazo definido</span>`;
  if (s.vencido) {
    return `<span class="prazo ${s.atrasado ? 'vencido' : 'ok'}">Prazo: ${dataHoraBR(a.prazo)}</span>`;
  }
  return `<span class="prazo">Entregar até ${dataHoraBR(a.prazo)}</span>`;
}

function listaAtividades(atividades, aba) {
  const visiveis = atividades.filter((a) => abasDe(a).abas.includes(aba));
  if (!visiveis.length) {
    const textos = {
      todos: ['Nenhum trabalho por aqui', 'Assim que o professor publicar uma atividade, ela aparece nesta lista.'],
      'nao-corrigidos': ['Nada aguardando correção', 'Quando você entregar um trabalho, ele fica aqui até o professor corrigir.'],
      corrigidos: ['Nenhum trabalho corrigido', 'As notas e observações dos professores aparecerão aqui.'],
      atrasados: ['Nada atrasado 🎉', 'Você está em dia com todos os prazos.'],
    };
    const [titulo, texto] = textos[aba] || textos.todos;
    return `<div class="vazio">
      <div class="vazio-icone">${aba === 'atrasados' ? '🎉' : '📋'}</div>
      <h3>${titulo}</h3><p>${texto}</p>
    </div>`;
  }
  return visiveis
    .map((a) => {
      const { s } = abasDe(a);
      const cor = corDe(a.materia || '').claro;
      return `
      <article class="atividade">
        <div class="atividade-icone" style="background:${cor}">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4zM8 13h8v2H8zm0 4h5v2H8z"/></svg>
        </div>
        <div class="atividade-corpo">
          <div class="atividade-topo">
            <div>
              <h3>${esc(a.titulo)}</h3>
              <p class="atividade-professor">${avatarProfessor(a.professor)} ${esc(a.professor || 'Professor não definido')}</p>
            </div>
            ${chipStatus(s)}
          </div>
          ${a.descricao ? `<p class="atividade-descricao">${esc(a.descricao)}</p>` : ''}
          <div class="atividade-meta">${blocoPrazo(a, s)}${s.atrasado && !s.temEntrega ? '<span class="chip atrasado">Não entregue</span>' : ''}</div>
          ${blocoEntrega(a, s)}
          <div class="atividade-rodape">
            ${blocoAcoes(a, s)}
            <a class="link-suave" href="/aluno/trabalho/${a.id}">Ver detalhes</a>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

function abas(aba, contagens) {
  return `
  <nav class="abas" role="tablist">
    ${Object.keys(ROTULOS_ABA)
      .map(
        (chave) => `
      <a class="aba ${aba === chave ? 'ativa' : ''}" role="tab" aria-selected="${aba === chave}"
         href="?aba=${chave}">
        ${ROTULOS_ABA[chave]}<span class="aba-contagem">${contagens[chave] || 0}</span>
      </a>`
      )
      .join('')}
  </nav>`;
}

/** Página da matéria (cabeçalho colorido + abas + lista). */
function paginaMateria({ usuario, materia, atividades, aba }) {
  const cor = corDe(materia.materia).claro;
  const contagens = { todos: 0, 'nao-corrigidos': 0, corrigidos: 0, atrasados: 0 };
  atividades.forEach((a) => {
    abasDe(a).abas.forEach((x) => contagens[x]++);
  });

  return `
  <header class="faixa-materia" style="background:${cor}">
    <div class="faixa-conteudo">
      <div>
        <h1>${esc(materia.materia)}</h1>
        <p>${esc(materia.turma)} · ${esc(materia.professor || 'Professor não definido')}</p>
      </div>
      <span class="faixa-avatar">${avatarProfessor(materia.professor)}</span>
    </div>
  </header>
  <div class="painel">
    <div class="painel-topo">
      <h2>Trabalhos</h2>
      <a class="btn text" href="/aluno">← Voltar às matérias</a>
    </div>
    ${abas(aba, contagens)}
    <div class="lista-atividades">${listaAtividades(atividades, aba)}</div>
  </div>`;
}

/** Detalhe de um trabalho (histórico completo do aluno). */
function paginaTrabalho({ usuario, a }) {
  const { s } = abasDe(a);
  const cor = corDe(a.materia || '').claro;
  return `
  <div class="painel">
    <div class="painel-topo">
      <a class="btn text" href="/aluno/materia/${a.vinculo_id}?aba=todos">← Voltar aos trabalhos</a>
    </div>
    <article class="atividade detalhe" style="--cor-fundo:${cor}">
      <div class="atividade-icone" style="background:${cor}">
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4zM8 13h8v2H8zm0 4h5v2H8z"/></svg>
      </div>
      <div class="atividade-corpo">
        <div class="atividade-topo">
          <div>
            <span class="rotulo-materia">${esc(a.materia)} · ${esc(a.turma)}</span>
            <h1>${esc(a.titulo)}</h1>
            <p class="atividade-professor">${avatarProfessor(a.professor)} ${esc(a.professor || '')}</p>
          </div>
          ${chipStatus(s)}
        </div>
        ${a.descricao ? `<p class="atividade-descricao">${esc(a.descricao)}</p>` : ''}
        <div class="atividade-meta">
          ${blocoPrazo(a, s)}
          <span class="prazo neutro">Publicado em ${dataBR(a.criado_em)}</span>
        </div>
        ${blocoEntrega(a, s)}
        <div class="atividade-rodape">${blocoAcoes(a, s)}</div>
      </div>
    </article>
  </div>`;
}

module.exports = { gradeMaterias, paginaMateria, paginaTrabalho };
