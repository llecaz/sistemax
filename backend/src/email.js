/**
 * Envio de e-mails transacionais (confirmação de cadastro e códigos de
 * acesso à turma).
 *
 * Duas situações:
 *
 * 1) SMTP configurado (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS /
 *    SMTP_FROM) — envia de verdade via nodemailer. Vale para Gmail
 *    (senha de app), Brevo, Resend SMTP, SendGrid etc.
 *
 * 2) Sem SMTP (desenvolvimento local) — o e-mail é impresso no console do
 *    servidor com o assunto e o conteúdo (incluindo link e código).
 *    Nenhum e-mail real sai da máquina.
 *
 * Em produção sem SMTP, o envio falha com um erro claro em vez de fingir
 * que enviou.
 */
const nodemailer = require('nodemailer');

const EM_PRODUCAO =
  process.env.AMBIENTE === 'producao' ||
  process.env.VERCEL === '1' ||
  process.env.RENDER === 'true';

function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function criarTransporte() {
  const porta = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || porta === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Envia um e-mail. Retorna { entregue: true|false, modo: 'smtp'|'console' }.
 * Em produção sem SMTP, lança erro (a chamadora decide como reagir).
 */
async function enviarEmail({ para, assunto, texto, html }) {
  const remetente = process.env.SMTP_FROM || `Nuvia <no-reply@localhost>`;

  if (!smtpConfigurado()) {
    if (EM_PRODUCAO) {
      // Produção sem SMTP: falha controlada com código claro, sem fingir envio.
      return { entregue: false, modo: 'nao-configurado' };
    }
    console.log('');
    console.log('📧 [email — SMTP não configurado: impresso no console, nada foi enviado]');
    console.log(`   Para:     ${para}`);
    console.log(`   Assunto:  ${assunto}`);
    console.log('   ----------------------------------------------------------');
    console.log(`   ${String(texto).split('\n').join('\n   ')}`);
    console.log('   ----------------------------------------------------------');
    console.log('');
    return { entregue: false, modo: 'console' };
  }

  const transporte = criarTransporte();
  await transporte.sendMail({ from: remetente, to: para, subject: assunto, text: texto, html });
  return { entregue: true, modo: 'smtp' };
}

/** E-mail com o link de confirmação do cadastro. */
async function enviarConfirmacaoEmail({ para, nome, link }) {
  const assunto = 'Nuvia — confirme seu e-mail';
  const texto = [
    `Olá, ${nome}!`,
    '',
    'Recebemos o seu cadastro no Nuvia (o cantinho de estudos da escola).',
    'Para confirmar o seu e-mail institucional, abra o link abaixo:',
    '',
    `   ${link}`,
    '',
    'O link vale por 24 horas e só pode ser usado uma vez.',
    'Se você não criou esta conta, ignore esta mensagem.',
  ].join('\n');
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#241f3a">
      <h1 style="font-size:20px;margin:0 0 12px">Nuvia — confirme seu e-mail</h1>
      <p>Olá, <strong>${escapeHtml(nome)}</strong>!</p>
      <p>Recebemos o seu cadastro no Nuvia. Para confirmar o seu e-mail institucional, clique no botão abaixo:</p>
      <p style="margin:20px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#b388f5;color:#241f3a;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:700">Confirmar meu e-mail</a></p>
      <p style="font-size:12px;color:#6f6789">O link vale por 24 horas e só pode ser usado uma vez. Se você não criou esta conta, ignore esta mensagem.</p>
    </div>`;
  return enviarEmail({ para, assunto, texto, html });
}

/** E-mail com o código de acesso à turma solicitada. */
async function enviarCodigoTurma({ para, nome, turma, codigo, validadeDias }) {
  const assunto = `Nuvia — seu código de acesso à turma ${turma}`;
  const texto = [
    `Olá, ${nome}!`,
    '',
    `Você pediu o código de acesso à turma ${turma} no Nuvia.`,
    `O seu código (uso único, válido por ${validadeDias} dias) é:`,
    '',
    `   ${codigo}`,
    '',
    'Para entrar na turma, acesse o Nuvia, vá até o início e digite o código',
    'no campo "Entrar em uma turma com código".',
    '',
    'Um abraço,',
    'Equipe Nuvia',
  ].join('\n');
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#241f3a">
      <h1 style="font-size:20px;margin:0 0 12px">Nuvia — código de acesso à turma ${escapeHtml(turma)}</h1>
      <p>Olá, <strong>${escapeHtml(nome)}</strong>!</p>
      <p>Você pediu o código de acesso à turma <strong>${escapeHtml(turma)}</strong>. O seu código (uso único, válido por ${Number(validadeDias) || 7} dias) é:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;background:#efe7ff;border-radius:12px;padding:14px 18px;display:inline-block;margin:8px 0 4px">${escapeHtml(codigo)}</p>
      <p style="font-size:13px;color:#6f6789">Para entrar na turma, acesse o Nuvia e digite o código no campo “Entrar em uma turma com código”.</p>
    </div>`;
  const envio = await enviarEmail({ para, assunto, texto, html });
  return { ...envio, codigo };
}

function escapeHtml(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  smtpConfigurado,
  enviarEmail,
  enviarConfirmacaoEmail,
  enviarCodigoTurma,
};
