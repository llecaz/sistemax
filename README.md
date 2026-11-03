# 🏫 Sistema de Entrega de Trabalhos — Estilo Google Classroom

Site para a escola onde os alunos enviam seus trabalhos **direto para o professor daquela matéria**, com escolha automática de **turma → matéria → professor**, correção com nota/observação e visual minimalista inspirado no Google Classroom.

Feito com **Express** (Node.js) + **PostgreSQL**.

---

## ✨ Principais recursos

### 🎨 Visual
- Estética **Google Classroom / minimalista**: Roboto, cards brancos com cantos arredondados, faixa colorida no topo de cada matéria, botões arredondados no azul do Google `#1a73e8`.
- **🎨 Sistema de personalização de temas** (⚙️ Configurações → **Aparência**):
  - **8 temas**: `Clean Minimal` (padrão), `Japandi`, `Dark Minimal`, `Soft UI`, `Lo-fi Night`, `Pastel Dream`, `Moonroom` e `Dark Academia`.
  - **Lo-fi Night** e **Moonroom** também mudam o **design** (decoração de fundo + widget exclusivo: rádio lo-fi e cantinho da lua), sem alterar a paleta do Lo-fi Night.
  - Galeria com **cards de pré-visualização** (miniatura da interface), **paleta de cores**, **descrição da estética** e selos `Selecionado` / `Visualizando` / `Padrão`.
  - Clique num card para **visualizar** a aparência na plataforma inteira e depois **Aplicar tema** (ou **Cancelar pré-visualização**).
  - O tema fica salvo **na conta (banco de dados)** — sobrevive a atualizar a página, sair e entrar novamente, e vale para qualquer dispositivo.
  - **Restaurar padrão** volta ao Clean Minimal.
  - Alternador **Sol 🌞 / Lua 🌙** na barra superior troca rapidamente entre o par claro/escuro do tema atual.
  - Cada tema tem sua própria identidade (fontes, cores, decorações de fundo), mas mantém a mesma estrutura e funcionalidades.
  - Organizado com **variáveis CSS**: base em `frontend/estilo.css` + identidade dos temas em `frontend/temas.css` + registro em `backend/src/temas.js`.
- Ícone de **engrenagem ⚙️** na barra superior → página de **Configurações**.
- Responsivo (celular e computador).

### 🔐 Login
- Tela de entrada **estilo Google**: card centralizado, campos Email/Senha, botão azul.
- **Manter conectado** (sessão de 30 dias) ou sessão só no navegador.
- **Cadastro de aluno pelo código da turma** (fornecido pela escola).
- **Esqueci a senha**: recuperação por pergunta de segurança + redefinição pelo admin.
- Mensagens de erro seguras: `"Email ou senha incorretos"` (não revela se a conta existe).
- Tentativas de login limitadas (proteção contra força bruta).

### 🎓 Área do Aluno
- **Início em painel**: saudação, resumo (a fazer / aguardando correção / corrigidas), **Minhas tarefas** com abas, **Minhas matérias** com barra de progresso, mini-calendário e próximas tarefas.
- **Visual lo-fi / dreamy** no painel inicial: mesma paleta creme, lilás e rosa do calendário, tipografia pixel, cartões com sombra dura, ilustrações da biblioteca e cartão de dica escuro.
- **Página da matéria em painel**: lista de trabalhos + resumo lateral com entregues, progresso e próximo prazo.
- **Detalhe do trabalho em painel**: descrição, prazo, entrega/correção e envio + resumo lateral (situação, prazo, envio, nota), orientações de entrega e atalhos.
- Grade de **cards das matérias** da turma (cada matéria com o nome do professor).
- Abas de filtro dos trabalhos: `Todos` · `Não corrigidos` · `Corrigidos` · `Atrasados`
  - *Não corrigidos*: entregue, aguardando correção
  - *Corrigidos*: com nota e observação do professor
  - *Atrasados*: prazo vencido e não entregue (ou entregue fora do prazo)
- Envio de arquivo (PDF, DOCX, PPTX, XLSX, JPG/PNG, TXT — até 15 MB).
- **Outras formas de entrega**: abas **Arquivo**, **Link** (site, artigo, post) e **Google Drive** (link compartilhado), com validação de URL no servidor e chips de categorias (documentos, planilhas, apresentações, imagens).
- **Reenvio permitido enquanto o trabalho não for corrigido.**

### 🗓️ Calendário do mês (aluno e professor)
- Página própria com grade do **mês**, prazos e provas marcados por dia.
- **Visual lo-fi / dreamy em pixel art**: quarto de estudos aconchegante, tons pastel de rosa, lilás, roxo e creme.
- **Barra lateral escura** com navegação em ícones pixel, estante de livros, luas e plantinhas.
- **Player lo-fi** funcional (acordes, baixo e chuva sintetizados com Web Audio — sem arquivos externos).
- Área principal com cabeçalho ilustrado, navegação de meses e cartão do calendário.
- Painel direito com **Próximas tarefas**, cartão motivacional e ilustrações de gatinhos.
- Rodapé com **resumo do dia**, **progresso do mês** e legenda de cores.
- Indicadores coloridos: **tarefa/quiz**, **entrega**, **prova**, **projeto** e **evento**.
- No celular, a grade mostra a **semana inteira** com pontinhos coloridos por tipo de atividade.
- O **professor** pode usar **+ Adicionar evento** para marcar provas/projetos/eventos no mês; o aluno apenas visualiza.
- Ilustrações em SVG pixel art geradas por `scripts/gerar-pixel-art.js` e salvas em `frontend/img/lofi/`.
- **Biblioteca de decorações** recortada da cartela oficial em pixel art, com PNGs transparentes em `frontend/assets/decorations/`:
  - `cats/` — gatinhos dormindo, sentado, sobre livros, anjo, espreguiçando, deitado, na manta e espiando.
  - `celestial/` — lua, estrelas, sparkles e corações.
  - `details/` — laços, patinhas e asinhas.
- Componente reutilizável `decoracao(nome, opções)` em `backend/src/paginas/decoracoes.js` (tamanho, posição, margem, opacidade, visibilidade e `alt`).
- As decorações aparecem na barra lateral, no cabeçalho e nos painéis do calendário, e no painel inicial do aluno/professor (cartão de dica e saudação).

### 🖼️ Biblioteca de decorações (pixel art)

Os recortes foram extraídos da cartela original, mantendo transparência, contorno, cores e proporção. Nenhuma ilustração foi redesenhada. A cartela não tinha plantas, então a pasta `plants/` não foi criada — apenas os elementos realmente presentes.

```
frontend/assets/decorations/
├── cats/             # 9 gatinhos
├── celestial/        # lua, estrelas, sparkles e corações
└── details/          # laços, patinhas e asinhas
```

Uso do componente no backend:

```js
const { decoracao } = require('./decoracoes');

decoracao('cat-sleeping', {
  pasta: 'cats',
  tamanho: 160,          // px ou string CSS
  opacidade: 0.9,
  top: '12px', right: '10px',  // posicionamento absoluto opcional
  margem: '8px',
  ocultarEm: 'mobile',   // 'mobile' | 'tablet' | 'sempre'
  alt: 'Gatinho dormindo em uma almofada rosa',
});
```

O CSS base fica em `frontend/decoracoes.css` (`.deco`, `.deco--abs`, classes de visibilidade) e preserva a proporção com `width` + `height: auto`, `image-rendering: pixelated` e `pointer-events: none`.

### 👩‍🏫 Área do Professor
- **Início em painel**: entregas para corrigir, matérias com progresso de correções, mini-calendário e próximas tarefas.
- **Visual lo-fi / dreamy** também no painel do professor, seguindo o calendário.
- **Página da matéria em painel**: publicar atividades + resumo lateral (entregas, correções pendentes e próximo prazo).
- **Tela de correção em painel**: entregas dos alunos + resumo lateral (prazo, alunos, entregues, corrigidas, média e progresso), lista de quem está aguardando e de quem não entregou (com atalho para o aluno).
- Cards das turmas/matérias que leciona (com entregas aguardando correção).
- Criar **atividade com prazo de entrega**; filtros `Todas / Aguardando correção / Corrigidas`.
- Lista de alunos com download do arquivo e correção: **nota (0–10) + observação**.

### ⚙️ Área do Admin
- **Painel com resumo lateral**: totais de turmas, alunos, professores, matérias e vínculos, alertas (sem vínculo/sem turma) e atalhos.
- Cadastrar **turmas** (gera o **código de matrícula**, com botão "Copiar" e regeneração).
- Cadastrar **disciplinas** e **professores**.
- **Vincular professor ↔ turma ↔ matéria** (é daí que o aluno escolhe quem é professor de quê).
- Gerenciar alunos (trocar turma, redefinir senha, ativar/desativar).

### ⚙️ Configurações (engrenagem)
- **Foto de perfil** (JPG/PNG/WebP até 2 MB) ou inicial num círculo colorido.
- **Nome**, **email** e **turma conectada** (aluno) / matérias que leciona (professor).
- Alterar **senha** e **pergunta de segurança**.
- Escolha do **tema claro/escuro**.

---

## 🛠️ Tecnologia

| Item | Escolha |
|---|---|
| Backend | **Node.js + Express 5** |
| Banco de dados | **PostgreSQL** (`pg` + pool de conexões) |
| Sessões | `express-session` com store no PostgreSQL (`connect-pg-simple`) |
| Uploads | `multer` (arquivos fora da área pública) |
| Frontend | HTML + CSS + JS puro, ícones SVG embutidos |
| Senhas | Hash `scrypt` + salt (nativo do Node) |
| Configuração | `dotenv` (arquivo `.env`) |

---

## ▶️ Como executar

**Requisitos:** Node.js **18+** (testado na 26).

```bash
npm install        # primeira vez
npm start          # sobe o banco (se local) + prepara as tabelas + inicia o site
```

Abra <http://localhost:3000> — na rede da escola: `http://IP-DA-MÁQUINA:3000`.

### 👤 Acessos de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | `admin@escola.com` | `admin123` |
| Aluno | `ana@escola.com` | `aluno123` |
| Professora | `maria@escola.com` | `prof123` |
| Professor | `joao@escola.com` | `prof123` |

> ⚠️ Troque as senhas depois do primeiro acesso.

### ⚙️ Configuração do banco (`.env`)

Copie o modelo e ajuste:

```bash
cp .env.exemplo .env
```

| Variável | Descrição |
|---|---|
| `AMBIENTE` | `local` (PostgreSQL desta máquina) ou `producao` (banco externo) |
| `DATABASE_URL_LOCAL` | Conexão do PostgreSQL local — padrão: `postgresql://sistemax:sistemax@127.0.0.1:5433/sistemax` |
| `DATABASE_URL_PRODUCAO` | Conexão do banco externo (Render, Neon, servidor da escola) |
| `PORT` | Porta do site (padrão 3000) |
| `SESSION_SECRET` | Segredo das sessões — troque por algo longo e único |
| `SITE_URL` | URL pública do site |

**No modo `local`** o servidor baixa e sobe um PostgreSQL real automaticamente (pasta `.pglocal/`) — sem sudo e sem Docker.
**No modo `producao`** basta apontar `DATABASE_URL_PRODUCAO` para o banco; as tabelas e os dados iniciais são criados sozinhos.

> 🔎 **Aviso:** algumas redes bloqueiam a porta `5432`. Se o site rodar em uma rede assim, use o modo `local` (as conexões são internas) ou um banco acessível pela rede permitida.

---

## 📁 Estrutura do projeto

O projeto está dividido em **duas pastas**: `backend/` (servidor) e `frontend/` (arquivos do navegador).

```
sistemax/
├── backend/                 # Lado servidor (Node.js + Express)
│   ├── servidor.js          # Inicia banco + servidor Express
│   └── src/
│       ├── app.js           # Configuração do Express (sessões, rotas, estáticos)
│       ├── db.js            # Pool de conexão com o PostgreSQL
│       ├── schema.sql       # Esquema das tabelas (idempotente)
│       ├── criarBanco.js    # Cria tabelas + insere dados de exemplo
│       ├── seed.js          # Dados iniciais (admin, turmas, matérias, professores)
│       ├── auth.js          # Senhas (scrypt), sessão e proteção de rotas
│       ├── temas.js         # ⭐ Registro dos temas visuais (fonte única)
│       ├── regras.js        # Regras de status (atrasado/corrigido/etc.)
│       ├── util.js          # Escape HTML, datas, cores, códigos
│       ├── postgresLocal.js # PostgreSQL local embutido (modo local)
│       ├── paginas/         # HTML gerado (layout, login, aluno, professor, admin, config)
│       │   └── decoracoes.js # ⭐ Componente decoracao() da biblioteca pixel art
│       └── rotas/           # Rotas (auth, aluno, professor, admin, config, arquivos)
├── frontend/                # Lado cliente (estáticos servidos pelo Express)
│   ├── estilo.css           # Tema base (variáveis) + visual Classroom + galeria
│   ├── temas.css            # ⭐ Identidade visual de cada tema (variáveis CSS)
│   ├── decoracoes.css       # ⭐ Componente .deco da biblioteca
│   ├── lofi.css             # ⭐ Visual lo-fi/pixel art da página de calendário
│   ├── lofi.js              # ⭐ Player lo-fi (Web Audio API)
│   ├── assets/decorations/  # ⭐ PNGs transparentes (cats, celestial, details)
│   ├── img/lofi/            # ⭐ Ilustrações pixel art (gatos, livros, plantas, lua)
│   └── app.js               # Temas, menu, confirmações, seleção de arquivos
├── scripts/gerar-pixel-art.js  # Gera os SVGs das ilustrações do calendário
├── backend/uploads/         # Arquivos enviados (fora da área pública)
├── package.json             # Scripts: start, dev, criar-banco
├── .env.exemplo             # Modelo de configuração
└── README.md
```

---

## 🎨 Sistema de temas — como adicionar um tema novo

1. **Registre** o tema em [`backend/src/temas.js`](backend/src/temas.js):
   adicione um objeto com `id`, `nome`, `categoria`, `modo` (`claro`/`escuro`),
   `par` (tema oposto usado pelo alternador Sol/Lua), `descricao` e `paleta` (5 cores).
2. **Crie o bloco de cores** em [`frontend/temas.css`](frontend/temas.css):
   ```css
   [data-tema='meu-tema'] {
     --fundo: #...;
     --superficie: #...;
     /* as mesmas variáveis do :root em estilo.css */
   }
   ```
3. (Opcional) Adicione toques de identidade no mesmo arquivo — fontes, decorações de fundo etc.

Pronto: o tema aparece **automaticamente** na galeria de Configurações → Aparência.
O tema padrão de novos usuários é o `clean-minimal` (coluna `usuarios.tema`).

---

## 🗃️ Banco de dados (7 tabelas)

| Tabela | Função |
|---|---|
| `usuarios` | admin, professores e alunos (nome, e-mail, senha, pergunta de segurança, **tema visual**) |
| `turmas` | turmas com **código de matrícula** (ex.: `TURMA-9ANOA-K7X2`) |
| `disciplinas` | Matemática, Português, História... |
| `turma_disciplina` | ⭐ vínculo **turma ↔ matéria ↔ professor** (o coração do sistema) |
| `atividades` | trabalho criado pelo professor: título, descrição e **prazo** |
| `entregas` | arquivo do aluno + nota + observação do professor |
| `session` | sessões dos usuários (guardadas no PostgreSQL) |

---

## 🔒 Segurança

- Senhas com hash `scrypt` + salt (nunca em texto puro).
- Sessão por cookie `httpOnly` + token no PostgreSQL (dá para encerrar sessão de qualquer lugar).
- Limite de tentativas de login (força bruta).
- Arquivos fora da pasta pública — baixados apenas pelo aluno dono, pelo professor da matéria ou pelo admin.
- Todo texto exibido é escapado (proteção contra XSS/injeção).
- Mensagens de login genéricas, sem revelar se a conta existe.
- `.env` (com as credenciais do banco) fora do Git.

---

## 🧭 Fluxo completo de uso

1. **Admin** entra → cadastra turmas (recebe os códigos), disciplinas e professores → **vincula professor ↔ turma ↔ matéria**.
2. **Aluno** entra no site → *"Criar conta de aluno"* → informa o **código da turma** → já cai na turma certa.
3. **Professor** cria uma **atividade com prazo** numa das suas matérias.
4. **Aluno** abre a matéria → envia o arquivo (pode reenviar enquanto não corrigido).
5. **Professor** baixa o arquivo → dá **nota e observação**.
6. **Aluno** acompanha nas abas `Não corrigidos` / `Corrigidos` / `Atrasados`.
7. Qualquer usuário configura **foto, dados e tema** pelo ícone ⚙️.
