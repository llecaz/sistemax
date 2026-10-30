/** Rotas públicas: login, cadastro de aluno por código de turma, recuperação e saída. */
const express = require('express');
const { um, query } = require('../db');
const { hash, conferir, podeTentar, registrarTentativa, limparTentativas } = require('../auth');
const { telaLogin } = require('../paginas/login');
const { homeDo } = require('../paginas/layout');
const { temaOuPadrao } = require('../temas');

const router = express.Router();

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

function entrarNaSessao(req, usuario, manter) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) return reject(erro);
      req.session.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        matricula: usuario.matricula,
        turma_id: usuario.turma_id,
        turma_nome: usuario.turma_nome,
        foto: usuario.foto,
        pergunta_seg: usuario.pergunta_seg,
        criado_em: usuario.criado_em,
        tema: temaOuPadrao(usuario.tema),
      };
      if (manter) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
      else req.session.cookie.maxAge = null; // só enquanto o navegador abrir
      req.session.save((e) => (e ? reject(e) : resolve()));
    });
  });
}

const CONSULTA_USUARIO = `
  SELECT u.*, t.nome AS turma_nome
    FROM usuarios u
    LEFT JOIN turmas t ON t.id = u.turma_id`;

/** Página inicial: mostra o login (ou leva ao painel certo). */
router.get('/', (req, res) => {
  if (req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  res.send(telaLogin({ modo: 'entrar', req }));
});

/** Login. */
router.post('/entrar', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const manter = !!req.body.manter;

    if (!email || !senha) {
      flash(req, 'erro', 'Informe e-mail e senha.');
      return res.redirect('/');
    }

    const chave = email;
    if (!podeTentar(chave)) {
      flash(req, 'erro', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      return res.redirect('/');
    }

    const usuario = await um(`${CONSULTA_USUARIO} WHERE lower(u.email) = lower($1)`, [email]);
    const senhaOk = usuario && conferir(senha, usuario.senha_hash);

    if (!usuario || !senhaOk || !usuario.ativo) {
      registrarTentativa(chave);
      flash(req, 'erro', 'Email ou senha incorretos.');
      return res.redirect('/');
    }

    limparTentativas(chave);
    await entrarNaSessao(req, usuario, manter);
    res.redirect(homeDo(usuario));
  } catch (erro) {
    console.error('[login]', erro);
    flash(req, 'erro', 'Não foi possível entrar agora. Tente novamente.');
    res.redirect('/');
  }
});

/** Formulário de cadastro do aluno. */
router.get('/cadastro', (req, res) => {
  if (req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  res.send(telaLogin({ modo: 'cadastro', req }));
});

/** Cria a conta do aluno usando o código da turma. */
router.post('/cadastro', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const codigo = String(req.body.codigo || '').trim().toUpperCase();

    if (!nome || !email || senha.length < 6 || !codigo) {
      flash(req, 'erro', 'Preencha todos os campos. A senha precisa ter ao menos 6 caracteres.');
      return res.redirect('/cadastro');
    }

    const turma = await um(`SELECT id, nome FROM turmas WHERE upper(codigo) = $1 AND ativa`, [codigo]);
    if (!turma) {
      flash(req, 'erro', 'Código de turma inválido. Confira com a secretaria da escola.');
      return res.redirect('/cadastro');
    }

    const existe = await um(`SELECT id FROM usuarios WHERE lower(email) = lower($1)`, [email]);
    if (existe) {
      flash(req, 'erro', 'Já existe uma conta cadastrada com este e-mail.');
      return res.redirect('/cadastro');
    }

    const novo = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, turma_id)
       VALUES ($1, $2, $3, 'aluno', $4) RETURNING id`,
      [nome, email, hash(senha), turma.id]
    );
    // Matrícula automática: ano + sequência
    const matricula = `${new Date().getFullYear()}${String(novo.rows[0].id).padStart(5, '0')}`;
    await query(`UPDATE usuarios SET matricula = $1 WHERE id = $2`, [matricula, novo.rows[0].id]);

    const usuario = await um(`${CONSULTA_USUARIO} WHERE u.id = $1`, [novo.rows[0].id]);
    await entrarNaSessao(req, usuario, false);
    req.session.flash = [
      { tipo: 'ok', texto: `Conta criada! Bem-vindo(a) à turma ${turma.nome}.` },
    ];
    res.redirect('/aluno');
  } catch (erro) {
    console.error('[cadastro]', erro);
    flash(req, 'erro', 'Não foi possível criar a conta agora. Tente novamente.');
    res.redirect('/cadastro');
  }
});

/** Recuperação — passo 1: descobrir a pergunta de segurança. */
router.get('/recuperar', (req, res) => {
  if (req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  res.send(telaLogin({ modo: 'recuperar', dados: null, req }));
});

router.post('/recuperar/passo1', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const usuario = await um(`${CONSULTA_USUARIO} WHERE lower(u.email) = lower($1)`, [email]);
    if (!usuario || !usuario.pergunta_seg || !usuario.resposta_seg) {
      flash(req, 'erro', 'Não foi possível localizar a conta ou ela não tem pergunta de segurança cadastrada. Procure o administrador da escola.');
      return res.redirect('/recuperar');
    }
    res.send(telaLogin({ modo: 'recuperar', dados: { email: usuario.email, pergunta: usuario.pergunta_seg }, req }));
  } catch (erro) {
    console.error('[recuperar1]', erro);
    res.redirect('/recuperar');
  }
});

/** Recuperação — passo 2: validar resposta e definir nova senha. */
router.post('/recuperar/passo2', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const resposta = String(req.body.resposta || '').trim();
    const senha = String(req.body.senha || '');

    const usuario = await um(`${CONSULTA_USUARIO} WHERE lower(u.email) = lower($1)`, [email]);
    const ok =
      usuario &&
      usuario.pergunta_seg &&
      conferir(resposta.toLowerCase(), usuario.resposta_seg);

    if (!ok) {
      flash(req, 'erro', 'Resposta incorreta. Tente novamente.');
      return res.redirect('/recuperar');
    }
    if (senha.length < 6) {
      flash(req, 'erro', 'A nova senha precisa ter ao menos 6 caracteres.');
      return res.redirect('/recuperar');
    }

    await query(`UPDATE usuarios SET senha_hash = $1 WHERE id = $2`, [hash(senha), usuario.id]);
    flash(req, 'ok', 'Senha redefinida com sucesso! Já pode entrar.');
    res.redirect('/');
  } catch (erro) {
    console.error('[recuperar2]', erro);
    flash(req, 'erro', 'Não foi possível redefinir a senha agora.');
    res.redirect('/recuperar');
  }
});

/** Sair da conta. */
router.post('/sair', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
