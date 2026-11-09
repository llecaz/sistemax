/** Rotas públicas: login, cadastro de aluno por código de turma, recuperação e saída. */
const express = require('express');
const { um, query } = require('../db');
const { hash, conferir, podeTentar, registrarTentativa, limparTentativas } = require('../auth');
const { telaLogin } = require('../paginas/login');
const { homeDo } = require('../paginas/layout');
const { temaOuPadrao } = require('../temas');
const {
  provedorValido,
  provedorConfigurado,
  novoState,
  urlAutorizacao,
  perfilDoCodigo,
} = require('../oauth');

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

/** Página de login (a página inicial "/" é o index.html, servido em app.js). */
router.get('/entrar', (req, res) => {
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
      return res.redirect('/entrar');
    }

    const chave = email;
    if (!podeTentar(chave)) {
      flash(req, 'erro', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      return res.redirect('/entrar');
    }

    const usuario = await um(`${CONSULTA_USUARIO} WHERE lower(u.email) = lower($1)`, [email]);
    const senhaOk = usuario && conferir(senha, usuario.senha_hash);

    if (!usuario || !senhaOk || !usuario.ativo) {
      registrarTentativa(chave);
      flash(req, 'erro', 'Email ou senha incorretos.');
      return res.redirect('/entrar');
    }

    limparTentativas(chave);
    await entrarNaSessao(req, usuario, manter);
    res.redirect(homeDo(usuario));
  } catch (erro) {
    console.error('[login]', erro);
    flash(req, 'erro', 'Não foi possível entrar agora. Tente novamente.');
    res.redirect('/entrar');
  }
});

/** Formulário de cadastro do aluno. */
router.get('/cadastro', (req, res) => {
  if (req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  const dados = req.session.emailCadastro ? { email: req.session.emailCadastro } : null;
  res.send(telaLogin({ modo: 'cadastro', dados, req }));
});

/** Cria a conta do aluno usando o código da turma. */
router.post('/cadastro', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const codigo = String(req.body.codigo || '').trim().toUpperCase();
    if (email) req.session.emailCadastro = email;

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

    // Se o cadastro veio do login social, vincula o provedor a esta conta
    // já na criação (o e-mail veio verificado pelo Google/GitHub).
    const pendente = req.session.oauthCadastro;
    if (
      pendente &&
      pendente.provedor &&
      pendente.idExterno &&
      pendente.email &&
      pendente.email.toLowerCase() === email &&
      Date.now() - pendente.criadoEm < 15 * 60 * 1000
    ) {
      const coluna = pendente.provedor === 'google' ? 'oauth_google_id' : 'oauth_github_id';
      await query(`UPDATE usuarios SET ${coluna} = $1 WHERE id = $2`, [pendente.idExterno, novo.rows[0].id]);
    }
    delete req.session.oauthCadastro;
    delete req.session.emailCadastro;

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
    res.redirect('/entrar');
  } catch (erro) {
    console.error('[recuperar2]', erro);
    flash(req, 'erro', 'Não foi possível redefinir a senha agora.');
    res.redirect('/recuperar');
  }
});

/* ------------------------------------------------------------
   Login social (Google / GitHub)
   Só entra quem já possui uma conta Nuvia com o e-mail verificado
   pelo provedor. O vínculo fica salvo em oauth_google_id /
   oauth_github_id (ver schema.sql).
   ------------------------------------------------------------ */

/** Inicia o fluxo: redireciona para o provedor com um state anti-CSRF. */
router.get('/entrar/:provedor', (req, res) => {
  const provedor = req.params.provedor;
  if (!provedorValido(provedor)) return res.redirect('/entrar');

  if (!provedorConfigurado(provedor)) {
    flash(
      req,
      'erro',
      `O login com ${provedor === 'google' ? 'Google' : 'GitHub'} ainda não foi configurado. Use e-mail e senha ou avise o administrador.`
    );
    return res.redirect('/entrar');
  }

  const state = novoState();
  req.session.oauth = { state, provedor, criadoEm: Date.now() };
  delete req.session.oauthCadastro;
  req.session.save((erro) => {
    if (erro) {
      console.error('[oauth/iniciar]', erro);
      flash(req, 'erro', 'Não foi possível iniciar o login social. Tente novamente.');
      return res.redirect('/entrar');
    }
    res.redirect(urlAutorizacao(provedor, req, state));
  });
});

/** Retorno do provedor: valida o state, troca o código e abre a sessão. */
router.get('/entrar/:provedor/callback', async (req, res) => {
  const provedor = req.params.provedor;
  const voltar = (tipo, texto, destino = '/entrar') => {
    flash(req, tipo, texto);
    return res.redirect(destino);
  };

  try {
    if (!provedorValido(provedor)) return res.redirect('/entrar');

    const pendente = req.session.oauth;
    delete req.session.oauth;

    if (req.query.error) {
      return voltar('erro', 'Login cancelado. Nenhuma conta foi conectada.');
    }

    // Confere o state (proteção contra CSRF) e a validade (10 minutos).
    const stateRecebido = String(req.query.state || '');
    const stateValido =
      pendente &&
      pendente.provedor === provedor &&
      pendente.state &&
      pendente.state.length === stateRecebido.length &&
      require('crypto').timingSafeEqual(Buffer.from(pendente.state), Buffer.from(stateRecebido)) &&
      Date.now() - pendente.criadoEm < 10 * 60 * 1000;

    if (!stateValido) {
      return voltar('erro', 'A sessão do login social expirou. Tente novamente.');
    }

    const codigo = String(req.query.code || '');
    if (!codigo) return voltar('erro', 'O provedor não devolveu a autorização.');

    const perfil = await perfilDoCodigo(provedor, codigo, req);
    const coluna = provedor === 'google' ? 'oauth_google_id' : 'oauth_github_id';

    let usuario = perfil.idExterno
      ? await um(`${CONSULTA_USUARIO} WHERE u.${coluna} = $1`, [perfil.idExterno])
      : null;

    if (!usuario) {
      usuario = await um(`${CONSULTA_USUARIO} WHERE lower(u.email) = lower($1)`, [perfil.email]);
    }

    if (!usuario) {
      // Guarda o e-mail para pré-preencher o cadastro (sem expor na URL) e
      // o vínculo do provedor para conectar a conta assim que ela for criada.
      req.session.emailCadastro = perfil.email;
      req.session.oauthCadastro = {
        provedor,
        idExterno: perfil.idExterno || null,
        email: perfil.email,
        criadoEm: Date.now(),
      };
      return voltar(
        'erro',
        `Não encontramos uma conta Nuvia com o e-mail ${perfil.email}. Crie sua conta de aluno com o código da turma e tente novamente.`,
        '/cadastro'
      );
    }

    if (perfil.idExterno && !usuario[coluna]) {
      await query(`UPDATE usuarios SET ${coluna} = $1 WHERE id = $2`, [perfil.idExterno, usuario.id]);
    }

    await entrarNaSessao(req, usuario, false);
    req.session.flash = [
      { tipo: 'ok', texto: `Bem-vindo(a), ${usuario.nome}! Você entrou com ${provedor === 'google' ? 'o Google' : 'o GitHub'}.` },
    ];
    res.redirect(homeDo(usuario));
  } catch (erro) {
    console.error('[oauth/callback]', erro.message);
    voltar('erro', 'Não foi possível entrar com essa conta agora. Tente novamente ou use e-mail e senha.');
  }
});

/** Sair da conta. */
router.post('/sair', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
