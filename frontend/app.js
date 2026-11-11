/* ============================================================
   Comportamento do site: tema, menu, mensagens, arquivos
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Aparência: Dark/Normal + Lofi Mode ---------- */
  var LISTA_TEMAS = window.SISTEMA_TEMAS || [];
  var MAPA_TEMAS = {};
  LISTA_TEMAS.forEach(function (t) {
    MAPA_TEMAS[t.id] = t;
  });
  var TEMA_PADRAO = window.SISTEMA_TEMA_PADRAO || 'nuvia';
  // Temas que existiam antes da simplificação → caem no modo equivalente
  var LEGADO = {
    claro: 'nuvia-day', escuro: 'nuvia',
    'clean-minimal': 'nuvia-day', japandi: 'nuvia-day', 'soft-ui': 'nuvia-day', 'pastel-dream': 'nuvia-day',
    'dark-minimal': 'nuvia', 'lo-fi-night': 'nuvia', moonroom: 'nuvia', 'dark-academia': 'nuvia',
  };

  function resolverTema(id) {
    if (MAPA_TEMAS[id]) return id;
    return LEGADO[id] || TEMA_PADRAO;
  }

  function modoDoTema(id) {
    return MAPA_TEMAS[id] && MAPA_TEMAS[id].modo === 'escuro' ? 'escuro' : 'claro';
  }

  function idTemaAtual() {
    return resolverTema(document.documentElement.getAttribute('data-tema') || TEMA_PADRAO);
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

  /** Aplica o modo na página inteira (visual + cards de configuração). */
  function aplicarTema(id, comTransicao) {
    id = resolverTema(id);
    var d = document.documentElement;
    if (comTransicao !== false) transicaoTema();
    d.setAttribute('data-tema', id);
    d.setAttribute('data-tema-modo', modoDoTema(id));

    // Cards de modo da página de configuração
    document.querySelectorAll('[data-tema-escolher]').forEach(function (card) {
      var igual = card.getAttribute('data-tema-escolher') === id;
      card.classList.toggle('selecionado', igual);
      card.setAttribute('aria-pressed', igual ? 'true' : 'false');
      var selo = card.querySelector('.selo-tema');
      if (selo) selo.textContent = igual ? '✓ Selecionado' : 'Aplicar';
    });
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
        }
      })
      .catch(function () {}); // sem rede: o tema continua aplicado neste dispositivo
  }

  function lofiAtual() {
    return document.documentElement.getAttribute('data-lofi') === 'on';
  }

  function aplicarLofi(ativo) {
    var d = document.documentElement;
    if (ativo) transicaoTema();
    d.setAttribute('data-lofi', ativo ? 'on' : 'off');
    document.querySelectorAll('#btn-lofi, #btn-lofi-cfg').forEach(function (botao) {
      botao.setAttribute('aria-checked', ativo ? 'true' : 'false');
      botao.classList.toggle('lofi-ativo', ativo);
      var rotulo = botao.querySelector('.lofi-toggle-rotulo');
      if (rotulo) rotulo.textContent = ativo ? 'Ativado' : 'Desativado';
    });
  }

  /** Persiste o Lofi Mode: salva na conta (servidor). */
  function salvarLofi(ativo) {
    try {
      localStorage.setItem('lofi', ativo ? 'on' : 'off');
    } catch (e) {}
    if (!window.SISTEMA_LOGADO || typeof fetch !== 'function') return Promise.resolve();
    return fetch('/configuracoes/lofi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ lofi: ativo }),
      keepalive: true,
    }).catch(function () {}); // sem rede: o modo continua aplicado nesta página
  }

  document.addEventListener('click', function (evento) {
    // Alternador Dark/Normal (menu lateral e tela de login)
    var botaoTema = evento.target.closest('#btn-tema');
    if (botaoTema) {
      var atual = idTemaAtual();
      var par = (MAPA_TEMAS[atual] && MAPA_TEMAS[atual].par) || TEMA_PADRAO;
      aplicarTema(par);
      salvarTema(par);
      return;
    }
    // Card de modo na configuração: aplica o modo escolhido
    var card = evento.target.closest('[data-tema-escolher]');
    if (card) {
      evento.preventDefault();
      var escolhido = aplicarTema(card.getAttribute('data-tema-escolher'));
      salvarTema(escolhido);
      return;
    }
    // Lofi Mode (menu lateral e configurações)
    if (evento.target.closest('#btn-lofi') || evento.target.closest('#btn-lofi-cfg')) {
      var ligado = !lofiAtual();
      aplicarLofi(ligado);
      // No calendário o markup muda conforme o modo — recarrega para aplicar
      var promessa = salvarLofi(ligado);
      if (document.body && document.body.dataset && document.body.dataset.pagina === 'calendario') {
        Promise.resolve(promessa).then(function () { location.reload(); });
        setTimeout(function () { location.reload(); }, 600); // fallback sem rede
      }
      return;
    }
  });

  // Ao enviar o formulário da galeria de modos (sem JS o botão submit funciona)
  document.addEventListener('submit', function (evento) {
    var form = evento.target;
    if (form.id !== 'form-tema') return;
    var botao = evento.submitter;
    if (botao && botao.getAttribute('data-tema-escolher')) {
      evento.preventDefault();
      var escolhido = aplicarTema(botao.getAttribute('data-tema-escolher'));
      salvarTema(escolhido);
    }
  });

  // Sincroniza estado inicial com o que a página renderizou
  aplicarTema(idTemaAtual(), false);
  aplicarLofi(lofiAtual());

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

  /* ---------- Abas do envio (arquivo / link / drive) ---------- */
  document.addEventListener('click', function (evento) {
    var aba = evento.target.closest('[data-envio-aba]');
    if (!aba) return;
    var bloco = aba.closest('.bloco-envio');
    if (!bloco) return;
    var qual = aba.getAttribute('data-envio-aba');

    bloco.querySelectorAll('[data-envio-aba]').forEach(function (b) {
      var ativa = b === aba;
      b.classList.toggle('ativa', ativa);
      b.setAttribute('aria-selected', ativa ? 'true' : 'false');
    });

    // Painéis: mostra o escolhido e desabilita os campos dos outros
    // (senão o "required" dos campos ocultos impediria o envio)
    bloco.querySelectorAll('[data-envio-painel]').forEach(function (painel) {
      var ativo = painel.getAttribute('data-envio-painel') === qual;
      painel.classList.toggle('ativo', ativo);
      painel.querySelectorAll('input, button, select, textarea').forEach(function (campo) {
        if (ativo) {
          campo.removeAttribute('disabled');
        } else {
          campo.setAttribute('disabled', 'disabled');
        }
      });
    });

    // Informa ao servidor o método escolhido
    var oculto = bloco.querySelector('[data-metodo-envio]');
    if (oculto) oculto.value = qual;
  });

  // Ao carregar a página, deixa os painéis iniciais consistentes
  document.querySelectorAll('.bloco-envio').forEach(function (bloco) {
    var ativa = bloco.querySelector('[data-envio-aba].ativa') || bloco.querySelector('[data-envio-aba]');
    if (ativa) ativa.click();
  });

  /* ---------- Confirmações (excluir, gerar código...) ---------- */
  document.addEventListener('submit', function (evento) {
    var form = evento.target;
    var aviso = form.getAttribute('data-confirma');
    if (aviso && !window.confirm(aviso)) {
      evento.preventDefault();
      return;
    }
    var botao = evento.submitter || form.querySelector('button[type="submit"]');
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

  /* ---------- Modo foco (timer de estudos) ---------- */
  document.querySelectorAll('[data-foco]').forEach(function (cartao) {
    var TOTAL = 25 * 60; // 25 minutos
    var restante = TOTAL;
    var rodando = false;
    var intervalo = null;
    var tempo = cartao.querySelector('[data-foco-tempo]');
    var barra = cartao.querySelector('[data-foco-barra]');
    var botao = cartao.querySelector('[data-foco-acao="alternar"]');
    var zerar = cartao.querySelector('[data-foco-acao="zerar"]');
    var dica = cartao.querySelector('.dash-foco-dica');
    var dicaOriginal = dica ? dica.textContent : '';

    function doisDigitos(n) {
      return String(n).padStart(2, '0');
    }

    function pintar() {
      if (tempo) tempo.textContent = doisDigitos(Math.floor(restante / 60)) + ':' + doisDigitos(restante % 60);
      if (barra) barra.style.width = Math.round((restante / TOTAL) * 100) + '%';
    }

    function parar() {
      rodando = false;
      if (intervalo) clearInterval(intervalo);
      intervalo = null;
      if (botao) botao.textContent = restante === 0 ? 'De novo' : 'Continuar';
      if (restante === 0) {
        cartao.classList.add('dash-foco-completo');
        if (dica) dica.textContent = 'Ciclo concluído! Hora de 5 minutinhos de pausa ♡';
      }
    }

    function iniciar() {
      if (restante <= 0) restante = TOTAL;
      rodando = true;
      if (botao) botao.textContent = 'Pausar';
      intervalo = setInterval(function () {
        restante -= 1;
        if (restante <= 0) {
          restante = 0;
          pintar();
          parar();
          if (botao) botao.textContent = 'De novo';
          return;
        }
        pintar();
      }, 1000);
    }

    if (botao) {
      botao.addEventListener('click', function () {
        if (rodando) parar();
        else iniciar();
      });
    }

    if (zerar) {
      zerar.addEventListener('click', function () {
        parar();
        restante = TOTAL;
        cartao.classList.remove('dash-foco-completo');
        if (dica) dica.textContent = dicaOriginal;
        if (botao) botao.textContent = 'Começar';
        pintar();
      });
    }

    if (botao) {
      botao.addEventListener('click', function () {
        if (restante === 0) {
          cartao.classList.remove('dash-foco-completo');
          if (dica) dica.textContent = dicaOriginal;
        }
      });
    }

    pintar();
  });

  /* ---------- Calendário: filtrar a lista clicando num dia ---------- */
  (function () {
    var painelLista = document.getElementById('lista-eventos');
    var filtro = document.getElementById('filtro-dia');
    var filtroTexto = document.getElementById('filtro-dia-texto');
    var filtroLimpar = document.getElementById('filtro-dia-limpar');
    var itens = painelLista ? painelLista.querySelectorAll('.cal-lista-item, .lofi-lista-item') : [];
    var selecionado = null;

    function chaveParaTexto(chave) {
      var partes = String(chave || '').split('-');
      if (partes.length !== 3) return chave;
      var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      var dia = Number(partes[2]);
      var mes = Number(partes[1]) - 1;
      var ano = partes[0];
      if (Number.isNaN(dia) || Number.isNaN(mes) || mes < 0 || mes > 11) return chave;
      return dia + ' de ' + meses[mes] + ' de ' + ano;
    }

    function aplicarFiltro(chave) {
      selecionado = chave;
      itens.forEach(function (item) {
        item.hidden = !!chave && item.getAttribute('data-dia') !== chave;
      });
      if (filtro && filtroTexto) {
        filtro.hidden = !chave;
        if (chave) filtroTexto.textContent = chaveParaTexto(chave);
      }
      document.querySelectorAll('.cal-dia[data-dia]').forEach(function (dia) {
        dia.classList.toggle('selecionado', !!chave && dia.getAttribute('data-dia') === chave);
      });
      document.querySelectorAll('[data-filtro-dia]').forEach(function (botao) {
        botao.setAttribute('aria-pressed', botao.getAttribute('data-filtro-dia') === chave ? 'true' : 'false');
      });
    }

    document.addEventListener('click', function (evento) {
      var botaoDia = evento.target.closest('[data-filtro-dia]');
      var diaCel = evento.target.closest('.cal-dia[data-dia]');
      if (!botaoDia && !diaCel) return;
      // Cliques em links/botões (exceto o próprio botão de filtro) mantêm o comportamento deles
      var alvo = evento.target.closest('a, button, input, select, textarea');
      if (alvo && !botaoDia) return;
      var celula = diaCel || (botaoDia && botaoDia.closest('.cal-dia[data-dia]'));
      if (!celula) return;
      if (Number(celula.getAttribute('data-eventos') || 0) === 0) return;
      var chave = celula.getAttribute('data-dia');
      aplicarFiltro(selecionado === chave ? null : chave);
      if (selecionado && painelLista) {
        painelLista.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    if (filtroLimpar) {
      filtroLimpar.addEventListener('click', function () {
        aplicarFiltro(null);
      });
    }
  })();
})();
