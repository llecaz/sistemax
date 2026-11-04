# Biblioteca de decorações — Nuvia Pixel Art

Recortes individuais da cartela oficial (`frontend/assets/source/nuvia-assets-sheet.png`),
com transparência real, contorno, sombras e tons claros/rosados preservados.
Nenhum desenho foi redesenhado: todos os elementos vêm da cartela.

Servidos pelo Express em `/assets/decorations/...`
(arquivos físicos em `frontend/assets/decorations/`).
Os recortes novos usam o prefixo `nuvia-` para não colidir com a biblioteca
anterior, que continua intacta e em uso.

## cats/ (6)

| Arquivo | Ilustração |
|---|---|
| `nuvia-cat-angel-heart.png` | Gatinho com auréola, asinhas e coração |
| `nuvia-cat-bow-laying.png` | Gatinho deitado com laço rosa |
| `nuvia-cat-bow-sitting.png` | Gatinho sentado com laço rosa |
| `nuvia-cat-couch-nap.png` | Gatinho dormindo no sofá lilás |
| `nuvia-cat-peeking.png` | Gatinho espiando com as patinhas para fora |
| `nuvia-cat-sleeping-pillow.png` | Gatinho dormindo em uma almofada rosa, com "zzz" |

## plants/ (4)

| Arquivo | Ilustração |
|---|---|
| `nuvia-plant-flowers.png` | Vaso com flores lilás |
| `nuvia-plant-hanging.png` | Planta pendurada com folhas caindo |
| `nuvia-plant-potted.png` | Planta de folhas largas em vaso rosa |
| `nuvia-plant-small-pot.png` | Plantinha pequena em vaso rosa |

## stationery/ (7)

| Arquivo | Ilustração |
|---|---|
| `nuvia-book-open.png` | Livro aberto |
| `nuvia-books-stack.png` | Pilha de três livros lilás com marcadores |
| `nuvia-bookshelf.png` | Estante com livros e plantinha |
| `nuvia-laptop.png` | Notebook lilás com gatinho na tela |
| `nuvia-notebook-cat.png` | Caderno com gatinho na capa |
| `nuvia-notepad.png` | Bloco de notas com espiral |
| `nuvia-pencils.png` | Par de lápis |

## celestial/ (23)

| Arquivo | Ilustração |
|---|---|
| `nuvia-moon.png` | Lua crescente amarela |
| `nuvia-star-yellow.png` | Estrela amarela grande |
| `nuvia-star-yellow-small.png` | Estrela amarela pequena |
| `nuvia-star-yellow-bottom.png` | Estrela amarela da faixa inferior |
| `nuvia-sparkle-orange.png` | Brilho laranja grande |
| `nuvia-sparkle-orange-medium.png` | Brilho laranja médio |
| `nuvia-sparkle-orange-small.png` | Brilho laranja pequeno |
| `nuvia-sparkle-purple.png` | Brilho lilás grande |
| `nuvia-sparkle-purple-mid.png` | Brilho lilás médio |
| `nuvia-sparkle-purple-small.png` | Brilho lilás pequeno |
| `nuvia-sparkle-purple-tiny.png` | Brilho lilás mínimo |
| `nuvia-sparkle-peach-large.png` | Brilho pêssego grande |
| `nuvia-sparkle-peach-mid.png` | Brilho pêssego médio |
| `nuvia-sparkle-peach-tiny.png` | Brilho pêssego mínimo |
| `nuvia-sparkle-lilac-tiny.png` | Brilho lilás claro mínimo |
| `nuvia-sparkle-pink.png` | Brilho rosa |
| `nuvia-sparkle-star-bottom.png` | Estrela/brilho da faixa inferior |
| `nuvia-sparkle-bottom.png` | Brilho da faixa inferior |
| `nuvia-heart-pink.png` | Coração rosa |
| `nuvia-heart-pink-large.png` | Coração rosa grande |
| `nuvia-heart-pink-small.png` | Coração rosa pequeno |
| `nuvia-heart-pink-bottom.png` | Coração rosa da faixa inferior |
| `nuvia-heart-lilac-small.png` | Coração lilás pequeno |

## accessories/ (10)

| Arquivo | Ilustração |
|---|---|
| `nuvia-bow-pink.png` | Laço rosa |
| `nuvia-bow-purple.png` | Laço lilás |
| `nuvia-cushion.png` | Almofada xadrez lilás |
| `nuvia-envelope-heart.png` | Envelope com coração |
| `nuvia-headphones.png` | Fones de ouvido |
| `nuvia-mug-cat.png` | Caneca com gatinho |
| `nuvia-paw-print.png` | Patinha |
| `nuvia-paw-print-large.png` | Patinha grande |
| `nuvia-wall-hanging-cat.png` | Quadro de parede com gatinho |
| `nuvia-window-night.png` | Janela com céu noturno, lua e laços |

## ui/ (11)

| Arquivo | Ilustração |
|---|---|
| `nuvia-icon-calendar.png` | Ícone de calendário |
| `nuvia-icon-folder.png` | Ícone de pasta |
| `nuvia-icon-home.png` | Ícone de casa |
| `nuvia-icon-logout.png` | Ícone de sair |
| `nuvia-icon-settings.png` | Ícone de engrenagem |
| `nuvia-icon-user.png` | Ícone de usuário |
| `nuvia-input-bar-bow.png` | Barra de campo decorada com laço |
| `nuvia-input-bar-cat.png` | Barra de campo decorada com gatinho |
| `nuvia-note-card.png` | Cartão de anotação |
| `nuvia-progress-bar.png` | Barra de progresso |
| `nuvia-speech-bubble.png` | Balão de fala |

## Onde cada ilustração é usada

- **Login** (`backend/src/paginas/login.js`): cena de estudos com janela, planta
  pendurada, quadro, estante, flores, notebook, livros, gatinho dormindo, caneca,
  almofada, planta e lua; gatinho espiando + coração no hero "Nuvia"; brilhos e
  estrela ao redor do formulário; laços rosa/lilás nos quatro cantos.
- **Dashboard** (`backend/src/paginas/inicio.js`): lua, brilho, gatinho dormindo e
  planta no cartão de dica; gatinho espiando, brilho laranja e coração na saudação;
  plantinha no título de "Minhas tarefas" e "Minhas matérias".
- **Calendário** (`backend/src/paginas/calendario.js`): gatinho com laço no
  cabeçalho, estante + plantinha no rail, lua/estrela/coração no rodapé do rail,
  gatinho no disco do player, lua do painel, gatinho dormindo + planta + estrela no
  cartão motivacional, livros + gatinho espiando na ilustração lateral, lua da
  legenda, coração no estado vazio, planta pendurada/livros/gatinho/lua/estrela no
  rodapé decorativo.
- **UI/ícones e demais recortes** ficam disponíveis para novas telas, sem links
  externos.

## Uso

```js
const { decoracao } = require('../../backend/src/paginas/decoracoes');

decoracao('nuvia-cat-sleeping-pillow', { pasta: 'cats', tamanho: 160 });
decoracao('nuvia-moon', {
  pasta: 'celestial',
  tamanho: 48,
  top: '10px',
  right: '12px',
  opacidade: 0.8,
  rotacao: -12,            // graus, sem distorcer
  ocultarEm: 'mobile',
});
```

O componente aceita `tamanho`, `posicao` (`top`/`right`/`bottom`/`left`),
`margem`, `opacidade`, `rotacao`, `ocultarEm` (`mobile`/`tablet`/`sempre`),
`classe`, `estilo`, `carregamento` e `alt`. O CSS base está em
`frontend/decoracoes.css` (`.deco`, `.deco--abs`, classes de visibilidade),
sempre com `width` + `height: auto`, `image-rendering: pixelated` e
`pointer-events: none`.
