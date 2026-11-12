/** Página "Modo foco": cronômetro grande estilo pixel art + trilha lo-fi. */
const { pagina } = require('./layout');

function paginaFoco({ usuario, req }) {
  return pagina({
    titulo: 'Modo foco',
    usuario,
    req,
    ativa: 'foco',
    corpo: `
    <div class="foco-app">
      <section class="foco-painel foco-painel--timer" aria-labelledby="foco-titulo">
        <span class="foco-selo">modo foco</span>
        <h1 id="foco-titulo" class="foco-titulo">Um passo de cada vez.</h1>

        <div class="foco-cronometro" role="timer" aria-label="Tempo restante do modo foco">
          <span class="foco-moldura"><span class="foco-tempo" data-foco-tempo>25:00</span></span>
        </div>
        <div class="foco-barra" aria-hidden="true"><i data-foco-barra></i></div>
        <p class="foco-ciclos"><span data-foco-ciclos>0</span> ciclo(s) concluído(s)</p>

        <div class="foco-controles">
          <button class="btn primario grande foco-btn-principal" type="button" data-foco-acao="alternar" data-foco-alternar aria-pressed="false">Começar</button>
          <button class="btn secundario" type="button" data-foco-acao="zerar">Zerar</button>
        </div>

        <div class="foco-adicionar" role="group" aria-label="Adicionar tempo ao cronômetro">
          <span class="foco-adicionar-rotulo">Adicionar</span>
          <button type="button" class="foco-add" data-foco-add="0:5">+5 min</button>
          <button type="button" class="foco-add" data-foco-add="0:15">+15 min</button>
          <button type="button" class="foco-add" data-foco-add="0:30">+30 min</button>
          <button type="button" class="foco-add" data-foco-add="1:0">+1 hora</button>
        </div>

        <form class="foco-duracao" id="foco-duracao-form" aria-label="Definir duração do ciclo">
          <label class="foco-duracao-campo">
            <input type="number" id="foco-horas" name="horas" min="0" max="999" inputmode="numeric" value="0" required>
            <span>horas</span>
          </label>
          <span class="foco-duracao-sep" aria-hidden="true">:</span>
          <label class="foco-duracao-campo">
            <input type="number" id="foco-minutos" name="minutos" min="0" max="59" inputmode="numeric" value="25" required>
            <span>minutos</span>
          </label>
          <button class="btn secundario" type="submit">Definir</button>
        </form>
        <p class="foco-dica">O cronômetro <strong>continua contando mesmo se você mudar de página</strong> — o mini-timer fica no canto inferior direito.</p>

        <div class="foco-concluido" data-foco-concluido hidden>
          <strong>Ciclo concluído!</strong>
          <span>Respire um pouquinho. Você merece.</span>
        </div>
      </section>

      <section class="foco-painel foco-painel--musica" aria-labelledby="foco-musica-titulo">
        <h2 id="foco-musica-titulo">Trilha sonora do foco</h2>

        <div class="foco-abas" role="tablist" aria-label="Fonte de música">
          <button class="foco-aba ativa" type="button" role="tab" aria-selected="true" data-musica-aba="local">Lo-fi local</button>
          <button class="foco-aba" type="button" role="tab" aria-selected="false" data-musica-aba="youtube">YouTube</button>
          <button class="foco-aba" type="button" role="tab" aria-selected="false" data-musica-aba="spotify">Spotify</button>
          <button class="foco-aba" type="button" role="tab" aria-selected="false" data-musica-aba="outro">Outro app</button>
        </div>

        <div class="foco-aba-painel" data-musica-painel="local" role="tabpanel">
          <div class="foco-local-topo">
            <span class="foco-pulso" aria-hidden="true"></span>
            <span class="foco-local-info">
              <strong data-musica-nome>Chuva no telhado</strong>
              <small data-musica-desc>Chuva suave + acordes lentos</small>
            </span>
            <span class="foco-local-status" data-musica-status>pausado</span>
          </div>
          <div class="foco-local-controles">
            <button class="foco-btn-circular" type="button" data-musica-alternar aria-pressed="false">▶ Tocar</button>
            <button class="foco-btn-redondo" type="button" data-musica-proxima aria-label="Próxima música">➜</button>
          </div>
          <ul class="foco-trilhas" aria-label="Trilhas geradas localmente">
            <li><button type="button" class="foco-trilha selecionada" data-trilha-indice="0" aria-pressed="true"><strong>Chuva no telhado</strong><small>Chuva suave + acordes lentos</small></button></li>
            <li><button type="button" class="foco-trilha" data-trilha-indice="1" aria-pressed="false"><strong>Madrugada no laboratório</strong><small>Pads calmos para estudar até tarde</small></button></li>
            <li><button type="button" class="foco-trilha" data-trilha-indice="2" aria-pressed="false"><strong>Café e pixel</strong><small>Lofi jazz de fim de tarde</small></button></li>
          </ul>
          <label class="foco-volume">Volume
            <input id="foco-volume" type="range" min="0" max="100" value="60" aria-label="Volume da trilha local">
          </label>
          <p class="foco-musica-nota">Trilhas geradas no seu navegador, offline — nada sai daqui, nenhuma conta necessária.</p>
        </div>

        <div class="foco-aba-painel" data-musica-painel="youtube" role="tabpanel" hidden>
          <label class="foco-url-label" for="foco-yt-url">Link de um vídeo, live ou playlist</label>
          <input id="foco-yt-url" class="foco-url-input" type="url" inputmode="url" autocomplete="off" placeholder="https://www.youtube.com/watch?v=...">
          <button class="btn primario" id="foco-yt-tocar" type="button">Tocar no YouTube</button>
          <div id="foco-yt-player" class="foco-yt-player" aria-live="polite"></div>
          <p class="foco-musica-nota" id="foco-yt-status">O player oficial do YouTube abre aqui — a reprodução respeita as regras da plataforma.</p>
        </div>

        <div class="foco-aba-painel" data-musica-painel="spotify" role="tabpanel" hidden>
          <label class="foco-url-label" for="foco-spotify-url">Link <code>open.spotify.com</code> (faixa, playlist, álbum...)</label>
          <input id="foco-spotify-url" class="foco-url-input" type="url" inputmode="url" autocomplete="off" placeholder="https://open.spotify.com/playlist/...">
          <button class="btn primario" id="foco-spotify-carregar" type="button">Carregar no Spotify</button>
          <div id="foco-spotify-player" class="foco-spotify-player" aria-live="polite"></div>
          <p class="foco-musica-nota" id="foco-spotify-status">Sem Premium: prévias de 30 segundos. Com Premium logado no navegador: reprodução completa.</p>
        </div>

        <div class="foco-aba-painel" data-musica-painel="outro" role="tabpanel" hidden>
          <label class="foco-url-label" for="foco-outro-url">Link de outro app (Deezer, Apple Music, SoundCloud, Tidal...)</label>
          <input id="foco-outro-url" class="foco-url-input" type="url" inputmode="url" autocomplete="off" placeholder="https://...">
          <button class="btn primario" id="foco-outro-abrir" type="button">Abrir no app</button>
          <p class="foco-musica-nota" id="foco-outro-status">Abre em nova aba — o cronômetro continua contando nesta página.</p>
        </div>
      </section>
    </div>`,
  });
}

module.exports = { paginaFoco };
