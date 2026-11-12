/** Rotas do aluno: matérias, trabalhos com abas e envio de arquivos. */
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { um, todos, query, PRODUCAO } = require('../db');
const { exigePerfil } = require('../auth');
const { nomeArquivoUnico, gerarCodigoAcesso, normalizarCodigoAcesso } = require('../util');
const { abasDe, ROTULOS_ABA } = require('../regras');
const { paginaMateria, paginaTrabalho } = require('../paginas/aluno');
const { paginaInicioAluno, paginaNotificacoes } = require('../paginas/inicio');
const { paginaCalendario } = require('../paginas/calendario');
const { pagina } = require('../paginas/layout');
const { alunoSemTurma } = require('../paginas/alunoSemTurma');
const { enviarCodigoTurma } = require('../email');
const { enviarLinkConfirmacao } = require('../emailVerificacao');
const IC = require('../icones');

const router = express.Router();
router.use(exigePerfil('aluno'));

const PASTA = path.join(__dirname, '..', '..', 'uploads', 'entregas');
fs.mkdirSync(PASTA, { recursive: true });

const EXTENSOES = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'];

/**
 * Valida um link de entrega (Drive, site, Docs...).
 * Só aceita http/https com host com ponto; rejeita javascript:, data: etc.
 */
function linkValido(valor) {
  try {
    const u = new URL(String(valor).trim());
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.') || u.hostname.endsWith('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

// O conteúdo é guardado no banco (BYTEA). Isso mantém os arquivos
// persistentes na Vercel, onde o disco da função é temporário.
// A Vercel limita o corpo da requisição a ~4,5 MB; em produção usamos 4 MB.
const LIMITE_MB = Number(process.env.LIMITE_ENTREGA_MB) || (PRODUCAO ? 4 : 15);

const enviarArquivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!EXTENSOES.includes(ext)) {
      return cb(new Error('Tipo de arquivo não permitido.'));
    }
    cb(null, true);
  },
});

function flash(req, tipo, texto) {
  req.session.flash = [{ tipo, texto }];
}

/** Início: grade de matérias da turma do aluno. */
router.get('/', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario.turma_id) {
      const fresco = await um(
        `SELECT email_verificado, turma_pretendida_id FROM usuarios WHERE id = $1`,
        [usuario.id]
      );
      const turmas = await todos(`SELECT id, nome FROM turmas WHERE ativa ORDER BY ano_letivo, nome`);
      return res.send(
        pagina({
          titulo: 'Entrar em uma turma',
          usuario,
          req,
          ativa: 'inicio',
          corpo: alunoSemTurma({
            usuario: { ...usuario, ...fresco },
            turmas,
            emailVerificado: Boolean(fresco && fresco.email_verificado),
          }),
        })
      );
    }

    const [materias, atividades] = await Promise.all([
      todos(
        `SELECT td.id AS vinculo_id, d.nome AS materia,
                COALESCE(p.nome, '') AS professor,
                (SELECT count(*) FROM atividades a WHERE a.vinculo_id = td.id AND a.ativa AND a.tipo = 'trabalho') AS total_trabalhos,
                (SELECT count(*) FROM atividades a
                   JOIN entregas e ON e.atividade_id = a.id
                  WHERE a.vinculo_id = td.id AND a.ativa AND a.tipo = 'trabalho' AND e.aluno_id = $2) AS entregues,
                (SELECT count(*) FROM atividades a
                   JOIN entregas e ON e.atividade_id = a.id
                  WHERE a.vinculo_id = td.id AND e.aluno_id = $2 AND e.nota IS NULL) AS aguardando,
                (SELECT round(avg(e.nota)::numeric, 1) FROM atividades a
                   JOIN entregas e ON e.atividade_id = a.id
                  WHERE a.vinculo_id = td.id AND e.aluno_id = $2 AND e.nota IS NOT NULL) AS media
           FROM turma_disciplina td
           JOIN disciplinas d ON d.id = td.disciplina_id
           LEFT JOIN usuarios p ON p.id = td.professor_id
          WHERE td.turma_id = $1
          ORDER BY d.nome`,
        [usuario.turma_id, usuario.id]
      ),
      todos(
        `SELECT a.id, a.titulo, a.descricao, a.prazo, a.tipo, td.id AS vinculo_id,
                d.nome AS materia,
                e.id AS entrega_id, e.enviado_em, e.nota
           FROM atividades a
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
           LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
          WHERE td.turma_id = $1 AND a.ativa
          ORDER BY (a.prazo IS NULL), a.prazo`,
        [usuario.turma_id, usuario.id]
      ),
    ]);

    const aba = ['todas', 'afazer', 'entregues', 'corrigidas'].includes(req.query.aba)
      ? req.query.aba
      : 'todas';
    const busca = String(req.query.q || '').trim();
    const agora = new Date();
    const ano = Number(req.query.ano) || agora.getFullYear();
    const mes = Math.min(11, Math.max(0, (Number(req.query.mes) || agora.getMonth() + 1) - 1));

    res.send(
      pagina({
        titulo: 'Início',
        usuario,
        req,
        ativa: 'inicio',
        corpo: paginaInicioAluno({
          usuario,
          materias,
          atividades,
          eventos: atividades,
          aba,
          busca,
          ano,
          mes,
        }),
      })
    );
  } catch (erro) {
    console.error('[aluno/home]', erro);
    flash(req, 'erro', 'Não foi possível carregar suas matérias.');
    res.redirect('/');
  }
});

/** Reenviar o e-mail de confirmação (no máximo um envio por minuto). */
router.post('/reenviar-confirmacao', async (req, res) => {
  try {
    const usuario = await um(
      `SELECT id, nome, email, email_verificado FROM usuarios WHERE id = $1`,
      [req.session.usuario.id]
    );
    if (!usuario) return res.redirect('/aluno');
    if (usuario.email_verificado) {
      flash(req, 'ok', 'Seu e-mail já está confirmado.');
      return res.redirect('/aluno');
    }
    const recente = await um(
      `SELECT 1 FROM verificacao_email WHERE usuario_id = $1 AND criado_em > now() - interval '60 seconds'`,
      [usuario.id]
    );
    if (recente) {
      flash(req, 'erro', 'Aguarde um minuto antes de pedir outro e-mail.');
      return res.redirect('/aluno');
    }
    const envio = await enviarLinkConfirmacao(req, usuario);
    if (envio.modo === 'nao-configurado') {
      flash(req, 'erro', 'Não foi possível enviar o e-mail — o servidor não tem SMTP configurado. Copie o link no console do servidor.');
    } else if (envio.modo === 'console' && envio.link) {
      flash(req, 'ok', `Desenvolvimento (sem SMTP): clique para confirmar — ${envio.link}`);
    } else {
      flash(req, 'ok', 'E-mail de confirmação reenviado. Confira sua caixa de entrada (e o spam).');
    }
  } catch (erro) {
    console.error('[reenviar-confirmacao]', erro);
    flash(req, 'erro', 'Não foi possível reenviar agora. Tente novamente.');
  }
  res.redirect('/aluno');
});

/** Pedir o código de acesso à turma (só com e-mail confirmado; uso único, 7 dias). */
router.post('/solicitar-codigo-turma', async (req, res) => {
  try {
    const sessao = req.session.usuario;
    const usuario = await um(
      `SELECT id, nome, email, turma_id, turma_pretendida_id, email_verificado
         FROM usuarios WHERE id = $1`,
      [sessao.id]
    );
    if (!usuario) return res.redirect('/aluno');
    if (usuario.turma_id) {
      flash(req, 'ok', 'Você já está em uma turma.');
      return res.redirect('/aluno');
    }
    if (!usuario.email_verificado) {
      flash(req, 'erro', 'Confirme seu e-mail institucional antes de pedir o código.');
      return res.redirect('/aluno');
    }

    const escolha = Number(req.body.turma || 0) || usuario.turma_pretendida_id || null;
    const turma = escolha
      ? await um(`SELECT id, nome FROM turmas WHERE id = $1 AND ativa`, [escolha])
      : null;
    if (!turma) {
      flash(req, 'erro', 'Escolha uma turma válida.');
      return res.redirect('/aluno');
    }
    if (usuario.turma_pretendida_id !== turma.id) {
      await query(`UPDATE usuarios SET turma_pretendida_id = $1 WHERE id = $2`, [turma.id, usuario.id]);
    }

    // Limite anti-abuso: um pedido a cada 5 minutos.
    const recente = await um(
      `SELECT 1 FROM codigos_turma_acesso WHERE aluno_id = $1 AND criado_em > now() - interval '5 minutes'`,
      [usuario.id]
    );
    if (recente) {
      flash(req, 'erro', 'Aguarde alguns minutos antes de pedir outro código.');
      return res.redirect('/aluno');
    }

    // Código único de 8 caracteres, uso único, válido por 7 dias.
    let codigo = null;
    for (let tentativa = 0; tentativa < 5 && !codigo; tentativa += 1) {
      const candidato = gerarCodigoAcesso();
      try {
        await query(
          `INSERT INTO codigos_turma_acesso (aluno_id, turma_id, codigo, expira_em)
           VALUES ($1, $2, $3, now() + interval '7 days')`,
          [usuario.id, turma.id, candidato]
        );
        codigo = candidato;
      } catch (erro) {
        if (!erro || erro.code !== '23505') throw erro; // conflito de único → tenta outro
      }
    }
    if (!codigo) throw new Error('Não foi possível gerar um código único.');

    const envio = await enviarCodigoTurma({
      para: usuario.email,
      nome: usuario.nome,
      turma: turma.nome,
      codigo,
      validadeDias: 7,
    });
    if (envio.modo === 'nao-configurado') {
      flash(req, 'erro', `O código de acesso a ${turma.nome} foi gerado e está no console do servidor (SMTP não configurado). Avise o administrador.`);
    } else if (envio.modo === 'console' && envio.codigo) {
      flash(req, 'ok', `Desenvolvimento (sem SMTP): seu código de acesso a ${turma.nome} é ${envio.codigo}`);
    } else {
      flash(req, 'ok', `Enviamos o código de acesso à turma ${turma.nome} para ${usuario.email}.`);
    }
  } catch (erro) {
    console.error('[solicitar-codigo]', erro);
    flash(req, 'erro', 'Não foi possível enviar o código agora. Tente novamente.');
  }
  res.redirect('/aluno');
});

/** Entrar na turma com o código recebido por e-mail (validado no servidor). */
router.post('/entrar-turma', async (req, res) => {
  try {
    const sessao = req.session.usuario;
    const usuario = await um(`SELECT id, turma_id FROM usuarios WHERE id = $1`, [sessao.id]);
    if (!usuario) return res.redirect('/aluno');
    if (usuario.turma_id) {
      flash(req, 'ok', 'Você já está em uma turma.');
      return res.redirect('/aluno');
    }
    const codigo = normalizarCodigoAcesso(req.body.codigo);
    if (!codigo) {
      flash(req, 'erro', 'Digite o código de acesso.');
      return res.redirect('/aluno');
    }
    const registro = await um(
      `SELECT c.id, c.turma_id, t.nome AS turma_nome
         FROM codigos_turma_acesso c
         JOIN turmas t ON t.id = c.turma_id
        WHERE c.codigo = $1
          AND c.aluno_id = $2
          AND c.usado_em IS NULL
          AND c.expira_em > now()`,
      [codigo, usuario.id]
    );
    if (!registro) {
      flash(req, 'erro', 'Código inválido ou expirado. Confira o e-mail ou peça um novo.');
      return res.redirect('/aluno');
    }
    await query(`UPDATE codigos_turma_acesso SET usado_em = now() WHERE id = $1`, [registro.id]);
    await query(
      `UPDATE usuarios SET turma_id = $1, turma_pretendida_id = NULL WHERE id = $2`,
      [registro.turma_id, usuario.id]
    );
    req.session.usuario.turma_id = registro.turma_id;
    req.session.usuario.turma_nome = registro.turma_nome;
    flash(req, 'ok', `Bem-vindo à turma ${registro.turma_nome}! Suas matérias já estão liberadas.`);
  } catch (erro) {
    console.error('[entrar-turma]', erro);
    flash(req, 'erro', 'Não foi possível entrar na turma agora. Tente novamente.');
  }
  res.redirect('/aluno');
});

/** Notificações: prazos, entregas e correções do aluno. */
router.get('/notificacoes', async (req, res) => {
  try {
    const usuario = req.session.usuario;

    if (!usuario.turma_id) {
      return res.send(
        pagina({
          titulo: 'Notificações',
          usuario,
          req,
          ativa: 'notificacoes',
          corpo: paginaNotificacoes({ usuario, perfil: 'aluno' }),
        })
      );
    }

    const atividades = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.tipo, td.id AS vinculo_id,
              d.nome AS materia,
              e.id AS entrega_id, e.enviado_em, e.nota
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE td.turma_id = $1 AND a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo`,
      [usuario.turma_id, usuario.id]
    );

    res.send(
      pagina({
        titulo: 'Notificações',
        usuario,
        req,
        ativa: 'notificacoes',
        corpo: paginaNotificacoes({ usuario, atividades, perfil: 'aluno' }),
      })
    );
  } catch (erro) {
    console.error('[aluno/notificacoes]', erro);
    flash(req, 'erro', 'Não foi possível carregar suas notificações.');
    res.redirect('/aluno');
  }
});

/** Calendário escolar do aluno: prazos de trabalhos e avaliações. */
router.get('/calendario', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const agora = new Date();
    const ano = Number(req.query.ano) || agora.getFullYear();
    const mes = Math.min(11, Math.max(0, (Number(req.query.mes) || agora.getMonth() + 1) - 1));

    if (!usuario.turma_id) {
      return res.send(
        pagina({
          titulo: 'Calendário do mês',
          usuario,
          req,
          ativa: 'calendario',
          corpo: `<div class="vazio"><div class="vazio-icone">${IC.agenda}</div>
            <h3>Sem turma definida</h3>
            <p>Fale com a secretaria para entrar em uma turma.</p></div>`,
        })
      );
    }

    // Todos os trabalhos e avaliações da turma (com situação da entrega do aluno)
    const eventos = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.tipo, td.id AS vinculo_id,
              d.nome AS materia,
              e.id AS entrega_id, e.enviado_em, e.nota
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE td.turma_id = $1 AND a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo`,
      [usuario.turma_id, usuario.id]
    );

    res.send(
      pagina({
        titulo: 'Calendário do mês',
        usuario,
        req,
        ativa: 'calendario',
        corpo: paginaCalendario({ usuario, eventos, ano, mes, professor: false, tema: usuario.tema, lofi: usuario.lofi }),
      })
    );
  } catch (erro) {
    console.error('[aluno/calendario]', erro);
    flash(req, 'erro', 'Não foi possível carregar o calendário.');
    res.redirect('/aluno');
  }
});

/** Trabalhos da matéria, com abas de filtro. */
router.get('/materia/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const vinculoId = Number(req.params.id);
    const aba = ROTULOS_ABA[req.query.aba] ? req.query.aba : 'todos';

    const materia = await um(
      `SELECT td.id AS vinculo_id, d.nome AS materia, t.nome AS turma, COALESCE(p.nome,'') AS professor
         FROM turma_disciplina td
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t      ON t.id = td.turma_id
         LEFT JOIN usuarios p ON p.id = td.professor_id
        WHERE td.id = $1 AND td.turma_id = $2`,
      [vinculoId, usuario.turma_id]
    );
    if (!materia) {
      flash(req, 'erro', 'Matéria não encontrada na sua turma.');
      return res.redirect('/aluno');
    }

    const atividades = await todos(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em, a.tipo,
              $3::int AS vinculo_id, $4::text AS materia,
              COALESCE(p.nome,'') AS professor,
              e.id AS entrega_id, e.enviado_em, e.nota, e.observacao,
              e.arquivo_nome, e.arquivo_tamanho, e.corrigido_em, e.link, e.metodo
         FROM atividades a
         LEFT JOIN usuarios p ON p.id = a.professor_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE a.vinculo_id = $1 AND a.ativa
        ORDER BY (a.prazo IS NULL), a.prazo, a.criado_em DESC`,
      [vinculoId, usuario.id, vinculoId, materia.materia]
    );

    res.send(
      pagina({
        titulo: materia.materia,
        usuario,
        req,
        ativa: 'inicio',
        corpo: paginaMateria({ usuario, materia, atividades, aba }),
      })
    );
  } catch (erro) {
    console.error('[aluno/materia]', erro);
    flash(req, 'erro', 'Não foi possível abrir esta matéria.');
    res.redirect('/aluno');
  }
});

/** Detalhe de um trabalho. */
router.get('/trabalho/:id', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const atividade = await um(
      `SELECT a.id, a.titulo, a.descricao, a.prazo, a.criado_em, td.id AS vinculo_id,
              d.nome AS materia, t.nome AS turma, COALESCE(p.nome,'') AS professor,
              e.id AS entrega_id, e.enviado_em, e.nota, e.observacao,
              e.arquivo_nome, e.arquivo_tamanho, e.corrigido_em, e.link, e.metodo
         FROM atividades a
         JOIN turma_disciplina td ON td.id = a.vinculo_id
         JOIN disciplinas d ON d.id = td.disciplina_id
         JOIN turmas t ON t.id = td.turma_id
         LEFT JOIN usuarios p ON p.id = a.professor_id
         LEFT JOIN entregas e ON e.atividade_id = a.id AND e.aluno_id = $2
        WHERE a.id = $1 AND td.turma_id = $3 AND a.ativa`,
      [Number(req.params.id), usuario.id, usuario.turma_id]
    );
    if (!atividade) {
      flash(req, 'erro', 'Trabalho não encontrado.');
      return res.redirect('/aluno');
    }
    res.send(
      pagina({ titulo: atividade.titulo, usuario, req, ativa: 'inicio', corpo: paginaTrabalho({ usuario, a: atividade }) })
    );
  } catch (erro) {
    console.error('[aluno/trabalho]', erro);
    flash(req, 'erro', 'Não foi possível abrir o trabalho.');
    res.redirect('/aluno');
  }
});

/** Envio (ou reenvio) de trabalho: arquivo OU link (Drive, site, Docs...). */
router.post('/entregar/:id', (req, res) => {
  enviarArquivo.single('arquivo')(req, res, async (erro) => {
    const usuario = req.session.usuario;
    try {
      if (erro) {
        const texto =
          erro.code === 'LIMIT_FILE_SIZE'
            ? `Arquivo muito grande: o limite é ${LIMITE_MB} MB.`
            : erro.message || 'Não foi possível enviar o arquivo.';
        flash(req, 'erro', texto);
        return res.redirect('/aluno');
      }

      const atividadeId = Number(req.params.id);
      const atividade = await um(
        `SELECT a.id, a.ativa, td.turma_id, td.id AS vinculo_id, d.nome AS materia
           FROM atividades a
           JOIN turma_disciplina td ON td.id = a.vinculo_id
           JOIN disciplinas d ON d.id = td.disciplina_id
          WHERE a.id = $1`,
        [atividadeId]
      );

      // Decide o método: link/drive vêm no corpo, senão exige arquivo
      const bruto = req.body && req.body.metodo;
      const metodo = bruto === 'link' || bruto === 'drive' ? bruto : 'arquivo';
      let link = null;
      if (metodo !== 'arquivo') {
        link = linkValido(req.body && req.body.link);
        if (!link) {
          flash(req, 'erro', 'Link inválido. Use um endereço começando com http:// ou https://.');
          return res.redirect(`/aluno/trabalho/${atividadeId}`);
        }
      }

      if (!atividade || !atividade.ativa || atividade.turma_id !== usuario.turma_id || (metodo === 'arquivo' && !req.file)) {
        flash(req, 'erro', 'Não foi possível entregar o trabalho.');
        return res.redirect('/aluno');
      }

      const existente = await um(
        `SELECT id, nota, arquivo FROM entregas WHERE atividade_id = $1 AND aluno_id = $2`,
        [atividadeId, usuario.id]
      );
      if (existente && existente.nota !== null && existente.nota !== undefined) {
        flash(req, 'erro', 'Este trabalho já foi corrigido pelo professor. Fale com ele para solicitar reavaliação.');
        return res.redirect(`/aluno/trabalho/${atividadeId}`);
      }

      if (metodo !== 'arquivo') {
        await query(
          `INSERT INTO entregas (atividade_id, aluno_id, metodo, link, arquivo_nome, arquivo, arquivo_tipo, arquivo_tamanho, arquivo_dados)
           VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NULL)
           ON CONFLICT (atividade_id, aluno_id) DO UPDATE SET
             metodo = EXCLUDED.metodo,
             link = EXCLUDED.link,
             arquivo_nome = NULL,
             arquivo = NULL,
             arquivo_tipo = NULL,
             arquivo_tamanho = NULL,
             arquivo_dados = NULL,
             enviado_em = now()`,
          [atividadeId, usuario.id, metodo, link]
        );
        // Ao trocar de arquivo para link, remove o arquivo antigo do disco
        if (existente && existente.arquivo) {
          fs.unlink(path.join(PASTA, existente.arquivo), () => {});
        }
        flash(req, 'ok', existente ? 'Trabalho reenviado com sucesso!' : 'Trabalho entregue com sucesso!');
        return res.redirect(`/aluno/materia/${atividade.vinculo_id}?aba=todos`);
      }

      const nomeGuardado = nomeArquivoUnico(
        path.extname(req.file.originalname || '').toLowerCase() || '.pdf'
      );

      await query(
        `INSERT INTO entregas (atividade_id, aluno_id, metodo, link, arquivo_nome, arquivo, arquivo_tipo, arquivo_tamanho, arquivo_dados)
         VALUES ($1, $2, 'arquivo', NULL, $3, $4, $5, $6, $7)
         ON CONFLICT (atividade_id, aluno_id) DO UPDATE SET
           metodo = 'arquivo',
           link = NULL,
           arquivo_nome = EXCLUDED.arquivo_nome,
           arquivo = EXCLUDED.arquivo,
           arquivo_tipo = EXCLUDED.arquivo_tipo,
           arquivo_tamanho = EXCLUDED.arquivo_tamanho,
           arquivo_dados = EXCLUDED.arquivo_dados,
           enviado_em = now()`,
        [
          atividadeId,
          usuario.id,
          req.file.originalname,
          nomeGuardado,
          req.file.mimetype,
          req.file.size,
          req.file.buffer,
        ]
      );

      // Apaga o arquivo anterior (se houver reenvio)
      if (existente && existente.arquivo) {
        fs.unlink(path.join(PASTA, existente.arquivo), () => {});
      }

      flash(req, 'ok', existente ? 'Trabalho reenviado com sucesso!' : 'Trabalho entregue com sucesso!');
      res.redirect(`/aluno/materia/${atividade.vinculo_id}?aba=todos`);
    } catch (e) {
      console.error('[aluno/entregar]', e);
      flash(req, 'erro', 'Falha ao enviar o trabalho. Tente novamente.');
      res.redirect('/aluno');
    }
  });
});

module.exports = router;
