/** Rotas do professor: matérias, atividades, entregas e correções. */
const express = require('express');
const { um, todos, query } = require('../db');
const { exigePerfil } = require('../auth');
const { paginaMateriaProfessor, paginaAtividadeProfessor } = require('../paginas/professor');
const { paginaInicioProfessor, paginaNotificacoes } = require('../paginas/inicio');
const { paginaCalendario } = require('../paginas/calendario');
const { pagina } = require('../paginas/layout');

const router = express.Router();
router.use(exigePerfil('professor'));

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

/** Calendário escolar do professor: trabalhos e avaliações das matérias. */
router.get('/calendario', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const agora = new Date();
    const ano = Number(req.query.ano) || agora.getFullYear();
    const mes = Math.min(11, Math.max(0, (Number(req.query.mes) || agora.getMonth() + 1) - 1));

    const [eventos, materias] = await Promise.all([
      todos(
        `SELECT a.id, a.titulo, a.descricao, a.prazo, a.tipo, td.id AS vinculo_id,
                d.nome AS materia, t.nome AS turma,
                (SELECT count(*) FROM entregas e WHERE e.atividade_id = a.id) AS total_entregas,
                (SELECT count(*) FROM entregas e WHERE e.atividade_id = a.id AND e.nota IS NOT NULL) AS corrigidas,
                (SELECT count(*) FROM usuarios u WHERE u.turma_id = td.turma_id AND u.tipo = 'aluno' AND u.ativo) AS alunos_turma
           FROM atividades a
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
           JOIN turmas t ON t.id = td.turma_id
          WHERE a.professor_id = $1 AND a.ativa
          ORDER BY (a.prazo IS NULL), a.prazo`,
        [usuario.id]
      ),
      todos(
        `SELECT td.id AS vinculo_id, d.nome AS materia, t.nome AS turma
           FROM turma_disciplina td
           JOIN disciplinas d ON d.id = td.disciplina_id
           JOIN turmas t ON t.id = td.turma_id
          WHERE td.professor_id = $1
          ORDER BY t.nome, d.nome`,
        [usuario.id]
      ),
    ]);

    res.send(
      pagina({
        titulo: 'Calendário do mês',
        usuario,
        req,
        ativa: 'calendario',
        corpo: paginaCalendario({ usuario, eventos, ano, mes, professor: true, materias, tema: usuario.tema }),
      })
    );
  } catch (erro) {
    console.error('[prof/calendario]', erro);
    flash(req, 'erro', 'Não foi possível carregar o calendário.');
    res.redirect('/professor');
  }
});

/** Início: painel do professor (correções, matérias e calendário). */
router.get('/', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const [materias, entregas, eventos] = await Promise.all([
      todos(
        `SELECT td.id AS vinculo_id, t.nome AS turma, d.nome AS materia,
                (SELECT count(*) FROM atividades a WHERE a.vinculo_id = td.id AND a.ativa) AS atividades,
                (SELECT count(*) FROM entregas e
                   JOIN atividades a ON a.id = e.atividade_id
                  WHERE a.vinculo_id = td.id) AS entregas,
                (SELECT count(*) FROM entregas e
                   JOIN atividades a ON a.id = e.atividade_id
                  WHERE a.vinculo_id = td.id AND e.nota IS NULL) AS pendentes,
                (SELECT count(*) FROM usuarios u WHERE u.turma_id = t.id AND u.tipo = 'aluno' AND u.ativo) AS alunos
           FROM turma_disciplina td
           JOIN turmas t ON t.id = td.turma_id
           JOIN disciplinas d ON d.id = td.disciplina_id
          WHERE td.professor_id = $1 AND t.ativa
          ORDER BY t.nome, d.nome`,
        [usuario.id]
      ),
      todos(
        `SELECT e.id, e.enviado_em, e.metodo, e.link, e.arquivo_nome,
                a.id AS atividade_id, a.titulo, a.prazo, a.vinculo_id,
                d.nome AS materia, t.nome AS turma, u.nome AS aluno,
                (a.prazo IS NOT NULL AND e.enviado_em > a.prazo) AS atrasada
           FROM entregas e
           JOIN atividades a ON a.id = e.atividade_id
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
           JOIN turmas t ON t.id = td.turma_id
           JOIN usuarios u ON u.id = e.aluno_id
          WHERE a.professor_id = $1 AND e.nota IS NULL
          ORDER BY e.enviado_em
          LIMIT 8`,
        [usuario.id]
      ),
      todos(
        `SELECT a.id, a.titulo, a.prazo, a.tipo, td.id AS vinculo_id,
                d.nome AS materia, t.nome AS turma
           FROM atividades a
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
           JOIN turmas t ON t.id = td.turma_id
          WHERE a.professor_id = $1 AND a.ativa
          ORDER BY (a.prazo IS NULL), a.prazo`,
        [usuario.id]
      ),
    ]);
    const busca = String(req.query.q || '').trim();
    const agora = new Date();
    const ano = Number(req.query.ano) || agora.getFullYear();
    const mes = Math.min(11, Math.max(0, (Number(req.query.mes) || agora.getMonth() + 1) - 1));

    res.send(
      pagina({
        titulo: 'Início',
        usuario,
        req,
        ativa: 'inicio',
        corpo: paginaInicioProfessor({ usuario, materias, entregas, eventos, busca, ano, mes }),
      })
    );
  } catch (erro) {
    console.error('[prof/home]', erro);
    flash(req, 'erro', 'Não foi possível carregar suas matérias.');
    res.redirect('/');
  }
});

/** Notificações: novas entregas e entregas fora do prazo. */
router.get('/notificacoes', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const entregas = await todos(
      `SELECT e.id, e.enviado_em, e.metodo, e.link, e.arquivo_nome,
              a.id AS atividade_id, a.titulo, a.prazo, a.vinculo_id,
              d.nome AS materia, t.nome AS turma, u.nome AS aluno,
              (a.prazo IS NOT NULL AND e.enviado_em > a.prazo) AS atrasada
         FROM entregas e
         JOIN atividades a ON a.id = e.atividade_id
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
         JOIN usuarios u ON u.id = e.aluno_id
        WHERE a.professor_id = $1 AND e.nota IS NULL
        ORDER BY e.enviado_em DESC
        LIMIT 30`,
      [usuario.id]
    );

    res.send(
      pagina({
        titulo: 'Notificações',
        usuario,
        req,
        ativa: 'notificacoes',
        corpo: paginaNotificacoes({ usuario, entregas, perfil: 'professor' }),
      })
    );
  } catch (erro) {
    console.error('[prof/notificacoes]', erro);
    flash(req, 'erro', 'Não foi possível carregar suas notificações.');
    res.redirect('/professor');
  }
});

/** Atribuições da matéria (publicar e acompanhar atividades). */
router.get('/materia/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const vinculoId = Number(req.params.id);
    const aba = ['todas', 'pendentes', 'corrigidas'].includes(req.query.aba) ? req.query.aba : 'todas';

    const materia = await um(
      `SELECT td.id AS vinculo_id, d.nome AS materia, t.id AS turma_id, t.nome AS turma, td.professor_id,
              (SELECT count(*) FROM usuarios u WHERE u.turma_id = t.id AND u.tipo = 'aluno' AND u.ativo) AS alunos
         FROM turma_disciplina td
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
        WHERE td.id = $1 AND td.professor_id = $2`,
      [vinculoId, usuario.id]
    );
    if (!materia) {
      flash(req, 'erro', 'Matéria não encontrada entre as suas.');
      return res.redirect('/professor');
    }

    const atividades = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em, a.tipo,
              (SELECT count(*) FROM entregas e WHERE e.atividade_id = a.id) AS total_entregas,
              (SELECT count(*) FROM entregas e WHERE e.atividade_id = a.id AND e.nota IS NOT NULL) AS corrigidas,
              (SELECT count(*) FROM usuarios u WHERE u.turma_id = $2 AND u.tipo = 'aluno' AND u.ativo) AS alunos_turma
         FROM atividades a
        WHERE a.vinculo_id = $1 AND a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo, a.criado_em DESC`,
      [vinculoId, materia.turma_id]
    );

    res.send(
      pagina({
        titulo: materia.materia,
        usuario,
        req,
        ativa: 'inicio',
        corpo: paginaMateriaProfessor({ materia, atividades, aba }),
      })
    );
  } catch (erro) {
    console.error('[prof/materia]', erro);
    flash(req, 'erro', 'Não foi possível abrir esta matéria.');
    res.redirect('/professor');
  }
});

/** Publica uma nova atividade com prazo. */
router.post('/atividade', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const vinculoId = Number(req.body.vinculo_id);
    const titulo = String(req.body.titulo || '').trim();
    const descricao = String(req.body.descricao || '').trim();
    const prazo = req.body.prazo ? new Date(req.body.prazo) : null;
    const tipo = ['trabalho', 'avaliacao', 'tarefa', 'projeto', 'evento'].includes(req.body.tipo)
      ? req.body.tipo
      : 'trabalho';
    const voltarCalendario = req.body.voltar === 'calendario';

    if (!titulo) {
      flash(req, 'erro', 'Dê um título à atividade.');
      return res.redirect(voltarCalendario ? '/professor/calendario' : '/professor');
    }

    const vinculo = await um(
      `SELECT id FROM turma_disciplina WHERE id = $1 AND professor_id = $2`,
      [vinculoId, usuario.id]
    );
    if (!vinculo) {
      flash(req, 'erro', 'Você não leciona esta matéria.');
      return res.redirect('/professor');
    }

    await query(
      `INSERT INTO atividades (vinculo_id, professor_id, titulo, descricao, prazo, tipo)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [vinculoId, usuario.id, titulo, descricao, prazo && !Number.isNaN(prazo.getTime()) ? prazo : null, tipo]
    );

    const mensagens = {
      trabalho: 'Trabalho publicado! Os alunos já podem entregar.',
      avaliacao: 'Prova marcada! Ela aparece no calendário dos alunos.',
      tarefa: 'Tarefa/quiz marcada no calendário.',
      projeto: 'Projeto marcado no calendário.',
      evento: 'Evento adicionado ao calendário.',
    };
    flash(req, 'ok', mensagens[tipo]);
    res.redirect(voltarCalendario ? '/professor/calendario' : `/professor/materia/${vinculoId}`);
  } catch (erro) {
    console.error('[prof/atividade]', erro);
    flash(req, 'erro', 'Não foi possível publicar a atividade.');
    res.redirect('/professor');
  }
});

/** Exclui uma atividade (e as entregas dela). */
router.post('/atividade/:id/excluir', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const id = Number(req.params.id);
    const atividade = await um(
      `SELECT a.id, a.vinculo_id FROM atividades a WHERE a.id = $1 AND a.professor_id = $2`,
      [id, usuario.id]
    );
    if (!atividade) {
      flash(req, 'erro', 'Atividade não encontrada.');
      return res.redirect('/professor');
    }
    await query(`DELETE FROM atividades WHERE id = $1`, [id]);
    flash(req, 'ok', 'Atividade excluída.');
    res.redirect(`/professor/materia/${atividade.vinculo_id}`);
  } catch (erro) {
    console.error('[prof/excluir]', erro);
    flash(req, 'erro', 'Não foi possível excluir.');
    res.redirect('/professor');
  }
});

/** Entregas da atividade + correção. */
router.get('/atividade/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const id = Number(req.params.id);

    const atividade = await um(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em, a.vinculo_id,
              d.nome AS materia, t.id AS turma_id, t.nome AS turma, td.professor_id
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
        WHERE a.id = $1 AND a.professor_id = $2`,
      [id, usuario.id]
    );
    if (!atividade) {
      flash(req, 'erro', 'Atividade não encontrada.');
      return res.redirect('/professor');
    }

    const alunos = await todos(
      `SELECT u.id, u.nome, u.email,
              e.id AS entrega_id, e.arquivo_nome, e.arquivo_tamanho, e.enviado_em,
              e.nota, e.observacao, e.corrigido_em, e.link, e.metodo
         FROM usuarios u
         LEFT JOIN entregas e ON e.aluno_id = u.id AND e.atividade_id = $1
        WHERE u.turma_id = $2 AND u.tipo = 'aluno' AND u.ativo
        ORDER BY u.nome`,
      [id, atividade.turma_id]
    );

    const materia = {
      vinculo_id: atividade.vinculo_id,
      materia: atividade.materia,
      turma: atividade.turma,
    };
    res.send(
      pagina({
        titulo: atividade.titulo,
        usuario,
        req,
        ativa: 'inicio',
        corpo: paginaAtividadeProfessor({ materia, atividade, alunos }),
      })
    );
  } catch (erro) {
    console.error('[prof/atividade-get]', erro);
    flash(req, 'erro', 'Não foi possível abrir a atividade.');
    res.redirect('/professor');
  }
});

/** Salva a correção (nota + observação). */
router.post('/corrigir/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const entregaId = Number(req.params.id);
    const nota = String(req.body.nota || '').trim();
    const observacao = String(req.body.observacao || '').trim();

    const entrega = await um(
      `SELECT e.id, e.atividade_id, a.vinculo_id
         FROM entregas e
         JOIN atividades a ON a.id = e.atividade_id
        WHERE e.id = $1 AND a.professor_id = $2`,
      [entregaId, usuario.id]
    );
    if (!entrega) {
      flash(req, 'erro', 'Entrega não encontrada.');
      return res.redirect('/professor');
    }

    if (nota === '') {
      flash(req, 'erro', 'Informe a nota (de 0 a 10) para corrigir.');
      return res.redirect(`/professor/atividade/${entrega.atividade_id}`);
    }
    const notaNum = Number(nota.replace(',', '.'));
    if (Number.isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      flash(req, 'erro', 'A nota deve ser um número entre 0 e 10.');
      return res.redirect(`/professor/atividade/${entrega.atividade_id}`);
    }

    await query(
      `UPDATE entregas SET nota = $1, observacao = $2, corrigido_em = now() WHERE id = $3`,
      [notaNum.toFixed(2), observacao, entregaId]
    );

    flash(req, 'ok', 'Correção salva. O aluno já pode ver a nota.');
    res.redirect(`/professor/atividade/${entrega.atividade_id}`);
  } catch (erro) {
    console.error('[prof/corrigir]', erro);
    flash(req, 'erro', 'Não foi possível salvar a correção.');
    res.redirect('/professor');
  }
});

module.exports = router;
