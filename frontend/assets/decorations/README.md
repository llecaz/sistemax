# Biblioteca de decorações — Dreamy Lo-fi Pixel Art

Recortes individuais da cartela original, com transparência real, contorno,
cores e espaço de respiro preservados. Nenhum desenho foi redesenhado.

Servidos pelo Express em `/assets/decorations/...`
(arquivos físicos em `frontend/assets/decorations/`).

## cats/ (9)

| Arquivo | Ilustração |
|---|---|
| `cat-sleeping.png` | Gatinho dormindo em uma almofada rosa, com coração e "zzz" |
| `cat-sitting.png` | Gatinho sentado com laço rosa |
| `cat-books.png` | Gatinho dormindo em cima de uma pilha de livros |
| `cat-angel.png` | Gatinho com asinhas, auréola e laço |
| `cat-stretching.png` | Gatinho se espreguiçando com o rabo para cima |
| `cat-lying.png` | Gatinho deitado de barriga para cima |
| `cat-blanket.png` | Gatinho dormindo em uma manta lilás com estrelas |
| `cat-peeking.png` | Gatinho espiando com as patinhas para fora |
| `cat-face.png` | Rostinho de gatinho |

## celestial/ (11)

`moon.png`, `star-orange.png`, `sparkle-peach.png`, `sparkle-purple.png`,
`sparkle-purple-small.png`, `sparkle-orange-small.png`, `heart-pink.png`,
`heart-purple.png`, `heart-pink-small.png`, `heart-pink-tiny.png`,
`heart-sparkle.png`.

## details/ (7)

`bow-pink.png`, `bow-purple-ribbon.png`, `bow-purple-star.png`,
`paw-print.png`, `paw-print-small.png`, `wing-left.png`, `wing-right.png`.

> A cartela não possui ilustrações de plantas, por isso não existe a pasta
> `plants/`. Só foram criados arquivos para elementos realmente presentes.

## Uso

```js
const { decoracao } = require('../../backend/src/paginas/decoracoes');

decoracao('cat-sleeping', { pasta: 'cats', tamanho: 160 });
decoracao('moon', {
  pasta: 'celestial',
  tamanho: 48,
  top: '10px',
  right: '12px',
  opacidade: 0.8,
  ocultarEm: 'mobile',
});
```

O componente aceita `tamanho`, `posicao` (`top`/`right`/`bottom`/`left`),
`margem`, `opacidade`, `ocultarEm` (`mobile`/`tablet`/`sempre`), `classe`,
`estilo` e `alt`. O CSS base está em `frontend/decoracoes.css`.
