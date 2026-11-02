/**
 * Gera as ilustrações em pixel art da página de calendário.
 *
 * As imagens são desenhadas em uma grade de pixels e exportadas como SVG
 * (retângulos sem antialiasing). Rode `node scripts/gerar-pixel-art.js`
 * sempre que quiser ajustar as cores ou o desenho.
 */
const fs = require('fs');
const path = require('path');

const SAIDA = path.join(__dirname, '..', 'frontend', 'img', 'lofi');

const C = {
  contorno: '#4a3a63',
  contornoSuave: '#6b5687',
  creme: '#f8e8d4',
  creme2: '#efd7bd',
  branco: '#fdf6ec',
  rosa: '#f3bccb',
  rosaEsc: '#d98aa6',
  rosaClaro: '#f9d9e2',
  lilas: '#cbb8ea',
  lilasEsc: '#9a7fd1',
  lilasClaro: '#e2d6f5',
  verde: '#a8d5a2',
  verdeEsc: '#6aa578',
  verdeClaro: '#c7e6c0',
  terracota: '#cf8f74',
  terracotaEsc: '#a96a55',
  amarelo: '#f4d992',
  dourado: '#e0b25c',
  marrom: '#8c6350',
  blush: '#eda1b5',
  sombra: '#e3cdbe',
};

function tela(largura, altura) {
  const pixels = new Map();
  const chave = (x, y) => `${x},${y}`;
  const api = {
    largura,
    altura,
    set(x, y, cor) {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= largura || y >= altura) return;
      if (!cor) pixels.delete(chave(x, y));
      else pixels.set(chave(x, y), cor);
    },
    rect(x, y, w, h, cor) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) api.set(x + i, y + j, cor);
    },
    elipse(cx, cy, rx, ry, cor) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) api.set(x, y, cor);
        }
      }
    },
    linha(x1, y1, x2, y2, cor, espessura = 1) {
      const passos = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) || 1;
      for (let i = 0; i <= passos; i++) {
        const x = Math.round(x1 + ((x2 - x1) * i) / passos);
        const y = Math.round(y1 + ((y2 - y1) * i) / passos);
        if (espessura <= 1) api.set(x, y, cor);
        else api.rect(x, y, espessura, espessura, cor);
      }
    },
    triangulo(x1, y1, x2, y2, x3, y3, cor) {
      const minX = Math.min(x1, x2, x3);
      const maxX = Math.max(x1, x2, x3);
      const minY = Math.min(y1, y2, y3);
      const maxY = Math.max(y1, y2, y3);
      const sinal = (px, py, ax, ay, bx, by) => (px - bx) * (ay - by) - (ax - bx) * (py - by);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const d1 = sinal(x, y, x1, y1, x2, y2);
          const d2 = sinal(x, y, x2, y2, x3, y3);
          const d3 = sinal(x, y, x3, y3, x1, y1);
          const temNeg = d1 < 0 || d2 < 0 || d3 < 0;
          const temPos = d1 > 0 || d2 > 0 || d3 > 0;
          if (!(temNeg && temPos)) api.set(x, y, cor);
        }
      }
    },
    brilho(cx, cy, cor, tamanho = 2) {
      api.set(cx, cy, cor);
      api.rect(cx - 1, cy, 3, 1, cor);
      api.rect(cx, cy - 1, 1, 3, cor);
      if (tamanho > 1) {
        api.set(cx - tamanho, cy - tamanho, cor);
        api.set(cx + tamanho, cy - tamanho, cor);
        api.set(cx - tamanho, cy + tamanho, cor);
        api.set(cx + tamanho, cy + tamanho, cor);
      }
    },
    buffer: () => pixels,
  };
  return api;
}

function svg(t, larguraFinal) {
  const pixels = t.buffer();
  const porCor = new Map();
  for (const [chave, cor] of pixels) {
    const [x, y] = chave.split(',').map(Number);
    if (!porCor.has(cor)) porCor.set(cor, []);
    porCor.get(cor).push([x, y]);
  }
  let corpo = '';
  for (const [cor, pontos] of porCor) {
    // Junta pixels horizontais em um único retângulo (SVG menor).
    const linhas = new Map();
    pontos.forEach(([x, y]) => {
      if (!linhas.has(y)) linhas.set(y, []);
      linhas.get(y).push(x);
    });
    const runs = [];
    for (const [y, xs] of linhas) {
      xs.sort((a, b) => a - b);
      let inicio = xs[0];
      let anterior = xs[0];
      for (let i = 1; i <= xs.length; i++) {
        const x = xs[i];
        if (x !== anterior + 1) {
          runs.push(`<rect x="${inicio}" y="${y}" width="${anterior - inicio + 1}" height="1"/>`);
          inicio = x;
        }
        anterior = x;
      }
    }
    corpo += `<g fill="${cor}">${runs.join('')}</g>`;
  }
  const escala = larguraFinal / t.largura;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(t.largura * escala)}" height="${Math.round(
    t.altura * escala
  )}" viewBox="0 0 ${t.largura} ${t.altura}" shape-rendering="crispEdges" role="img">${corpo}</svg>`;
}

/* ------------------------------- Gatinho sobre livros ------------------------------- */
function gatoLivros() {
  const t = tela(64, 56);

  t.elipse(33, 53, 25, 2, C.sombra);

  // Pilha de livros
  t.rect(8, 46, 46, 7, C.rosaEsc);
  t.rect(8, 46, 46, 1, '#b97a93');
  t.rect(13, 48, 32, 3, C.rosa);
  t.rect(54, 47, 5, 5, C.creme);
  t.rect(55, 48, 3, 1, C.creme2);

  t.rect(12, 39, 41, 7, C.lilasEsc);
  t.rect(12, 39, 41, 1, '#8168b8');
  t.rect(17, 41, 28, 3, C.lilas);
  t.rect(53, 40, 5, 5, C.creme);

  t.rect(10, 32, 43, 7, C.dourado);
  t.rect(10, 32, 43, 1, '#c49a4f');
  t.rect(15, 34, 30, 3, C.amarelo);
  t.rect(53, 33, 5, 5, C.creme);
  t.rect(24, 32, 3, 7, '#c49a4f'); // marcador

  // Rabinho saindo da pilha
  t.linha(16, 27, 9, 31, C.contorno, 2);
  t.linha(9, 31, 10, 36, C.lilasEsc, 2);
  t.set(10, 35, C.contorno);

  // Corpo
  t.elipse(31, 23, 16, 9, C.contorno);
  t.elipse(31, 23, 15, 8, C.creme);
  t.elipse(31, 26, 13, 5, C.creme2);

  // Listras do corpo
  [23, 27, 31, 35].forEach((x) => {
    t.rect(x, 16, 2, 6, C.lilasEsc);
  });

  // Patas
  t.rect(26, 27, 6, 4, C.creme);
  t.rect(38, 27, 6, 4, C.creme);
  t.rect(26, 30, 6, 1, C.creme2);
  t.rect(38, 30, 6, 1, C.creme2);
  t.rect(27, 28, 2, 1, C.blush);
  t.rect(39, 28, 2, 1, C.blush);

  // Cabeça
  t.elipse(46, 18, 9, 8, C.contorno);
  t.elipse(46, 18, 8, 7, C.creme);
  t.elipse(46, 21, 6, 4, C.creme2);

  // Orelhas
  t.triangulo(39, 13, 38, 7, 44, 11, C.contorno);
  t.triangulo(47, 11, 53, 7, 53, 14, C.contorno);
  t.triangulo(40, 12, 40, 9, 43, 11, C.blush);
  t.triangulo(48, 11, 52, 9, 52, 13, C.blush);

  // Listras da testa
  t.rect(43, 11, 1, 3, C.lilasEsc);
  t.rect(46, 10, 1, 3, C.lilasEsc);
  t.rect(49, 11, 1, 3, C.lilasEsc);

  // Olhos fechados e focinho
  t.rect(41, 18, 3, 1, C.contorno);
  t.rect(48, 18, 3, 1, C.contorno);
  t.set(42, 19, C.contorno);
  t.set(49, 19, C.contorno);
  t.rect(45, 21, 2, 1, C.rosaEsc);
  t.set(46, 22, C.contorno);
  t.rect(39, 21, 2, 1, C.blush);
  t.rect(52, 21, 2, 1, C.blush);

  // Estrelinhas
  t.brilho(58, 10, C.amarelo);
  t.brilho(6, 13, C.lilas, 1);
  t.brilho(33, 6, C.rosa, 1);

  return svg(t, 256);
}

/* ------------------------------- Gatinho na almofada ------------------------------- */
function gatoAlmofada() {
  const t = tela(64, 52);

  t.elipse(32, 48, 23, 2, C.sombra);

  // Almofada
  t.elipse(32, 36, 23, 10, C.contornoSuave);
  t.elipse(32, 36, 22, 9, C.rosaEsc);
  t.elipse(32, 35, 19, 7, C.rosa);
  t.elipse(32, 35, 15, 5, C.rosaClaro);
  t.set(10, 31, C.rosaClaro);
  t.set(54, 31, C.rosaClaro);
  t.set(10, 42, C.lilasClaro);
  t.set(54, 42, C.lilasClaro);
  t.rect(9, 33, 2, 2, C.lilas);
  t.rect(54, 33, 2, 2, C.lilas);

  // Corpo (pãozinho)
  t.elipse(32, 27, 15, 9, C.contorno);
  t.elipse(32, 27, 14, 8, C.creme);
  t.elipse(32, 31, 12, 4, C.creme2);

  // Cabeça
  t.elipse(32, 19, 9, 8, C.contorno);
  t.elipse(32, 19, 8, 7, C.creme);

  // Orelhas
  t.triangulo(25, 14, 24, 8, 30, 12, C.contorno);
  t.triangulo(33, 12, 39, 8, 39, 14, C.contorno);
  t.triangulo(26, 13, 26, 10, 29, 12, C.blush);
  t.triangulo(34, 12, 38, 10, 38, 13, C.blush);

  // Listras
  t.rect(29, 12, 1, 3, C.lilasEsc);
  t.rect(32, 11, 1, 3, C.lilasEsc);
  t.rect(35, 12, 1, 3, C.lilasEsc);
  [24, 28, 36, 40].forEach((x) => t.rect(x, 24, 2, 5, C.lilas));

  // Olhos fechados
  t.rect(27, 19, 3, 1, C.contorno);
  t.rect(34, 19, 3, 1, C.contorno);
  t.set(28, 20, C.contorno);
  t.set(35, 20, C.contorno);
  t.rect(31, 21, 2, 1, C.rosaEsc);
  t.set(32, 22, C.contorno);
  t.rect(25, 22, 2, 1, C.blush);
  t.rect(38, 22, 2, 1, C.blush);

  // Rabinho enrolado
  t.linha(47, 30, 53, 32, C.contorno, 2);
  t.linha(53, 32, 51, 27, C.lilasEsc, 2);

  t.brilho(58, 12, C.amarelo, 1);
  t.brilho(6, 16, C.rosa, 1);

  return svg(t, 256);
}

/* ----------------------------------- Plantinha ----------------------------------- */
function plantinha() {
  const t = tela(40, 48);

  t.elipse(20, 46, 13, 2, C.sombra);

  // Vaso
  t.rect(11, 34, 18, 11, C.terracotaEsc);
  t.rect(12, 35, 16, 9, C.terracota);
  t.rect(14, 37, 3, 1, '#e0a58c');
  t.rect(9, 31, 22, 4, C.terracotaEsc);
  t.rect(10, 31, 20, 2, C.terracota);

  // Caule
  t.rect(19, 18, 2, 14, C.verdeEsc);

  // Folhas
  t.elipse(14, 21, 7, 4, C.verdeEsc);
  t.elipse(14, 21, 6, 3, C.verde);
  t.elipse(26, 17, 7, 4, C.verdeEsc);
  t.elipse(26, 17, 6, 3, C.verde);
  t.elipse(19, 12, 4, 7, C.verdeEsc);
  t.elipse(19, 12, 3, 6, C.verdeClaro);
  t.elipse(11, 28, 6, 3, C.verde);
  t.elipse(29, 25, 6, 3, C.verde);

  t.brilho(35, 10, C.amarelo, 1);

  return svg(t, 120);
}

/* --------------------------------- Lua e estrelas --------------------------------- */
function luaEstrelas() {
  const t = tela(40, 32);

  // Lua crescente
  t.elipse(18, 16, 10, 10, C.dourado);
  t.elipse(18, 16, 9, 9, C.amarelo);
  t.elipse(23, 13, 9, 9, null);
  t.elipse(22, 12, 7, 7, null);

  // Estrelas
  t.brilho(30, 8, C.amarelo, 2);
  t.brilho(35, 19, C.rosa, 1);
  t.brilho(28, 24, C.lilas, 1);
  t.brilho(8, 6, C.branco, 1);

  return svg(t, 120);
}

/* -------------------------------- Cantinho de estudo -------------------------------- */
function cantinho() {
  const t = tela(64, 40);

  t.elipse(32, 37, 26, 2, C.sombra);

  // Pilha de livros
  t.rect(4, 28, 20, 6, C.lilasEsc);
  t.rect(4, 28, 20, 1, '#8168b8');
  t.rect(21, 29, 3, 4, C.creme);
  t.rect(6, 22, 18, 6, C.rosaEsc);
  t.rect(6, 22, 18, 1, '#b97a93');
  t.rect(21, 23, 3, 4, C.creme);

  // Caneca
  t.rect(32, 24, 12, 11, C.creme);
  t.rect(33, 25, 10, 8, C.branco);
  t.rect(35, 27, 6, 4, C.lilasClaro);
  t.rect(44, 27, 3, 2, C.creme);
  t.rect(44, 31, 3, 2, C.creme);
  t.rect(44, 29, 2, 2, C.creme);
  // Vapor
  t.rect(36, 18, 1, 3, C.creme2);
  t.rect(35, 15, 1, 3, C.creme2);
  t.rect(40, 17, 1, 4, C.creme2);
  t.rect(39, 14, 1, 3, C.creme2);

  // Plantinha
  t.rect(52, 30, 8, 6, C.terracota);
  t.rect(51, 28, 10, 3, C.terracotaEsc);
  t.rect(55, 23, 2, 6, C.verdeEsc);
  t.elipse(53, 22, 4, 2, C.verde);
  t.elipse(59, 20, 4, 2, C.verde);

  // Estrelas
  t.brilho(28, 8, C.amarelo, 1);
  t.brilho(48, 6, C.lilas, 1);

  return svg(t, 192);
}

/* -------------------------------- Cantinho de estudo -------------------------------- */
function estante() {
  const t = tela(64, 48);

  // Estante
  t.rect(4, 40, 56, 4, C.marrom);
  t.rect(4, 40, 56, 1, '#a9785f');
  t.rect(8, 44, 3, 2, '#6d4c3e');
  t.rect(53, 44, 3, 2, '#6d4c3e');

  // Livros em pé
  t.rect(8, 22, 6, 18, C.rosaEsc);
  t.rect(9, 24, 4, 2, C.rosaClaro);
  t.rect(15, 19, 5, 21, C.lilasEsc);
  t.rect(16, 21, 3, 2, C.lilasClaro);
  t.rect(21, 24, 6, 16, C.verdeEsc);
  t.rect(22, 26, 4, 2, C.verdeClaro);
  t.rect(28, 21, 4, 19, C.dourado);
  t.rect(29, 23, 2, 2, C.amarelo);

  // Livro deitado
  t.rect(33, 32, 12, 4, C.rosaClaro);
  t.rect(33, 32, 12, 1, C.rosaEsc);
  t.rect(43, 36, 3, 4, C.creme);

  // Plantinha na ponta
  t.rect(52, 33, 7, 7, C.terracota);
  t.rect(51, 31, 9, 3, C.terracotaEsc);
  t.rect(55, 26, 1, 6, C.verdeEsc);
  t.elipse(53, 25, 4, 2, C.verde);
  t.elipse(58, 23, 4, 2, C.verdeClaro);

  // Varal de estrelinhas
  t.linha(8, 12, 56, 9, C.creme2);
  t.brilho(18, 12, C.amarelo, 1);
  t.brilho(34, 10, C.rosa, 1);
  t.brilho(48, 9, C.lilas, 1);
  t.brilho(58, 18, C.amarelo, 1);

  return svg(t, 192);
}

const arquivos = {
  'gato-livros.svg': gatoLivros(),
  'gato-almofada.svg': gatoAlmofada(),
  'plantinha.svg': plantinha(),
  'lua-estrelas.svg': luaEstrelas(),
  'cantinho.svg': cantinho(),
  'estante.svg': estante(),
};

fs.mkdirSync(SAIDA, { recursive: true });
for (const [nome, conteudo] of Object.entries(arquivos)) {
  fs.writeFileSync(path.join(SAIDA, nome), conteudo, 'utf8');
  console.log('criado', path.join('frontend/img/lofi', nome));
}
