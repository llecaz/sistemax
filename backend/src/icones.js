/**
 * Ícones em linha do Nuvia (stroke, mesmo traço do site).
 * Substituem emojis por SVGs mono/monocromáticos proporcionais.
 * Uso: `${IC.x}` dentro de spans com tamanho definido pelo CSS.
 */
const tamanho = (w, h) => `width="${w || 24}" height="${h || 24}"`;
const svg = (conteudo, t) =>
  `<svg viewBox="0 0 24 24" ${t ? tamanho(t, t) : 'width="24" height="24"'} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`;

const IC = {
  livro: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>'),
  agenda: svg('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
  agendaMarcada: svg('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9.5 15 2 2 3.5-4"/>'),
  tarefa: svg('<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m8.5 12.5 2.5 2.5 5-5.5"/>'),
  usuarios: svg('<circle cx="9" cy="8" r="3.4"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3.4 3.4 0 0 1 0 5.6"/><path d="M18.5 14.6a5.5 5.5 0 0 1 2.5 5.4"/>'),
  broto: svg('<path d="M12 21v-8"/><path d="M12 13c0-3.5-3-5.5-7-5.5 0 4.5 3 6.5 7 5.5z"/><path d="M12 13c0-4 3-6.5 8-6.5 0 5-3 7-8 6.5z"/>'),
  lua: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
  link: svg('<path d="M10 14a5 5 0 0 0 7.1 0l3.5-3.5a5 5 0 0 0-7.1-7.1l-2 2"/><path d="M14 10a5 5 0 0 0-7.1 0l-3.5 3.5a5 5 0 0 0 7.1 7.1l2-2"/>'),
  canetaDocumento: svg('<path d="M7 3h7l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/><path d="M9.5 14.5 15 9l1.5 1.5-5.5 5.5H9.5z"/>'),
  coracao: svg('<path d="M12 20s-7-4.6-9.3-9.3A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 21.3 10.7C19 15.4 12 20 12 20z"/>'),
  presente: svg('<rect x="3" y="8" width="18" height="4"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8c-1.2-2-4.3-2.4-4.3 0 0 1.5 2 1.7 4.3 0zM12 8c1.2-2 4.3-2.4 4.3 0 0 1.5-2 1.7-4.3 0z"/>'),
  estrela: svg('<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L4.3 9.4l6-.9z"/>'),
  confete: svg('<g stroke-width="1.7"><path d="M5 12h4M7 8v3M3.5 15.5 6 17M17.5 15.5 15 17M19 12h-4M12 16v5M9 19h6"/></g><path d="m9 4 3 6 3-6"/><path d="m10 1 1.4 2M15 1.5l-1 2.3"/>'),
};
module.exports = IC;
