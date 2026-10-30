/** Download autorizado dos arquivos enviados (entregas). */
const express = require('express');
const path = require('path');
const { um } = require('../db');

const router = express.Router();

const PASTA = path.join(__dirname, '..', '..', 'uploads', 'entregas');

/** Somente o aluno dono, o professor da matéria ou o admin baixam. */
router.get('/entrega/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect('/');

    const entrega = await um(
      `SELECT e.id, e.aluno_id, e.arquivo, e.arquivo_nome,
              a.professor_id, td.turma_id
         FROM entregas e
         JOIN atividades a ON a.id = e.atividade_id
         JOIN turma_disciplina td ON td.id = a.vinculo_id
        WHERE e.id = $1`,
      [Number(req.params.id)]
    );
    if (!entrega || !entrega.arquivo) {
      req.session.flash = [{ tipo: 'erro', texto: 'Arquivo não encontrado.' }];
      return res.redirect(req.get('Referrer') || '/');
    }

    const podeVer =
      usuario.tipo === 'admin' ||
      (usuario.tipo === 'aluno' && entrega.aluno_id === usuario.id) ||
      (usuario.tipo === 'professor' && entrega.professor_id === usuario.id);

    if (!podeVer) {
      req.session.flash = [{ tipo: 'erro', texto: 'Você não tem permissão para baixar este arquivo.' }];
      return res.redirect(req.get('Referrer') || '/');
    }

    const nomeOriginal = entrega.arquivo_nome || 'arquivo';
    res.download(path.join(PASTA, entrega.arquivo), nomeOriginal, (erro) => {
      if (erro && !res.headersSent) {
        req.session.flash = [{ tipo: 'erro', texto: 'Arquivo não encontrado no servidor.' }];
        res.redirect(req.get('Referrer') || '/');
      }
    });
  } catch (erro) {
    console.error('[arquivos]', erro);
    res.redirect(req.get('Referrer') || '/');
  }
});

module.exports = router;
