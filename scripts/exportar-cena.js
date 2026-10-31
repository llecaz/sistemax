/** Gera a ilustração do calendário como PNG transparente (2×) usando o Edge headless.
 *  Uso: node scripts/exportar-cena.js
 *  Saída: frontend/img/calendario-cena.png
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const { ilustracaoCalendario } = require(path.join(raiz, 'backend', 'src', 'paginas', 'ilustracoes'));

const LARGURA = 640;
const ALTURA = 300;
const pasta = path.join(raiz, 'frontend', 'img');
fs.mkdirSync(pasta, { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;width:${LARGURA}px;height:${ALTURA}px;background:transparent;overflow:hidden}
svg{display:block;width:${LARGURA}px;height:${ALTURA}px}
.cena-sombra{fill:#3b302a;opacity:.07}
.livro-1{fill:#a9c8ea}.livro-2{fill:#f2b8c0}.livro-3{fill:#bfd9b6}.paginas{fill:#fbf3e8}.marcador{fill:#e0a83e}
.corpo,.cabeca,.orelha{fill:#f6d9c2}
.cauda{fill:none;stroke:#f6d9c2;stroke-width:8;stroke-linecap:round}
.listras path{stroke:#e5b295;stroke-width:2.5;stroke-linecap:round}
.orelha-interna{fill:#eda9a9}
.olho{fill:none;stroke:#6b5347;stroke-width:2;stroke-linecap:round}
.focinho{fill:#c98b7a}.bochecha{fill:#f0a3a3;opacity:.5}
.bigodes{stroke:#c9a894;stroke-width:1.5;stroke-linecap:round}
.caule{fill:none;stroke:#7aa574;stroke-width:3;stroke-linecap:round}
.folha{fill:#8fbc8a}.folha-clara{fill:#a9cfa2}
.vaso{fill:#e0a189}.vaso-borda{fill:#cf8b72}
.brilho{fill:#e0a83e;opacity:.85}
</style></head><body>${ilustracaoCalendario()}</body></html>`;

const htmlPath = path.join(raiz, '_cena.html');
fs.writeFileSync(htmlPath, html);

const edge = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const destino = path.join(pasta, 'calendario-cena.png');
execFileSync(
  edge,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    `--window-size=${LARGURA},${ALTURA}`,
    `--screenshot=${destino}`,
    `file:///${htmlPath.replace(/\\/g, '/')}`,
  ],
  { stdio: 'ignore' }
);
fs.unlinkSync(htmlPath);
console.log('PNG gerado:', destino, fs.statSync(destino).size, 'bytes');
