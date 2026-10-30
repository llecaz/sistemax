/** Regras de status dos trabalhos (entrega × prazo × correção). */

/**
 * Classifica uma atividade do ponto de vista do aluno.
 * @param {{prazo, enviado_em, entrega_id, nota}} a
 */
function classificar(a) {
  const agora = new Date();
  const temEntrega = !!a.entrega_id;
  const corrigido = temEntrega && a.nota !== null && a.nota !== undefined;
  const prazo = a.prazo ? new Date(a.prazo) : null;
  const entregueEm = temEntrega && a.enviado_em ? new Date(a.enviado_em) : null;
  const vencido = prazo ? agora.getTime() > prazo.getTime() : false;
  const atrasado = vencido && (!temEntrega || (entregueEm && entregueEm.getTime() > prazo.getTime()));
  return {
    temEntrega,
    corrigido,
    vencido,
    atrasado,
    aguardando: temEntrega && !corrigido,
    foraDoPrazo: !!(entregueEm && prazo && entregueEm.getTime() > prazo.getTime()),
  };
}

/** Quais abas devem exibir a atividade. */
function abasDe(a) {
  const s = classificar(a);
  const abas = ['todos'];
  if (s.aguardando) abas.push('nao-corrigidos');
  if (s.corrigido) abas.push('corrigidos');
  if (s.atrasado) abas.push('atrasados');
  return { abas, s };
}

const ROTULOS_ABA = {
  todos: 'Todos',
  'nao-corrigidos': 'Não corrigidos',
  corrigidos: 'Corrigidos',
  atrasados: 'Atrasados',
};

module.exports = { classificar, abasDe, ROTULOS_ABA };
