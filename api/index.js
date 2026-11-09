/**
 * Entrada da Vercel (serverless).
 *
 * A Vercel entrega TODAS as requisições para esta função (ver vercel.json).
 * Antes de responder, garantimos que o schema exista e que o administrador
 * inicial seja criado (se ADMIN_* estiver configurado). O resultado fica em
 * cache enquanto a instância estiver "quente".
 */
require('dotenv').config();

const app = require('../backend/src/app');
const { prepararBanco } = require('../backend/src/criarBanco');

let pronto = null;

function garantirBanco() {
  if (!pronto) {
    pronto = prepararBanco().catch((erro) => {
      pronto = null; // permite tentar de novo na próxima requisição
      throw erro;
    });
  }
  return pronto;
}

module.exports = async (req, res) => {
  try {
    await garantirBanco();
  } catch (erro) {
    console.error('[bootstrap]', erro);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Banco de dados indisponível. Verifique as variáveis de ambiente.');
  }
  return app(req, res);
};
