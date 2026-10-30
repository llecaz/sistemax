/**
 * Registro de temas visuais da plataforma — fonte única de verdade.
 *
 * Usado pelo backend (galeria de configurações, layout, login) e
 * exportado para o navegador via window.SISTEMA_TEMAS (ver scriptTemas()).
 *
 * ⭐ Para adicionar um tema novo:
 *   1. Cadastre o tema aqui (id, nome, modo, par, paleta...);
 *   2. Crie o bloco de variáveis correspondente em frontend/temas.css
 *      com o seletor [data-tema='SEU-ID'].
 */
const TEMA_PADRAO = 'clean-minimal';

const TEMAS = [
  /* ---------- Minimalistas e sofisticados ---------- */
  {
    id: 'clean-minimal',
    nome: 'Clean Minimal',
    categoria: 'Minimalistas e sofisticados',
    modo: 'claro',
    par: 'dark-minimal',
    padrao: true,
    descricao: 'Interface branca, moderna e organizada — o visual clássico da plataforma.',
    paleta: ['#f7f8fa', '#ffffff', '#202124', '#1a73e8', '#1e8e3e'],
  },
  {
    id: 'japandi',
    nome: 'Japandi',
    categoria: 'Minimalistas e sofisticados',
    modo: 'claro',
    par: 'dark-academia',
    padrao: false,
    descricao: 'Tons neutros e bege, materiais naturais e tipografia serifada — sereno e aconchegante.',
    paleta: ['#f4efe6', '#fffdf8', '#3a352d', '#748062', '#b98b56'],
  },
  {
    id: 'dark-minimal',
    nome: 'Dark Minimal',
    categoria: 'Minimalistas e sofisticados',
    modo: 'escuro',
    par: 'clean-minimal',
    padrao: false,
    descricao: 'Interface escura, elegante e discreta, com contraste suave para os olhos.',
    paleta: ['#1e2126', '#262a31', '#e8eaed', '#8ab4f8', '#81c784'],
  },
  {
    id: 'soft-ui',
    nome: 'Soft UI',
    categoria: 'Minimalistas e sofisticados',
    modo: 'claro',
    par: 'dark-minimal',
    padrao: false,
    descricao: 'Superfícies suaves, sombras delicadas e tons pastel com acabamento neumórfico.',
    paleta: ['#eef1f7', '#f7f9fc', '#3b4252', '#6c8ae4', '#f3a8c3'],
  },

  /* ---------- Cozy e aesthetic ---------- */
  {
    id: 'lo-fi-night',
    nome: 'Lo-fi Night',
    categoria: 'Cozy e aesthetic',
    modo: 'escuro',
    par: 'pastel-dream',
    padrao: false,
    descricao: 'Cantinho de estudo lo-fi: lavanda, azul e rosa, luz aconchegante e toques pixel art.',
    paleta: ['#1a1830', '#232042', '#e9e6ff', '#a78bfa', '#ffb4d9'],
  },
  {
    id: 'pastel-dream',
    nome: 'Pastel Dream',
    categoria: 'Cozy e aesthetic',
    modo: 'claro',
    par: 'lo-fi-night',
    padrao: false,
    descricao: 'Nuvens, estrelas e tons pastel numa atmosfera delicada e sonhadora.',
    paleta: ['#f7f4ff', '#ffffff', '#4a4458', '#9b8cf5', '#f7a8c4'],
  },

  /* ---------- Vintage e retrô ---------- */
  {
    id: 'dark-academia',
    nome: 'Dark Academia',
    categoria: 'Vintage e retrô',
    modo: 'escuro',
    par: 'japandi',
    padrao: false,
    descricao: 'Tons terrosos, livros antigos e tipografia serifada com charme vintage.',
    paleta: ['#1f1a16', '#2a231d', '#ece3d4', '#c9a050', '#8fae7a'],
  },
];

const POR_ID = Object.fromEntries(TEMAS.map((t) => [t.id, t]));

const CATEGORIAS = [...new Set(TEMAS.map((t) => t.categoria))];

/** O id informado corresponde a um tema cadastrado? */
function temaValido(id) {
  return Object.prototype.hasOwnProperty.call(POR_ID, id);
}

/** Devolve o id válido ou o tema padrão. */
function temaOuPadrao(id) {
  return temaValido(id) ? id : TEMA_PADRAO;
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
