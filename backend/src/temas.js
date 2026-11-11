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
const TEMA_PADRAO = 'nuvia';

const TEMAS = [
  /* ---------- Nuvia (identidade principal) ---------- */
  {
    id: 'nuvia',
    nome: 'Nuvia Pixel',
    categoria: 'Cozy e aesthetic',
    modo: 'escuro',
    par: 'nuvia-day',
    padrao: true,
    descricao:
      'Quarto de estudos em pixel art: noite lilás, gatinhos, laços cor-de-rosa e um planner aconchegante para organizar a rotina escolar.',
    paleta: ['#141127', '#1e1838', '#f3eeff', '#c1a9ff', '#ffb4d9'],
  },
  {
    id: 'nuvia-day',
    nome: 'Nuvia Manhã',
    categoria: 'Cozy e aesthetic',
    modo: 'claro',
    par: 'nuvia',
    padrao: false,
    descricao:
      'A versão iluminada do cantinho Nuvia: creme, rosa e lilás suaves, com o mesmo carinho em pixel art.',
    paleta: ['#f7eef7', '#fffaf4', '#4b3a63', '#a77bd8', '#d8638c'],
  },

  /* ---------- Minimalistas e sofisticados ---------- */
  {
    id: 'clean-minimal',
    nome: 'Lavanda',
    categoria: 'Minimalistas e sofisticados',
    modo: 'claro',
    par: 'dark-minimal',
    padrao: false,
    descricao: 'Interface clara em lavanda e roxo, com cartões brancos, cantos arredondados e visual SaaS moderno.',
    paleta: ['#f4f2fb', '#ffffff', '#2e2947', '#7b5ce6', '#2f9e6e'],
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
    nome: 'Lavanda Noturna',
    categoria: 'Minimalistas e sofisticados',
    modo: 'escuro',
    par: 'clean-minimal',
    padrao: false,
    descricao: 'Versão escura da identidade lavanda, com contraste suave e superfícies roxas discretas.',
    paleta: ['#17131f', '#211b2e', '#f1edf9', '#a78bfa', '#4ade80'],
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
  {
    id: 'moonroom',
    nome: 'Moonroom',
    categoria: 'Cozy e aesthetic',
    modo: 'escuro',
    par: 'pastel-dream',
    padrao: false,
    descricao: 'Quarto à meia-luz rosa: lua na janela, luzes penduradas e um cantinho doce para estudar.',
    paleta: ['#2a1a28', '#3a2536', '#ffe4ef', '#ff9ec4', '#8fdfc0'],
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
