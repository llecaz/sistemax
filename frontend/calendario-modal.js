/**
 * Modal do dia — calendário.
 * Lê os eventos do mês embutidos no <script id="cal-eventos-json"> e abre uma
 * janela com o dia (dia da semana, data e hora), os detalhes de cada
 * avaliação (título, descrição, matéria, tipo, situação) e o link do trabalho.
 * Tudo é montado via DOM (sem injetar HTML do servidor de volta na página).
 */
(function () {
  'use strict';

  var dialog = document.getElementById('cal-dia-modal');
  var dadosEl = document.getElementById('cal-eventos-json');
  if (!dialog || !dadosEl) return;

  var eventos = [];
  try {
    eventos = JSON.parse(dadosEl.textContent || '[]') || [];
  } catch (erro) {
    console.error('[calendario-modal] JSON inválido', erro);
    eventos = [];
  }

  var porDia = {};
  eventos.forEach(function (ev) {
    if (ev && ev.chaveDia) (porDia[ev.chaveDia] = porDia[ev.chaveDia] || []).push(ev);
  });

  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var selo = document.getElementById('cal-modal-selo');
  var titulo = document.getElementById('cal-dia-modal-titulo');
  var contador = document.getElementById('cal-modal-contador');
  var lista = document.getElementById('cal-modal-eventos');
  var botaoFiltrar = document.getElementById('cal-modal-filtrar');
  var diaAtual = null;

  function criar(tag, texto, classe) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  function bloco(classe, texto) {
    return criar('p', texto, classe);
  }

  function renderEvento(ev) {
    var artigo = criar('article', null, 'cal-modal-evento cal-modal-evento--' + (ev.tipo || 'trabalho'));

    var topo = criar('div', null, 'cal-modal-evento-topo');
    var ponto = criar('span', null, 'ponto ' + (ev.tipo || 'trabalho'));
    ponto.setAttribute('aria-hidden', 'true');
    topo.appendChild(ponto);
    topo.appendChild(criar('strong', ev.titulo, 'cal-modal-evento-titulo'));
    topo.appendChild(criar('span', ev.tipoRotulo || 'Atividade', 'cal-etiqueta ' + (ev.tipo || 'trabalho')));

    artigo.appendChild(topo);

    var metaLinha = criar('div', null, 'cal-modal-evento-meta');
    var meta = [];
    if (ev.materia) meta.push(ev.materia);
    if (ev.turma) meta.push(ev.turma);
    if (ev.hora) meta.push('às ' + ev.hora);
    if (meta.length) metaLinha.appendChild(criar('small', meta.join(' · '), 'cal-modal-evento-sub'));
    artigo.appendChild(metaLinha);

    artigo.appendChild(bloco('cal-modal-descricao', ev.descricao || 'Sem descrição.'));

    var rodape = criar('div', null, 'cal-modal-evento-rodape');

    if (typeof ev.situacao === 'string' && ev.situacao) {
      rodape.appendChild(criar('span', ev.situacao, 'cal-modal-situacao cal-modal-situacao--' + (ev.entregou ? (ev.nota != null ? 'corrigida' : 'entregue') : ev.situacao === 'Atrasada' ? 'atrasada' : 'pendente')));
    } else if (typeof ev.alunosTurma === 'number' && ev.alunosTurma > 0) {
      var entregasTxt = ev.totalEntregas + ' de ' + ev.alunosTurma + ' alunos entregaram';
      if (typeof ev.corrigidas === 'number') entregasTxt += ' · ' + ev.corrigidas + ' corrigida' + (ev.corrigidas === 1 ? '' : 's');
      rodape.appendChild(criar('span', entregasTxt, 'cal-modal-situacao cal-modal-situacao--info'));
    } else if (typeof ev.totalEntregas === 'number') {
      rodape.appendChild(criar('span', ev.totalEntregas + ' entrega' + (ev.totalEntregas === 1 ? '' : 's') + ' até agora', 'cal-modal-situacao cal-modal-situacao--info'));
    }

    if (ev.href && ev.hrefRotulo) {
      var link = document.createElement('a');
      link.className = 'btn secundario cal-modal-link';
      link.href = ev.href;
      link.textContent = ev.hrefRotulo;
      rodape.appendChild(link);
    }

    artigo.appendChild(rodape);
    return artigo;
  }

  function abrir(chave) {
    var itens = porDia[chave] || [];
    var partes = String(chave).split('-');
    var data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    if (Number.isNaN(data.getTime())) return;

    diaAtual = chave;
    selo.textContent = DIAS[data.getDay()];
    titulo.textContent = data.getDate() + ' de ' + MESES[data.getMonth()] + ' de ' + data.getFullYear();
    contador.textContent = itens.length === 1 ? '1 atividade neste dia' : itens.length + ' atividades neste dia';

    lista.innerHTML = '';
    if (itens.length) {
      itens.forEach(function (ev) { lista.appendChild(renderEvento(ev)); });
    } else {
      lista.appendChild(bloco('cal-modal-vazio', 'Nenhuma atividade neste dia.'));
    }

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function fechar() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-abrir-dia]');
    if (!botao) return;
    evento.preventDefault();
    abrir(botao.getAttribute('data-abrir-dia'));
  });

  document.getElementById('cal-modal-fechar').addEventListener('click', fechar);
  document.getElementById('cal-modal-fechar-2').addEventListener('click', fechar);

  // Clique no backdrop fecha o diálogo
  dialog.addEventListener('click', function (evento) {
    if (evento.target === dialog) fechar();
  });

  if (botaoFiltrar) {
    botaoFiltrar.addEventListener('click', function () {
      var chave = diaAtual;
      fechar();
      if (chave && typeof window.NuviaCalendarFilterDay === 'function') {
        window.NuviaCalendarFilterDay(chave);
      }
      var listaEventos = document.getElementById('lista-eventos');
      if (listaEventos && typeof listaEventos.scrollIntoView === 'function') {
        listaEventos.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
})();
