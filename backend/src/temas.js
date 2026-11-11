/**
 * Registro de temas visuais da plataforma — fonte única de verdade.
 *
 * Dois modos principais, alternáveis pelo botão já existente:
 *   - nuvia      → Dark Mode  (padrão)
 *   - nuvia-day  → Normal Mode (claro)
 * O Lofi Mode é uma camada independente (ver lofi), ativável
 * em qualquer um dos dois modos — não é um tema separado.
 *
 * Usado pelo backend (galeria de configurações, layout, login) e
 * exportado para o navegador via window.SISTEMA_TEMAS (ver scriptTemas()).
 *
 * ⭐ Para adicionar um modo novo:
 *   1. Cadastre o modo aqui (id, nome, modo, par, paleta...);
 *   2. Crie o bloco de variáveis correspondente em frontend/nuvia.css.
 */
const TEMA_PADRAO = 'nuvia';

const TEMAS = [
  /* ---------- Dark Mode — noite lilás, padrão ---------- */
  {
    id: 'nuvia',
    nome: 'Dark Mode',
    categoria: 'Modos de aparência',
    modo: 'escuro',
    par: 'nuvia-day',
    padrao: true,
    descricao:
      'A noite lilás do cantinho Nuvia: fundo profundo com estrelinhas, cartões em roxo aconchegante, gatinhos e acentos em rosa e lilás.',
    paleta: ['#141127', '#1e1838', '#f3eeff', '#c1a9ff', '#ffb4d9'],
  },
  /* ---------- Normal Mode — manhã creme e rosa ---------- */
  {
    id: 'nuvia-day',
    nome: 'Normal Mode',
    categoria: 'Modos de aparência',
    modo: 'claro',
    par: 'nuvia',
    padrao: false,
    descricao:
      'A versão iluminada do cantinho Nuvia: creme, rosa e lilás suaves, com o mesmo carinho em pixel art.',
    paleta: ['#f7eef7', '#fffaf4', '#4b3a63', '#a77bd8', '#d8638c'],
  },
];

const POR_ID = Object.fromEntries(TEMAS.map((t) => [t.id, t]));

const CATEGORIAS = [...new Set(TEMAS.map((t) => t.categoria))];

/**
 * Ids de temas que existiam antes da simplificação para dois modos.
 * Contas antigas caem no modo equivalente (escuro → Dark, claro → Normal).
 */
const LEGADO = {
  claro: 'nuvia-day',
  'clean-minimal': 'nuvia-day',
  japandi: 'nuvia-day',
  'soft-ui': 'nuvia-day',
  'pastel-dream': 'nuvia-day',
  escuro: 'nuvia',
  'dark-minimal': 'nuvia',
  'lo-fi-night': 'nuvia',
  moonroom: 'nuvia',
  'dark-academia': 'nuvia',
};

/** O id informado corresponde a um tema cadastrado? */
function temaValido(id) {
  return Object.prototype.hasOwnProperty.call(POR_ID, id);
}

/** Devolve o id válido (resolve ids antigos) ou o tema padrão. */
function temaOuPadrao(id) {
  if (temaValido(id)) return id;
  return LEGADO[id] || TEMA_PADRAO;
}

/** Devolve o objeto completo de um tema (ou do padrão). */
function temaDe(id) {
  return POR_ID[temaOuPadrao(id)];
}

/** Script embutido no <head>: dá ao navegador a lista de temas. */
function scriptTemas() {
  const lista = TEMAS.map(({ id, nome, categoria, modo, par, padrao, descricao, paleta }) => ({
    id,
    nome,
    categoria,
    modo,
    par,
    padrao,
    descricao,
    paleta,
  }));
  return `<script>window.SISTEMA_TEMAS=${JSON.stringify(lista)};window.SISTEMA_TEMA_PADRAO=${JSON.stringify(
    TEMA_PADRAO
  )};</script>`;
}

module.exports = { TEMAS, TEMA_PADRAO, CATEGORIAS, POR_ID, temaValido, temaOuPadrao, temaDe, scriptTemas };
