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
      `SELECT e.id, e.aluno_id, e.arquivo, e.arquivo_nome, e.arquivo_tipo,
              e.arquivo_dados,
              a.professor_id, td.turma_id
         FROM entregas e
         JOIN atividades a ON a.id = e.atividade_id
         JOIN turma_disciplina td ON td.id = a.vinculo_id
        WHERE e.id = $1`,
      [Number(req.params.id)]
    );
    if (!entrega || (!entrega.arquivo && !entrega.arquivo_dados)) {
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
    const nomeSeguro = nomeOriginal.replace(/["\\\r\n]/g, '_');
    const disposicao = `attachment; filename="${nomeSeguro}"; filename*=UTF-8''${encodeURIComponent(nomeOriginal)}`;

    // Arquivo novo: conteúdo guardado no banco (persistente na Vercel).
    if (entrega.arquivo_dados) {
      res.setHeader('Content-Type', entrega.arquivo_tipo || 'application/octet-stream');
      res.setHeader('Content-Disposition', disposicao);
      res.setHeader('Content-Length', entrega.arquivo_dados.length);
      return res.send(entrega.arquivo_dados);
    }

    // Arquivo antigo: ainda está no disco (dados de exemplo/legado).
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
