/**
 * PostgreSQL "embutido" para desenvolvimento local.
 * Baixa os binários do PostgreSQL (via npm) e roda um servidor REAL
 * nesta máquina, na pasta .pglocal — sem sudo e sem Docker.
 * Usado apenas quando AMBIENTE=local no .env.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Pasta de dados do PostgreSQL local.
 *
 * O initdb do PostgreSQL no Windows não lida bem com caminhos que tenham
 * acentos (ex.: "Programação"). Nesses casos usamos uma pasta neutra no
 * diretório temporário do sistema. Também dá para escolher manualmente com
 * a variável PG_LOCAL_DIR.
 */
function pastaDeDados() {
  if (process.env.PG_LOCAL_DIR) return path.resolve(process.env.PG_LOCAL_DIR);
  const preferida = path.join(__dirname, '..', '..', '.pglocal');
  if (!/[^\x00-\x7F]/.test(preferida)) return preferida;
  // Hash do caminho do projeto: cada cópia do sistema ganha sua própria pasta
  // e não disputa o mesmo banco com outro projeto aberto na máquina.
  const hash = require('crypto').createHash('sha1').update(preferida).digest('hex').slice(0, 8);
  return path.join(os.tmpdir(), `sistemax-pglocal-${hash}`);
}

const DIRETORIO = pastaDeDados();

/**
 * O initdb (e o postgres de bootstrap) falha no Windows quando o diretório
 * de trabalho do processo tem acentos — mesmo com caminhos de dados
 * puramente ASCII. Se o cwd atual tiver caracteres fora de ASCII, mudamos
 * para uma pasta neutra apenas durante o bootstrap.
 */
function cwdNeutro() {
  try {
    const atual = process.cwd();
    if (!/[^\x00-\x7F]/.test(atual)) return null;
    const seguro = path.join(os.tmpdir(), 'sistemax-cwd-neutro');
    fs.mkdirSync(seguro, { recursive: true });
    process.chdir(seguro);
    return atual;
  } catch {
    return null;
  }
}

function restaurarCwd(anterior) {
  if (!anterior) return;
  try {
    process.chdir(anterior);
  } catch {}
}

async function iniciarPostgresLocal() {
  let EmbeddedPostgres;
  try {
    // Quando o projeto está numa pasta com acentos, carregamos o pacote
    // pela junção ASCII para que o initdb receba caminhos sem acentos.
    const { carregarEmbeddedPostgres } = require('./embeddedPostgresAscii');
    const modulo = await carregarEmbeddedPostgres();
    EmbeddedPostgres = modulo.default || modulo.EmbeddedPostgres || modulo;
  } catch (erro) {
    console.warn('⚠️  Não foi possível inicializar o PostgreSQL local:', erro.message);
    console.warn('   Usando DATABASE_URL_LOCAL diretamente, se definida.');
    return null;
  }

  const url = new URL(process.env.DATABASE_URL_LOCAL || 'postgresql://sistemax:sistemax@127.0.0.1:5433/sistemax');
  const postgres = new EmbeddedPostgres({
    databaseDir: DIRETORIO,
    user: url.username,
    password: decodeURIComponent(url.password),
    port: Number(url.port || 5433),
    persistent: true,
    // Evita o encoding WIN1252 do locale do Windows (que não aceita emojis/UTF-8).
    // O locale "C" é universal e não depende do idioma configurado na máquina —
    // sem ele o initdb falha em sistemas com locale pt_BR.1252.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

  if (!fs.existsSync(path.join(DIRETORIO, 'PG_VERSION'))) {
    console.log('🗄️  Primeira execução: preparando o PostgreSQL local...');
    const cwdAnterior = cwdNeutro();
    try {
      await postgres.initialise();
    } finally {
      restaurarCwd(cwdAnterior);
    }
  }

  try {
    const cwdAnterior = cwdNeutro();
    try {
      await postgres.start();
    } finally {
      restaurarCwd(cwdAnterior);
    }
    console.log('🗄️  PostgreSQL local rodando na porta', url.port || 5433);
  } catch (erro) {
    // Já estava rodando (outra instância) — tudo bem.
    if (!/already|running|being started/i.test(String(erro && erro.message))) throw erro;
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
