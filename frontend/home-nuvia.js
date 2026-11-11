/* Página inicial Nuvia: menu mobile, abas do planner e animações de entrada. */
(function () {
  'use strict';

  /* ---------- Menu mobile ---------- */
  var botao = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav-principal');

  function fecharMenu() {
    if (!nav || !botao) return;
    nav.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu');
  }

  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) fecharMenu();
    });

    document.addEventListener('click', function (evento) {
      if (!nav.classList.contains('aberto')) return;
      if (nav.contains(evento.target) || botao.contains(evento.target)) return;
      fecharMenu();
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape') fecharMenu();
    });
  }

  /* ---------- Abas do planner ---------- */
  var abas = document.querySelectorAll('[data-planner-tab]');
  var paineis = document.querySelectorAll('[data-planner-panel]');

  abas.forEach(function (aba) {
    aba.addEventListener('click', function () {
      var alvo = aba.getAttribute('data-planner-tab');

      abas.forEach(function (outra) {
        var ativa = outra === aba;
        outra.classList.toggle('ativo', ativa);
        outra.setAttribute('aria-selected', String(ativa));
      });

      paineis.forEach(function (painel) {
        painel.classList.toggle('ativo', painel.getAttribute('data-planner-panel') === alvo);
      });
    });
  });

  /* ---------- Revelar ao rolar ---------- */
  var itens = document.querySelectorAll('.reveal');
  var reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduzir || !('IntersectionObserver' in window)) {
    itens.forEach(function (item) { item.classList.add('visivel'); });
    return;
  }

  var observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  itens.forEach(function (item) { observador.observe(item); });
})();
