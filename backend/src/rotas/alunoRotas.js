/** Rotas do aluno: matérias, trabalhos com abas e envio de arquivos. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { um, todos, query } = require('../db');
const { exigePerfil } = require('../auth');
const { nomeArquivoUnico } = require('../util');
const { abasDe, ROTULOS_ABA } = require('../regras');
const { gradeMaterias, paginaMateria, paginaTrabalho } = require('../paginas/aluno');
const { pagina } = require('../paginas/layout');

const router = express.Router();
router.use(exigePerfil('aluno'));

const PASTA = path.join(__dirname, '..', '..', 'uploads', 'entregas');
fs.mkdirSync(PASTA, { recursive: true });

const EXTENSOES = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];

const enviarArquivo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PASTA),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
      cb(null, nomeArquivoUnico(ext));
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!EXTENSOES.includes(ext)) {
      return cb(new Error('Tipo de arquivo não permitido.'));
    }
    cb(null, true);
  },
});

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

/** Início: grade de matérias da turma do aluno. */
router.get('/', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario.turma_id) {
      return res.send(
        pagina({
          titulo: 'Minhas matérias',
          usuario,
          req,
          corpo: `<div class="vazio"><div class="vazio-icone">🏫</div>
            <h3>Você ainda não está em nenhuma turma</h3>
            <p>Fale com a secretaria para receber o código de matrícula da sua turma.</p></div>`,
        })
      );
    }

    const materias = await todos(
      `SELECT td.id AS vinculo_id, d.nome AS materia,
              COALESCE(p.nome, '') AS professor,
              (SELECT count(*) FROM atividades a WHERE a.vinculo_id = td.id AND a.ativa) AS total,
              (SELECT count(*) FROM atividades a
                 JOIN entregas e ON e.atividade_id = a.id
                WHERE a.vinculo_id = td.id AND e.aluno_id = $2 AND e.nota IS NULL) AS aguardando
         FROM turma_disciplina td
         JOIN disciplinas d ON d.id = td.disciplina_id
         LEFT JOIN usuarios p ON p.id = td.professor_id
        WHERE td.turma_id = $1
        ORDER BY d.nome`,
      [usuario.turma_id, usuario.id]
    );

    res.send(
      pagina({ titulo: 'Minhas matérias', usuario, req, corpo: gradeMaterias({ usuario, materias }) })
    );
  } catch (erro) {
    console.error('[aluno/home]', erro);
    flash(req, 'erro', 'Não foi possível carregar suas matérias.');
    res.redirect('/');
  }
});

/** Trabalhos da matéria, com abas de filtro. */
router.get('/materia/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const vinculoId = Number(req.params.id);
    const aba = ROTULOS_ABA[req.query.aba] ? req.query.aba : 'todos';

    const materia = await um(
      `SELECT td.id AS vinculo_id, d.nome AS materia, t.nome AS turma, COALESCE(p.nome,'') AS professor
         FROM turma_disciplina td
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t      ON t.id = td.turma_id
         LEFT JOIN usuarios p ON p.id = td.professor_id
        WHERE td.id = $1 AND td.turma_id = $2`,
      [vinculoId, usuario.turma_id]
    );
    if (!materia) {
      flash(req, 'erro', 'Matéria não encontrada na sua turma.');
      return res.redirect('/aluno');
    }

    const atividades = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em,
              $3::int AS vinculo_id, $4::text AS materia,
              COALESCE(p.nome,'') AS professor,
              e.id AS entrega_id, e.enviado_em, e.nota, e.observacao,
              e.arquivo_nome, e.arquivo_tamanho, e.corrigido_em
         FROM atividades a
         LEFT JOIN usuarios p ON p.id = a.professor_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE a.vinculo_id = $1 AND a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo, a.criado_em DESC`,
      [vinculoId, usuario.id, vinculoId, materia.materia]
    );

    res.send(
      pagina({
        titulo: materia.materia,
        usuario,
        req,
        corpo: paginaMateria({ usuario, materia, atividades, aba }),
      })
    );
  } catch (erro) {
    console.error('[aluno/materia]', erro);
    flash(req, 'erro', 'Não foi possível abrir esta matéria.');
    res.redirect('/aluno');
  }
});

/** Detalhe de um trabalho. */
router.get('/trabalho/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const atividade = await um(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em, td.id AS vinculo_id,
              d.nome AS materia, t.nome AS turma, COALESCE(p.nome,'') AS professor,
              e.id AS entrega_id, e.enviado_em, e.nota, e.observacao,
              e.arquivo_nome, e.arquivo_tamanho, e.corrigido_em
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
         LEFT JOIN usuarios p ON p.id = a.professor_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE a.id = $1 AND td.turma_id = $3 AND a.ativa`,
      [Number(req.params.id), usuario.id, usuario.turma_id]
    );
    if (!atividade) {
      flash(req, 'erro', 'Trabalho não encontrado.');
      return res.redirect('/aluno');
    }
    res.send(
      pagina({ titulo: atividade.titulo, usuario, req, corpo: paginaTrabalho({ usuario, a: atividade }) })
    );
  } catch (erro) {
    console.error('[aluno/trabalho]', erro);
    flash(req, 'erro', 'Não foi possível abrir o trabalho.');
    res.redirect('/aluno');
  }
});

/** Envio (ou reenvio) de arquivo. */
router.post('/entregar/:id', (req, res) => {
  enviarArquivo.single('arquivo')(req, res, async (erro) => {
    const usuario = req.session.usuario;
    try {
      if (erro) {
        const texto =
          erro.code === 'LIMIT_FILE_SIZE'
            ? 'Arquivo muito grande: o limite é 15 MB.'
            : erro.message || 'Não foi possível enviar o arquivo.';
        flash(req, 'erro', texto);
        return res.redirect('/aluno');
      }

      const atividadeId = Number(req.params.id);
      const atividade = await um(
        `SELECT a.id, a.ativa, td.turma_id, td.id AS vinculo_id, d.nome AS materia
           FROM atividades a
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
          WHERE a.id = $1`,
        [atividadeId]
      );

      if (!atividade || !atividade.ativa || atividade.turma_id !== usuario.turma_id || !req.file) {
        flash(req, 'erro', 'Não foi possível entregar o trabalho.');
        return res.redirect('/aluno');
      }

      const existente = await um(
        `SELECT id, nota, arquivo FROM entregas WHERE atividade_id = $1 AND aluno_id = $2`,
        [atividadeId, usuario.id]
      );
      if (existente && existente.nota !== null && existente.nota !== undefined) {
        fs.unlink(req.file.path, () => {});
        flash(req, 'erro', 'Este trabalho já foi corrigido pelo professor. Fale com ele para solicitar reavaliação.');
        return res.redirect(`/aluno/trabalho/${atividadeId}`);
      }

      await query(
        `INSERT INTO entregas (atividade_id, aluno_id, arquivo_nome, arquivo, arquivo_tipo, arquivo_tamanho)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (atividade_id, aluno_id) DO UPDATE SET
           arquivo_nome = EXCLUDED.arquivo_nome,
           arquivo = EXCLUDED.arquivo,
           arquivo_tipo = EXCLUDED.arquivo_tipo,
           arquivo_tamanho = EXCLUDED.arquivo_tamanho,
           enviado_em = now()`,
        [
          atividadeId,
          usuario.id,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
        ]
      );

      // Apaga o arquivo anterior (se houver reenvio)
      if (existente && existente.arquivo) {
        fs.unlink(path.join(PASTA, existente.arquivo), () => {});
      }

      flash(req, 'ok', existente ? 'Trabalho reenviado com sucesso!' : 'Trabalho entregue com sucesso!');
      res.redirect(`/aluno/materia/${atividade.vinculo_id}?aba=todos`);
    } catch (e) {
      console.error('[aluno/entregar]', e);
      flash(req, 'erro', 'Falha ao enviar o trabalho. Tente novamente.');
      res.redirect('/aluno');
    }
  });
});

module.exports = router;
