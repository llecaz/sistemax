/**
 * Ponto de entrada do sistema.
 * Sobe o PostgreSQL local (se AMBIENTE=local), prepara o banco
 * e inicia o servidor Express na porta definida no .env.
 */
require('dotenv').config();

const PRODUCAO =
  process.env.AMBIENTE === 'producao' ||
  process.env.VERCEL === '1' ||
  process.env.RENDER === 'true';

(async () => {
  // 1) Banco: PostgreSQL local embutido (desenvolvimento) ou externo (produção)
  let postgresLocal = null;
  try {
    if (!PRODUCAO && process.env.PG_LOCAL !== 'false') {
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
    if (process.env.PG_LOCAL === 'false') {
      console.error('   O banco externo (DATABASE_URL_LOCAL) não respondeu.');
      console.error('   Confirme que a instância do PostgreSQL em 5433 está no ar,');
      console.error('   ou remova PG_LOCAL=false para tentar o PostgreSQL embutido.');
    } else {
      console.error('   Falha ao iniciar o PostgreSQL local. Se este caminho falhar de novo,');
      console.error('   defina PG_LOCAL=false no .env e DATABASE_URL_LOCAL apontando para um');
      console.error('   PostgreSQL rodando nesta máquina (ou use .env para um banco externo).');
    }
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
    if (!PRODUCAO) {
      console.log('   Admin  → admin@escola.com / admin123');
      console.log('   Aluno  → ana@escola.com   / aluno123');
      console.log('   Prof.  → maria@escola.com / prof123');
      console.log('');
    }
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
