/**
 * Conexão com o banco de dados PostgreSQL (pool de conexões).
 * A URL escolhida vem do .env conforme AMBIENTE:
 *   - local      → DATABASE_URL_LOCAL  (PostgreSQL desta máquina)
 *   - producao   → DATABASE_URL_PRODUCAO (banco externo, ex.: Render)
 */
require('dotenv').config();
const { Pool } = require('pg');

const AMBIENTE = process.env.AMBIENTE === 'producao' ? 'producao' : 'local';
const DATABASE_URL =
  (AMBIENTE === 'producao' ? process.env.DATABASE_URL_PRODUCAO : process.env.DATABASE_URL_LOCAL) ||
  process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Nenhuma variável DATABASE_URL definida. Copie .env.exemplo para .env.');
  process.exit(1);
}

const ehExterna = !/127\.0\.0\.1|localhost|::1/.test(DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Bancos externos (Render, Neon...) exigem SSL.
  ssl: ehExterna ? (process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false }) : false,
  max: 10,
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

module.exports = { pool, query, um, todos, AMBIENTE, DATABASE_URL };
