/** Painel do administrador: turmas, disciplinas, professores, vínculos e alunos. */
const { esc, dataBR } = require('../util');
const { avatar } = require('./layout');

const SECOES = [
  ['turmas', 'Turmas'],
  ['disciplinas', 'Disciplinas'],
  ['professores', 'Professores'],
  ['vinculos', 'Vínculos turma ↔ matéria'],
  ['alunos', 'Alunos'],
];

function seletorSecao(atual) {
  return `<nav class="abas abas-admin">${SECOES.map(
    ([chave, rotulo]) =>
      `<a class="aba ${atual === chave ? 'ativa' : ''}" href="/admin?secao=${chave}">${rotulo}</a>`
  ).join('')}</nav>`;
}

function secaoTurmas(dados) {
  const linhas = dados.turmas
    .map(
      (t) => `
    <tr>
      <td><strong>${esc(t.nome)}</strong></td>
      <td><code class="codigo" title="Código de matrícula da turma">${esc(t.codigo)}</code>
          <button class="btn mini copiar" type="button" data-copia="${esc(t.codigo)}">Copiar</button></td>
      <td>${t.ano_letivo}</td>
      <td>${Number(t.alunos || 0)}</td>
      <td>${t.ativa ? '<span class="chip corrigido">Ativa</span>' : '<span class="chip atrasado">Inativa</span>'}</td>
      <td class="acoes-linha">
        <form method="post" action="/admin/turmas/${t.id}/codigo" class="inline"
              data-confirma="Gerar um NOVO código? O código antigo deixará de funcionar.">
          <button class="btn texto" type="submit">Novo código</button>
        </form>
        <form method="post" action="/admin/turmas/${t.id}/status" class="inline">
          <button class="btn texto" type="submit">${t.ativa ? 'Desativar' : 'Ativar'}</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return `
  <div class="cartao-form aberto">
    <h3>Nova turma</h3>
    <form method="post" action="/admin/turmas" class="form-interno linha-tres">
      <div class="campo"><input type="text" id="nome-turma" name="nome" placeholder=" " maxlength="80" required>
        <label for="nome-turma">Nome (ex.: 9º Ano A)</label></div>
      <div class="campo"><input type="number" name="ano_letivo" value="${new Date().getFullYear()}" min="2000" max="2100" placeholder=" ">
        <label>Ano letivo</label></div>
      <div class="form-acoes"><button class="btn primario" type="submit">Criar turma</button></div>
    </form>
    <p class="dica">O sistema gera automaticamente o <strong>código de matrícula</strong> que os alunos usam para se cadastrar.</p>
  </div>
  <div class="tabela-envolve">
    <table class="tabela">
      <thead><tr><th>Turma</th><th>Código de matrícula</th><th>Ano</th><th>Alunos</th><th>Situação</th><th></th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="6">Nenhuma turma cadastrada.</td></tr>'}</tbody>
    </table>
  </div>`;
}

function secaoDisciplinas(dados) {
  const linhas = dados.disciplinas
    .map(
      (d) => `
    <tr>
      <td><strong>${esc(d.nome)}</strong></td>
      <td>${Number(d.vinculos || 0)} vínculo(s)</td>
      <td class="acoes-linha">
        <form method="post" action="/admin/disciplinas/${d.id}/excluir" class="inline"
              data-confirma="Excluir a matéria '${esc(d.nome)}'?">
          <button class="btn texto-perigo" type="submit">Excluir</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return `
  <div class="cartao-form aberto">
    <h3>Nova matéria</h3>
    <form method="post" action="/admin/disciplinas" class="form-interno">
      <div class="campo"><input type="text" id="nome-disc" name="nome" placeholder=" " maxlength="80" required>
        <label for="nome-disc">Nome da matéria (ex.: Matemática)</label></div>
      <div class="form-acoes"><button class="btn primario" type="submit">Adicionar</button></div>
    </form>
  </div>
  <div class="tabela-envolve">
    <table class="tabela">
      <thead><tr><th>Matéria</th><th>Uso</th><th></th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="3">Nenhuma matéria cadastrada.</td></tr>'}</tbody>
    </table>
  </div>`;
}

function secaoProfessores(dados) {
  const linhas = dados.professores
    .map(
      (p) => `
    <tr>
      <td><div class="celula-usuario">${avatar(p, 'pequeno')}<div><strong>${esc(p.nome)}</strong>
        <small>${esc(p.email)}</small></div></div></td>
      <td>${esc(p.materias || '—')}</td>
      <td>${p.ativo ? '<span class="chip corrigido">Ativo</span>' : '<span class="chip atrasado">Inativo</span>'}</td>
      <td class="acoes-linha">
        <details class="dropdown">
          <summary class="btn texto">Redefinir senha</summary>
          <form method="post" action="/admin/usuarios/${p.id}/senha" class="form-dropdown">
            <input type="text" name="senha" placeholder="Nova senha" minlength="6" required>
            <button class="btn primario pequeno" type="submit">Salvar</button>
          </form>
        </details>
        <form method="post" action="/admin/usuarios/${p.id}/status" class="inline">
          <button class="btn texto" type="submit">${p.ativo ? 'Desativar' : 'Ativar'}</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return `
  <div class="cartao-form aberto">
    <h3>Novo professor</h3>
    <form method="post" action="/admin/professores" class="form-interno linha-tres">
      <div class="campo"><input type="text" id="nome-prof" name="nome" placeholder=" " maxlength="120" required>
        <label for="nome-prof">Nome completo</label></div>
      <div class="campo"><input type="email" id="email-prof" name="email" placeholder=" " maxlength="160" required>
        <label for="email-prof">E-mail</label></div>
      <div class="campo"><input type="text" id="senha-prof" name="senha" placeholder=" " minlength="6" required>
        <label for="senha-prof">Senha inicial</label></div>
      <div class="form-acoes"><button class="btn primario" type="submit">Criar professor</button></div>
    </form>
  </div>
  <div class="tabela-envolve">
    <table class="tabela">
      <thead><tr><th>Professor</th><th>Matérias</th><th>Situação</th><th></th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="4">Nenhum professor cadastrado.</td></tr>'}</tbody>
    </table>
  </div>`;
}

function secaoVinculos(dados) {
  const opcoes = (lista, selecionado) =>
    lista.map((o) => `<option value="${o.id}" ${Number(o.id) === Number(selecionado) ? 'selected' : ''}>${esc(o.rotulo)}</option>`).join('');

  const linhas = dados.vinculos
    .map(
      (v) => `
    <tr>
      <td><strong>${esc(v.turma)}</strong></td>
      <td>${esc(v.disciplina)}</td>
      <td>
        <form method="post" action="/admin/vinculos/${v.id}" class="form-troca">
          <select name="professor_id" onchange="this.form.submit()">
            <option value="">— sem professor —</option>
            ${opcoes(dados.professorOptions, v.professor_id)}
          </select>
        </form>
      </td>
      <td class="acoes-linha">
        <form method="post" action="/admin/vinculos/${v.id}/excluir" class="inline"
              data-confirma="Remover este vínculo? As atividades dessa combinação deixam de aparecer.">
          <button class="btn texto-perigo" type="submit">Remover</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return `
  <div class="cartao-form aberto">
    <h3>Vincular matéria à turma</h3>
    <p class="dica">É este vínculo que define <strong>quem é o professor de cada matéria em cada turma</strong> — o aluno vê exatamente essa combinação ao enviar o trabalho.</p>
    <form method="post" action="/admin/vinculos" class="form-interno linha-tres">
      <div class="campo"><label for="v-turma" class="acima">Turma</label>
        <select id="v-turma" name="turma_id" required>
          <option value="">Escolha a turma</option>
          ${opcoes(dados.turmaOptions)}
        </select></div>
      <div class="campo"><label for="v-disc" class="acima">Matéria</label>
        <select id="v-disc" name="disciplina_id" required>
          <option value="">Escolha a matéria</option>
          ${opcoes(dados.disciplinaOptions)}
        </select></div>
      <div class="campo"><label for="v-prof" class="acima">Professor</label>
        <select id="v-prof" name="professor_id">
          <option value="">Sem professor (por definir)</option>
          ${opcoes(dados.professorOptions)}
        </select></div>
      <div class="form-acoes"><button class="btn primario" type="submit">Salvar vínculo</button></div>
    </form>
  </div>
  <div class="tabela-envolve">
    <table class="tabela">
      <thead><tr><th>Turma</th><th>Matéria</th><th>Professor</th><th></th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="4">Nenhum vínculo criado ainda.</td></tr>'}</tbody>
    </table>
  </div>`;
}

function secaoAlunos(dados) {
  const linhas = dados.alunos
    .map(
      (a) => `
    <tr>
      <td><div class="celula-usuario">${avatar(a, 'pequeno')}<div><strong>${esc(a.nome)}</strong>
        <small>${esc(a.email)}</small></div></div></td>
      <td>${esc(a.matricula || '—')}</td>
      <td>
        <form method="post" action="/admin/usuarios/${a.id}/turma" class="form-troca">
          <select name="turma_id" onchange="this.form.submit()">
            <option value="">— sem turma —</option>
            ${opcoesTurma(dados.turmaOptions, a.turma_id)}
          </select>
        </form>
      </td>
      <td>${a.ativo ? '<span class="chip corrigido">Ativo</span>' : '<span class="chip atrasado">Inativo</span>'}</td>
      <td class="acoes-linha">
        <details class="dropdown">
          <summary class="btn texto">Redefinir senha</summary>
          <form method="post" action="/admin/usuarios/${a.id}/senha" class="form-dropdown">
            <input type="text" name="senha" placeholder="Nova senha" minlength="6" required>
            <button class="btn primario pequeno" type="submit">Salvar</button>
          </form>
        </details>
        <form method="post" action="/admin/usuarios/${a.id}/status" class="inline">
          <button class="btn texto" type="submit">${a.ativo ? 'Desativar' : 'Ativar'}</button>
        </form>
      </td>
    </tr>`
    )
    .join('');

  return `
  <div class="cartao-form aberto">
    <h3>Novo aluno (cadastro manual)</h3>
    <p class="dica">Normalmente o aluno se cadastra sozinho com o código da turma. Use este formulário apenas para cadastros manuais.</p>
    <form method="post" action="/admin/alunos" class="form-interno linha-tres">
      <div class="campo"><input type="text" id="nome-aluno" name="nome" placeholder=" " maxlength="120" required>
        <label for="nome-aluno">Nome completo</label></div>
      <div class="campo"><input type="email" id="email-aluno" name="email" placeholder=" " maxlength="160" required>
        <label for="email-aluno">E-mail</label></div>
      <div class="campo"><input type="text" id="senha-aluno" name="senha" placeholder=" " minlength="6" required>
        <label for="senha-aluno">Senha inicial</label></div>
      <div class="campo"><label for="al-turma" class="acima">Turma</label>
        <select id="al-turma" name="turma_id" required>
          <option value="">Escolha a turma</option>
          ${opcoesTurma(dados.turmaOptions)}
        </select></div>
      <div class="campo"><input type="text" id="matricula" name="matricula" placeholder=" " maxlength="30">
        <label for="matricula">Matrícula (opcional)</label></div>
      <div class="form-acoes"><button class="btn primario" type="submit">Criar aluno</button></div>
    </form>
  </div>
  <div class="tabela-envolve">
    <table class="tabela">
      <thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Situação</th><th></th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="5">Nenhum aluno cadastrado.</td></tr>'}</tbody>
    </table>
  </div>`;
}

function opcoesTurma(lista, selecionado) {
  return (lista || [])
    .map(
      (o) =>
        `<option value="${o.id}" ${Number(o.id) === Number(selecionado) ? 'selected' : ''}>${esc(o.rotulo)}</option>`
    )
    .join('');
}

/** Página do painel administrativo. */
function painelAdmin({ secao, dados, usuario }) {
  let conteudo = secaoTurmas(dados);
  if (secao === 'disciplinas') conteudo = secaoDisciplinas(dados);
  if (secao === 'professores') conteudo = secaoProfessores(dados);
  if (secao === 'vinculos') conteudo = secaoVinculos(dados);
  if (secao === 'alunos') conteudo = secaoAlunos(dados);

  return `
  <div class="cabecalho-secao">
    <div>
      <h1>Painel administrativo</h1>
      <p class="descricao">Cadastre turmas, matérias e professores, e defina quem leciona cada matéria.</p>
    </div>
  </div>
  ${seletorSecao(secao)}
  <div class="painel">${conteudo}</div>`;
}

module.exports = { painelAdmin };
