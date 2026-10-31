/**
 * Ilustrações do calendário.
 *
 * A cena do gatinho é desenhada em SVG aqui e exportada para
 * `frontend/img/calendario-cena.png` (2×, fundo transparente) pelo script
 * `scripts/exportar-cena.js`. A página usa o PNG.
 */

/** Cena do calendário: gatinho dormindo sobre livros ao lado de uma plantinha. */
function ilustracaoCalendario() {
  return `
  <svg class="cal-cena" viewBox="0 0 320 150" role="img"
       aria-label="Ilustração de um gatinho dormindo sobre uma pilha de livros ao lado de uma plantinha">
    <ellipse class="cena-sombra" cx="160" cy="136" rx="132" ry="12"/>

    <!-- plantinha -->
    <g class="planta">
      <path class="caule" d="M262 98 V64"/>
      <path class="folha" d="M262 92 C256 74 242 70 236 72 C235 84 247 92 262 92 Z"/>
      <path class="folha" d="M262 86 C268 68 282 64 288 66 C289 79 277 86 262 86 Z"/>
      <path class="folha folha-clara" d="M262 78 C258 62 266 50 275 48 C281 58 273 73 262 78 Z"/>
      <path class="vaso" d="M241 100 h42 l-5 24 a4 4 0 0 1 -4 3 h-24 a4 4 0 0 1 -4 -3 Z"/>
      <rect class="vaso-borda" x="235" y="94" width="54" height="9" rx="4"/>
    </g>

    <!-- pilha de livros -->
    <g class="livros">
      <rect class="livro livro-1" x="56" y="112" width="122" height="15" rx="5"/>
      <rect class="paginas" x="164" y="115" width="13" height="9" rx="2"/>
      <rect class="livro livro-2" x="66" y="98" width="108" height="15" rx="5"/>
      <rect class="paginas" x="160" y="101" width="13" height="9" rx="2"/>
      <rect class="livro livro-3" x="60" y="84" width="100" height="15" rx="5"/>
      <rect class="paginas" x="146" y="87" width="13" height="9" rx="2"/>
      <path class="marcador" d="M120 84 v15 l5 -4 5 4 V84 Z"/>
    </g>

    <!-- gatinho -->
    <g class="gato">
      <path class="cauda" d="M76 86 C54 90 50 105 64 109"/>
      <rect class="corpo" x="76" y="58" width="74" height="27" rx="13"/>
      <g class="listras">
        <path d="M98 60 v9"/>
        <path d="M108 58 v10"/>
        <path d="M118 60 v9"/>
      </g>
      <circle class="cabeca" cx="146" cy="66" r="16"/>
      <path class="orelha" d="M136 54 L132 39 L145 48 Z"/>
      <path class="orelha" d="M154 54 L161 40 L162 52 Z"/>
      <path class="orelha-interna" d="M137 51 L135 44 L141 48 Z"/>
      <path class="orelha-interna" d="M155 51 L159 44 L159 50 Z"/>
      <path class="olho" d="M139 68 q3.5 3.5 7 0"/>
      <path class="olho" d="M149 68 q3.5 3.5 7 0"/>
      <path class="focinho" d="M146 72 l-2.2 2.2 h4.4 Z"/>
      <circle class="bochecha" cx="136" cy="75" r="3"/>
      <circle class="bochecha" cx="157" cy="75" r="3"/>
      <path class="bigodes" d="M131 72 h-9"/>
      <path class="bigodes" d="M161 72 h9"/>
    </g>

    <!-- brilhos -->
    <path class="brilho" d="M40 40 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z"/>
    <path class="brilho" d="M292 34 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5 Z"/>
  </svg>`;
}

/** Patinha pequena usada no cartão motivacional. */
function patinha() {
  return `<svg class="cal-patinha" viewBox="0 0 24 24" aria-hidden="true">
    <g fill="currentColor">
      <ellipse cx="12" cy="15.2" rx="5" ry="4.2"/>
      <ellipse cx="5.4" cy="10" rx="2.2" ry="2.8"/>
      <ellipse cx="9.4" cy="6.4" rx="2.1" ry="2.7"/>
      <ellipse cx="14.8" cy="6.4" rx="2.1" ry="2.7"/>
      <ellipse cx="18.6" cy="10" rx="2.2" ry="2.8"/>
    </g>
  </svg>`;
}

module.exports = { ilustracaoCalendario, patinha };
