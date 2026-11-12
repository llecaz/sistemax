/** Página de Configurações: foto, dados pessoais, tema e segurança. */
const { esc } = require('../util');
const { avatar } = require('./layout');
const { TEMAS, temaOuPadrao } = require('../temas');

const PERGUNTAS = [
  'Qual o nome da sua mãe?',
  'Qual o nome da sua cidade?',
  'Qual o nome do seu primeiro professor?',
  'Qual o nome do seu animal de estimação?',
  'Em que cidade você nasceu?',
];

function rotuloPerfil(tipo) {
  return tipo === 'admin' ? 'Administrador' : tipo === 'professor' ? 'Professor(a)' : 'Aluno(a)';
}

/** Card de modo (Dark/Normal): prévia da interface + descrição. */
function cardModo(t, atual) {
  const [fundo, superficie, texto, acento, detalhe] = t.paleta;
  const sel = t.id === atual;
  return `
  <button type="submit" name="tema" value="${t.id}" class="tema-card modo-card ${sel ? 'selecionado' : ''}" data-tema-escolher="${t.id}" aria-pressed="${sel}" aria-label="Aplicar ${esc(t.nome)}">
    <span class="tema-previa" aria-hidden="true" style="--p-fundo:${fundo};--p-superficie:${superficie};--p-texto:${texto};--p-acento:${acento};--p-detalhe:${detalhe}">
      <span class="previa-barra"><span class="previa-logo"></span><span class="previa-ponto"></span><span class="previa-ponto"></span></span>
      <span class="previa-corpo">
        <span class="previa-lateral"></span>
        <span class="previa-cartoes"><span></span><span></span></span>
      </span>
    </span>
    <span class="tema-card-topo">
      <strong>${esc(t.nome)}</strong>
      <span class="selo-tema">${sel ? '✓ Selecionado' : 'Aplicar'}</span>
      ${t.padrao ? '<span class="selo-padrao">Padrão</span>' : ''}
    </span>
    <small class="tema-descricao">${esc(t.descricao)}</small>
  </button>`;
}

/** Seção "Aparência": os dois modos principais + o Lofi Mode opcional. */
function secaoAparencia(usuario) {
  const atual = temaOuPadrao(usuario.tema);
  const lofiAtivo = Boolean(usuario.lofi);
  return `
    <section class="cartao-config cartao-temas">
      <h2>Aparência</h2>
      <p class="descricao">Dois modos principais — <strong>Dark Mode</strong> e <strong>Normal Mode</strong> — que você
      alterna pelo botão no menu lateral. Clique num card para aplicar na hora; a preferência fica salva na conta.</p>
      <form method="post" action="/configuracoes/tema" id="form-tema" data-tema-atual="${atual}">
        <div class="linha-modos">${TEMAS.map((t) => cardModo(t, atual)).join('')}</div>
      </form>

      <div class="lofi-linha">
        <span class="lofi-linha-icone" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </span>
        <div class="lofi-linha-texto">
          <strong>Lofi Mode</strong>
          <small>Pixel art, chuva e study room — opcional e funciona nos dois modos. Ao desativar, tudo volta ao visual do modo atual.</small>
        </div>
        <button type="button" class="lofi-toggle lofi-toggle-grande" id="btn-lofi-cfg" role="switch" aria-checked="${lofiAtivo ? 'true' : 'false'}" aria-label="Ativar ou desativar o Lofi Mode">
          <span class="lofi-toggle-trilho" aria-hidden="true"><span class="lofi-toggle-bolinha"></span></span>
          <span class="lofi-toggle-rotulo" aria-hidden="true">${lofiAtivo ? 'Ativado' : 'Desativado'}</span>
        </button>
      </div>
    </section>`;
}

function paginaConfiguracoes({ usuario }) {
  const ehAluno = usuario.tipo === 'aluno';
  const linhasInfo = [
    ['Nome completo', usuario.nome],
    ['E-mail', usuario.email],
    ehAluno ? ['Turma conectada', usuario.turma_nome || 'Nenhuma turma'] : null,
    ehAluno ? ['Matrícula', usuario.matricula || '—'] : null,
    usuario.tipo === 'professor' ? ['Matérias que leciona', usuario.materias || 'Nenhuma vinculada'] : null,
    ['Perfil', rotuloPerfil(usuario.tipo)],
    ['Conta criada em', usuario.criado_em ? new Date(usuario.criado_em).toLocaleDateString('pt-BR') : '—'],
  ].filter(Boolean);

  const perguntaAtual = usuario.pergunta_seg || '';

  return `
  <div class="cfg-app">
  <div class="cabecalho-secao">
    <div>
      <span class="cfg-selo">conta e preferências</span>
      <h1>Configurações</h1>
      <p class="descricao">Seus dados, aparência do site e segurança da conta</p>
    </div>
  </div>

  <div class="grade-config">
    <!-- ===== Perfil ===== -->
    <section class="cartao-config">
      <h2>Perfil</h2>
      <div class="perfil-topo">
        <div class="foto-grande">${avatar(usuario)}</div>
        <div class="perfil-acoes">
          <form method="post" action="/configuracoes/foto" enctype="multipart/form-data" class="form-foto">
            <label class="seletor-arquivo">
              <input type="file" name="foto" accept="image/png,image/jpeg,image/webp" required data-envio-foto>
              <span class="btn secundario">Trocar foto</span>
              <span class="nome-arquivo"></span>
            </label>
            <button class="btn primario ocultar" type="submit">Enviar foto</button>
          </form>
          <small>JPG, PNG ou WebP · até 2 MB</small>
          ${
            usuario.foto
              ? `<form method="post" action="/configuracoes/foto/remover" class="inline">
                   <button class="btn texto" type="submit">Remover foto</button>
                 </form>`
              : ''
          }
        </div>
      </div>

      <dl class="lista-info">
        ${linhasInfo.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
      </dl>

      <form method="post" action="/configuracoes/nome" class="form-interno">
        <div class="campo">
          <input type="text" id="cfg-nome" name="nome" placeholder=" " maxlength="120" value="${esc(usuario.nome)}" required>
          <label for="cfg-nome">Nome exibido</label>
        </div>
        <div class="form-acoes"><button class="btn primario" type="submit">Salvar nome</button></div>
      </form>
    </section>

    <!-- ===== Segurança ===== -->
    <section class="cartao-config">
      <h2>Segurança</h2>

      <h3 class="subtitulo-config">Alterar senha</h3>
      <form method="post" action="/configuracoes/senha" class="form-interno">
        <div class="campo"><input type="password" id="senha-atual" name="atual" placeholder=" " required autocomplete="current-password">
          <label for="senha-atual">Senha atual</label></div>
        <div class="campo"><input type="password" id="senha-nova" name="nova" placeholder=" " minlength="6" required autocomplete="new-password">
          <label for="senha-nova">Nova senha (mínimo 6 caracteres)</label></div>
        <div class="form-acoes"><button class="btn primario" type="submit">Alterar senha</button></div>
      </form>

      <h3 class="subtitulo-config">Pergunta de segurança</h3>
      <p class="descricao">Usada para recuperar a senha pelo próprio site.</p>
      <form method="post" action="/configuracoes/seguranca" class="form-interno">
        <div class="campo">
          <label for="pergunta" class="acima">Pergunta</label>
          <select id="pergunta" name="pergunta" required>
            <option value="">Escolha uma pergunta</option>
            ${PERGUNTAS.map(
              (p) => `<option value="${esc(p)}" ${p === perguntaAtual ? 'selected' : ''}>${esc(p)}</option>`
            ).join('')}
            ${perguntaAtual && !PERGUNTAS.includes(perguntaAtual) ? `<option value="${esc(perguntaAtual)}" selected>${esc(perguntaAtual)}</option>` : ''}
          </select>
        </div>
        <div class="campo">
          <input type="text" id="resposta" name="resposta" placeholder=" " maxlength="120" required>
          <label for="resposta">Resposta${perguntaAtual ? ' (digite uma nova ou a mesma)' : ''}</label>
        </div>
        <div class="form-acoes"><button class="btn primario" type="submit">Salvar pergunta</button></div>
      </form>
    </section>

    <!-- ===== Sessão ===== -->
    <section class="cartao-config">
      <h2>Sessão</h2>
      <p class="descricao">Ao sair, você precisará entrar novamente neste dispositivo.</p>
      <form method="post" action="/sair">
        <button class="btn secundario" type="submit">Sair da conta</button>
      </form>
    </section>

    <!-- ===== Aparência (no final: o perfil ganha prioridade) ===== -->
    ${secaoAparencia(usuario)}
  </div>
  </div>`;
}

module.exports = { paginaConfiguracoes };
