/** Painel exibido ao aluno que ainda não entrou em nenhuma turma. */
const { esc } = require('../util');

const SVG_ESCOLA = `<svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v9h14v-9"/><path d="M9.5 19v-5h5v5"/><path d="M4 22h16"/></svg>`;

function alunoSemTurma({ usuario, turmas, emailVerificado }) {
  const email = esc(usuario.email || '');
  const pretendida = Number(usuario.turma_pretendida_id || 0);

  const verificadoBloco = emailVerificado
    ? `
      <p>Escolha a turma que você vai entrar. Enviaremos o <strong>código de acesso</strong> para <strong>${email}</strong>.</p>
      <form method="post" action="/aluno/solicitar-codigo-turma" class="sem-turma-form">
        <label class="sem-turma-label" for="turma">Turma</label>
        <select id="turma" name="turma" required>
          <option value="">Selecione a turma…</option>
          ${turmas
            .map(
              (t) =>
                `<option value="${Number(t.id)}"${Number(t.id) === pretendida ? ' selected' : ''}>${esc(t.nome)}</option>`
            )
            .join('')}
        </select>
        <button class="btn primario" type="submit">Enviar código para o meu e-mail</button>
      </form>
      <div class="sem-turma-divisor"><span>já tem o código?</span></div>
      <form method="post" action="/aluno/entrar-turma" class="sem-turma-form">
        <label class="sem-turma-label" for="codigo">Código de acesso</label>
        <input id="codigo" name="codigo" type="text" inputmode="latin" autocomplete="off" autocapitalize="characters" placeholder="Ex.: K7X2M9QA" required>
        <button class="btn" type="submit">Entrar na turma</button>
      </form>
      <p class="sem-turma-dica">O código vale por 7 dias e só pode ser usado uma vez. Se não receber em alguns minutos, veja o console do servidor (modo sem SMTP) ou peça para a escola reenviar.</p>`
    : `
      <p>Antes de liberar o acesso, confirme o seu <strong>e-mail institucional</strong>. Enviamos um link de confirmação para <strong>${email}</strong> quando você criou a conta.</p>
      <form method="post" action="/aluno/reenviar-confirmacao" class="sem-turma-form">
        <button class="btn primario" type="submit">Reenviar e-mail de confirmação</button>
      </form>
      <p class="sem-turma-dica">Confira também a caixa de spam. O link vale por 24 horas.</p>`;

  return `<div class="sem-turma">
    <div class="sem-turma-card">
      <div class="vazio-icone" aria-hidden="true">${SVG_ESCOLA}</div>
      <h3>Você ainda não está em nenhuma turma</h3>
      ${verificadoBloco}
    </div>
  </div>`;
}

module.exports = { alunoSemTurma };
