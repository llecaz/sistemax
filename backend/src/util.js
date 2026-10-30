/** Utilidades gerais: escape de HTML, formatação, códigos e cores. */
const crypto = require('crypto');

/** Escapa texto para exibição segura no HTML (proteção contra XSS). */
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formata data ISO/Date para "dd/mm/aaaa". */
function dataBR(valor) {
  if (!valor) return '—';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** Formata data e hora para "dd/mm/aaaa às hh:mm". */
function dataHoraBR(valor) {
  if (!valor) return '—';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "2 horas" / "há 3 dias" / "agora" */
function decorrido(valor) {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seg < 60) return 'agora há pouco';
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `há ${dias} dia${dias > 1 ? 's' : ''}`;
  return `em ${dataBR(d)}`;
}

/** Valor de data/hora no formato aceito por <input type="datetime-local">. */
function paraInputDataHora(valor) {
  if (!valor) return '';
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Gera código de matrícula da turma, ex.: TURMA-9A-K7X2 */
function gerarCodigoTurma(nomeTurma) {
  const base = (nomeTurma || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 6);
  const sufixo = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `TURMA-${base || 'TURMA'}-${sufixo}`;
}

/** Nome aleatório (sem path) para arquivo salvo em disco. */
function nomeArquivoUnico(extensao) {
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensao}`;
}

/** Inicial do nome para o avatar (ex.: "Maria Silva" → "MS"). */
function iniciais(nome) {
  const partes = String(nome || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Cor fixa por índice (para avatar e faixa da matéria). */
const PALETA = [
  { claro: '#1e88e5', escuro: '#8ab4f8' },
  { claro: '#00897b', escuro: '#4dd0c0' },
  { claro: '#6a3ab2', escuro: '#b39ddb' },
  { claro: '#e8710a', escuro: '#ffb74d' },
  { claro: '#c62828', escuro: '#ef9a9a' },
  { claro: '#2e7d32', escuro: '#81c784' },
  { claro: '#0277bd', escuro: '#64b5f6' },
  { claro: '#ad1457', escuro: '#f06292' },
];

function corDe(chave) {
  const texto = String(chave || '');
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma += texto.charCodeAt(i);
  return PALETA[soma % PALETA.length];
}

/** Tamanho do arquivo legível: "1,2 MB". */
function tamanhoLegivel(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = {
  esc,
  dataBR,
  dataHoraBR,
  decorrido,
  paraInputDataHora,
  gerarCodigoTurma,
  nomeArquivoUnico,
  iniciais,
  corDe,
  tamanhoLegivel,
};
