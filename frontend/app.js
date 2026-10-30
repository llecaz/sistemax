/* ============================================================
   Comportamento do site: tema, menu, mensagens, arquivos
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Temas visuais (personalização) ---------- */
  var LISTA_TEMAS = window.SISTEMA_TEMAS || [];
  var MAPA_TEMAS = {};
  LISTA_TEMAS.forEach(function (t) {
    MAPA_TEMAS[t.id] = t;
  });
  var TEMA_PADRAO = window.SISTEMA_TEMA_PADRAO || 'clean-minimal';
  var LEGADO = { claro: 'clean-minimal', escuro: 'dark-minimal' }; // temas antigos do site

  function modoDoTema(id) {
    return MAPA_TEMAS[id] && MAPA_TEMAS[id].modo === 'escuro' ? 'escuro' : 'claro';
  }

  function idTemaAtual() {
    return document.documentElement.getAttribute('data-tema') || TEMA_PADRAO;
  }

  function guardarLocal(id) {
    try {
      localStorage.setItem('tema', id);
    } catch (e) {}
  }

  /** Janela de tempo com transições suaves durante a troca. */
  function transicaoTema() {
    var d = document.documentElement;
    d.classList.add('tema-transicao');
    setTimeout(function () {
      d.classList.remove('tema-transicao');
    }, 450);
  }

  /** Aplica o tema na página inteira (visual + galeria + formulário). */
  function aplicarTema(id, comTransicao) {
    if (!MAPA_TEMAS[id]) id = LEGADO[id] || TEMA_PADRAO;
    var d = document.documentElement;
    if (comTransicao !== false) transicaoTema();
    d.setAttribute('data-tema', id);
    d.setAttribute('data-tema-modo', modoDoTema(id));

    var salvo = d.getAttribute('data-tema-salvo') || id;
    var nome = (MAPA_TEMAS[id] && MAPA_TEMAS[id].nome) || id;

    // Indicadores dos cards da galeria
    document.querySelectorAll('[data-tema-card]').forEach(function (card) {
      var igual = card.getAttribute('data-tema-card') === id;
      card.classList.toggle('selecionado', igual);
      card.setAttribute('aria-pressed', igual ? 'true' : 'false');
      var selo = card.querySelector('.selo-tema');
      if (selo) selo.textContent = igual && id !== salvo ? 'Visualizando' : '✓ Selecionado';
    });

    var oculto = document.getElementById('tema-escondido');
    if (oculto) oculto.value = id;

    // Barra de ações: mostra quando há pré-visualização pendente
    var barra = document.getElementById('barra-tema');
    var texto = document.getElementById('barra-tema-texto');
    if (barra && texto) {
      var preview = id !== salvo;
      barra.classList.toggle('preview', preview);
      texto.innerHTML = preview
        ? 'Pré-visualizando <strong>' + nome + '</strong> — clique em “Aplicar tema” para salvar'
        : 'Tema atual: <strong>' + nome + '</strong>';
    }
    return id;
  }

  /** Persiste o tema: salva na conta (servidor) + neste dispositivo. */
  function salvarTema(id) {
    guardarLocal(id);
    if (!window.SISTEMA_LOGADO || typeof fetch !== 'function') return;
    fetch('/configuracoes/tema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ tema: id }),
      keepalive: true,
    })
      .then(function (resposta) {
        if (resposta && resposta.ok) {
          document.documentElement.setAttribute('data-tema-salvo', id);
          aplicarTema(id, false);
        }
      })
      .catch(function () {}); // sem rede: o tema continua aplicado neste dispositivo
  }

  document.addEventListener('click', function (evento) {
    // Alternador claro/escuro (barra superior e tela de login)
    var botaoTema = evento.target.closest('#btn-tema');
    if (botaoTema) {
      var atual = idTemaAtual();
      var par = MAPA_TEMAS[atual] && MAPA_TEMAS[atual].par;
      if (!par || !MAPA_TEMAS[par]) {
        var quero = modoDoTema(atual) === 'claro' ? 'escuro' : 'claro';
        par = TEMA_PADRAO;
        for (var i = 0; i < LISTA_TEMAS.length; i++) {
          if (LISTA_TEMAS[i].modo === quero) {
            par = LISTA_TEMAS[i].id;
            break;
          }
        }
        if (!MAPA_TEMAS[par]) par = atual;
      }
      aplicarTema(par);
      salvarTema(par);
      return;
    }
    // Card da galeria: pré-visualiza sem salvar
    var card = evento.target.closest('[data-tema-card]');
    if (card) {
      aplicarTema(card.getAttribute('data-tema-card'));
      return;
    }
    // Cancelar pré-visualização: volta ao tema salvo
    if (evento.target.closest('#btn-cancelar-tema')) {
      var salvo = document.documentElement.getAttribute('data-tema-salvo');
      if (salvo) aplicarTema(salvo);
    }
  });

  // Ao enviar o formulário da galeria, espelha a escolha no dispositivo
  document.addEventListener('submit', function (evento) {
    var form = evento.target;
    if (form.id !== 'form-tema') return;
    var restaurou = evento.submitter && evento.submitter.getAttribute('name') === 'restaurar';
    var oculto = form.querySelector('#tema-escondido');
    guardarLocal(restaurou ? TEMA_PADRAO : oculto ? oculto.value : TEMA_PADRAO);
  });

  // Sincroniza cards/estado inicial com o tema da página
  aplicarTema(idTemaAtual(), false);

  /* ---------- Menu lateral (gaveta) ---------- */
  function alternarGaveta(abrir) {
    var gaveta = document.getElementById('gaveta');
    var sobreposicao = document.getElementById('sobreposicao');
    if (!gaveta) return;
    gaveta.classList.toggle('aberta', abrir);
    if (sobreposicao) sobreposicao.classList.toggle('visivel', abrir);
    document.body.classList.toggle('menu-aberto', abrir);
  }

  document.addEventListener('click', function (evento) {
    if (evento.target.closest('#btn-menu')) alternarGaveta(true);
    if (evento.target.closest('#btn-fechar') || evento.target.closest('#sobreposicao')) alternarGaveta(false);
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') alternarGaveta(false);
  });

  /* ---------- Fechar mensagens ---------- */
  document.addEventListener('click', function (evento) {
    var fechar = evento.target.closest('.fechar-mensagem');
    if (fechar) {
      var msg = fechar.closest('.mensagem');
      if (msg) {
        msg.classList.add('saindo');
        setTimeout(function () {
          msg.remove();
        }, 200);
      }
    }
  });
  // Some sozinha depois de 8 segundos
  setTimeout(function () {
    document.querySelectorAll('.mensagem').forEach(function (m) {
      m.classList.add('saindo');
      setTimeout(function () {
        m.remove();
      }, 200);
    });
  }, 8000);

  /* ---------- Escolha de arquivo ---------- */
  document.addEventListener('change', function (evento) {
    var input = evento.target;
    if (input.type !== 'file') return;
    var rotulo = input.closest('.seletor-arquivo');
    if (!rotulo) return;
    var nome = rotulo.querySelector('.nome-arquivo');
    var limite = Number(rotulo.getAttribute('data-limite') || rotulo.closest('form').getAttribute('data-limite') || 0);

    if (nome) {
      nome.textContent = input.files && input.files[0] ? input.files[0].name : '';
      rotulo.classList.toggle('com-arquivo', !!(input.files && input.files.length));
    }

    var botaoEnviar = rotulo.closest('form').querySelector('.btn.ocultar');
    if (botaoEnviar) botaoEnviar.classList.toggle('ocultar', !(input.files && input.files.length));

    // Avisa quando passar do limite
    if (limite && input.files && input.files[0] && input.files[0].size > limite) {
      alert('Este arquivo tem ' + formatar(input.files[0].size) + '. O limite é ' + formatar(limite) + '.');
      input.value = '';
      if (nome) nome.textContent = '';
      if (botaoEnviar) botaoEnviar.classList.add('ocultar');
    }
  });

  function formatar(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /* ---------- Confirmações (excluir, gerar código...) ---------- */
  document.addEventListener('submit', function (evento) {
    var form = evento.target;
    var aviso = form.getAttribute('data-confirma');
    if (aviso && !window.confirm(aviso)) {
      evento.preventDefault();
      return;
    }
    var botao = form.querySelector('button[type="submit"]');
    if (botao && !form.classList.contains('form-correcao') && form.id !== 'form-tema') {
      botao.classList.add('carregando');
      botao.disabled = true;
    }
  });

  /* ---------- Copiar código da turma ---------- */
  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-copia]');
    if (!botao) return;
    var texto = botao.getAttribute('data-copia');
    var feito = function () {
      var original = botao.textContent;
      botao.textContent = 'Copiado!';
      botao.classList.add('copiado');
      setTimeout(function () {
        botao.textContent = original;
        botao.classList.remove('copiado');
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(feito).catch(feito);
    } else {
      feito();
    }
  });
})();
