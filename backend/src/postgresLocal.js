/**
 * PostgreSQL "embutido" para desenvolvimento local.
 * Baixa os binários do PostgreSQL (via npm) e roda um servidor REAL
 * nesta máquina, na pasta .pglocal — sem sudo e sem Docker.
 * Usado apenas quando AMBIENTE=local no .env.
 */
const path = require('path');
const fs = require('fs');

const DIRETORIO = path.join(__dirname, '..', '..', '.pglocal');

async function iniciarPostgresLocal() {
  let EmbeddedPostgres;
  try {
    const modulo = require('embedded-postgres');
    EmbeddedPostgres = modulo.default || modulo;
  } catch {
    console.warn('⚠️  Pacote "embedded-postgres" não instalado — usando DATABASE_URL.');
    return null;
  }

  const url = new URL(process.env.DATABASE_URL_LOCAL || 'postgresql://sistemax:sistemax@127.0.0.1:5433/sistemax');
  const postgres = new EmbeddedPostgres({
    databaseDir: DIRETORIO,
    user: url.username,
    password: decodeURIComponent(url.password),
    port: Number(url.port || 5433),
    persistent: true,
    // Evita o encoding WIN1252 do locale do Windows (que não aceita emojis/UTF-8)
    initdbFlags: ['--encoding=UTF8'],
  });

  if (!fs.existsSync(path.join(DIRETORIO, 'PG_VERSION'))) {
    console.log('🗄️  Primeira execução: preparando o PostgreSQL local...');
    await postgres.initialise();
  }

  try {
    await postgres.start();
    console.log('🗄️  PostgreSQL local rodando na porta', url.port || 5433);
  } catch (erro) {
    // Já estava rodando (outra instância) — tudo bem.
    if (!/already|running|being started/i.test(String(erro.message))) throw erro;
  }

  const nomeBanco = url.pathname.replace('/', '');
  try {
    await postgres.createDatabase(nomeBanco);
  } catch (erro) {
    if (!/already exists/i.test(String(erro.message))) throw erro;
  }
  return postgres;
}

module.exports = { iniciarPostgresLocal };
