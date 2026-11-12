/**
 * Sessão de usuário (compartilhada entre rotas e o auto-login).
 * O cookie da sessão fica no PostgreSQL (connect-pg-simple); "lembrar de mim"
 * usa um token próprio, também no banco, ver lembrarSessao.js.
 */
const { temaOuPadrao } = require('./temas');

/** Abre a sessão do usuário (regenerando o sid — proteção contra fixation). */
function entrarNaSessao(req, usuario, manter) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) return reject(erro);
      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        matricula: usuario.matricula,
        turma_id: usuario.turma_id,
        turma_nome: usuario.turma_nome,
        foto: usuario.foto,
        pergunta_seg: usuario.pergunta_seg,
        criado_em: usuario.criado_em,
        email_verificado: Boolean(usuario.email_verificado),
        turma_pretendida_id: usuario.turma_pretendida_id || null,
        tema: temaOuPadrao(usuario.tema),
        lofi: Boolean(usuario.lofi),
      };
      if (manter) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
      else req.session.cookie.maxAge = null; // só enquanto o navegador abrir
      req.session.save((e) => (e ? reject(e) : resolve()));
    });
  });
}

module.exports = { entrarNaSessao };
