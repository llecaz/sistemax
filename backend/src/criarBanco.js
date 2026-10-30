/**
 * Cria as tabelas (schema.sql) e, se o banco estiver vazio,
 * insere os dados de exemplo para teste.
 * Uso: npm run criar-banco   |   também é chamado no início do servidor.
 */
const fs = require('fs');
const path = require('path');
const { pool, query, AMBIENTE } = require('./db');

async function criarTabelas() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(sql);
}

async function bancoVazio() {
  const res = await query(
    `SELECT NOT EXISTS (SELECT 1 FROM usuarios) AND
            NOT EXISTS (SELECT 1 FROM turmas) AS vazio`
  );
  return res.rows[0].vazio;
}

async function prepararBanco() {
  await criarTabelas();
  const vazio = await bancoVazio();
  if (vazio) {
    console.log('🌱 Banco vazio: inserindo dados de exemplo...');
    await require('./seed').semear();
  }
  return { vazio, ambiente: AMBIENTE };
}

/** Executa direto (CLI). */
if (require.main === module) {
  (async () => {
    try {
      const r = await prepararBanco();
      console.log('✅ Banco pronto.', r);
      await pool.end();
      process.exit(0);
    } catch (erro) {
      console.error('❌ Erro ao preparar o banco:', erro.message);
      process.exit(1);
    }
  })();
}

module.exports = { criarTabelas, prepararBanco };
