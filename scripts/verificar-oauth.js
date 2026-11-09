/**
 * Mostra se o login social está configurado e quais URLs de retorno devem
 * ser cadastradas no Google e no GitHub.
 *
 * Uso: npm run verificar-oauth
 * Não exibe segredos — apenas "configurado" ou "faltando".
 */
require('dotenv').config();
const path = require('path');
const { PROVEDORES, provedorConfigurado } = require(path.join(__dirname, '..', 'backend', 'src', 'oauth'));

const base = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

console.log('');
console.log(`URL base (SITE_URL): ${base}`);
console.log('');

let faltando = 0;
for (const id of ['google', 'github']) {
  const p = PROVEDORES[id];
  const ok = provedorConfigurado(id);
  if (!ok) faltando++;
  console.log(`${p.nome}: ${ok ? '✅ configurado' : '❌ faltando credenciais'}`);
  console.log(`  Callback para cadastrar no provedor: ${p.redirectUri(base)}`);
  console.log('');
}

if (faltando) {
  console.log('Para ativar, preencha no .env (ou no painel da Vercel):');
  console.log('  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET');
  console.log('  GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET');
  console.log('Depois reinicie o servidor (npm start).');
  console.log('Passo a passo: COMO-CONFIGURAR-LOGIN-SOCIAL.md');
} else {
  console.log('Tudo pronto. Reinicie o servidor e teste os botões na tela de login.');
}
console.log('');
