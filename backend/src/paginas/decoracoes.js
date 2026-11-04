/**
 * Componente reutilizável para as ilustrações decorativas em pixel art.
 *
 * Os arquivos ficam em `frontend/assets/decorations/` (servidos em
 * `/assets/decorations/...`) e foram recortados da cartela original,
 * preservando transparência, contorno e proporção.
 *
 * Opções:
 * - pasta: 'cats' | 'plants' | 'stationery' | 'celestial' |
 *   'accessories' | 'ui' | 'details'
 * - tamanho: número (px) ou string CSS
 * - opacidade: 0 a 1
 * - rotacao: graus (ex.: -12) para inclinar sem distorcer
 * - classe / estilo: ajustes livres
 * - top/right/bottom/left + margem: posicionamento absoluto
 * - ocultarEm: 'mobile' | 'tablet' | 'sempre'
 * - alt: descrição (quando vazio, a imagem é decorativa)
 */
const { esc } = require('../util');

const PASTAS = ['cats', 'plants', 'stationery', 'celestial', 'accessories', 'ui', 'details'];

function decoracao(nome, opcoes = {}) {
  const {
    pasta = 'details',
    tamanho = 64,
    opacidade = 1,
    rotacao,
    classe = '',
    estilo = '',
    alt = '',
    top,
    right,
    bottom,
    left,
    margem,
    ocultarEm = '',
    carregamento = 'lazy',
  } = opcoes;

  const pastaSegura = PASTAS.includes(pasta) ? pasta : 'details';
  const classes = ['deco'];
  const estilos = [];

  if (top != null || right != null || bottom != null || left != null) classes.push('deco--abs');
  if (top != null) estilos.push(`--deco-top:${top}`);
  if (right != null) estilos.push(`--deco-right:${right}`);
  if (bottom != null) estilos.push(`--deco-bottom:${bottom}`);
  if (left != null) estilos.push(`--deco-left:${left}`);
  if (margem != null) estilos.push(`--deco-margem:${margem}`);
  if (tamanho != null) estilos.push(`--deco-w:${typeof tamanho === 'number' ? `${tamanho}px` : tamanho}`);
  if (opacidade !== 1) estilos.push(`--deco-op:${opacidade}`);
  if (rotacao != null) estilos.push(`--deco-rot:${typeof rotacao === 'number' ? `${rotacao}deg` : rotacao}`);
  if (ocultarEm === 'mobile') classes.push('deco--oculta-mobile');
  if (ocultarEm === 'tablet') classes.push('deco--oculta-tablet');
  if (ocultarEm === 'sempre') classes.push('deco--oculto');
  if (classe) classes.push(classe);
  if (estilo) estilos.push(estilo);

  const atributosAlt = alt ? `alt="${esc(alt)}"` : 'alt="" aria-hidden="true"';
  return `<img class="${classes.join(' ')}" src="/assets/decorations/${pastaSegura}/${nome}.png" ${atributosAlt} loading="${carregamento}" decoding="async"${
    estilos.length ? ` style="${estilos.join(';')}"` : ''
  }>`;
}

module.exports = { decoracao, PASTAS };
