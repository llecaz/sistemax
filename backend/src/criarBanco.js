/**
 * Cria as tabelas (schema.sql) e prepara o banco.
 *
 * - Em produção (AMBIENTE=producao ou VERCEL=1): NUNCA insere os dados de
 *   exemplo. Apenas cria/atualiza o schema e, se configurado, cria o
 *   primeiro administrador a partir das variáveis ADMIN_*.
 * - Em desenvolvimento: continua inserindo o seed quando o banco está vazio.
 *
 * Uso: npm run criar-banco   |   também é chamado no início do servidor.
 */
const fs = require('fs');
const path = require('path');
const { pool, query, um, AMBIENTE, PRODUCAO } = require('./db');

/**
 * Dados de referência que o sistema precisa para funcionar:
 * as 14 matérias oficiais e a turma "1º DSB". Idempotente — pode rodar
 * a cada inicialização, sem duplicar nada.
 */
const MATERIAS_OFICIAIS = [
  'Introdução a Programação',
  'Introdução a Computação',
  'Análise e Métodos de Sistemas',
  'Banco de Dados',
  'Ed Dig Comp Prog e Ia',
  'Lógica Computacional',
  'Química',
  'Matemática',
  'Língua Portuguesa',
  'Língua Inglesa',
  'Geografia',
  'Educação Física',
  'Biologia',
  'Artes',
];

async function garantirDadosBase() {
  for (const nome of MATERIAS_OFICIAIS) {
    await query(`INSERT INTO disciplinas (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING`, [nome]);
  }
  const turma = await um(`SELECT id FROM turmas WHERE nome = $1`, ['1º DSB']);
  if (!turma) {
    const { gerarCodigoTurma } = require('./util');
    await query(`INSERT INTO turmas (nome, codigo, ativa) VALUES ($1, $2, TRUE) ON CONFLICT (codigo) DO NOTHING`, [
      '1º DSB',
      gerarCodigoTurma('1DSB'),
    ]);
    console.log('🏫 Turma 1º DSB garantida (criada agora; novas turmas também pelo admin).');
  }
}

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

/**
 * Em produção não existe "cadastro de admin" público. Se ainda não houver
 * nenhum administrador e as variáveis estiverem definidas, criamos um.
 * Sem ADMIN_EMAIL/ADMIN_SENHA o site sobe normalmente, mas ninguém administra
 * até que essas variáveis sejam configuradas.
 */
async function garantirAdmin() {
  const res = await query(`SELECT count(*)::int AS total FROM usuarios WHERE tipo = 'admin'`);
  if (res.rows[0].total > 0) return false;

  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senha = String(process.env.ADMIN_SENHA || '');
  const nome = String(process.env.ADMIN_NOME || 'Administrador').trim() || 'Administrador';

  if (!email || senha.length < 8) {
    console.warn(
      '⚠️  Nenhum administrador cadastrado. Defina ADMIN_EMAIL e ADMIN_SENHA (mín. 8 caracteres) para criar o primeiro admin.'
    );
    return false;
  }

  const { hash } = require('./auth');
  await query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo, ativo)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [nome, email, hash(senha)]
  );
  console.log('👑 Administrador inicial criado a partir das variáveis ADMIN_*.');
  return true;
}

async function prepararBanco() {
  await criarTabelas();
  await garantirDadosBase();

  // Limpeza barata de sessões e tokens vencidos (útil em serverless).
  await query(`DELETE FROM session WHERE expire < now()`);
  await query(`DELETE FROM lembrar_sessao WHERE expira_em < now()`);
  await query(`DELETE FROM verificacao_email WHERE expira_em < now() OR usado_em IS NOT NULL`);
  await query(`DELETE FROM codigos_turma_acesso WHERE expira_em < now()`);

  const vazio = await bancoVazio();
  let semeado = false;
  if (vazio && !PRODUCAO && process.env.SEED_DEMO !== 'false') {
    console.log('🌱 Banco vazio: inserindo dados de exemplo...');
    await require('./seed').semear();
    semeado = true;
  }

  let adminCriado = false;
  if (PRODUCAO) adminCriado = await garantirAdmin();

  return { vazio, semeado, adminCriado, ambiente: AMBIENTE };
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

module.exports = { criarTabelas, prepararBanco, garantirAdmin };
