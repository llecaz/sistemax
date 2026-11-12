/**
 * Envio do link de confirmação de e-mail (usado no cadastro e no reenvio).
 * Invalida tokens anteriores do usuário e cria um token novo, de uso único,
 * válido por 24 horas.
 *
 * Retorna sempre { entregue, modo, link? }:
 * - SMTP configurado → { entregue: true,  modo: 'smtp' }
 * - Sem SMTP (dev local) → { entregue: false, modo: 'console', link }
 *   (o chamador decide se mostra o link na tela)
 */
const { query } = require('./db');
const { gerarTokenVerificacao } = require('./util');
const { enviarConfirmacaoEmail } = require('./email');

function baseUrlPublica(req) {
  const configurada = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (configurada) return configurada;
  return `${req.protocol}://${req.get('host')}`;
}

async function enviarLinkConfirmacao(req, usuario) {
  await query(`UPDATE verificacao_email SET usado_em = now() WHERE usuario_id = $1 AND usado_em IS NULL`, [
    usuario.id,
  ]);
  const { raw, hash } = gerarTokenVerificacao();
  await query(
    `INSERT INTO verificacao_email (usuario_id, token_hash, expira_em)
     VALUES ($1, $2, now() + interval '24 hours')`,
    [usuario.id, hash]
  );
  const link = `${baseUrlPublica(req)}/confirmar-email?token=${raw}`;
  const envio = await enviarConfirmacaoEmail({ para: usuario.email, nome: usuario.nome, link });
  return { ...envio, link };
}

module.exports = { enviarLinkConfirmacao };
