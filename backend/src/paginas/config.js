/** Página de Configurações: foto, dados pessoais, tema e segurança. */
const { esc } = require('../util');
const { avatar } = require('./layout');
const { TEMAS, CATEGORIAS, TEMA_PADRAO, temaDe, temaOuPadrao } = require('../temas');

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

/** Card de tema da galeria: prévia da interface + paleta + descrição. */
function cardTema(t, atual) {
  const [fundo, superficie, texto, acento, detalhe] = t.paleta;
  const sel = t.id === atual;
  const cores = t.paleta.map((c) => `<i style="background:${c}"></i>`).join('');
  return `
  <button type="button" class="tema-card ${sel ? 'selecionado' : ''}" data-tema-card="${t.id}" data-modo="${
    t.modo
  }" aria-pressed="${sel}" aria-label="Visualizar tema ${esc(t.nome)}">
    <span class="tema-previa" aria-hidden="true" style="--p-fundo:${fundo};--p-superficie:${superficie};--p-texto:${texto};--p-acento:${acento};--p-detalhe:${detalhe}">
      <span class="previa-barra"><span class="previa-logo"></span><span class="previa-ponto"></span><span class="previa-ponto"></span></span>
      <span class="previa-corpo">
        <span class="previa-lateral"></span>
        <span class="previa-cartoes"><span></span><span></span></span>
      </span>
    </span>
    <span class="tema-card-topo">
      <strong>${esc(t.nome)}</strong>
      <span class="selo-tema">✓ Selecionado</span>
      ${t.padrao ? '<span class="selo-padrao">Padrão</span>' : ''}
    </span>
    <span class="paleta" title="Paleta de cores">${cores}</span>
    <small class="tema-descricao">${esc(t.descricao)}</small>
  </button>`;
}

/** Seção "Aparência": galeria de temas com pré-visualização e aplicação. */
function secaoAparencia(usuario) {
  const atual = temaOuPadrao(usuario.tema);
  const grupos = CATEGORIAS.map(
    (cat) => `
    <div class="grupo-temas">
      <h3 class="grupo-tema-titulo">${esc(cat)}</h3>
      <div class="linha-temas">${TEMAS.filter((t) => t.categoria === cat)
        .map((t) => cardTema(t, atual))
        .join('')}</div>
    </div>`
  ).join('');

  return `
    <section class="cartao-config cartao-temas">
      <h2>Aparência</h2>
      <p class="descricao">Escolha um tema para personalizar a plataforma. Clique num card para visualizar a aparência
      e depois clique em <strong>Aplicar tema</strong> — sua preferência fica salva na conta e vale para qualquer dispositivo.</p>
      <form method="post" action="/configuracoes/tema" id="form-tema" data-tema-atual="${atual}">
        <input type="hidden" name="tema" id="tema-escondido" value="${atual}">
        ${grupos}
        <div class="barra-tema" id="barra-tema">
          <span class="barra-tema-texto" id="barra-tema-texto">Tema atual: <strong>${esc(
            temaDe(atual).nome
          )}</strong></span>
          <div class="barra-tema-acoes">
            <button class="btn texto" type="button" id="btn-cancelar-tema">Cancelar pré-visualização</button>
            <button class="btn secundario" type="submit" name="restaurar" value="1">Restaurar padrão</button>
            <button class="btn primario" type="submit">Aplicar tema</button>
          </div>
        </div>
      </form>
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
  <div class="cabecalho-secao">
    <div>
      <h1>Configurações</h1>
      <p class="descricao">Seus dados, aparência do site e segurança da conta</p>
    </div>
  </div>

  <div class="grade-config">
    <!-- ===== Aparência (galeria de temas) ===== -->
    ${secaoAparencia(usuario)}

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
  </div>`;
}

module.exports = { paginaConfiguracoes };
