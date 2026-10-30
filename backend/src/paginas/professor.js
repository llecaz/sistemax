/** Páginas do professor: matérias que leciona, atividades e correções. */
const { esc, dataBR, dataHoraBR, decorrido, corDe, tamanhoLegivel, paraInputDataHora } = require('../util');
const { avatar } = require('./layout');

function selo(texto, tipo) {
  return `<span class="chip ${tipo}">${esc(texto)}</span>`;
}

/** Grade de cards das turmas/matérias do professor. */
function gradeProfessor({ usuario, materias }) {
  const cards = materias
    .map((m) => {
      const cor = corDe(m.materia).claro;
      const total = Number(m.atividades || 0);
      const pendentes = Number(m.pendentes || 0);
      return `
      <a class="card-materia" href="/professor/materia/${m.vinculo_id}">
        <div class="card-faixa" style="background:${cor}">
          <span class="card-nome">${esc(m.materia)}</span>
          <span class="card-turma">${esc(m.turma)}</span>
        </div>
        <div class="card-corpo">
          <div class="card-textos">
            <span class="card-professor">${total} atividade${total > 1 ? 's' : ''} publicada${total > 1 ? 's' : ''}</span>
            <span class="card-info">
              ${
                pendentes
                  ? `<small class="destaque">${pendentes} entrega${pendentes > 1 ? 's' : ''} aguardando correção</small>`
                  : '<small>Tudo corrigido por aqui</small>'
              }
            </span>
          </div>
        </div>
      </a>`;
    })
    .join('');

  return `
  <div class="cabecalho-secao">
    <div>
      <h1>Minhas matérias</h1>
      <p class="descricao">Turmas e matérias que você leciona</p>
    </div>
  </div>
  ${
    materias.length
      ? `<div class="grade-materias">${cards}</div>`
      : `<div class="vazio"><div class="vazio-icone">📖</div>
         <h3>Nenhuma matéria atribuída</h3>
         <p>Peça ao administrador para vincular você a uma turma e matéria.</p></div>`
  }`;
}

function blocoNovaAtividade(vinculoId) {
  return `
  <details class="cartao-form" id="nova-atividade">
    <summary><span class="btn primario">+ Nova atividade</span></summary>
    <form method="post" action="/professor/atividade" class="form-interno">
      <input type="hidden" name="vinculo_id" value="${vinculoId}">
      <div class="campo">
        <input type="text" id="titulo" name="titulo" placeholder=" " maxlength="160" required>
        <label for="titulo">Título da atividade</label>
      </div>
      <div class="campo">
        <textarea id="descricao" name="descricao" placeholder=" " rows="3" maxlength="2000"></textarea>
        <label for="descricao">Descrição (opcional)</label>
      </div>
      <div class="campo linha-dupla">
        <label for="prazo" class="acima">Prazo de entrega (opcional)</label>
        <input type="datetime-local" id="prazo" name="prazo">
      </div>
      <div class="form-acoes">
        <button class="btn primario" type="submit">Publicar atividade</button>
      </div>
    </form>
  </details>`;
}

function seletorAba(aba, contagens) {
  const opcoes = [
    ['todas', 'Todas'],
    ['pendentes', 'Aguardando correção'],
    ['corrigidas', 'Corrigidas'],
  ];
  return `<nav class="abas" role="tablist">${opcoes
    .map(
      ([chave, rotulo]) => `
      <a class="aba ${aba === chave ? 'ativa' : ''}" href="?aba=${chave}" role="tab">${rotulo}
        <span class="aba-contagem">${contagens[chave] || 0}</span>
      </a>`
    )
    .join('')}</nav>`;
}

/** Página da matéria do professor: publicar e acompanhar atividades. */
function paginaMateriaProfessor({ materia, atividades, aba }) {
  const cor = corDe(materia.materia).claro;
  const contagens = { todas: atividades.length, pendentes: 0, corrigidas: 0 };
  atividades.forEach((a) => {
    const total = Number(a.total_entregas || 0);
    const corrigidas = Number(a.corrigidas || 0);
    if (total > corrigidas) contagens.pendentes++;
    if (total > 0 && total === corrigidas) contagens.corrigidas++;
  });

  const visiveis = atividades.filter((a) => {
    const total = Number(a.total_entregas || 0);
    const corrigidas = Number(a.corrigidas || 0);
    if (aba === 'pendentes') return total > corrigidas;
    if (aba === 'corrigidas') return total > 0 && total === corrigidas;
    return true;
  });

  const lista = visiveis.length
    ? visiveis
        .map((a) => {
          const total = Number(a.total_entregas || 0);
          const corrigidas = Number(a.corrigidas || 0);
          const turmaTotal = Number(a.alunos_turma || 0);
          const prazoVencido = a.prazo && new Date(a.prazo) < new Date();
          return `
        <article class="atividade">
          <div class="atividade-icone" style="background:${cor}">
            <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2 4 4h-4zM8 13h8v2H8zm0 4h5v2H8z"/></svg>
          </div>
          <div class="atividade-corpo">
            <div class="atividade-topo">
              <div>
                <h3>${esc(a.titulo)}</h3>
                <p class="atividade-professor">
                  ${total} de ${turmaTotal} entregue${turmaTotal === 1 ? '' : 's'} · ${corrigidas} corrigida${
                    corrigidas === 1 ? '' : 's'
                  }
                </p>
              </div>
              ${prazoVencido ? selo('Prazo encerrado', 'atrasado') : a.prazo ? selo('Até ' + dataHoraBR(a.prazo), 'pendente') : selo('Sem prazo', 'aguardando')}
            </div>
            ${a.descricao ? `<p class="atividade-descricao">${esc(a.descricao)}</p>` : ''}
            <div class="atividade-rodape">
              <a class="btn primario" href="/professor/atividade/${a.id}">Ver entregas e corrigir</a>
              <form method="post" action="/professor/atividade/${a.id}/excluir" class="inline"
                    data-confirma="Excluir a atividade "${esc(a.titulo)}" e todas as entregas dela?">
                <button class="btn texto-perigo" type="submit">Excluir</button>
              </form>
            </div>
          </div>
        </article>`;
        })
        .join('')
    : `<div class="vazio"><div class="vazio-icone">📋</div>
       <h3>${aba === 'todas' ? 'Nenhuma atividade publicada' : 'Nada nesta aba'}</h3>
       <p>${aba === 'todas' ? 'Use o botão "+ Nova atividade" para publicar um trabalho com prazo.' : 'Nenhuma atividade corresponde a este filtro.'}</p></div>`;

  return `
  <header class="faixa-materia" style="background:${cor}">
    <div class="faixa-conteudo">
      <div>
        <h1>${esc(materia.materia)}</h1>
        <p>${esc(materia.turma)} · ${Number(materia.alunos || 0)} aluno(s)</p>
      </div>
      <a class="btn fantasma" href="/professor">← Minhas matérias</a>
    </div>
  </header>
  <div class="painel">
    ${blocoNovaAtividade(materia.vinculo_id)}
    ${seletorAba(aba, contagens)}
    <div class="lista-atividades">${lista}</div>
  </div>`;
}

/** Página de uma atividade: entregas dos alunos e correção. */
function paginaAtividadeProfessor({ materia, atividade, alunos }) {
  const cor = corDe(materia.materia).claro;
  const prazoVencido = atividade.prazo && new Date(atividade.prazo) < new Date();

  const linhas = alunos
    .map((al) => {
      const temArquivo = !!al.entrega_id;
      const corrigido = temArquivo && al.nota !== null && al.nota !== undefined;
      const atrasado =
        atividade.prazo &&
        (!temArquivo || new Date(al.enviado_em) > new Date(atividade.prazo));

      const estado = corrigido
        ? selo(`Corrigido · ${al.nota}`, 'corrigido')
        : temArquivo
        ? selo('Aguardando correção', 'aguardando')
        : atrasado
        ? selo('Não entregue (atrasado)', 'atrasado')
        : selo('Não entregue', 'pendente');

      const arquivo = temArquivo
        ? `<div class="linha-arquivo">
             <a class="btn secundario pequeno" href="/arquivos/entrega/${al.entrega_id}">Baixar</a>
             <div class="linha-arquivo-info">
               <strong>${esc(al.arquivo_nome || 'arquivo')}</strong>
               <small>${decorrido(al.enviado_em)} · ${tamanhoLegivel(al.arquivo_tamanho)}</small>
             </div>
           </div>`
        : `<p class="sem-arquivo">Sem arquivo enviado</p>`;

      const correcao = temArquivo
        ? `<form method="post" action="/professor/corrigir/${al.entrega_id}" class="form-correcao">
             <div class="campo nota-campo">
               <input type="number" step="0.01" min="0" max="10" id="nota-${al.id}" name="nota"
                      placeholder=" " value="${al.nota !== null && al.nota !== undefined ? esc(String(al.nota)) : ''}">
               <label for="nota-${al.id}">Nota (0 a 10)</label>
             </div>
             <div class="campo">
               <textarea id="obs-${al.id}" name="observacao" placeholder=" " rows="2" maxlength="1000">${esc(
                 al.observacao || ''
               )}</textarea>
               <label for="obs-${al.id}">Observação para o aluno</label>
             </div>
             <button class="btn primario pequeno" type="submit">${corrigido ? 'Atualizar correção' : 'Salvar correção'}</button>
           </form>`
        : '';

      return `
      <article class="linha-aluno ${corrigido ? 'foi-corrigido' : ''}">
        <div class="linha-aluno-topo">
          <div class="aluno-identidade">${avatar(al, 'pequeno')}<strong>${esc(al.nome)}</strong></div>
          ${estado}
        </div>
        ${arquivo}
        ${temArquivo ? `<small class="linha-envio">Enviado em ${dataHoraBR(al.enviado_em)}</small>` : ''}
        ${correcao}
      </article>`;
    })
    .join('');

  const entregas = alunos.filter((a) => a.entrega_id).length;
  const corrigidas = alunos.filter((a) => a.entrega_id && a.nota !== null && a.nota !== undefined).length;

  return `
  <header class="faixa-materia" style="background:${cor}">
    <div class="faixa-conteudo">
      <div>
        <span class="rotulo-faixa">${esc(materia.turma)} · ${esc(materia.materia)}</span>
        <h1>${esc(atividade.titulo)}</h1>
        <p>${entregas} de ${alunos.length} entregues · ${corrigidas} corrigidas${
          atividade.prazo ? ` · Prazo: ${dataHoraBR(atividade.prazo)}${prazoVencido ? ' (encerrado)' : ''}` : ''
        }</p>
      </div>
      <a class="btn fantasma" href="/professor/materia/${materia.vinculo_id}">← Voltar</a>
    </div>
  </header>
  <div class="painel">
    ${atividade.descricao ? `<p class="descricao-atividade">${esc(atividade.descricao)}</p>` : ''}
    <div class="lista-alunos">${linhas || '<div class="vazio"><div class="vazio-icone">👥</div><h3>Sem alunos na turma</h3></div>'}</div>
  </div>`;
}

module.exports = { gradeProfessor, paginaMateriaProfessor, paginaAtividadeProfessor };
