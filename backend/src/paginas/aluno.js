/** Páginas do aluno: grade de matérias e trabalhos da matéria (com abas). */
const { esc, dataBR, dataHoraBR, decorrido, corDe, tamanhoLegivel, dominioLink } = require('../util');
const { classificar, abasDe, ROTULOS_ABA } = require('../regras');
const { TIPOS } = require('./calendario');

/* Ícones em linha (mesmo traço do restante do site) — substituem os emojis. */
const ICO_LIVRO = `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/></svg>`;
const ICO_FESTA = `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 9 10 2 10l6 4.5-2.5 7L12 15.5 18.5 21.5 16 14.5l6-4.5-7 0z" stroke-width="1.6"/></svg>`;
const ICO_TAREFA = `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m8.5 12.5 2.5 2.5 5-5.5"/></svg>`;
const ICO_DOC = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/><path d="M9 14h6M9 17h6M9 11h2"/></svg>`;
const ICO_PLANILHA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9.5 4v16M15.5 4v16"/></svg>`;
const ICO_APRESENTACAO = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M9 21l3-4 3 4"/><path d="M12 4V3M8 10l3-3 3 3"/></svg>`;
const ICO_IMAGEM = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m5 18 6-6 5 5M14 16l2-2 4 4"/></svg>`;
const ICO_CLIP = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 11.5-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5"/></svg>`;
const ICO_LINK = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-2 2"/><path d="M14 10a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l2-2"/></svg>`;
const ICO_NUVEM = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1 0-9 6 6 0 0 1 11.6 2 4 4 0 0 1-.6 7z"/><path d="M12 12v7m0-7-3 3m3-3 3 3"/></svg>`;

function avatarProfessor(nome) {
  if (!nome) return `<span class="avatar pequeno"><span style="background:#9aa0a6">?</span></span>`;
  const cor = corDe(nome).claro;
  const partes = nome.trim().split(/\s+/);
  const ini = (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
  return `<span class="avatar pequeno"><span style="--faixa:${cor}">${esc(ini)}</span></span>`;
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
        <div class="card-faixa" style="--faixa:${cor}">
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
           <div class="vazio-icone">${ICO_LIVRO}</div>
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
  const detalhe =
    a.metodo === 'link' && a.link
      ? `<a class="arquivo-enviado link-entrega" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">
           ${ICO_LINK} ${esc(dominioLink(a.link))} · abrir link entregue
         </a>`
      : `<span class="arquivo-enviado">${esc(a.arquivo_nome || '')} · ${tamanhoLegivel(a.arquivo_tamanho)}</span>`;
  return `
  <div class="entregue-em">
    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
    <span>Entregue <strong>${decorrido(a.enviado_em)}</strong> (${dataHoraBR(a.enviado_em)})</span>
    ${detalhe}
  </div>`;
}

/** Categorias de arquivo que o aluno pode enviar. */
const CATEGORIAS_ARQUIVO = [
  [ICO_DOC, 'Documentos', '.pdf, .doc, .docx, .txt'],
  [ICO_PLANILHA, 'Planilhas', '.xls, .xlsx'],
  [ICO_APRESENTACAO, 'Apresentações', '.ppt, .pptx'],
  [ICO_IMAGEM, 'Imagens', '.jpg, .jpeg, .png'],
];

function blocoAcoes(a, s) {
  const temNota = s.corrigido;
  if (temNota) {
    const botao =
      a.metodo === 'link' && a.link
        ? `<a class="btn secundario" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Abrir meu link</a>`
        : `<a class="btn secundario" href="/arquivos/entrega/${a.entrega_id}">Baixar meu arquivo</a>`;
    return `<div class="acoes-atividade">${botao}</div>`;
  }
  const fora = s.foraDoPrazo;
  const rotulo = s.temEntrega ? 'Reenviar' : fora ? 'Entregar atrasado' : 'Entregar trabalho';
  const chips = CATEGORIAS_ARQUIVO.map(
    ([icone, nome, ext]) => `<li class="chip-arquivo" title="${esc(ext)}"><span>${icone}</span>${esc(nome)}</li>`
  ).join('');

  return `
  <div class="bloco-envio">
    <nav class="abas-envio" role="tablist" aria-label="Formas de entrega">
      <button class="aba-envio ativa" type="button" role="tab" aria-selected="true" data-envio-aba="arquivo">${ICO_CLIP} Arquivo</button>
      <button class="aba-envio" type="button" role="tab" aria-selected="false" data-envio-aba="link">${ICO_LINK} Link</button>
      <button class="aba-envio" type="button" role="tab" aria-selected="false" data-envio-aba="drive">${ICO_NUVEM} Drive</button>
    </nav>

    <form class="form-entrega" method="post" action="/aluno/entregar/${a.id}" enctype="multipart/form-data"
          data-limite="15728640">
      <input type="hidden" name="metodo" value="arquivo" data-metodo-envio>

      <!-- Painel: arquivo do computador -->
      <div class="envio-painel ativo" data-envio-painel="arquivo">
        <label class="seletor-arquivo">
          <input type="file" name="arquivo" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt" required>
          <span class="btn ${s.temEntrega ? 'secundario' : 'primario'}">${rotulo} de arquivo</span>
          <span class="nome-arquivo"></span>
        </label>
        <ul class="chips-arquivo" aria-label="Tipos aceitos">
          ${chips}
        </ul>
        <small class="dica-envio">Documentos, planilhas, apresentações, imagens e texto — até 15 MB.</small>
        <button class="btn primario ocultar" type="submit">Enviar arquivo</button>
      </div>

      <!-- Painel: link avulso -->
      <div class="envio-painel" data-envio-painel="link">
        <div class="campo">
          <input type="url" name="link" id="link-${a.id}" placeholder=" " maxlength="2000" required disabled
                 pattern="https?://.+" autocomplete="off">
          <label for="link-${a.id}">Cole o link do trabalho (site, artigo, post...)</label>
        </div>
        <small class="dica-envio">Use um endereço que comece com http:// ou https://.</small>
        <button class="btn primario" type="submit" disabled>${rotulo} com link</button>
      </div>

      <!-- Painel: Google Drive -->
      <div class="envio-painel" data-envio-painel="drive">
        <div class="campo">
          <input type="url" name="link" id="drive-${a.id}" placeholder=" " maxlength="2000" required disabled
                 pattern="https?://.+" autocomplete="off">
          <label for="drive-${a.id}">Link do arquivo no Google Drive</label>
        </div>
        <small class="dica-envio">No Drive: clique com o botão direito no arquivo → Compartilhar → Copiar link.</small>
        <button class="btn primario" type="submit" disabled>${rotulo} do Drive</button>
      </div>
    </form>
  </div>`;
}

function blocoPrazo(a, s) {
  if (!a.prazo) return `<span class="prazo neutro">Sem prazo definido</span>`;
  if (s.vencido) {
    return `<span class="prazo ${s.atrasado ? 'vencido' : 'ok'}">Prazo: ${dataHoraBR(a.prazo)}</span>`;
  }
  return `<span class="prazo">Entregar até ${dataHoraBR(a.prazo)}</span>`;
}

function listaAtividades(atividades, aba) {
  const ehTrabalho = (a) => (a.tipo || 'trabalho') === 'trabalho';
  const visiveis = atividades.filter((a) => (ehTrabalho(a) ? abasDe(a).abas.includes(aba) : aba === 'todos'));
  if (!visiveis.length) {
    const textos = {
      todos: ['Nenhum trabalho por aqui', 'Assim que o professor publicar uma atividade, ela aparece nesta lista.'],
      'nao-corrigidos': ['Nada aguardando correção', 'Quando você entregar um trabalho, ele fica aqui até o professor corrigir.'],
      corrigidos: ['Nenhum trabalho corrigido', 'As notas e observações dos professores aparecerão aqui.'],
      atrasados: ['Nada atrasado', 'Você está em dia com todos os prazos.'],
    };
    const [titulo, texto] = textos[aba] || textos.todos;
    return `<div class="vazio">
      <div class="vazio-icone">${aba === 'atrasados' ? ICO_FESTA : ICO_TAREFA}</div>
      <h3>${titulo}</h3><p>${texto}</p>
    </div>`;
  }
  return visiveis
    .map((a) => {
      const { s } = abasDe(a);
      const cor = corDe(a.materia || '').claro;
      if ((a.tipo || 'trabalho') !== 'trabalho') {
        const info = TIPOS[a.tipo] || TIPOS.trabalho;
        return `
      <article class="atividade">
        <div class="atividade-icone" style="--faixa:${cor}">
          <span class="atividade-glyph">${info.icone}</span>
        </div>
        <div class="atividade-corpo">
          <div class="atividade-topo">
            <div>
              <h3>${esc(a.titulo)}</h3>
              <p class="atividade-professor">${avatarProfessor(a.professor)} ${esc(a.professor || 'Professor não definido')}</p>
            </div>
            <span class="chip avaliacao">${info.rotulo}</span>
          </div>
          ${a.descricao ? `<p class="atividade-descricao">${esc(a.descricao)}</p>` : ''}
          <div class="atividade-meta">${
            a.prazo ? `<span class="prazo">${dataHoraBR(a.prazo)}</span>` : '<span class="prazo neutro">Sem data</span>'
          }</div>
          <div class="atividade-rodape">
            <a class="link-suave" href="/aluno/calendario">Ver no calendário</a>
          </div>
        </div>
      </article>`;
      }
      return `
      <article class="atividade">
        <div class="atividade-icone" style="--faixa:${cor}">
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

/** Página da matéria (cabeçalho colorido + painel de trabalhos + resumo lateral). */
function paginaMateria({ usuario, materia, atividades, aba }) {
  const cor = corDe(materia.materia).claro;
  const contagens = { todos: 0, 'nao-corrigidos': 0, corrigidos: 0, atrasados: 0 };
  const trabalhos = atividades.filter((a) => (a.tipo || 'trabalho') === 'trabalho');
  atividades.forEach((a) => {
    if ((a.tipo || 'trabalho') !== 'trabalho') return;
    abasDe(a).abas.forEach((x) => contagens[x]++);
  });

  const total = trabalhos.length;
  const entregues = trabalhos.filter((a) => a.entrega_id).length;
  const aEntregar = total - entregues;
  const pct = total ? Math.round((entregues / total) * 100) : 0;

  // Próximo prazo entre os trabalhos ainda não entregues
  const pendentes = trabalhos
    .filter((a) => !a.entrega_id && a.prazo)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo));
  const proxima = pendentes[0];
  const proximaS = proxima ? abasDe(proxima).s : null;

  return `
  <header class="faixa-materia" style="--faixa:${cor}">
    <div class="faixa-conteudo">
      <div>
        <h1>${esc(materia.materia)}</h1>
        <p>${esc(materia.turma)} · ${esc(materia.professor || 'Professor não definido')}</p>
      </div>
      <span class="faixa-avatar">${avatarProfessor(materia.professor)}</span>
    </div>
  </header>

  <div class="mat-grade">
    <div class="painel">
      <div class="painel-topo">
        <h2>Trabalhos</h2>
        <a class="btn text" href="/aluno">← Voltar às matérias</a>
      </div>
      ${abas(aba, contagens)}
      <div class="lista-atividades">${listaAtividades(atividades, aba)}</div>
    </div>

    <aside class="mat-lateral">
      <section class="ini-painel">
        <header class="ini-painel-topo"><h2>Resumo da matéria</h2></header>
        <ul class="mat-resumo">
          <li><span>Trabalhos publicados</span><strong>${total}</strong></li>
          <li><span>Entregues por você</span><strong>${entregues}</strong></li>
          <li><span>A entregar</span><strong>${aEntregar}</strong></li>
        </ul>
        <div class="mat-progresso-topo">
          <span>Seu progresso</span><strong>${pct}%</strong>
        </div>
        <div class="ini-barra"><i style="width:${pct}%;background:${cor}"></i></div>
      </section>

      <section class="ini-painel">
        <header class="ini-painel-topo"><h2>Próximo prazo</h2></header>
        ${
          proxima
            ? `<a class="mat-prazo" href="/aluno/trabalho/${proxima.id}">
                 <span class="chip ${proximaS && proximaS.atrasado && !proxima.entrega_id ? 'atrasado' : 'aguardando'}">${
                   proximaS && proximaS.atrasado && !proxima.entrega_id ? 'Atrasado' : 'Em aberto'
                 }</span>
                 <strong>${esc(proxima.titulo)}</strong>
                 <small>${dataHoraBR(proxima.prazo)}</small>
               </a>`
            : '<p class="mat-vazio">Nenhum prazo em aberto. Tudo entregue por aqui!</p>'
        }
        <a class="ini-cal-ver" href="/aluno/calendario">Ver calendário do mês →</a>
      </section>
    </aside>
  </div>`;
}

/** Detalhe de um trabalho (histórico completo do aluno). */
function paginaTrabalho({ usuario, a }) {
  const { s } = abasDe(a);
  const cor = corDe(a.materia || '').claro;
  const info = TIPOS[a.tipo || 'trabalho'] || TIPOS.trabalho;
  const estado = s.corrigido
    ? 'Corrigido'
    : s.atrasado
      ? s.temEntrega
        ? 'Entregue fora do prazo'
        : 'Atrasado'
      : s.aguardando
        ? 'Aguardando correção'
        : s.temEntrega
          ? 'Entregue'
          : 'Ainda não entregue';
  const metodo =
    !s.temEntrega ? '—' : a.metodo === 'link' ? 'Link' : a.metodo === 'drive' ? 'Google Drive' : 'Arquivo';

  return `
  <header class="faixa-materia" style="--faixa:${cor}">
    <div class="faixa-conteudo">
      <div>
        <span class="rotulo-faixa">${esc(a.materia)} · ${esc(a.turma)}</span>
        <h1>${esc(a.titulo)}</h1>
        <p>${esc(a.professor || 'Professor não definido')} · Publicado em ${dataBR(a.criado_em)}</p>
      </div>
      <span class="faixa-avatar">${avatarProfessor(a.professor)}</span>
    </div>
  </header>

  <div class="mat-grade">
    <div class="painel">
      <div class="painel-topo">
        <h2>Trabalho</h2>
        <a class="btn text" href="/aluno/materia/${a.vinculo_id}?aba=todos">← Voltar aos trabalhos</a>
      </div>

      <article class="atividade detalhe trab-conteudo" style="--cor-fundo:${cor}">
        <div class="atividade-topo">
          <span class="chip ${info.classe}">${info.rotulo}</span>
          ${chipStatus(s)}
        </div>
        ${a.descricao ? `<p class="atividade-descricao">${esc(a.descricao)}</p>` : '<p class="atividade-descricao sem-descricao">Sem descrição enviada pelo professor.</p>'}
        <div class="atividade-meta">
          ${blocoPrazo(a, s)}
          <span class="prazo neutro">Publicado em ${dataBR(a.criado_em)}</span>
        </div>
        ${blocoEntrega(a, s)}
        <div class="atividade-rodape">${blocoAcoes(a, s)}</div>
      </article>
    </div>

    <aside class="mat-lateral">
      <section class="ini-painel">
        <header class="ini-painel-topo"><h2>Resumo da entrega</h2></header>
        <ul class="mat-resumo">
          <li><span>Situação</span><strong>${estado}</strong></li>
          <li><span>Prazo</span><strong>${a.prazo ? dataBR(a.prazo) : 'Sem prazo'}</strong></li>
          <li><span>Enviado em</span><strong>${a.enviado_em ? dataBR(a.enviado_em) : '—'}</strong></li>
          <li><span>Forma de envio</span><strong>${metodo}</strong></li>
          <li><span>Nota</span><strong>${s.corrigido && a.nota !== null && a.nota !== undefined ? esc(String(a.nota)) : '—'}</strong></li>
        </ul>
      </section>

      ${
        s.corrigido
          ? `<section class="ini-painel">
               <header class="ini-painel-topo"><h2>Observação do professor</h2></header>
               <p class="trab-observacao">${esc(a.observacao || 'Sem observações.')}</p>
               <small class="trab-data">Corrigido em ${dataHoraBR(a.corrigido_em)}</small>
             </section>`
          : `<section class="ini-painel">
               <header class="ini-painel-topo"><h2>Como entregar</h2></header>
               <ul class="trab-dicas">
                 <li><strong>Arquivo</strong><small>PDF, DOCX, PPTX, XLSX, JPG/PNG ou TXT — até 15 MB.</small></li>
                 <li><strong>Link</strong><small>Site, artigo ou post com endereço http(s).</small></li>
                 <li><strong>Google Drive</strong><small>Link compartilhado do arquivo no Drive.</small></li>
               </ul>
               <p class="trab-nota">${s.temEntrega ? 'Você pode reenviar enquanto o trabalho não for corrigido.' : 'Envie antes do prazo para evitar atraso.'}</p>
             </section>`
      }

      <section class="ini-painel">
        <header class="ini-painel-topo"><h2>Atalhos</h2></header>
        <ul class="trab-atalhos">
          <li><a href="/aluno/materia/${a.vinculo_id}?aba=todos">Ver trabalhos de ${esc(a.materia)}</a></li>
          <li><a href="/aluno/calendario">Calendário do mês</a></li>
        </ul>
      </section>
    </aside>
  </div>`;
}

module.exports = { gradeMaterias, paginaMateria, paginaTrabalho };
