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

-- Foto de perfil guardada no próprio banco (necessário em hospedagem
-- serverless, onde o disco não é permanente). Mantemos também a coluna
-- "foto" com o nome do arquivo, usada nas URLs /fotos/<nome>.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_dados BYTEA;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_tipo  TEXT;

-- Tema visual preferido do usuário (sistema de personalização de temas)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'clean-minimal';

-- Vínculo com login social (Google / GitHub). O e-mail precisa ser o mesmo
-- da conta Nuvia; o ID externo evita depender do e-mail em logins futuros.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS oauth_google_id TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS oauth_github_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_oauth_google
  ON usuarios(oauth_google_id) WHERE oauth_google_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_oauth_github
  ON usuarios(oauth_github_id) WHERE oauth_github_id IS NOT NULL;

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

-- Tipo da atividade: trabalho (entrega), avaliacao/prova, tarefa/quiz,
-- projeto ou evento. Os três últimos são marcações de calendário.
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'trabalho';
DO $$
BEGIN
  ALTER TABLE atividades DROP CONSTRAINT IF EXISTS atividades_tipo_check;
  ALTER TABLE atividades ADD CONSTRAINT atividades_tipo_check
    CHECK (tipo IN ('trabalho','avaliacao','tarefa','projeto','evento'));
END $$;

-- Entrega do aluno (uma por atividade; reenvio substitui enquanto não corrigida)
CREATE TABLE IF NOT EXISTS entregas (
  id             SERIAL PRIMARY KEY,
  atividade_id   INTEGER     NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
  aluno_id       INTEGER     NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
  arquivo_nome   TEXT,                              -- nome original do arquivo
  arquivo        TEXT,                              -- nome do arquivo no disco
  arquivo_tipo   TEXT,
  arquivo_tamanho BIGINT,
  link           TEXT,                              -- entrega via link (Drive, site, Docs...)
  metodo         TEXT        NOT NULL DEFAULT 'arquivo' CHECK (metodo IN ('arquivo','link','drive')),
  enviado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota           NUMERIC(6,2),
  observacao     TEXT         NOT NULL DEFAULT '',
  corrigido_em   TIMESTAMPTZ,
  UNIQUE (atividade_id, aluno_id)
);
CREATE INDEX IF NOT EXISTS idx_entrega_aluno ON entregas(aluno_id);

-- Conteúdo do arquivo entregue guardado no banco (hospedagem serverless).
-- Registros antigos continuam funcionando pelo arquivo em disco.
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS arquivo_dados BYTEA;

-- Migrações de colunas novas (tabelas já existentes ignoram o CREATE TABLE acima)
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS link TEXT;                          -- entrega via link (Drive, site, Docs...)
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS metodo TEXT NOT NULL DEFAULT 'arquivo';
-- Corrige o domínio de valores aceitos (arquivo/link/drive) de forma segura
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entregas_metodo_check') THEN
    ALTER TABLE entregas ADD CONSTRAINT entregas_metodo_check
      CHECK (metodo IN ('arquivo','link','drive'));
  END IF;
END $$;

-- Sessões (usado pelo express-session + connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid    TEXT PRIMARY KEY,
  sess   JSONB        NOT NULL,
  expire TIMESTAMPTZ  NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
