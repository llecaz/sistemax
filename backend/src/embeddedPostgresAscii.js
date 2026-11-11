/**
 * Carrega o pacote ESM `embedded-postgres` através de um caminho 100% ASCII.
 *
 * O initdb do PostgreSQL (binário nativo) não tolera caminho com acentos no
 * Windows: quando o projeto está numa pasta como "Programação", o bootstrap
 * falha com "invalid byte sequence for encoding UTF8: 0xe7 0xe3 0x6f".
 *
 * Quando detectamos acentos no caminho do projeto, criamos uma junção
 * (junction) para a raiz do projeto dentro do diretório temporário e
 * importamos o módulo por ela — assim os caminhos internos ficam ASCII
 * e o initdb funciona normalmente.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const RAIZ_PROJETO = path.join(__dirname, '..', '..');

function caminhoComAcentos() {
  return /[^\x00-\x7F]/.test(RAIZ_PROJETO);
}

/** Junta o projeto a um caminho ASCII no temp (se necessário). */
function garantirJunction() {
  if (!caminhoComAcentos()) return null;
  const junction = path.join(os.tmpdir(), 'sistemax-junction-' + RAIZ_PROJETO.length);
  try {
    // Remove uma junção anterior (apaga só o reparse point, nunca o conteúdo).
    fs.rmdirSync(junction);
  } catch {
    // Não existia, ou é uma pasta real (não tocamos nela).
  }
  execFileSync('cmd.exe', ['/c', 'mklink', '/J', junction, RAIZ_PROJETO], {
    stdio: 'ignore',
  });
  return junction;
}

/** Importa dinamicamente o módulo e devolve o namespace (ESM). */
async function carregarEmbeddedPostgres() {
  const junction = garantirJunction();
  const parteRaiz = junction || RAIZ_PROJETO;
  const entrada = path.join(parteRaiz, 'node_modules', 'embedded-postgres', 'dist', 'index.js');
  return import(pathToFileURL(entrada).href);
}

module.exports = { carregarEmbeddedPostgres, caminhoComAcentos };
