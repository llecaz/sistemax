/** Rota pública autenticada do Modo Foco (/foco). */
const express = require('express');
const { exigePerfil } = require('../auth');
const { paginaFoco } = require('../paginas/foco');

const router = express.Router();
router.use(exigePerfil('admin', 'professor', 'aluno'));

router.get('/', (req, res) => {
  res.send(paginaFoco({ usuario: req.session.usuario, req }));
});

module.exports = router;
