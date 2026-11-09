/**
 * Login social (OAuth 2.0) com Google e GitHub.
 *
 * Fluxo usado: Authorization Code.
 *   1. O usuário clica em "Continuar com Google/GitHub".
 *   2. Redirecionamos para a tela do provedor com um `state` aleatório.
 *   3. O provedor devolve o código em /entrar/<provedor>/callback.
 *   4. Trocamos o código por um token e lemos o e-mail verificado.
 *   5. Só entra quem já tem uma conta Nuvia com aquele e-mail.
 *
 * Nenhum segredo fica no código: tudo vem de variáveis de ambiente.
 */
const crypto = require('crypto');

const PROVEDORES = {
  google: {
    nome: 'Google',
    autorizacao: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    escopo: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: (base) => process.env.GOOGLE_REDIRECT_URI || `${base}/entrar/google/callback`,
    extras: { prompt: 'select_account' },
  },
  github: {
    nome: 'GitHub',
    autorizacao: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    escopo: 'read:user user:email',
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
    redirectUri: (base) => process.env.GITHUB_REDIRECT_URI || `${base}/entrar/github/callback`,
    extras: {},
  },
};

/** URL pública do site (para montar o redirect_uri). */
function baseUrl(req) {
  const configurada = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (configurada) return configurada;
  const protocolo = req.protocol || 'http';
  const host = req.get('host');
  return `${protocolo}://${host}`;
}

function provedorValido(id) {
  return Object.prototype.hasOwnProperty.call(PROVEDORES, id);
}

/** O provedor só aparece funcionando se as credenciais estiverem definidas. */
function provedorConfigurado(id) {
  const p = PROVEDORES[id];
  return !!(p && p.clientId() && p.clientSecret());
}

/** Gera o `state` anti-CSRF para guardar na sessão. */
function novoState() {
  return crypto.randomBytes(24).toString('hex');
}

/** URL para onde o navegador do usuário deve ir. */
function urlAutorizacao(id, req, state) {
  const p = PROVEDORES[id];
  const params = new URLSearchParams({
    client_id: p.clientId(),
    redirect_uri: p.redirectUri(baseUrl(req)),
    response_type: 'code',
    scope: p.escopo,
    state,
    ...p.extras,
  });
  return `${p.autorizacao}?${params.toString()}`;
}

async function buscarJson(url, opcoes) {
  const resposta = await fetch(url, {
    ...opcoes,
    signal: AbortSignal.timeout(15000),
  });
  if (!resposta.ok) {
    throw new Error(`Falha na comunicação com o provedor (${resposta.status}).`);
  }
  return resposta.json();
}

/** Troca o código de autorização pelo perfil do usuário (e-mail verificado). */
async function perfilDoCodigo(id, code, req) {
  const p = PROVEDORES[id];
  const corpo = new URLSearchParams({
    client_id: p.clientId(),
    client_secret: p.clientSecret(),
    code,
    grant_type: 'authorization_code',
    redirect_uri: p.redirectUri(baseUrl(req)),
  });

  const token = await buscarJson(p.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: corpo.toString(),
  });

  if (!token.access_token) {
    throw new Error('O provedor não devolveu um token de acesso.');
  }

  if (id === 'google') {
    const dados = await buscarJson('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!dados.email || dados.email_verified === false) {
      throw new Error('O e-mail da conta Google não está verificado.');
    }
    return {
      email: String(dados.email).toLowerCase(),
      nome: dados.name || dados.email,
      idExterno: String(dados.sub || ''),
    };
  }

  // GitHub: o e-mail pode estar privado; nesse caso usamos /user/emails.
  const dados = await buscarJson('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Nuvia',
    },
  });

  let email = dados.email;
  let verificado = !!dados.email;
  if (!email) {
    const emails = await buscarJson('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Nuvia',
      },
    });
    const principal = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
    if (principal) {
      email = principal.email;
      verificado = true;
    }
  }

  if (!email || !verificado) {
    throw new Error('O e-mail da conta GitHub não está verificado.');
  }

  return {
    email: String(email).toLowerCase(),
    nome: dados.name || dados.login || email,
    idExterno: String(dados.id || ''),
  };
}

module.exports = {
  PROVEDORES,
  provedorValido,
  provedorConfigurado,
  novoState,
  urlAutorizacao,
  perfilDoCodigo,
  baseUrl,
};
