/**
 * "Lembrar de mim" — login automático entre visitas.
 *
 * Fluxo: ao entrar marcando a opção, o servidor cria um token aleatório
 * (32 bytes) e guarda APENAS o hash dele no banco (tabela lembrar_sessao).
 * O valor cru vai para um cookie HttpOnly `nuvia_lembrar` (90 dias).
 * Em requisições futuras sem sessão, o middleware `tentarAutoLogin`
 * valida o token (não expirado, usuário ativo), roda a sessão no PostgreSQL
 * e ROTACIONA o token (uso único por ciclo).
 * Nunca guardamos senhas, e a tabela pode ser apagada por completo caso o
 * usuário peça para sair de todas as sessões.
 */
const crypto = require('crypto');
const { um, query } = require('./db');
const { hashToken } = require('./util');
const { entrarNaSessao } = require('./sessao');

const COOKIE = 'nuvia_lembrar';
const DURACAO_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias

const LEMBRAR_DURACAO = "interval '90 days'";

const CONSULTA_USUARIO = `
  SELECT u.*, t.nome AS turma_nome
    FROM usuarios u
    LEFT JOIN turmas t ON t.id = u.turma_id`;

/** Cookie parsing manual (evita dependência extra). */
function lerCookie(req, nome) {
  const cabecalhos = String(req.headers.cookie || '');
  const trechos = cabecalhos.split(';');
  for (const trecho of trechos) {
    const i = trecho.indexOf('=');
    if (i < 0) continue;
    if (trecho.slice(0, i).trim() === nome) return decodeURIComponent(trecho.slice(i + 1).trim());
  }
  return null;
}

/** Cria um token de "lembrar de mim" para o usuário (no cookie fica o valor cru). */
async function criarLembrarSessao(usuarioId) {
  const raw = crypto.randomBytes(32).toString('hex');
  await query(
    `INSERT INTO lembrar_sessao (usuario_id, token_hash, expira_em)
     VALUES ($1, $2, now() + ${LEMBRAR_DURACAO})`,
    [usuarioId, hashToken(raw)]
  );
  return raw;
}

function definirCookie(res, raw) {
  res.cookie(COOKIE, raw, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DURACAO_MS,
    secure: 'auto',
  });
}

function limparCookie(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

/** Revoga UM token (o do dispositivo atual — ao sair da conta). */
async function revogarLembrarSessao(raw) {
  if (!raw || typeof raw !== 'string' || raw.length > 200) return;
  await query(`DELETE FROM lembrar_sessao WHERE token_hash = $1`, [hashToken(raw)]);
}

/** Revoga TODOS os tokens do usuário (ao trocar a senha ou ao admin desativá-lo). */
async function revogarTodas(usuarioId) {
  await query(`DELETE FROM lembrar_sessao WHERE usuario_id = $1`, [usuarioId]);
}

/**
 * Middleware: se a sessão estiver ativa, não faz nada; senão, tenta o token
 * de "lembrar de mim" e abre a sessão automaticamente.
 */
async function tentarAutoLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();

  const raw = lerCookie(req, COOKIE);
  if (!raw) return next();

  try {
    const registro = await um(
      `SELECT l.id, l.usuario_id
         FROM lembrar_sessao l
        WHERE l.token_hash = $1
          AND l.expira_em > now()`,
      [hashToken(raw)]
    );
    if (!registro) {
      limparCookie(res);
      return next();
    }

    const usuario = await um(`${CONSULTA_USUARIO} WHERE u.id = $1 AND u.ativo`, [registro.usuario_id]);
    if (!usuario) {
      await query(`DELETE FROM lembrar_sessao WHERE id = $1`, [registro.id]);
      limparCookie(res);
      return next();
    }

    // Sessão aberta a partir do banco
    await entrarNaSessao(req, usuario, true);

    // Rotaciona o token (o valor usado é apagado e um novo é emitido)
    const rawNovo = crypto.randomBytes(32).toString('hex');
    await query(
      `UPDATE lembrar_sessao
          SET token_hash = $1, expira_em = now() + ${LEMBRAR_DURACAO}
        WHERE id = $2`,
      [hashToken(rawNovo), registro.id]
    );
    definirCookie(res, rawNovo);

    return next();
  } catch (erro) {
    console.error('[lembrar-sessao]', erro);
    return next();
  }
}

module.exports = {
  COOKIE,
  criarLembrarSessao,
  tentarAutoLogin,
  revogarLembrarSessao,
  revogarTodas,
  definirCookie,
  limparCookie,
};
