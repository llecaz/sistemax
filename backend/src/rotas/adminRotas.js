/** Rotas do administrador: turmas, disciplinas, professores, vínculos e alunos. */
const express = require('express');
const { um, todos, query } = require('../db');
const { exigePerfil, hash } = require('../auth');
const { gerarCodigoTurma } = require('../util');
const { painelAdmin } = require('../paginas/admin');
const { paginaCalendario } = require('../paginas/calendario');
const { pagina } = require('../paginas/layout');

const router = express.Router();
router.use(exigePerfil('admin'));

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

function id(valor) {
  return Number(valor) || 0;
}

async function carregarDados() {
  const [turmas, disciplinas, professores, vinculos, alunos] = await Promise.all([
    todos(`SELECT t.*, (SELECT count(*) FROM usuarios u WHERE u.turma_id = t.id AND u.tipo = 'aluno') AS alunos
             FROM turmas t ORDER BY t.nome`),
    todos(`SELECT d.*, (SELECT count(*) FROM turma_disciplina td WHERE td.disciplina_id = d.id) AS vinculos
             FROM disciplinas d ORDER BY d.nome`),
    todos(`SELECT u.id, u.nome, u.email, u.ativo,
                  (SELECT string_agg(t.nome || ' · ' || d.nome, ', ' ORDER BY t.nome)
                     FROM turma_disciplina td
                     JOIN turmas t ON t.id = td.turma_id
                     JOIN disciplinas d ON d.id = td.disciplina_id
                    WHERE td.professor_id = u.id) AS materias
             FROM usuarios u WHERE u.tipo = 'professor' ORDER BY u.nome`),
    todos(`SELECT td.id, td.professor_id, t.nome AS turma, d.nome AS disciplina
             FROM turma_disciplina td
             JOIN turmas t ON t.id = td.turma_id
             JOIN disciplinas d ON d.id = td.disciplina_id
            ORDER BY t.nome, d.nome`),
    todos(`SELECT u.id, u.nome, u.email, u.matricula, u.turma_id, u.ativo, t.nome AS turma_nome
             FROM usuarios u LEFT JOIN turmas t ON t.id = u.turma_id
            WHERE u.tipo = 'aluno' ORDER BY u.nome`),
  ]);

  return {
    turmas,
    disciplinas,
    professores,
    vinculos,
    alunos,
    turmaOptions: turmas.map((t) => ({ id: t.id, rotulo: `${t.nome} (${t.ano_letivo})` })),
    disciplinaOptions: disciplinas.map((d) => ({ id: d.id, rotulo: d.nome })),
    professorOptions: professores.map((p) => ({ id: p.id, rotulo: p.nome })),
  };
}

/** Calendário escolar do admin: visão geral de todas as atividades. */
router.get('/calendario', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const agora = new Date();
    const ano = Number(req.query.ano) || agora.getFullYear();
    const mes = Math.min(11, Math.max(0, (Number(req.query.mes) || agora.getMonth() + 1) - 1));

    const eventos = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.tipo, td.id AS vinculo_id,
              d.nome AS materia, t.nome AS turma,
              (SELECT count(*) FROM entregas e WHERE e.atividade_id = a.id) AS total_entregas
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
        WHERE a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo`
    );

    res.send(
      pagina({
        titulo: 'Calendário do mês',
        usuario,
        req,
        ativa: 'calendario',
        corpo: paginaCalendario({ usuario, eventos, ano, mes }),
      })
    );
  } catch (erro) {
    console.error('[admin/calendario]', erro);
    flash(req, 'erro', 'Não foi possível carregar o calendário.');
    res.redirect('/admin');
  }
});

/** Painel administrativo. */
router.get('/', async (req, res) => {
  try {
    const secoes = ['turmas', 'disciplinas', 'professores', 'vinculos', 'alunos'];
    const secao = secoes.includes(req.query.secao) ? req.query.secao : 'turmas';
    const dados = await carregarDados();
    res.send(
      pagina({
        titulo: 'Painel administrativo',
        usuario: req.session.usuario,
        req,
        ativa: 'admin',
        corpo: painelAdmin({ secao, dados, usuario: req.session.usuario }),
      })
    );
  } catch (erro) {
    console.error('[admin/home]', erro);
    flash(req, 'erro', 'Não foi possível carregar o painel.');
    res.redirect('/');
  }
});

/* ---------------- Turmas ---------------- */
router.post('/turmas', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const ano = Number(req.body.ano_letivo) || new Date().getFullYear();
    if (!nome) {
      flash(req, 'erro', 'Informe o nome da turma.');
      return res.redirect('/admin?secao=turmas');
    }
    const nova = await query(`INSERT INTO turmas (nome, ano_letivo, codigo) VALUES ($1, $2, $3) RETURNING codigo`,
      [nome, ano, gerarCodigoTurma(nome)]);
    flash(req, 'ok', `Turma criada! Código de matrícula: ${nova.rows[0].codigo}`);
    res.redirect('/admin?secao=turmas');
  } catch (erro) {
    console.error('[admin/turmas]', erro);
    flash(req, 'erro', 'Não foi possível criar a turma.');
    res.redirect('/admin?secao=turmas');
  }
});

router.post('/turmas/:id/codigo', async (req, res) => {
  try {
    const t = await um(`SELECT id, nome FROM turmas WHERE id = $1`, [id(req.params.id)]);
    if (!t) return res.redirect('/admin?secao=turmas');
    await query(`UPDATE turmas SET codigo = $1 WHERE id = $2`, [gerarCodigoTurma(t.nome), t.id]);
    flash(req, 'ok', 'Novo código gerado. Distribua-o aos alunos — o antigo parou de funcionar.');
    res.redirect('/admin?secao=turmas');
  } catch (erro) {
    console.error('[admin/codigo]', erro);
    flash(req, 'erro', 'Não foi possível gerar o código.');
    res.redirect('/admin?secao=turmas');
  }
});

router.post('/turmas/:id/status', async (req, res) => {
  try {
    await query(`UPDATE turmas SET ativa = NOT ativa WHERE id = $1`, [id(req.params.id)]);
    flash(req, 'ok', 'Situação da turma alterada.');
    res.redirect('/admin?secao=turmas');
  } catch (erro) {
    console.error('[admin/turma-status]', erro);
    res.redirect('/admin?secao=turmas');
  }
});

/* ---------------- Disciplinas ---------------- */
router.post('/disciplinas', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    if (!nome) return res.redirect('/admin?secao=disciplinas');
    await query(
      `INSERT INTO disciplinas (nome) VALUES ($1)
       ON CONFLICT (nome) DO NOTHING`,
      [nome]
    );
    flash(req, 'ok', 'Matéria adicionada.');
    res.redirect('/admin?secao=disciplinas');
  } catch (erro) {
    console.error('[admin/disciplinas]', erro);
    flash(req, 'erro', 'Não foi possível adicionar a matéria.');
    res.redirect('/admin?secao=disciplinas');
  }
});

router.post('/disciplinas/:id/excluir', async (req, res) => {
  try {
    const discId = id(req.params.id);
    const usos = await um(`SELECT count(*)::int AS n FROM turma_disciplina WHERE disciplina_id = $1`, [discId]);
    if (usos && usos.n > 0) {
      flash(req, 'erro', `Esta matéria está em uso em ${usos.n} turma(s). Remova os vínculos antes de excluí-la.`);
      return res.redirect('/admin?secao=disciplinas');
    }
    await query(`DELETE FROM disciplinas WHERE id = $1`, [discId]);
    flash(req, 'ok', 'Matéria excluída.');
    res.redirect('/admin?secao=disciplinas');
  } catch (erro) {
    console.error('[admin/disc-excluir]', erro);
    flash(req, 'erro', 'Não foi possível excluir a matéria.');
    res.redirect('/admin?secao=disciplinas');
  }
});

/* ---------------- Professores e usuários ---------------- */
async function usuarioExistente(email) {
  return um(`SELECT id FROM usuarios WHERE lower(email) = lower($1)`, [String(email || '').trim().toLowerCase()]);
}

router.post('/professores', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    if (!nome || !email || senha.length < 6) {
      flash(req, 'erro', 'Preencha nome, e-mail e uma senha com ao menos 6 caracteres.');
      return res.redirect('/admin?secao=professores');
    }
    if (await usuarioExistente(email)) {
      flash(req, 'erro', 'Já existe uma conta com este e-mail.');
      return res.redirect('/admin?secao=professores');
    }
    await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES ($1, $2, $3, 'professor')`,
      [nome, email, hash(senha)]
    );
    flash(req, 'ok', `Professor(a) ${nome} criado(a). Agora vincule-o às matérias na aba "Vínculos".`);
    res.redirect('/admin?secao=professores');
  } catch (erro) {
    console.error('[admin/professores]', erro);
    flash(req, 'erro', 'Não foi possível criar o professor.');
    res.redirect('/admin?secao=professores');
  }
});

router.post('/usuarios/:id/senha', async (req, res) => {
  try {
    const senha = String(req.body.senha || '');
    const alvo = Number(req.params.id);
    if (senha.length < 6) {
      flash(req, 'erro', 'A nova senha precisa ter ao menos 6 caracteres.');
      return res.redirect('/admin?secao=professores');
    }
    const u = await um(`SELECT tipo FROM usuarios WHERE id = $1`, [alvo]);
    if (!u) return res.redirect('/admin');
    await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [hash(senha), alvo]);
    flash(req, 'ok', 'Senha redefinida.');
    res.redirect(`/admin?secao=${u.tipo === 'aluno' ? 'alunos' : 'professores'}`);
  } catch (erro) {
    console.error('[admin/senha]', erro);
    flash(req, 'erro', 'Não foi possível redefinir a senha.');
    res.redirect('/admin');
  }
});

router.post('/usuarios/:id/status', async (req, res) => {
  try {
    const alvo = Number(req.params.id);
    const u = await um(`SELECT tipo FROM usuarios WHERE id = $1`, [alvo]);
    if (!u) return res.redirect('/admin');
    if (u.tipo === 'admin') {
      flash(req, 'erro', 'Não é possível desativar um administrador.');
      return res.redirect('/admin');
    }
    await query(`UPDATE usuarios SET ativo = NOT ativo WHERE id = $1`, [alvo]);
    flash(req, 'ok', 'Situação do usuário alterada.');
    res.redirect(`/admin?secao=${u.tipo === 'aluno' ? 'alunos' : 'professores'}`);
  } catch (erro) {
    console.error('[admin/status]', erro);
    res.redirect('/admin');
  }
});

router.post('/usuarios/:id/turma', async (req, res) => {
  try {
    const turmaId = req.body.turma_id ? id(req.body.turma_id) : null;
    await query(`UPDATE usuarios SET turma_id = $1 WHERE id = $2 AND tipo = 'aluno'`, [turmaId, id(req.params.id)]);
    flash(req, 'ok', 'Turma do aluno atualizada.');
    res.redirect('/admin?secao=alunos');
  } catch (erro) {
    console.error('[admin/aluno-turma]', erro);
    res.redirect('/admin?secao=alunos');
  }
});

/* ---------------- Vínculos turma ↔ matéria ↔ professor ---------------- */
router.post('/vinculos', async (req, res) => {
  try {
    const turmaId = id(req.body.turma_id);
    const discId = id(req.body.disciplina_id);
    const profId = req.body.professor_id ? id(req.body.professor_id) : null;
    if (!turmaId || !discId) {
      flash(req, 'erro', 'Escolha a turma e a matéria.');
      return res.redirect('/admin?secao=vinculos');
    }
    await query(
      `INSERT INTO turma_disciplina (turma_id, disciplina_id, professor_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (turma_id, disciplina_id) DO UPDATE SET professor_id = EXCLUDED.professor_id`,
      [turmaId, discId, profId]
    );
    flash(req, 'ok', 'Vínculo salvo: os alunos já veem este professor na matéria.');
    res.redirect('/admin?secao=vinculos');
  } catch (erro) {
    console.error('[admin/vinculos]', erro);
    flash(req, 'erro', 'Não foi possível salvar o vínculo.');
    res.redirect('/admin?secao=vinculos');
  }
});

router.post('/vinculos/:id', async (req, res) => {
  try {
    const profId = req.body.professor_id ? id(req.body.professor_id) : null;
    await query(`UPDATE turma_disciplina SET professor_id = $1 WHERE id = $2`, [profId, id(req.params.id)]);
    flash(req, 'ok', 'Professor atualizado neste vínculo.');
    res.redirect('/admin?secao=vinculos');
  } catch (erro) {
    console.error('[admin/vinculo-update]', erro);
    res.redirect('/admin?secao=vinculos');
  }
});

router.post('/vinculos/:id/excluir', async (req, res) => {
  try {
    const v = await um(
      `SELECT td.id, (SELECT count(*)::int FROM atividades a WHERE a.vinculo_id = td.id) AS atividades
         FROM turma_disciplina td WHERE td.id = $1`,
      [id(req.params.id)]
    );
    if (v && v.atividades > 0) {
      flash(req, 'erro', 'Esta combinação já tem atividades publicadas. Remova as atividades antes de excluir o vínculo.');
      return res.redirect('/admin?secao=vinculos');
    }
    await query(`DELETE FROM turma_disciplina WHERE id = $1`, [id(req.params.id)]);
    flash(req, 'ok', 'Vínculo removido.');
    res.redirect('/admin?secao=vinculos');
  } catch (erro) {
    console.error('[admin/vinculo-del]', erro);
    res.redirect('/admin?secao=vinculos');
  }
});

/* ---------------- Alunos ---------------- */
router.post('/alunos', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const turmaId = id(req.body.turma_id);
    const matricula = String(req.body.matricula || '').trim() || null;

    if (!nome || !email || senha.length < 6 || !turmaId) {
      flash(req, 'erro', 'Preencha nome, e-mail, senha (mínimo 6) e turma.');
      return res.redirect('/admin?secao=alunos');
    }
    if (await usuarioExistente(email)) {
      flash(req, 'erro', 'Já existe uma conta com este e-mail.');
      return res.redirect('/admin?secao=alunos');
    }

    const novo = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, turma_id, matricula)
       VALUES ($1, $2, $3, 'aluno', $4, $5) RETURNING id`,
      [nome, email, hash(senha), turmaId, matricula]
    );
    if (!matricula) {
      const automatica = `${new Date().getFullYear()}${String(novo.rows[0].id).padStart(5, '0')}`;
      await query(`UPDATE usuarios SET matricula = $1 WHERE id = $2`, [automatica, novo.rows[0].id]);
    }
    flash(req, 'ok', `Aluno(a) ${nome} cadastrado(a).`);
    res.redirect('/admin?secao=alunos');
  } catch (erro) {
    console.error('[admin/alunos]', erro);
    flash(req, 'erro', 'Não foi possível cadastrar o aluno.');
    res.redirect('/admin?secao=alunos');
  }
});

/* ---------------- Edição e exclusão (CRUD completo) ---------------- */

/** Atualiza nome e ano letivo de uma turma. */
router.post('/turmas/:id', async (req, res) => {
  try {
    const turmaId = id(req.params.id);
    const nome = String(req.body.nome || '').trim();
    const ano = Number(req.body.ano_letivo) || new Date().getFullYear();
    if (!nome) {
      flash(req, 'erro', 'Informe o nome da turma.');
      return res.redirect('/admin?secao=turmas');
    }
    const r = await query(`UPDATE turmas SET nome = $1, ano_letivo = $2 WHERE id = $3`, [nome, ano, turmaId]);
    flash(req, r.rowCount ? 'ok' : 'erro', r.rowCount ? 'Turma atualizada.' : 'Turma não encontrada.');
    res.redirect('/admin?secao=turmas');
  } catch (erro) {
    console.error('[admin/turma-editar]', erro);
    flash(req, 'erro', 'Não foi possível atualizar a turma.');
    res.redirect('/admin?secao=turmas');
  }
});

/** Exclui uma turma sem alunos e sem vínculos. */
router.post('/turmas/:id/excluir', async (req, res) => {
  try {
    const turmaId = id(req.params.id);
    const [alunos, vinculos] = await Promise.all([
      um(`SELECT count(*)::int AS n FROM usuarios WHERE turma_id = $1 AND tipo = 'aluno'`, [turmaId]),
      um(`SELECT count(*)::int AS n FROM turma_disciplina WHERE turma_id = $1`, [turmaId]),
    ]);
    if (alunos.n > 0) {
      flash(req, 'erro', `Esta turma tem ${alunos.n} aluno(s). Transfira ou exclua os alunos antes de removê-la.`);
      return res.redirect('/admin?secao=turmas');
    }
    if (vinculos.n > 0) {
      flash(req, 'erro', `Esta turma tem ${vinculos.n} vínculo(s) com matérias. Remova os vínculos antes de excluí-la.`);
      return res.redirect('/admin?secao=turmas');
    }
    await query(`DELETE FROM turmas WHERE id = $1`, [turmaId]);
    flash(req, 'ok', 'Turma excluída.');
    res.redirect('/admin?secao=turmas');
  } catch (erro) {
    console.error('[admin/turma-excluir]', erro);
    flash(req, 'erro', 'Não foi possível excluir a turma.');
    res.redirect('/admin?secao=turmas');
  }
});

/** Renomeia uma matéria. */
router.post('/disciplinas/:id', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    if (!nome) {
      flash(req, 'erro', 'Informe o nome da matéria.');
      return res.redirect('/admin?secao=disciplinas');
    }
    const r = await query(`UPDATE disciplinas SET nome = $1 WHERE id = $2`, [nome, id(req.params.id)]);
    flash(req, r.rowCount ? 'ok' : 'erro', r.rowCount ? 'Matéria atualizada.' : 'Matéria não encontrada.');
    res.redirect('/admin?secao=disciplinas');
  } catch (erro) {
    const duplicada = erro.code === '23505';
    console.error('[admin/disc-editar]', erro.message);
    flash(req, 'erro', duplicada ? 'Já existe uma matéria com esse nome.' : 'Não foi possível atualizar a matéria.');
    res.redirect('/admin?secao=disciplinas');
  }
});

/** Atualiza nome/e-mail de aluno ou professor. */
router.post('/usuarios/:id', async (req, res) => {
  try {
    const alvo = id(req.params.id);
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!nome || !email) {
      flash(req, 'erro', 'Informe nome e e-mail.');
      return res.redirect('/admin');
    }
    const u = await um(`SELECT tipo FROM usuarios WHERE id = $1`, [alvo]);
    if (!u) return res.redirect('/admin');
    const secao = u.tipo === 'aluno' ? 'alunos' : 'professores';
    if (u.tipo === 'admin') {
      flash(req, 'erro', 'Os dados do administrador são alterados em Configurações.');
      return res.redirect('/admin');
    }
    const conflito = await um(
      `SELECT id FROM usuarios WHERE lower(email) = lower($1) AND id <> $2`,
      [email, alvo]
    );
    if (conflito) {
      flash(req, 'erro', 'Já existe outra conta com este e-mail.');
      return res.redirect(`/admin?secao=${secao}`);
    }
    await query(`UPDATE usuarios SET nome = $1, email = $2 WHERE id = $3`, [nome, email, alvo]);
    flash(req, 'ok', 'Dados atualizados.');
    res.redirect(`/admin?secao=${secao}`);
  } catch (erro) {
    console.error('[admin/usuario-editar]', erro);
    flash(req, 'erro', 'Não foi possível atualizar os dados.');
    res.redirect('/admin');
  }
});

/** Exclui aluno ou professor (com proteções). */
router.post('/usuarios/:id/excluir', async (req, res) => {
  try {
    const alvo = id(req.params.id);
    const u = await um(`SELECT id, tipo, nome FROM usuarios WHERE id = $1`, [alvo]);
    if (!u) return res.redirect('/admin');
    if (u.tipo === 'admin') {
      flash(req, 'erro', 'Não é possível excluir um administrador.');
      return res.redirect('/admin');
    }
    const secao = u.tipo === 'aluno' ? 'alunos' : 'professores';
    if (u.tipo === 'professor') {
      const atividades = await um(`SELECT count(*)::int AS n FROM atividades WHERE professor_id = $1`, [alvo]);
      if (atividades.n > 0) {
        flash(req, 'erro', `Este professor tem ${atividades.n} atividade(s) publicada(s). Exclua as atividades antes de remover a conta.`);
        return res.redirect('/admin?secao=professores');
      }
    }
    await query(`DELETE FROM usuarios WHERE id = $1`, [alvo]);
    flash(req, 'ok', `${u.tipo === 'aluno' ? 'Aluno(a)' : 'Professor(a)'} ${u.nome} excluído(a).`);
    res.redirect(`/admin?secao=${secao}`);
  } catch (erro) {
    console.error('[admin/usuario-excluir]', erro);
    flash(req, 'erro', 'Não foi possível excluir a conta.');
    res.redirect('/admin');
  }
});

module.exports = router;
