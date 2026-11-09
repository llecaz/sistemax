/* Instalação do Nuvia como aplicativo (PWA).
   Registra o Service Worker e mostra um botão de instalação quando o
   navegador permite (Android/Chrome/Edge) ou instruções no iPhone/iPad. */
(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (erro) {
        console.warn('Service Worker não registrado:', erro && erro.message);
      });
    });
  }

  var standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (standalone) return;

  var CHAVE = 'nuvia-instalar-dispensado';
  try {
    if (sessionStorage.getItem(CHAVE) === '1') return;
  } catch (e) {}

  var promptEvento = null;
  var botao = null;

  function esconder() {
    if (botao && botao.parentNode) botao.parentNode.removeChild(botao);
    botao = null;
  }

  function dispensar() {
    try {
      sessionStorage.setItem(CHAVE, '1');
    } catch (e) {}
    esconder();
  }

  function criarBotao(rotulo, aoClicar) {
    if (botao) return;
    botao = document.createElement('div');
    botao.setAttribute('role', 'region');
    botao.setAttribute('aria-label', 'Instalar o aplicativo Nuvia');
    botao.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:9999',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'padding:10px 12px 10px 16px',
      'border-radius:999px',
      'border:1px solid rgba(255,255,255,.35)',
      'background:linear-gradient(145deg,#c7b7ff,#8064e8)',
      'box-shadow:0 12px 30px rgba(23,19,45,.35)',
      'font-family:inherit',
      'font-size:14px',
      'font-weight:600',
      'color:#21183d',
    ].join(';');

    var acao = document.createElement('button');
    acao.type = 'button';
    acao.textContent = rotulo;
    acao.style.cssText =
      'border:0;background:transparent;font:inherit;font-weight:700;color:#21183d;cursor:pointer;padding:4px 2px';
    acao.addEventListener('click', aoClicar);

    var fechar = document.createElement('button');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Dispensar');
    fechar.textContent = '×';
    fechar.style.cssText =
      'border:0;background:rgba(33,24,61,.12);color:#21183d;width:26px;height:26px;border-radius:50%;font-size:16px;line-height:1;cursor:pointer';
    fechar.addEventListener('click', dispensar);

    botao.appendChild(acao);
    botao.appendChild(fechar);
    document.body.appendChild(botao);
  }

  window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault();
    promptEvento = evento;
    criarBotao('Instalar app', async function () {
      if (!promptEvento) return;
      promptEvento.prompt();
      try {
        await promptEvento.userChoice;
      } catch (e) {}
      promptEvento = null;
      esconder();
    });
  });

  window.addEventListener('appinstalled', function () {
    promptEvento = null;
    esconder();
  });

  // iPhone/iPad (Safari) não dispara beforeinstallprompt: mostramos instruções.
  var iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  if (iOS && safari) {
    criarBotao('Como instalar', function () {
      window.alert(
        'Para instalar o Nuvia no seu iPhone/iPad:\n\n' +
          '1. Toque no botão Compartilhar (□↑) do Safari.\n' +
          '2. Escolha "Adicionar à Tela de Início".\n' +
          '3. Toque em "Adicionar".\n\n' +
          'O Nuvia abrirá como um aplicativo.'
      );
    });
  }
})();
