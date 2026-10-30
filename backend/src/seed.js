/**
 * Dados de exemplo (seed) para testar o sistema na primeira execução.
 * Só roda quando o banco está vazio.
 */
const fs = require('fs');
const path = require('path');
const { query } = require('./db');
const { hash } = require('./auth');
const { gerarCodigoTurma, nomeArquivoUnico } = require('./util');

const PASTA_ENTREGAS = path.join(__dirname, '..', 'uploads', 'entregas');

/** Gera um PDF mínimo válido (para as entregas de exemplo). */
function pdfExemplo(texto) {
  const conteudo = `BT /F1 22 Tf 60 720 Td (${texto.replace(/[()\\]/g, '')}) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((corpo, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
  });
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function salvarExemplo(titulo) {
  fs.mkdirSync(PASTA_ENTREGAS, { recursive: true });
  const nome = nomeArquivoUnico('.pdf');
  fs.writeFileSync(path.join(PASTA_ENTREGAS, nome), pdfExemplo(titulo));
  return { nome, tamanho: fs.statSync(path.join(PASTA_ENTREGAS, nome)).size };
}

async function semear() {
  const dias = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  // ---- Admin ----
  await query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['Administrador da Escola', 'admin@escola.com', hash('admin123')]
  );

  // ---- Turmas ----
  const turmas = {};
  for (const nome of ['9º Ano A', '1º Ano B']) {
    const r = await query(
      `INSERT INTO turmas (nome, codigo, ativa) VALUES ($1, $2, TRUE)
       ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id, nome, codigo`,
      [nome, gerarCodigoTurma(nome)]
    );
    turmas[nome] = r.rows[0];
  }

  // ---- Disciplinas ----
  const disciplinas = {};
  for (const nome of ['Matemática', 'Português', 'História', 'Ciências', 'Inglês']) {
    const r = await query(
      `INSERT INTO disciplinas (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id`,
      [nome]
    );
    disciplinas[nome] = r.rows[0];
  }

  // ---- Professores ----
  const professores = {};
  for (const p of [
    ['Maria Silva', 'maria@escola.com'],
    ['João Souza', 'joao@escola.com'],
  ]) {
    const r = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, tipo, pergunta_seg, resposta_seg)
       VALUES ($1, $2, $3, 'professor', $4, $5)
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
       RETURNING id`,
      [p[0], p[1], hash('prof123'), 'Qual o nome do seu primeiro professor?', hash('escola')]
    );
    professores[p[0]] = r.rows[0];
  }

  // ---- Aluno de teste ----
  const aluno = await query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo, matricula, turma_id, pergunta_seg, resposta_seg)
     VALUES ('Ana Pereira', 'ana@escola.com', $1, 'aluno', '2026001', $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, turma_id = EXCLUDED.turma_id
     RETURNING id`,
    [hash('aluno123'), turmas['9º Ano A'].id, 'Qual o nome da sua cidade?', hash('curitiba')]
  );

  // ---- Vínculos turma ↔ matéria ↔ professor ----
  const vinculos = {};
  const plano = [
    ['9º Ano A', 'Matemática', 'Maria Silva'],
    ['9º Ano A', 'Ciências', 'Maria Silva'],
    ['9º Ano A', 'Português', 'João Souza'],
    ['9º Ano A', 'História', 'João Souza'],
    ['9º Ano A', 'Inglês', null],
    ['1º Ano B', 'Matemática', 'Maria Silva'],
    ['1º Ano B', 'Português', 'João Souza'],
  ];
  for (const [turma, disc, prof] of plano) {
    const r = await query(
      `INSERT INTO turma_disciplina (turma_id, disciplina_id, professor_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (turma_id, disciplina_id) DO UPDATE SET professor_id = EXCLUDED.professor_id
       RETURNING id`,
      [turmas[turma].id, disciplinas[disc].id, prof ? professores[prof].id : null]
    );
    vinculos[`${turma}|${disc}`] = r.rows[0];
  }

  // ---- Atividades de exemplo (cobrindo todas as abas do aluno) ----
  const atividades = [];
  const planoAtividades = [
    {
      chave: '9º Ano A|Matemática',
      titulo: 'Lista de Exercícios — Equações do 1º Grau',
      descricao: 'Resolver os exercícios 1 a 15 do caderno, mostrando todos os passos.',
      prazo: dias(7),
      entrega: { atraso: 0, nota: null, observacao: null },
      arq: 'Equacoes-1-grau-exemplo.pdf',
    },
    {
      chave: '9º Ano A|Português',
      titulo: 'Redação — O meu bairro',
      descricao: 'Texto dissertativo de até 20 linhas, com introdução, desenvolvimento e conclusão.',
      prazo: dias(-3),
      entrega: { atraso: 24 * 60 * 60 * 1000, nota: null, observacao: null }, // entregue 1 dia depois
      arq: 'Redacao-meu-bairro-exemplo.pdf',
    },
    {
      chave: '9º Ano A|História',
      titulo: 'Semana da Revolução de 1930',
      descricao: 'Pesquisa de até 3 páginas sobre as causas e consequências da Revolução de 1930.',
      prazo: dias(-10),
      entrega: { atraso: -2 * 24 * 60 * 60 * 1000, nota: '8.5', observacao: 'Muito boa pesquisa! Falta apenas citar as fontes das imagens.' },
      arq: 'Revolucao-1930-exemplo.pdf',
    },
    {
      chave: '9º Ano A|Matemática',
      titulo: 'Prova Bimestral de Matemática',
      descricao: 'Levar impresso. Permitido usar apenas calculadora simples.',
      prazo: dias(-1),
      entrega: null, // não entregue → aparece em Atrasados
      arq: null,
    },
  ];

  for (const a of planoAtividades) {
    const vinculo = vinculos[a.chave];
    if (!vinculo) continue;
    const r = await query(
      `INSERT INTO atividades (vinculo_id, professor_id, titulo, descricao, prazo)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [vinculo.id, professores['Maria Silva'].id, a.titulo, a.descricao, a.prazo]
    );
    // professor dono correto: usa o professor do vínculo
    const profDoVinculo = await query(`SELECT professor_id FROM turma_disciplina WHERE id = $1`, [vinculo.id]);
    if (profDoVinculo.rows[0].professor_id) {
      await query(`UPDATE atividades SET professor_id = $1 WHERE id = $2`, [
        profDoVinculo.rows[0].professor_id,
        r.rows[0].id,
      ]);
    }
    atividades.push({ id: r.rows[0].id, ...a });

    if (a.entrega) {
      const arq = salvarExemplo(a.arq);
      const enviadoEm = new Date(Date.now() + (a.entrega.atraso || 0));
      await query(
        `INSERT INTO entregas (atividade_id, aluno_id, arquivo_nome, arquivo, arquivo_tipo, arquivo_tamanho,
                               enviado_em, nota, observacao, corrigido_em)
         VALUES ($1, $2, $3, $4, 'application/pdf', $5, $6, $7, $8, $9)
         ON CONFLICT (atividade_id, aluno_id) DO NOTHING`,
        [
          r.rows[0].id,
          aluno.rows[0].id,
          a.arq,
          arq.nome,
          arq.tamanho,
          enviadoEm,
          a.entrega.nota,
          a.entrega.observacao || '',
          a.entrega.nota ? new Date() : null,
        ]
      );
    }
  }

  console.log('🌱 Dados de exemplo criados:');
  console.log('   Admin   → admin@escola.com   / admin123');
  console.log('   Aluno   → ana@escola.com     / aluno123  (9º Ano A)');
  console.log('   Prof.   → maria@escola.com   / prof123   (Matemática, Ciências)');
  console.log('   Prof.   → joao@escola.com    / prof123   (Português, História)');
  console.log('   Código da turma 9º Ano A:', turmas['9º Ano A'].codigo);
  console.log('   Código da turma 1º Ano B:', turmas['1º Ano B'].codigo);
}

module.exports = { semear };

if (require.main === module) {
  const { pool } = require('./db');
  semear()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('❌', e.message);
      process.exit(1);
    });
}
