-- ============================================================
--  Sistema de Entrega de Trabalhos — esquema do PostgreSQL
--  Executado automaticamente na primeira vez (idempotente)
-- ============================================================

-- Turmas da escola (com código de matrícula para o aluno se cadastrar)
CREATE TABLE IF NOT EXISTS turmas (
  id          SERIAL PRIMARY KEY,
  nome        TEXT        NOT NULL,
  ano_letivo  INTEGER     NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int,
  codigo      TEXT        NOT NULL UNIQUE,
  ativa       BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matérias / disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
  id    SERIAL PRIMARY KEY,
  nome  TEXT NOT NULL UNIQUE
);

-- Usuários: admin, professores e alunos
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nome           TEXT        NOT NULL,
  email          TEXT        NOT NULL UNIQUE,
  senha_hash     TEXT        NOT NULL,
  tipo           TEXT        NOT NULL CHECK (tipo IN ('admin','aluno','professor')),
  matricula      TEXT        UNIQUE,                -- alunos
  turma_id       INTEGER     REFERENCES turmas(id) ON DELETE SET NULL,  -- alunos
  foto           TEXT,                              -- arquivo da foto de perfil
  pergunta_seg   TEXT,                              -- pergunta de segurança
  resposta_seg   TEXT,                              -- resposta (hash)
  ativo          BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_turma  ON usuarios(turma_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo   ON usuarios(tipo);

-- Tema visual preferido do usuário (sistema de personalização de temas)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'clean-minimal';

-- ⭐ Vínculo turma <-> matéria <-> professor (o coração do sistema)
CREATE TABLE IF NOT EXISTS turma_disciplina (
  id            SERIAL PRIMARY KEY,
  turma_id      INTEGER NOT NULL REFERENCES turmas(id)      ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  professor_id  INTEGER REFERENCES usuarios(id)             ON DELETE SET NULL,
  UNIQUE (turma_id, disciplina_id)
);
CREATE INDEX IF NOT EXISTS idx_vinculo_professor ON turma_disciplina(professor_id);

-- Atividade/trabalho criado pelo professor, com prazo de entrega
CREATE TABLE IF NOT EXISTS atividades (
  id           SERIAL PRIMARY KEY,
  vinculo_id   INTEGER     NOT NULL REFERENCES turma_disciplina(id) ON DELETE CASCADE,
  professor_id INTEGER     NOT NULL REFERENCES usuarios(id)         ON DELETE CASCADE,
  titulo       TEXT        NOT NULL,
  descricao    TEXT        NOT NULL DEFAULT '',
  prazo        TIMESTAMPTZ,
  ativa        BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_atividade_vinculo ON atividades(vinculo_id);

-- Entrega do aluno (uma por atividade; reenvio substitui enquanto não corrigida)
CREATE TABLE IF NOT EXISTS entregas (
  id             SERIAL PRIMARY KEY,
  atividade_id   INTEGER     NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id       INTEGER     NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
  arquivo_nome   TEXT,                              -- nome original do arquivo
  arquivo        TEXT,                              -- nome do arquivo no disco
  arquivo_tipo   TEXT,
  arquivo_tamanho BIGINT,
  enviado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota           NUMERIC(6,2),
  observacao     TEXT         NOT NULL DEFAULT '',
  corrigido_em   TIMESTAMPTZ,
  UNIQUE (atividade_id, aluno_id)
);
CREATE INDEX IF NOT EXISTS idx_entrega_aluno ON entregas(aluno_id);

-- Sessões (usado pelo express-session + connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid    TEXT PRIMARY KEY,
  sess   JSONB        NOT NULL,
  expire TIMESTAMPTZ  NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
