/** Teste rápido de conexão com o PostgreSQL. Uso: node src/testarConexao.js */
const { pool } = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW() AS agora, version() AS versao');
    console.log('✅ Conectado ao PostgreSQL!');
    console.log('   Hora do servidor:', res.rows[0].agora);
    console.log('   Versão:', res.rows[0].versao.split(' ').slice(0, 2).join(' '));
    const tabelas = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    console.log('   Tabelas existentes:', tabelas.rows.map((t) => t.table_name).join(', ') || '(nenhuma)');
    await pool.end();
    process.exit(0);
  } catch (erro) {
    console.error('❌ Falha na conexão:', erro.message);
    process.exit(1);
  }
})();
