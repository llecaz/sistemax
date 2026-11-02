/**
 * Player lo-fi da página de calendário.
 * Gera uma ambientação suave (acordes, baixo e chuva) com Web Audio,
 * sem depender de arquivos de áudio externos.
 */
(function () {
  var botao = document.getElementById('lofi-play');
  var caixa = document.getElementById('lofi-player');
  var status = document.getElementById('lofi-player-status');
  if (!botao || !caixa || !status) return;

  var ctx = null;
  var master = null;
  var ruidoGain = null;
  var timer = null;
  var ativo = false;
  var passo = 0;

  var acordes = [
    [220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66],
    [174.61, 220.0, 261.63],
    [196.0, 246.94, 329.63],
  ];
  var melodia = [523.25, 587.33, 659.25, 783.99, 880.0];

  function preparar() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      botao.disabled = true;
      status.textContent = 'áudio indisponível';
      return false;
    }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);

    var buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < dados.length; i++) dados[i] = (Math.random() * 2 - 1) * 0.3;
    var ruido = ctx.createBufferSource();
    ruido.buffer = buffer;
    ruido.loop = true;

    var filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 820;

    ruidoGain = ctx.createGain();
    ruidoGain.gain.value = 0;
    ruido.connect(filtro);
    filtro.connect(ruidoGain);
    ruidoGain.connect(master);
    ruido.start();
    return true;
  }

  function nota(freq, quando, duracao, tipo, volume) {
    var osc = ctx.createOscillator();
    var ganho = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    ganho.gain.setValueAtTime(0, quando);
    ganho.gain.linearRampToValueAtTime(volume, quando + 0.4);
    ganho.gain.linearRampToValueAtTime(0, quando + duracao);
    osc.connect(ganho);
    ganho.connect(master);
    osc.start(quando);
    osc.stop(quando + duracao + 0.05);
  }

  function tocarAcorde() {
    if (!ctx) return;
    var agora = ctx.currentTime + 0.05;
    var acorde = acordes[passo % acordes.length];
    for (var i = 0; i < acorde.length; i++) {
      nota(acorde[i], agora, 3.9, 'triangle', 0.05 - i * 0.009);
    }
    nota(acorde[0] / 2, agora, 4.2, 'sine', 0.06);
    if (passo % 2 === 0) {
      var escolha = melodia[Math.floor(Math.random() * melodia.length)];
      nota(escolha, agora + 1.3, 1.7, 'triangle', 0.03);
    }
    passo++;
  }

  function tocar() {
    if (!preparar()) return;
    if (ctx.state === 'suspended') ctx.resume();
    ativo = true;
    caixa.classList.add('tocando');
    botao.textContent = '❚❚';
    botao.setAttribute('aria-pressed', 'true');
    botao.setAttribute('aria-label', 'Pausar música lo-fi');
    status.textContent = 'tocando · chuva & lofi';
    if (ruidoGain) {
      ruidoGain.gain.cancelScheduledValues(ctx.currentTime);
      ruidoGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.5);
    }
    tocarAcorde();
    timer = setInterval(tocarAcorde, 4000);
  }

  function parar() {
    ativo = false;
    if (timer) clearInterval(timer);
    timer = null;
    caixa.classList.remove('tocando');
    botao.textContent = '▶';
    botao.setAttribute('aria-pressed', 'false');
    botao.setAttribute('aria-label', 'Tocar música lo-fi');
    status.textContent = 'pausado · clique para voltar';
    if (ctx && ruidoGain) {
      ruidoGain.gain.cancelScheduledValues(ctx.currentTime);
      ruidoGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }
  }

  botao.addEventListener('click', function () {
    if (ativo) parar();
    else tocar();
  });
})();
