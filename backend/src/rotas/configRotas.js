/** Configurações do usuário: foto, nome, senha e pergunta de segurança. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { um, query } = require('../db');
const { hash, conferir } = require('../auth');
const { nomeArquivoUnico } = require('../util');
const { pagina } = require('../paginas/layout');
const { paginaConfiguracoes } = require('../paginas/config');
const { TEMA_PADRAO, temaValido, temaDe } = require('../temas');

const router = express.Router();

const PASTA_FOTOS = path.join(__dirname, '..', '..', 'uploads', 'fotos');
fs.mkdirSync(PASTA_FOTOS, { recursive: true });

const enviarFoto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PASTA_FOTOS),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
      cb(null, nomeArquivoUnico(ext));
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file.originalname || '').toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Formato não permitido. Use JPG, PNG ou WebP.'));
  },
});

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

function exigirLogin(req, res, next) {
  if (!req.session.usuario) return res.redirect('/');
  next();
}
router.use(exigirLogin);

/** Busca os dados completos para a página. */
async function dadosDoUsuario(id) {
  const usuario = await um(
    `SELECT u.id, u.nome, u.email, u.tipo, u.matricula, u.turma_id, u.foto,
            u.pergunta_seg, u.criado_em, u.tema, t.nome AS turma_nome
       FROM usuarios u LEFT JOIN turmas t ON t.id = u.turma_id
      WHERE u.id = $1`,
    [id]
  );
  if (usuario && usuario.tipo === 'professor') {
    const materias = await um(
      `SELECT COALESCE(string_agg(t.nome || ' · ' || d.nome, ', ' ORDER BY t.nome), 'Nenhuma vinculada') AS materias
         FROM turma_disciplina td
         JOIN turmas t ON t.id = td.turma_id
         JOIN disciplinas d ON d.id = td.disciplina_id
        WHERE td.professor_id = $1`,
      [id]
    );
    usuario.materias = materias ? materias.materias : 'Nenhuma vinculada';
  }
  return usuario;
}

/** Página de configurações. */
router.get('/', async (req, res) => {
  try {
    const usuario = await dadosDoUsuario(req.session.usuario.id);
    res.send(
      pagina({
        titulo: 'Configurações',
        usuario,
        req,
        corpo: paginaConfiguracoes({ usuario }),
      })
    );
  } catch (erro) {
    console.error('[config]', erro);
    flash(req, 'erro', 'Não foi possível abrir as configurações.');
    res.redirect('/');
  }
});

/** Trocar foto de perfil. */
router.post('/foto', (req, res) => {
  enviarFoto.single('foto')(req, res, async (erro) => {
    try {
      if (erro) {
        flash(req, 'erro', erro.code === 'LIMIT_FILE_SIZE' ? 'A foto pode ter no máximo 2 MB.' : erro.message);
        return res.redirect('/configuracoes');
      }
      if (!req.file) {
        flash(req, 'erro', 'Escolha uma imagem.');
        return res.redirect('/configuracoes');
      }
      const atual = await um(`SELECT foto FROM usuarios WHERE id = $1`, [req.session.usuario.id]);
      await query(`UPDATE usuarios SET foto = $1 WHERE id = $2`, [req.file.filename, req.session.usuario.id]);
      if (atual && atual.foto) fs.unlink(path.join(PASTA_FOTOS, atual.foto), () => {});
      req.session.usuario.foto = req.file.filename;
      flash(req, 'ok', 'Foto de perfil atualizada.');
      res.redirect('/configuracoes');
    } catch (e) {
      console.error('[config/foto]', e);
      flash(req, 'erro', 'Não foi possível enviar a foto.');
      res.redirect('/configuracoes');
    }
  });
});

/** Remover foto (volta para as iniciais). */
router.post('/foto/remover', async (req, res) => {
  try {
    const atual = await um(`SELECT foto FROM usuarios WHERE id = $1`, [req.session.usuario.id]);
    await query(`UPDATE usuarios SET foto = NULL WHERE id = $1`, [req.session.usuario.id]);
    if (atual && atual.foto) fs.unlink(path.join(PASTA_FOTOS, atual.foto), () => {});
    req.session.usuario.foto = null;
    flash(req, 'ok', 'Foto removida.');
  } catch (e) {
    console.error('[config/foto-remover]', e);
    flash(req, 'erro', 'Não foi possível remover a foto.');
  }
  res.redirect('/configuracoes');
});

/** Alterar o nome exibido. */
router.post('/nome', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    if (!nome) {
      flash(req, 'erro', 'O nome não pode ficar vazio.');
      return res.redirect('/configuracoes');
    }
    await query(`UPDATE usuarios SET nome = $1 WHERE id = $2`, [nome, req.session.usuario.id]);
    req.session.usuario.nome = nome;
    flash(req, 'ok', 'Nome atualizado.');
  } catch (e) {
    console.error('[config/nome]', e);
    flash(req, 'erro', 'Não foi possível salvar o nome.');
  }
  res.redirect('/configuracoes');
});

/** Alterar a senha. */
router.post('/senha', async (req, res) => {
  try {
    const atual = String(req.body.atual || '');
    const nova = String(req.body.nova || '');
    const usuario = await um(`SELECT senha_hash FROM usuarios WHERE id = $1`, [req.session.usuario.id]);

    if (!conferir(atual, usuario.senha_hash)) {
      flash(req, 'erro', 'A senha atual está incorreta.');
      return res.redirect('/configuracoes');
    }
    if (nova.length < 6) {
      flash(req, 'erro', 'A nova senha precisa ter ao menos 6 caracteres.');
      return res.redirect('/configuracoes');
    }
    await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [hash(nova), req.session.usuario.id]);
    flash(req, 'ok', 'Senha alterada com sucesso.');
  } catch (e) {
    console.error('[config/senha]', e);
    flash(req, 'erro', 'Não foi possível alterar a senha.');
  }
  res.redirect('/configuracoes');
});

/** Definir pergunta de segurança (usada para recuperar a senha). */
router.post('/seguranca', async (req, res) => {
  try {
    const pergunta = String(req.body.pergunta || '').trim();
    const resposta = String(req.body.resposta || '').trim();
    if (!pergunta || !resposta) {
      flash(req, 'erro', 'Escolha a pergunta e digite a resposta.');
      return res.redirect('/configuracoes');
    }
    await query(`UPDATE usuarios SET pergunta_seg = $1, resposta_seg = $2 WHERE id = $3`, [
      pergunta,
      hash(resposta.toLowerCase()),
      req.session.usuario.id,
    ]);
    req.session.usuario.pergunta_seg = pergunta;
    flash(req, 'ok', 'Pergunta de segurança salva.');
  } catch (e) {
    console.error('[config/seguranca]', e);
    flash(req, 'erro', 'Não foi possível salvar a pergunta.');
  }
  res.redirect('/configuracoes');
});

/** Salvar o tema visual (galeria de aparência ou alternador do topo). */
router.post('/tema', async (req, res) => {
  const ehJson = req.is('json') || req.headers.accept === 'application/json';
  try {
    const enviado = String(req.body.tema || '').trim();
    const restaurar = req.body.restaurar != null;
    const id = restaurar ? TEMA_PADRAO : enviado;

    if (!temaValido(id)) {
      if (ehJson) return res.status(400).json({ ok: false, erro: 'Tema inválido.' });
      flash(req, 'erro', 'Este tema não existe. Escolha outro na galeria.');
      return res.redirect('/configuracoes');
    }

    await query(`UPDATE usuarios SET tema = $1 WHERE id = $2`, [id, req.session.usuario.id]);
    req.session.usuario.tema = id;

    const nome = temaDe(id).nome;
    if (ehJson) return res.json({ ok: true, tema: id, nome });
    flash(req, 'ok', `Tema "${nome}" aplicado.`);
  } catch (e) {
    console.error('[config/tema]', e);
    if (ehJson) return res.status(500).json({ ok: false, erro: 'Não foi possível salvar o tema.' });
    flash(req, 'erro', 'Não foi possível salvar o tema.');
  }
  res.redirect('/configuracoes');
});

module.exports = router;
