/** Configuração do Express: sessões, middlewares, rotas e arquivos estáticos. */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const connectPg = require('connect-pg-simple');
const path = require('path');

const { pool, AMBIENTE } = require('./db');

const app = express();

const producao = AMBIENTE === 'producao';
if (producao) app.set('trust proxy', 1); // Render/proxy reverso
app.set('view engine', false); // as páginas são montadas em JS
app.disable('x-powered-by');

/* ---------- Sessões (guardadas no PostgreSQL) ---------- */
const PgSession = connectPg(session);
app.use(
  session({
    store: new PgSession({
      pool,
      table: 'session',
      pruneSessionInterval: 10 * 60,
    }),
    name: 'sistemax.sid',
    secret: process.env.SESSION_SECRET || 'sistemax-credencial-temporaria',
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

/* ---------- Corpo das requisições ---------- */
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

/* ---------- Arquivos estáticos (frontend/) ---------- */
app.use(
  express.static(path.join(__dirname, '..', '..', 'frontend'), {
    maxAge: producao ? '1h' : 0,
    etag: true,
  })
);
// Fotos de perfil (nomes aleatórios gerados pelo próprio sistema)
app.use(
  '/fotos',
  express.static(path.join(__dirname, '..', 'uploads', 'fotos'), {
    maxAge: '1 day',
    fallthrough: true,
  })
);

/* ---------- Rotas ---------- */
app.use('/', require('./rotas/authRotas'));
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
