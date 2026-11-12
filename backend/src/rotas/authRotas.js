/** Rotas públicas: login, cadastro de aluno e de professor, confirmação de e-mail, recuperação e saída. */
const express = require('express');
const { um, todos, query } = require('../db');
const { hash, conferir, podeTentar, registrarTentativa, limparTentativas } = require('../auth');
const { entrarNaSessao } = require('../sessao');
const { criarLembrarSessao, definirCookie, revogarLembrarSessao, limparCookie, COOKIE } = require('../lembrarSessao');
const { telaLogin } = require('../paginas/login');
const { homeDo } = require('../paginas/layout');
const {
  provedorValido,
  provedorConfigurado,
  novoState,
  urlAutorizacao,
  perfilDoCodigo,
} = require('../oauth');
const { hashToken } = require('../util');
const { enviarLinkConfirmacao } = require('../emailVerificacao');

const router = express.Router();

/** Domínio do e-mail institucional da escola (alunos). Configurável pelo .env. */
const DOMINIO_ESCOLA = (process.env.ESCOLA_EMAIL_DOMINIO || 'escola.pr.gov.br')
  .trim()
  .toLowerCase()
  .replace(/^@/, '');

function emailInstitucional(email) {
  const dominio = String(email || '').split('@')[1] || '';
  const d = dominio.toLowerCase();
  return d === DOMINIO_ESCOLA || d.endsWith(`.${DOMINIO_ESCOLA}`);
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
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
    if (manter) {
      // "Lembrar de mim": token de auto-login de 90 dias (hash no banco)
      const token = await criarLembrarSessao(usuario.id);
      definirCookie(res, token);
    }
    res.redirect(homeDo(usuario));
  } catch (erro) {
    console.error('[login]', erro);
    flash(req, 'erro', 'Não foi possível entrar agora. Tente novamente.');
    res.redirect('/entrar');
  }
});

/**
 * Se houver um vínculo de login social pendente na sessão (usuário tentou
 * entrar com Google/GitHub sem ter conta) e o e-mail for o mesmo, conecta o
 * provedor à conta recém-criada.
 */
async function vincularOauthPendente(req, email, usuarioId) {
  const pendente = req.session.oauthCadastro;
  if (
    pendente &&
    pendente.provedor &&
    pendente.idExterno &&
    pendente.email &&
    pendente.email.toLowerCase() === String(email).toLowerCase() &&
    Date.now() - pendente.criadoEm < 15 * 60 * 1000
  ) {
    const coluna = pendente.provedor === 'google' ? 'oauth_google_id' : 'oauth_github_id';
    await query(`UPDATE usuarios SET ${coluna} = $1 WHERE id = $2`, [pendente.idExterno, usuarioId]);
  }
  delete req.session.oauthCadastro;
}

/** Formulário de cadastro: duas divisórias (aluno e professor). */
router.get('/cadastro', async (req, res) => {
  if (req.session.usuario) return res.redirect(homeDo(req.session.usuario));
  const dadosSessao = req.session.emailCadastro ? { email: req.session.emailCadastro } : {};
  try {
    const [turmas, disciplinas] = await Promise.all([
      todos(`SELECT id, nome FROM turmas WHERE ativa ORDER BY ano_letivo, nome`),
      todos(`SELECT id, nome FROM disciplinas WHERE nome NOT IN ('Ciências', 'História') ORDER BY nome`),
    ]);
    res.send(
      telaLogin({
        modo: 'cadastro',
        dados: {
          ...dadosSessao,
          tipo: req.query.tipo === 'professor' ? 'professor' : 'aluno',
          dominio: DOMINIO_ESCOLA,
          turmas,
          disciplinas,
        },
        req,
      })
    );
  } catch (erro) {
    console.error('[cadastro]', erro);
    flash(req, 'erro', 'Não foi possível carregar o cadastro agora. Tente novamente.');
    res.send(
      telaLogin({
        modo: 'cadastro',
        dados: { ...dadosSessao, tipo: 'aluno', dominio: DOMINIO_ESCOLA, turmas: [], disciplinas: [] },
        req,
      })
    );
  }
});

/** Cria a conta do aluno (e-mail institucional + turma escolhida, sem acesso ainda). */
async function cadastroAluno(req, res) {
  const voltar = (tipo) => `/cadastro?tipo=${tipo}`;
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const confirmacao = String(req.body.confirmacao || '');
    const turmaId = Number(req.body.turma || 0) || null;
    if (email) req.session.emailCadastro = email;

    if (!nome || !email || !senha || !confirmacao) {
      flash(req, 'erro', 'Preencha todos os campos.');
      return res.redirect(voltar('aluno'));
    }
    if (!emailValido(email)) {
      flash(req, 'erro', 'Informe um e-mail válido.');
      return res.redirect(voltar('aluno'));
    }
    if (!emailInstitucional(email)) {
      flash(req, 'erro', `Use o e-mail institucional da escola (ex.: nome@${DOMINIO_ESCOLA}).`);
      return res.redirect(voltar('aluno'));
    }
    if (senha.length < 6) {
      flash(req, 'erro', 'A senha precisa ter ao menos 6 caracteres.');
      return res.redirect(voltar('aluno'));
    }
    if (senha !== confirmacao) {
      flash(req, 'erro', 'A senha e a confirmação não conferem.');
      return res.redirect(voltar('aluno'));
    }
    const turma = turmaId
      ? await um(`SELECT id, nome FROM turmas WHERE id = $1 AND ativa`, [turmaId])
      : null;
    if (!turma) {
      flash(req, 'erro', 'Escolha uma turma válida.');
      return res.redirect(voltar('aluno'));
    }

    const existe = await um(`SELECT id FROM usuarios WHERE lower(email) = lower($1)`, [email]);
    if (existe) {
      flash(req, 'erro', 'Já existe uma conta cadastrada com este e-mail.');
      return res.redirect(voltar('aluno'));
    }

    const novo = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, turma_id, turma_pretendida_id, email_verificado)
       VALUES ($1, $2, $3, 'aluno', NULL, $4, FALSE) RETURNING id`,
      [nome, email, hash(senha), turma.id]
    );
    // Matrícula automática: ano + sequência
    const matricula = `${new Date().getFullYear()}${String(novo.rows[0].id).padStart(5, '0')}`;
    await query(`UPDATE usuarios SET matricula = $1 WHERE id = $2`, [matricula, novo.rows[0].id]);

    await vincularOauthPendente(req, email, novo.rows[0].id);
    delete req.session.emailCadastro;

    let envio = { modo: 'console' };
    try {
      envio = await enviarLinkConfirmacao(req, { id: novo.rows[0].id, nome, email });
    } catch (erro) {
      console.error('[cadastro/email]', erro.message);
      // A conta existe; o aluno pode reenviar o e-mail depois pelo painel.
    }

    const usuario = await um(`${CONSULTA_USUARIO} WHERE u.id = $1`, [novo.rows[0].id]);
    await entrarNaSessao(req, usuario, true);
    const token = await criarLembrarSessao(usuario.id);
    definirCookie(res, token);
    req.session.flash = [
      {
        tipo: 'ok',
        texto:
          envio.modo === 'console'
            ? 'Conta criada! Enviamos o link de confirmação (modo de desenvolvimento: veja o e-mail no console do servidor). Depois confirme o e-mail para pedir o código da turma.'
            : 'Conta criada! Enviamos um e-mail de confirmação. Depois de confirmar, peça o código da turma no seu perfil.',
      },
    ];
    res.redirect('/aluno');
  } catch (erro) {
    console.error('[cadastro/aluno]', erro);
    flash(req, 'erro', 'Não foi possível criar a conta agora. Tente novamente.');
    res.redirect('/cadastro?tipo=aluno');
  }
}

router.post('/cadastro', cadastroAluno); // compatibilidade com links e testes antigos
router.post('/cadastro/aluno', cadastroAluno);

/** Cria a conta do professor (escolhe as matérias que leciona; sem restrição de e-mail). */
router.post('/cadastro/professor', async (req, res) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');
    const confirmacao = String(req.body.confirmacao || '');
    const materias = []
      .concat(req.body.materias || [])
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (email) req.session.emailCadastro = email;

    if (!nome || !email || !senha || !confirmacao) {
      flash(req, 'erro', 'Preencha todos os campos.');
      return res.redirect('/cadastro?tipo=professor');
    }
    if (!emailValido(email)) {
      flash(req, 'erro', 'Informe um e-mail válido.');
      return res.redirect('/cadastro?tipo=professor');
    }
    if (senha.length < 6) {
      flash(req, 'erro', 'A senha precisa ter ao menos 6 caracteres.');
      return res.redirect('/cadastro?tipo=professor');
    }
    if (senha !== confirmacao) {
      flash(req, 'erro', 'A senha e a confirmação não conferem.');
      return res.redirect('/cadastro?tipo=professor');
    }
    if (!materias.length) {
      flash(req, 'erro', 'Selecione ao menos uma matéria que você leciona.');
      return res.redirect('/cadastro?tipo=professor');
    }

    // Só matérias que existem no banco e podem ser escolhidas no cadastro
    // (Ciências e História ficam fora da lista de seleção do professor).
    const encontradas = await todos(
      `SELECT id FROM disciplinas WHERE id = ANY($1::int[]) AND nome NOT IN ('Ciências', 'História')`,
      [materias]
    );
    const idsValidos = encontradas.map((d) => d.id);
    if (!idsValidos.length) {
      flash(req, 'erro', 'Selecione ao menos uma matéria válida.');
      return res.redirect('/cadastro?tipo=professor');
    }

    const existe = await um(`SELECT id FROM usuarios WHERE lower(email) = lower($1)`, [email]);
    if (existe) {
      flash(req, 'erro', 'Já existe uma conta cadastrada com este e-mail.');
      return res.redirect('/cadastro?tipo=professor');
    }

    const novo = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, email_verificado)
       VALUES ($1, $2, $3, 'professor', TRUE) RETURNING id`,
      [nome, email, hash(senha)]
    );
    for (const disciplinaId of idsValidos) {
      await query(
        `INSERT INTO professor_disciplinas (professor_id, disciplina_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [novo.rows[0].id, disciplinaId]
      );
    }

    await vincularOauthPendente(req, email, novo.rows[0].id);
    delete req.session.emailCadastro;

    const usuario = await um(`${CONSULTA_USUARIO} WHERE u.id = $1`, [novo.rows[0].id]);
    await entrarNaSessao(req, usuario, true);
    const token = await criarLembrarSessao(usuario.id);
    definirCookie(res, token);
    req.session.flash = [{ tipo: 'ok', texto: 'Conta de professor criada! Bem-vindo(a) ao Nuvia.' }];
    res.redirect('/professor');
  } catch (erro) {
    console.error('[cadastro/professor]', erro);
    flash(req, 'erro', 'Não foi possível criar a conta agora. Tente novamente.');
    res.redirect('/cadastro?tipo=professor');
  }
});

/** Confirmação do e-mail (link enviado após o cadastro). Uso único, 24 h de validade. */
router.get('/confirmar-email', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      flash(req, 'erro', 'Link de confirmação inválido.');
      return res.redirect('/entrar');
    }
    const registro = await um(
      `SELECT v.id, v.usuario_id FROM verificacao_email v
        WHERE v.token_hash = $1 AND v.usado_em IS NULL AND v.expira_em > now()`,
      [hashToken(token)]
    );
    if (!registro) {
      flash(req, 'erro', 'Este link expirou ou já foi usado. Entre no painel e reenvie a confirmação.');
      return res.redirect('/entrar');
    }
    await query(`UPDATE verificacao_email SET usado_em = now() WHERE id = $1`, [registro.id]);
    await query(`UPDATE usuarios SET email_verificado = TRUE WHERE id = $1`, [registro.usuario_id]);

    if (req.session.usuario && req.session.usuario.id === registro.usuario_id) {
      req.session.usuario.email_verificado = true;
    }
    req.session.flash = [
      { tipo: 'ok', texto: 'E-mail confirmado! Agora você pode pedir o código da sua turma.' },
    ];
    res.redirect(req.session.usuario ? '/aluno' : '/entrar');
  } catch (erro) {
    console.error('[confirmar-email]', erro);
    flash(req, 'erro', 'Não foi possível confirmar o e-mail agora. Tente novamente.');
    res.redirect('/entrar');
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
        `Não encontramos uma conta Nuvia com o e-mail ${perfil.email}. Crie sua conta (aluno ou professor) e entre novamente com ${provedor === 'google' ? 'o Google' : 'o GitHub'}.`,
        '/cadastro'
      );
    }

    if (perfil.idExterno && !usuario[coluna]) {
      await query(`UPDATE usuarios SET ${coluna} = $1 WHERE id = $2`, [perfil.idExterno, usuario.id]);
    }

    await entrarNaSessao(req, usuario, true);
    // "Lembrar de mim" — vale também para login social (auto-login por 90 dias)
    const token = await criarLembrarSessao(usuario.id);
    definirCookie(res, token);
    req.session.flash = [
      { tipo: 'ok', texto: `Bem-vindo(a), ${usuario.nome}! Você entrou com ${provedor === 'google' ? 'o Google' : 'o GitHub'}.` },
    ];
    res.redirect(homeDo(usuario));
  } catch (erro) {
    console.error('[oauth/callback]', erro.message);
    voltar('erro', 'Não foi possível entrar com essa conta agora. Tente novamente ou use e-mail e senha.');
  }
});

/** Sair da conta (revoga o token de "lembrar de mim" deste dispositivo). */
router.post('/sair', async (req, res) => {
  try {
    const rex = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;\\s]+)');
    const cookie = (req.headers.cookie || '').match(rex);
    if (cookie) {
      await revogarLembrarSessao(decodeURIComponent(cookie[1]));
    }
  } catch (erro) {
    console.error('[sair]', erro);
  }
  limparCookie(res);
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
