/** Rotas do administrador: turmas, disciplinas, professores, vínculos e alunos. */
const express = require('express');
const { um, todos, query } = require('../db');
const { exigePerfil, hash } = require('../auth');
const { gerarCodigoTurma } = require('../util');
const { painelAdmin } = require('../paginas/admin');
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

module.exports = router;
