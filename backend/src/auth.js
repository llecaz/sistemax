/**
 * Autenticação: senhas (scrypt + salt), perguntas de segurança
 * e proteção de rotas por perfil de usuário.
 */
const crypto = require('crypto');
const { um } = require('./db');

/** Gera o hash de uma senha/resposta no formato "scrypt$salt$hash". */
function hash(valor) {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(String(valor), salt, 64).toString('hex');
  return `scrypt$${salt}$${digest}`;
}

/** Compara um valor puro com o hash salvo (tempo constante). */
function conferir(valor, hashSalvo) {
  if (!hashSalvo) return false;
  const partes = String(hashSalvo).split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  try {
    const calculado = crypto.scryptSync(String(valor), partes[1], 64);
    const guardado = Buffer.from(partes[2], 'hex');
    return calculado.length === guardado.length && crypto.timingSafeEqual(calculado, guardado);
  } catch {
    return false;
  }
}

/** Token aleatório para "manter conectado". */
function tokenAleatorio() {
  return crypto.randomBytes(32).toString('hex');
}

/** Exige usuário logado; redireciona para o login se não houver sessão. */
function exigeLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect('/?aviso=Precisa_fazer_login');
  }
  next();
}

/** Exige um perfil específico: exigePerfil('admin'), exigePerfil('aluno','professor'). */
function exigePerfil(...perfis) {
  return (req, res, next) => {
    if (!req.session || !req.session.usuario) return res.redirect('/?aviso=Precisa_fazer_login');
    if (!perfis.includes(req.session.usuario.tipo)) {
      req.session.flash = [{ tipo: 'erro', texto: 'Você não tem permissão para acessar essa página.' }];
      return res.redirect(req.session.usuario.tipo === 'admin' ? '/admin' : req.session.usuario.tipo === 'professor' ? '/professor' : '/aluno');
    }
    next();
  };
}

/** Limita tentativas de login por e-mail (em memória, proteção contra força bruta). */
const tentativas = new Map();
function podeTentar(chave) {
  const agora = Date.now();
  const lista = (tentativas.get(chave) || []).filter((t) => agora - t < 15 * 60 * 1000);
  tentativas.set(chave, lista);
  return lista.length < 5;
}
function registrarTentativa(chave) {
  const agora = Date.now();
  const lista = (tentativas.get(chave) || []).filter((t) => agora - t < 15 * 60 * 1000);
  lista.push(agora);
  tentativas.set(chave, lista);
}
function limparTentativas(chave) {
  tentativas.delete(chave);
}

/** Busca o usuário completo (para views). */
function usuarioDaSessao(req) {
  return req.session.usuario || null;
}

async function carregarUsuario(id) {
  return um(
    `SELECT u.id, u.nome, u.email, u.tipo, u.matricula, u.turma_id, u.foto, u.ativo,
            t.nome AS turma_nome, t.codigo AS turma_codigo
       FROM usuarios u
       LEFT JOIN turmas t ON t.id = u.turma_id
      WHERE u.id = $1`,
    [id]
  );
}

module.exports = {
  hash,
  conferir,
  tokenAleatorio,
  exigeLogin,
  exigePerfil,
  podeTentar,
  registrarTentativa,
  limparTentativas,
  usuarioDaSessao,
  carregarUsuario,
};
