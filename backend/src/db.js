/**
 * Conexão com o banco de dados PostgreSQL (pool de conexões).
 * A URL escolhida vem do .env conforme AMBIENTE:
 *   - local      → DATABASE_URL_LOCAL  (PostgreSQL desta máquina)
 *   - producao   → DATABASE_URL_PRODUCAO (banco externo, ex.: Render)
 */
require('dotenv').config();
const { Pool } = require('pg');

// Em produção (Vercel, Render ou ambiente=producao) nunca usamos o
// PostgreSQL embutido nem os dados de exemplo. VERCEL/RENDER são definidos
// automaticamente por cada plataforma.
const PRODUCAO =
  process.env.AMBIENTE === 'producao' ||
  process.env.VERCEL === '1' ||
  process.env.RENDER === 'true';
const AMBIENTE = PRODUCAO ? 'producao' : 'local';
const DATABASE_URL =
  (PRODUCAO
    ? process.env.DATABASE_URL || process.env.DATABASE_URL_PRODUCAO
    : process.env.DATABASE_URL_LOCAL) || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  const mensagem =
    'Nenhuma variável de banco definida. Em produção use DATABASE_URL (ou DATABASE_URL_PRODUCAO); ' +
    'localmente copie .env.exemplo para .env.';
  console.error('❌ ' + mensagem);
  if (PRODUCAO) throw new Error(mensagem);
  process.exit(1);
}

const ehExterna = !/127\.0\.0\.1|localhost|::1/.test(DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Bancos externos (Neon, Supabase, Render...) exigem SSL.
  ssl: ehExterna ? (process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false }) : false,
  // Funções serverless abrem várias instâncias; um pool pequeno evita
  // esgotar as conexões do banco.
  max: PRODUCAO ? 3 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

pool.on('error', (erro) => {
  console.error('[PG] Erro no pool de conexões:', erro.message);
});

/** Executa uma consulta SQL e devolve o resultado do pg. */
function query(texto, params) {
  return pool.query(texto, params);
}

/** Busca uma única linha (ou null). */
async function um(texto, params) {
  const res = await pool.query(texto, params);
  return res.rows[0] || null;
}

/** Busca uma lista de linhas. */
async function todos(texto, params) {
  const res = await pool.query(texto, params);
  return res.rows;
}

module.exports = { pool, query, um, todos, AMBIENTE, PRODUCAO, DATABASE_URL };
