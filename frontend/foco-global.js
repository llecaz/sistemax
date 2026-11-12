/**
 * Modo Foco — motor global do Nuvia.
 *
 * - Timer baseado em timestamp (endAt): continua contando mesmo se você
 *   navegar para outra página, recarregar ou fechar/abrir a aba.
 * - Estado persistido em localStorage ('nuvia-foco').
 * - Música lo-fi: 3 trilhas geradas localmente com Web Audio (offline),
 *   ou, opcionalmente, YouTube / Spotify (integrações oficiais) / outro app.
 * - Um widget flutuante (layout.js) segue o usuário em todas as páginas.
 *
 * API pública: window.NuviaFoco = { iniciar, pausar, alternar, zerar,
 *   definirMinutos, definirMs, adicionarMinutos, obterEstado, aoMudar,
 *   obterTempo }.
 */
(function () {
  'use strict';

  var KEY = 'nuvia-foco';
  var MUSICA_KEY = 'nuvia-foco-musica';
  var PADRAO = { totalMs: 25 * 60 * 1000, remainingMs: 25 * 60 * 1000, running: false, endAt: 0, ciclos: 0 };

  /* ================= Estado do timer ================= */
  function ler() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || '{}');
      var estado = Object.assign({}, PADRAO, s || {});
      estado.totalMs = Number(estado.totalMs) || PADRAO.totalMs;
      estado.remainingMs = Math.max(0, Number(estado.remainingMs) || 0);
      estado.endAt = Number(estado.endAt) || 0;
      estado.ciclos = Number(estado.ciclos) || 0;
      if (!estado.running && estado.endAt) estado.running = true; // migração
      return estado;
    } catch (e) {
      return Object.assign({}, PADRAO);
    }
  }
  var state = ler();
  var ouvintes = [];

  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    ouvintes.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }
  function aoMudar(fn) { ouvintes.push(fn); }

  function restante() {
    if (state.running && state.endAt) return Math.max(0, state.endAt - Date.now());
    return Math.max(0, Number(state.remainingMs) || 0);
  }
  function ativo() { return restante() > 0 || state.running; }

  function iniciar() {
    var r = restante();
    if (r <= 0) r = state.totalMs; // foi concluído → recomeça
    state.running = true;
    state.endAt = Date.now() + r;
    state.remainingMs = r;
    salvar();
  }
  function pausar() {
    state.remainingMs = restante();
    state.running = false;
    state.endAt = 0;
    salvar();
  }
  function alternar() { if (state.running) pausar(); else iniciar(); }
  function zerar() {
    state.running = false;
    state.endAt = 0;
    state.remainingMs = state.totalMs;
    salvar();
  }
  /** Define uma nova duração TOTAL (horas+minutos), sem limite. Reinicia o ciclo. */
  function definirMs(ms) {
    ms = Math.max(60 * 1000, Math.floor(Number(ms) || 0));
    state.totalMs = ms;
    state.remainingMs = ms;
    state.running = false;
    state.endAt = 0;
    salvar();
  }
  function definirMinutos(minutos) { definirMs(Math.round(Number(minutos) || 0) * 60 * 1000); }
  /** Soma minutos/horas ao cronômetro atual (restante e total), sem limite. */
  function adicionarMinutos(minutos) {
    var extra = Math.max(0, Number(minutos) || 0) * 60 * 1000;
    if (!extra) return;
    state.totalMs += extra;
    if (state.running && state.endAt) state.endAt += extra;
    else state.remainingMs = Math.max(0, (Number(state.remainingMs) || 0) + extra);
    salvar();
  }

  /* ================= Conclusão ================= */
  function completar() {
    state.running = false;
    state.endAt = 0;
    state.remainingMs = 0;
    state.ciclos = (state.ciclos || 0) + 1;
    salvar();
    tocarCampainha();
  }
  function tocarCampainha() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      var ctx = new AC();
      var notas = [523.25, 659.25, 783.99];
      notas.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var ganho = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        var t = ctx.currentTime + i * 0.35;
        ganho.gain.setValueAtTime(0.0001, t);
        ganho.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
        ganho.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.connect(ganho);
        ganho.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.5);
      });
    } catch (e) {}
  }

  /* ================= Formatação e UI ================= */
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatar(ms) {
    var totalSeg = Math.round(ms / 1000);
    var h = Math.floor(totalSeg / 3600);
    var m = Math.floor((totalSeg % 3600) / 60);
    var s = totalSeg % 60;
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }
  function formatarCurto(ms) {
    return Math.round(ms / 60000) + ' min';
  }

  var tituloOriginal = null;
  function atualizarTitulo() {
    if (typeof document === 'undefined') return;
    if (state.running && ativo()) {
      if (tituloOriginal === null) tituloOriginal = document.title;
      document.title = '⏱ ' + formatar(restante()) + ' · Nuvia';
    } else if (tituloOriginal !== null) {
      document.title = tituloOriginal;
    }
  }

  function atualizarUI() {
    var r = restante();
    var total = state.totalMs || 1;
    var texto = formatar(r);
    var pct = Math.max(0, Math.min(100, Math.round((r / total) * 100)));

    document.querySelectorAll('[data-foco-tempo]').forEach(function (el) { el.textContent = texto; });
    document.querySelectorAll('[data-foco-barra]').forEach(function (el) { el.style.width = pct + '%'; });
    document.querySelectorAll('[data-foco-sessao]').forEach(function (el) { el.textContent = formatarCurto(total); });
    document.querySelectorAll('[data-foco-alternar]').forEach(function (el) {
      var concluido = !state.running && r === 0;
      el.textContent = state.running ? 'Pausar' : concluido ? 'De novo' : r !== total ? 'Continuar' : 'Começar';
      el.setAttribute('aria-pressed', state.running ? 'true' : 'false');
    });
    document.querySelectorAll('[data-foco-ciclos]').forEach(function (el) { el.textContent = String(state.ciclos); });

    // Widget flutuante: só aparece com uma sessão em andamento (ou concluída)
    var widget = document.getElementById('foco-widget');
    if (widget) {
      var emCurso = state.running || r !== total || (r === 0 && (state.ciclos || 0) > 0);
      widget.hidden = !emCurso;
      widget.classList.toggle('foco-widget--concluido', !state.running && r === 0 && (state.ciclos || 0) > 0);
    }

    // Página de foco: estado "concluído"
    document.querySelectorAll('[data-foco-concluido]').forEach(function (el) {
      el.hidden = !(!state.running && r === 0 && (state.ciclos || 0) > 0);
    });

    atualizarTitulo();
  }

  /* ================= Música lo-fi (Web Audio, offline) ================= */
  var TRILHAS = [
    {
      nome: 'Chuva no telhado',
      descricao: 'Chuva suave + acordes lentos',
      acordes: [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66], [164.81, 207.65, 246.94]],
      melT: 7.5, chuva: 0.055, onda: 'triangle',
    },
    {
      nome: 'Madrugada no laboratório',
      descricao: 'Pads calmos para estudar até tarde',
      acordes: [[146.83, 174.61, 220.0], [196.0, 246.94, 293.66], [130.81, 164.81, 196.0], [164.81, 207.65, 246.94]],
      melT: 9, chuva: 0, onda: 'sine',
    },
    {
      nome: 'Café e pixel',
      descricao: 'Lofi jazz de fim de tarde',
      acordes: [[174.61, 220.0, 277.18, 349.23], [164.81, 207.65, 261.63, 329.63], [146.83, 185.0, 233.08, 293.66], [130.81, 164.81, 196.0, 246.94]],
      melT: 6.5, chuva: 0.025, onda: 'triangle',
    },
  ];

  var audio = {
    ctx: null,
    master: null,
    ruido: null,
    ruidoGain: null,
    timer: null,
    passo: 0,
    estado: { tocando: false, trilha: 0, volume: 0.6 },
  };

  function lerMusica() {
    try {
      var s = JSON.parse(localStorage.getItem(MUSICA_KEY) || '{}');
      audio.estado.trilha = (s.trilha | 0) % TRILHAS.length;
      audio.estado.volume = Math.min(1, Math.max(0, Number(s.volume != null ? s.volume : 0.6)));
      audio.estado.tocando = false; // nunca autoplay ao carregar
    } catch (e) { /* padrão */ }
  }
  function salvarMusica() {
    try {
      localStorage.setItem(MUSICA_KEY, JSON.stringify({ trilha: audio.estado.trilha, volume: audio.estado.volume }));
    } catch (e) {}
  }

  function prepararAudio() {
    if (audio.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var ctx = new AC();
    audio.ctx = ctx;
    audio.master = ctx.createGain();
    audio.master.gain.value = 0;
    audio.master.connect(ctx.destination);
    return true;
  }

  function nota(freq, quando, dur, tipo, vol) {
    var o = audio.ctx.createOscillator();
    var g = audio.ctx.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.exponentialRampToValueAtTime(vol, quando + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + dur);
    o.connect(g);
    g.connect(audio.master);
    o.start(quando);
    o.stop(quando + dur + 0.05);
  }

  function iniciarChuva(intensidade) {
    if (!audio.ctx) return;
    var ctx = audio.ctx;
    var buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < dados.length; i++) dados[i] = (Math.random() * 2 - 1) * 0.25;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    var filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 760;
    audio.ruidoGain = ctx.createGain();
    audio.ruidoGain.gain.value = 0;
    src.connect(filtro);
    filtro.connect(audio.ruidoGain);
    audio.ruidoGain.connect(audio.master);
    src.start();
    audio.ruido = src;
    audio.ruidoGain.gain.setTargetAtTime(intensidade, ctx.currentTime + 0.2, 0.6);
  }

  function pararChuva() {
    if (!audio.ctx || !audio.ruidoGain) return;
    var ctx = audio.ctx;
    audio.ruidoGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    window.setTimeout(function () {
      try { audio.ruido && audio.ruido.stop(); } catch (e) {}
      audio.ruido = null;
      audio.ruidoGain = null;
    }, 1500);
  }

  function tocarAcorde() {
    if (!audio.ctx) return;
    var trilha = TRILHAS[audio.estado.trilha];
    var agora = audio.ctx.currentTime + 0.08;
    var acorde = trilha.acordes[audio.passo % trilha.acordes.length];
    for (var i = 0; i < acorde.length; i++) {
      nota(acorde[i], agora, trilha.melT * 1.05, trilha.onda, 0.045 - i * 0.009);
    }
    nota(acorde[0] / 2, agora, trilha.melT * 1.1, 'sine', 0.05);
    audio.passo++;
  }

  var MUSICA = {
    obterEstado: function () { return { tocando: audio.estado.tocando, trilha: audio.estado.trilha, volume: audio.estado.volume, nome: TRILHAS[audio.estado.trilha].nome, descricao: TRILHAS[audio.estado.trilha].descricao }; },
    trilhas: TRILHAS,
    tocar: function () {
      if (!prepararAudio()) { marcarMusicaIndisponivel(); return; }
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      var trilha = TRILHAS[audio.estado.trilha];
      audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.master.gain.setTargetAtTime(audio.estado.volume * 0.32, audio.ctx.currentTime, 0.25);
      if (trilha.chuva > 0 && !audio.ruido) iniciarChuva(trilha.chuva);
      if (!audio.timer) { tocarAcorde(); audio.timer = window.setInterval(tocarAcorde, trilha.melT * 1000); }
      audio.estado.tocando = true;
      salvarMusica();
      atualizarUIMusica();
    },
    pausar: function () {
      if (!audio.ctx) return;
      audio.estado.tocando = false;
      if (audio.timer) { window.clearInterval(audio.timer); audio.timer = null; }
      audio.master.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.3);
      pararChuva();
      salvarMusica();
      atualizarUIMusica();
    },
    alternar: function () { audio.estado.tocando ? MUSICA.pausar() : MUSICA.tocar(); },
    proxima: function (vaiDireto) {
      var proximo = (audio.estado.trilha + 1) % TRILHAS.length;
      audio.estado.trilha = proximo;
      audio.passo = 0;
      if (audio.timer) { window.clearInterval(audio.timer); audio.timer = null; }
      if (audio.ctx) audio.master.gain.setTargetAtTime(0.0001, audio.ctx.currentTime, 0.15);
      pararChuva();
      window.setTimeout(function () { MUSICA.tocar(); }, 350);
      salvarMusica();
      atualizarUIMusica();
    },
    definirTrilha: function (indice) {
      indice = Math.max(0, Math.min(TRILHAS.length - 1, indice | 0));
      if (indice === audio.estado.trilha) { if (!audio.estado.tocando) MUSICA.tocar(); return; }
      audio.estado.trilha = indice;
      audio.passo = 0;
      if (audio.timer) { window.clearInterval(audio.timer); audio.timer = null; }
      pararChuva();
      window.setTimeout(function () { MUSICA.tocar(); }, 200);
      salvarMusica();
      atualizarUIMusica();
    },
    definirVolume: function (v) {
      audio.estado.volume = Math.min(1, Math.max(0, Number(v) || 0));
      if (audio.ctx && audio.estado.tocando) {
        audio.master.gain.setTargetAtTime(audio.estado.volume * 0.32, audio.ctx.currentTime, 0.1);
      }
      salvarMusica();
      atualizarUIMusica();
    },
  };

  function marcarMusicaIndisponivel() {
    document.querySelectorAll('[data-musica-status]').forEach(function (el) { el.textContent = 'áudio indisponível neste navegador'; });
  }
  function atualizarUIMusica() {
    var e = audio.estado;
    var t = TRILHAS[e.trilha];
    document.querySelectorAll('[data-musica-nome]').forEach(function (el) { el.textContent = t.nome; });
    document.querySelectorAll('[data-musica-desc]').forEach(function (el) { el.textContent = t.descricao; });
    document.querySelectorAll('[data-musica-status]').forEach(function (el) { el.textContent = e.tocando ? 'tocando' : 'pausado'; });
    document.querySelectorAll('[data-musica-alternar]').forEach(function (el) {
      el.textContent = e.tocando ? '⏸ Pausar' : '▶ Tocar';
      el.setAttribute('aria-pressed', e.tocando ? 'true' : 'false');
    });
    document.querySelectorAll('[data-trilha-indice]').forEach(function (el) {
      var ativo = Number(el.getAttribute('data-trilha-indice')) === e.trilha;
      el.classList.toggle('selecionada', ativo);
      el.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
    var vol = document.getElementById('foco-volume');
    if (vol && Number(vol.value) !== Math.round(e.volume * 100)) vol.value = String(Math.round(e.volume * 100));
  }

  /* ================= Tick global ================= */
  window.setInterval(function () {
    if (state.running && restante() <= 0) {
      completar();
    } else if (document.visibilityState === 'visible') {
      atualizarUI();
    }
  }, 500);

  /* ================= Bindings (página de foco + widget + cartão) ================= */
  function adicionarHorasMinutos(horas, minutos) {
    var extra = (Number(horas) || 0) * 3600 * 1000 + (Number(minutos) || 0) * 60 * 1000;
    adicionarMinutos(extra / 60000);
  }

  function ligarGlobal() {
    lerMusica();

    document.addEventListener('click', function (evento) {
      var alvoAcao = evento.target.closest('[data-foco-acao]');
      if (alvoAcao) {
        var acao = alvoAcao.getAttribute('data-foco-acao');
        if (acao === 'alternar') alternar();
        else if (acao === 'zerar') zerar();
        return;
      }
      var alvoAdd = evento.target.closest('[data-foco-add]');
      if (alvoAdd) {
        var partes = String(alvoAdd.getAttribute('data-foco-add') || '0').split(':');
        adicionarHorasMinutos(Number(partes[0] || 0), Number(partes[1] || 0));
        return;
      }
      var alvoTrilha = evento.target.closest('[data-trilha-indice]');
      if (alvoTrilha) {
        MUSICA.definirTrilha(Number(alvoTrilha.getAttribute('data-trilha-indice')));
        return;
      }
      if (evento.target.closest('[data-musica-alternar]')) { MUSICA.alternar(); return; }
      if (evento.target.closest('[data-musica-proxima]')) { MUSICA.proxima(); return; }
    });

    var form = document.getElementById('foco-duracao-form');
    if (form) {
      form.addEventListener('submit', function (evento) {
        evento.preventDefault();
        var h = Number((document.getElementById('foco-horas') || {}).value || 0);
        var m = Number((document.getElementById('foco-minutos') || {}).value || 0);
        definirMs(h * 3600 * 1000 + m * 60 * 1000);
      });
    }

    // --- Abas da fonte de música (Lo-fi / YouTube / Spotify / Outro app) ---
    document.querySelectorAll('[data-musica-aba]').forEach(function (aba) {
      aba.addEventListener('click', function () {
        var alvo = aba.getAttribute('data-musica-aba');
        document.querySelectorAll('[data-musica-aba]').forEach(function (a) {
          a.classList.toggle('ativa', a === aba);
          a.setAttribute('aria-selected', a === aba ? 'true' : 'false');
        });
        document.querySelectorAll('[data-musica-painel]').forEach(function (p) {
          p.hidden = p.getAttribute('data-musica-painel') !== alvo;
        });
      });
    });

    var vol = document.getElementById('foco-volume');
    if (vol) {
      vol.addEventListener('input', function () { MUSICA.definirVolume(Number(vol.value) / 100); });
    }

    // --- YouTube (integração oficial via IFrame Player API) ---
    var ytBotao = document.getElementById('foco-yt-tocar');
    if (ytBotao) {
      var carregadoYT = null;
      var carregandoYT = false;
      function idDoVideo(url) {
        var m;
        m = String(url).match(/[?&]v=([A-Za-z0-9_-]{6,})/); if (m) return m[1];
        m = String(url).match(/youtu\.be\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
        m = String(url).match(/youtube\.com\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
        m = String(url).match(/music\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/); if (m) return m[1];
        return null;
      }
      function listarPlaylist(url) {
        var m = String(url).match(/[?&]list=([A-Za-z0-9_-]{6,})/);
        return m ? m[1] : null;
      }
      function carregarAPI(callback) {
        if (window.YT && window.YT.Player) { callback(); return; }
        if (carregandoYT) { var t = window.setInterval(function () { if (window.YT && window.YT.Player) { window.clearInterval(t); callback(); } }, 200); return; }
        carregandoYT = true;
        window.onYouTubeIframeAPIReady = function () { callback(); };
        var s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
      ytBotao.addEventListener('click', function () {
        var input = document.getElementById('foco-yt-url');
        var url = (input && input.value || '').trim();
        var vid = idDoVideo(url);
        var lista = listarPlaylist(url);
        var cont = document.getElementById('foco-yt-player');
        var status = document.getElementById('foco-yt-status');
        if (!vid && !lista) { if (status) status.textContent = 'Link inválido. Cole a URL de um vídeo ou playlist do YouTube.'; return; }
        var montar = function () {
          try { if (carregadoYT && carregadoYT.destroy) carregadoYT.destroy(); } catch (e) {}
          cont.innerHTML = '<div id="foco-yt-frame"></div>';
          var opcoes = {
            height: '198',
            width: '100%',
            playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
            events: {
              onReady: function (e) { if (status) status.textContent = 'Tocando no YouTube'; },
              onError: function () { if (status) status.textContent = 'Não foi possível tocar este vídeo (pode estar bloqueado).'; },
            },
          };
          if (lista) { opcoes.playerVars.listType = 'playlist'; opcoes.playerVars.list = lista; if (vid) { opcoes.videoId = vid; } }
          else opcoes.videoId = vid;
          carregadoYT = new window.YT.Player('foco-yt-frame', opcoes);
        };
        carregarAPI(montar);
      });
    }

    // --- Spotify (embed oficial) ---
    var spBotao = document.getElementById('foco-spotify-carregar');
    if (spBotao) {
      spBotao.addEventListener('click', function () {
        var input = document.getElementById('foco-spotify-url');
        var url = (input && input.value || '').trim();
        var m = String(url).match(/open\.spotify\.com\/(track|playlist|album|episode|show|artist)\/([A-Za-z0-9]{10,})/);
        var status = document.getElementById('foco-spotify-status');
        var cont = document.getElementById('foco-spotify-player');
        if (!m || !cont) { if (status) status.textContent = 'Link inválido. Cole um link open.spotify.com (faixa, playlist, álbum...).'; return; }
        var tipo = m[1] === 'artist' ? 'artist' : m[1];
        cont.innerHTML = '<iframe title="Player Spotify" src="https://open.spotify.com/embed/' + tipo + '/' + m[2] + '?utm_source=generator&theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
        if (status) status.textContent = 'Carregado. Sem conta Premium toca a prévia de 30s.';
      });
    }

    // --- Outro app de música: abre o link em nova aba (o timer continua nesta) ---
    var outroBotao = document.getElementById('foco-outro-abrir');
    if (outroBotao) {
      outroBotao.addEventListener('click', function () {
        var input = document.getElementById('foco-outro-url');
        var url = (input && input.value || '').trim();
        var status = document.getElementById('foco-outro-status');
        var ok = false;
        try { var u = new URL(url); ok = u.protocol === 'https:' || u.protocol === 'http:'; } catch (e) { ok = false; }
        if (!ok) { if (status) status.textContent = 'Informe um endereço válido (https://...).'; return; }
        window.open(url, '_blank', 'noopener');
        if (status) status.textContent = 'Aberto em nova aba. O cronômetro continua aqui.';
      });
    }

    atualizarUI();
    atualizarUIMusica();
  }

  window.NuviaFoco = {
    iniciar: iniciar,
    pausar: pausar,
    alternar: alternar,
    zerar: zerar,
    definirMs: definirMs,
    definirMinutos: definirMinutos,
    adicionarMinutos: adicionarMinutos,
    obterEstado: function () { return Object.assign({}, state); },
    obterTempo: restante,
    aoMudar: aoMudar,
    musica: MUSICA,
    _tick: function () { if (state.running && restante() <= 0) completar(); else atualizarUI(); },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligarGlobal);
  } else {
    ligarGlobal();
  }
})();
