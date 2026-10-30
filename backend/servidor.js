/**
 * Ponto de entrada do sistema.
 * Sobe o PostgreSQL local (se AMBIENTE=local), prepara o banco
 * e inicia o servidor Express na porta definida no .env.
 */
require('dotenv').config();

(async () => {
  // 1) Banco: PostgreSQL local embutido (desenvolvimento) ou externo (produção)
  let postgresLocal = null;
  try {
    if (process.env.AMBIENTE !== 'producao') {
      const { iniciarPostgresLocal } = require('./src/postgresLocal');
      postgresLocal = await iniciarPostgresLocal();
    }
  } catch (erro) {
    console.error('❌ Falha ao iniciar o PostgreSQL local:', erro.message);
    console.error('   Defina AMBIENTE=producao no .env para usar o banco externo.');
    process.exit(1);
  }

  // 2) Tabelas + dados de exemplo (se o banco estiver vazio)
  try {
    const { prepararBanco } = require('./src/criarBanco');
    await prepararBanco();
  } catch (erro) {
    console.error('❌ Falha ao preparar o banco de dados:', erro.message);
    console.error('   Verifique o DATABASE_URL no arquivo .env');
    process.exit(1);
  }

  // 3) Servidor web
  const app = require('./src/app');
  const PORTA = Number(process.env.PORT) || 3000;

  const servidor = app.listen(PORTA, '0.0.0.0', () => {
    const rede = require('os').networkInterfaces();
    const ip = Object.values(rede)
      .flat()
      .find((i) => i.family === 'IPv4' && !i.internal);
    console.log('');
    console.log('✅ Sistema no ar!');
    console.log(`   Local ....... http://localhost:${PORTA}`);
    if (ip) console.log(`   Na rede ..... http://${ip.address}:${PORTA}`);
    console.log('');
    console.log('   Admin  → admin@escola.com / admin123');
    console.log('   Aluno  → ana@escola.com   / aluno123');
    console.log('   Prof.  → maria@escola.com / prof123');
    console.log('');
  });

  const encerrar = async () => {
    console.log('\nEncerrando...');
    servidor.close(async () => {
      try {
        const { pool } = require('./src/db');
        await pool.end();
      } catch {}
      try {
        if (postgresLocal) await postgresLocal.stop();
      } catch {}
      process.exit(0);
    });
  };
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
})().catch((erro) => {
  console.error('❌ Erro fatal:', erro);
  process.exit(1);
});
