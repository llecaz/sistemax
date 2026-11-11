/* Service Worker do Nuvia — instalável e com funcionamento offline básico.
   - Páginas (navegação): rede primeiro; se falhar, mostra /offline.html.
   - Arquivos estáticos: cache primeiro, atualizando em segundo plano.
   - Nunca guarda HTML autenticado, uploads, fotos ou respostas de API. */
const VERSAO = 'nuvia-v2';
const CACHE_ESTATICOS = `${VERSAO}-estaticos`;
const CACHE_OFFLINE = `${VERSAO}-offline`;

const ESTATICOS = [
  '/offline.html',
  '/estilo.css',
  '/temas.css',
  '/decoracoes.css',
  '/lofi.css',
  '/login-nuvia.css',
  '/app.js',
  '/lofi.js',
  '/pwa.js',
  '/favicon.png',
  '/img/cat-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_ESTATICOS)
      .then((cache) => cache.addAll(ESTATICOS))
      .catch(() => undefined)
      .then(() => caches.open(CACHE_OFFLINE).then((cache) => cache.add('/offline.html')).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => !chave.startsWith(VERSAO))
            .map((chave) => caches.delete(chave))
        )
      )
      .then(() => self.clients.claim())
  );
});

function naoCacheavel(url, requisicao) {
  if (requisicao.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;
  // Conteúdo pessoal, dinâmico ou de autenticação nunca vai para o cache.
  return (
    url.pathname.startsWith('/arquivos') ||
    url.pathname.startsWith('/fotos') ||
    url.pathname.startsWith('/saude') ||
    url.pathname.startsWith('/entrar') ||
    url.pathname.startsWith('/sair') ||
    url.pathname.startsWith('/configuracoes')
  );
}

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);

  if (naoCacheavel(url, request)) return;

  // Navegação: sempre tenta a rede (dados atualizados), cai para o offline.
  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_OFFLINE);
        return (await cache.match('/offline.html')) || Response.error();
      })
    );
    return;
  }

  // Estáticos: responde do cache e atualiza em segundo plano.
  evento.respondWith(
    caches.match(request).then((emCache) => {
      const rede = fetch(request)
        .then((resposta) => {
          if (resposta && resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CACHE_ESTATICOS).then((cache) => cache.put(request, copia)).catch(() => undefined);
          }
          return resposta;
        })
        .catch(() => emCache);
      return emCache || rede;
    })
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'pular-espera') self.skipWaiting();
});
