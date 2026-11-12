/** Configuração do Express: sessões, middlewares, rotas e arquivos estáticos. */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const path = require('path');

const { pool, query, AMBIENTE, PRODUCAO } = require('./db');
const { homeDo } = require('./paginas/layout');
const { provedorConfigurado } = require('./oauth');

const app = express();

const producao = PRODUCAO;
if (producao) app.set('trust proxy', 1); // Vercel/Render/proxy reverso
app.set('view engine', false); // as páginas são montadas em JS
app.disable('x-powered-by');

/* ---------- Cabeçalhos de segurança básicos ---------- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

/* ---------- Sessões (guardadas no PostgreSQL) ---------- */
const segredo = process.env.SESSION_SECRET;
if (producao && (!segredo || segredo.length < 32)) {
  throw new Error('Defina SESSION_SECRET com pelo menos 32 caracteres nas variáveis de ambiente de produção.');
}

const PgSession = connectPg(session);
app.use(
  session({
    store: new PgSession({
      pool,
      table: 'session',
      // Em serverless o processo é curto; a limpeza é feita no preparo do banco.
      pruneSessionInterval: producao ? false : 10 * 60,
    }),
    name: 'sistemax.sid',
    secret: segredo || 'sistemax-credencial-temporaria',
    resave: false,
    saveUninitialized: false,
    proxy: producao,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto',
      maxAge: null, // sessão do navegador (muda p/ 30 dias no "manter conectado")
    },
  })
);

/* ---------- "Lembrar de mim" — auto-login pelo cookie ---------- */
app.use(require('./lembrarSessao').tentarAutoLogin);

/* ---------- Corpo das requisições ---------- */
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

/* ---------- Página inicial (frontend/index.html) ---------- */
app.get('/', (req, res) => {
  if (req.session && req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
});

/* ---------- Arquivos estáticos (frontend/) ---------- */
app.use(
  express.static(path.join(__dirname, '..', '..', 'frontend'), {
    maxAge: producao ? '1h' : 0,
    etag: true,
    index: false, // a raiz "/" é servida pela rota acima
  })
);

/* ---------- Diagnóstico simples (sem dados sensíveis) ---------- */
app.get('/saude', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({
      ok: true,
      ambiente: AMBIENTE,
      oauth: {
        google: provedorConfigurado('google'),
        github: provedorConfigurado('github'),
      },
    });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Fotos de perfil: primeiro procura no banco (produção/serverless) e,
// se não encontrar, cai para os arquivos antigos em disco (desenvolvimento).
app.get('/fotos/:nome', async (req, res, next) => {
  try {
    const foto = await query(
      `SELECT foto_dados, foto_tipo FROM usuarios WHERE foto = $1 LIMIT 1`,
      [req.params.nome]
    );
    const registro = foto.rows[0];
    if (registro && registro.foto_dados) {
      res.setHeader('Content-Type', registro.foto_tipo || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(registro.foto_dados);
    }
  } catch (erro) {
    console.error('[fotos]', erro.message);
  }
  next();
});
app.use(
  '/fotos',
  express.static(path.join(__dirname, '..', 'uploads', 'fotos'), {
    maxAge: '1 day',
    fallthrough: true,
  })
);

/* ---------- Rotas ---------- */
app.use('/', require('./rotas/authRotas'));
app.use('/foco', require('./rotas/focoRotas'));
app.use('/aluno', require('./rotas/alunoRotas'));
app.use('/professor', require('./rotas/professorRotas'));
app.use('/admin', require('./rotas/adminRotas'));
app.use('/configuracoes', require('./rotas/configRotas'));
app.use('/arquivos', require('./rotas/arquivoRotas'));

/* ---------- Erro de rota desconhecida ---------- */
app.use((req, res) => {
  const usuario = req.session && req.session.usuario;
  if (usuario) {
    const destino = usuario.tipo === 'admin' ? '/admin' : usuario.tipo === 'professor' ? '/professor' : '/aluno';
    req.session.flash = [{ tipo: 'erro', texto: 'Página não encontrada.' }];
    return res.redirect(destino);
  }
  res.status(404).send(
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>404</title>
     <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
     <link rel="stylesheet" href="/estilo.css"></head>
     <body class="tela-login"><div class="login-cartao"><h1>404</h1>
     <p class="subtitulo">Página não encontrada.</p><a class="btn primario" href="/">Voltar ao início</a></div></body></html>`
  );
});

/* ---------- Erros internos ---------- */
app.use((erro, req, res, next) => {
  console.error('[servidor]', erro);
  if (res.headersSent) return next(erro);
  const texto =
    erro.code === 'LIMIT_FILE_SIZE'
      ? 'Arquivo muito grande.'
      : 'Ocorreu um erro inesperado. Tente novamente.';
  if (req.session) req.session.flash = [{ tipo: 'erro', texto }];
  res.redirect('/');
});

module.exports = app;
