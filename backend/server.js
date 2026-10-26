const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const conexao = require('./dbconfig');

const app = express();

app.use(cors());
app.use(express.json());

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const STATUS_PERMITIDOS = ['pendente', 'aceita', 'concluida', 'cancelada'];

function timeToMinutes(hora) {
  if (!hora) return 0;
  const [h, m] = String(hora).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normalizarDiaSemana(dia) {
  if (!dia) return '';

  const valor = String(dia).trim().toLowerCase();
  const mapa = {
    domingo: 'Domingo',
    'domingo-feira': 'Domingo',
    segunda: 'Segunda',
    'segunda-feira': 'Segunda',
    terca: 'Terça',
    'terca-feira': 'Terça',
    terça: 'Terça',
    'terça-feira': 'Terça',
    quarta: 'Quarta',
    'quarta-feira': 'Quarta',
    quinta: 'Quinta',
    'quinta-feira': 'Quinta',
    sexta: 'Sexta',
    'sexta-feira': 'Sexta',
    sabado: 'Sábado',
    sábado: 'Sábado',
  };

  return mapa[valor] || valor.charAt(0).toUpperCase() + valor.slice(1);
}

function horariosSeSobrepoem(inicioA, fimA, inicioB, fimB) {
  const inicioAMin = timeToMinutes(inicioA);
  const fimAMin = timeToMinutes(fimA);
  const inicioBMin = timeToMinutes(inicioB);
  const fimBMin = timeToMinutes(fimB);

  return inicioAMin < fimBMin && inicioBMin < fimAMin;
}

function obterDiaSemana(dataIso) {
  const data = new Date(`${dataIso}T12:00:00`);
  const dia = data.getDay();
  return DIAS_SEMANA[dia];
}

function normalizarHorario(hora) {
  if (!hora) return '';
  const texto = String(hora).trim();
  if (!texto.includes(':')) return texto;
  const [h, m] = texto.split(':');
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    conexao.query(sql, params, (erro, resultado) => {
      if (erro) {
        reject(erro);
        return;
      }
      resolve(resultado);
    });
  });
}

async function garantirEstruturaBanco() {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS disponibilidade_voluntario (
        id_disponibilidade INT AUTO_INCREMENT PRIMARY KEY,
        id_voluntario INT NOT NULL,
        dia_semana VARCHAR(20) NOT NULL,
        horario_inicio TIME NOT NULL,
        horario_fim TIME NOT NULL,
        ativo TINYINT(1) DEFAULT 1,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_disponibilidade_voluntario_usuario
          FOREIGN KEY (id_voluntario) REFERENCES usuarios(id_usuario)
          ON DELETE CASCADE
      )
    `);

    await queryAsync(`
      CREATE TABLE IF NOT EXISTS solicitacoes_ajuda (
        id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
        id_pcd INT NOT NULL,
        id_voluntario INT NOT NULL,
        id_disponibilidade INT NULL,
        tipo_ajuda VARCHAR(100) NOT NULL,
        descricao TEXT NULL,
        data_agendamento DATE NOT NULL,
        horario_inicio TIME NOT NULL,
        horario_fim TIME NOT NULL,
        status ENUM('pendente', 'aceita', 'concluida', 'cancelada') NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_solicitacao_pcd
          FOREIGN KEY (id_pcd) REFERENCES usuarios(id_usuario)
          ON DELETE CASCADE,
        CONSTRAINT fk_solicitacao_voluntario
          FOREIGN KEY (id_voluntario) REFERENCES usuarios(id_usuario)
          ON DELETE CASCADE,
        CONSTRAINT fk_solicitacao_disponibilidade
          FOREIGN KEY (id_disponibilidade) REFERENCES disponibilidade_voluntario(id_disponibilidade)
          ON DELETE SET NULL
      )
    `);

    const colunasUsuarios = await queryAsync('SHOW COLUMNS FROM usuarios');
    const temEspecialidade = colunasUsuarios.some((coluna) => coluna.Field === 'especialidade');

    if (!temEspecialidade) {
      await queryAsync('ALTER TABLE usuarios ADD COLUMN especialidade VARCHAR(100) DEFAULT "Atendimento geral"');
    }
  } catch (erro) {
    console.error('Erro ao preparar estrutura do banco:', erro);
  }
}

garantirEstruturaBanco();

async function validarVoluntarioEUsuario(idVoluntario, idPcd) {
  const voluntario = await queryAsync(
    'SELECT id_usuario, nome, tipo_usuario, especialidade FROM usuarios WHERE id_usuario = ?',
    [idVoluntario]
  );

  const pcd = await queryAsync(
    'SELECT id_usuario, nome, tipo_usuario FROM usuarios WHERE id_usuario = ?',
    [idPcd]
  );

  if (!voluntario.length) {
    throw new Error('Voluntário não encontrado');
  }

  if (!pcd.length) {
    throw new Error('Usuário solicitante não encontrado');
  }

  if (voluntario[0].tipo_usuario !== 'voluntario') {
    throw new Error('O usuário informado não é um voluntário');
  }

  if (pcd[0].tipo_usuario !== 'pcd') {
    throw new Error('O usuário informado não é uma pessoa com deficiência');
  }
}

function validarHorario(inicio, fim) {
  if (!inicio || !fim) {
    return 'Dia e horário são obrigatórios';
  }

  if (timeToMinutes(inicio) >= timeToMinutes(fim)) {
    return 'O horário final deve ser posterior ao inicial';
  }

  return null;
}

function extrairMensagemErro(erro, padrao = 'Erro inesperado') {
  if (erro && erro.message) {
    return erro.message;
  }
  return padrao;
}

app.post('/usuarios', async (req, res) => {
  const { nome, email, senha, cpf, numero, tipo_usuario, especialidade } = req.body;

  if (!nome || !email || !senha || !cpf || !numero || !tipo_usuario) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  if (!['pcd', 'voluntario'].includes(tipo_usuario)) {
    return res.status(400).json({ mensagem: 'Tipo de usuário inválido' });
  }

  const cpfLimpo = String(cpf || '').replace(/\D/g, '');
  const numeroLimpo = String(numero || '').replace(/\D/g, '');

  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ mensagem: 'CPF inválido' });
  }

  const especialidadeFinal = especialidade || 'Atendimento geral';

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const sql = `INSERT INTO usuarios (nome, email, senha, cpf, numero, tipo_usuario, especialidade) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    await queryAsync(sql, [nome, email, senhaCriptografada, cpfLimpo, numeroLimpo, tipo_usuario, especialidadeFinal]);

    return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
  } catch (erro) {
    console.log(erro);

    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'E-mail ou CPF já cadastrado' });
    }

    return res.status(500).json({ mensagem: 'Erro ao cadastrar usuário' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const sql = `
      SELECT id_usuario, nome, email, cpf, numero, tipo_usuario,
             COALESCE(especialidade, 'Atendimento geral') AS especialidade
      FROM usuarios
    `;

    const resultado = await queryAsync(sql);
    return res.json(resultado);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar usuários' });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT id_usuario, nome, email, cpf, numero, tipo_usuario,
             COALESCE(especialidade, 'Atendimento geral') AS especialidade
      FROM usuarios
      WHERE id_usuario = ?
    `;

    const resultado = await queryAsync(sql, [id]);

    if (resultado.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    return res.json(resultado[0]);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, cpf, numero, especialidade } = req.body;

  if (!nome || !email || !cpf || !numero) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  const cpfLimpo = String(cpf || '').replace(/\D/g, '');
  const numeroLimpo = String(numero || '').replace(/\D/g, '');

  try {
    const sql = `
      UPDATE usuarios
      SET nome = ?, email = ?, cpf = ?, numero = ?, especialidade = COALESCE(?, especialidade)
      WHERE id_usuario = ?
    `;

    await queryAsync(sql, [nome, email, cpfLimpo, numeroLimpo, especialidade || null, id]);

    return res.json({ mensagem: 'Dados atualizados com sucesso' });
  } catch (erro) {
    console.log(erro);

    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'E-mail ou CPF já usado por outro usuário' });
    }

    return res.status(500).json({ mensagem: 'Erro ao atualizar usuário' });
  }
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const query = 'SELECT * FROM usuarios WHERE email = ?';

  conexao.query(query, [email], async (erro, resultado) => {
    if (erro) {
      console.log(erro);
      return res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
    }

    const usuario = resultado[0];

    if (!usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos' });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Login bem-sucedido',
      data: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        numero: usuario.numero,
        tipo_usuario: usuario.tipo_usuario,
        especialidade: usuario.especialidade || 'Atendimento geral',
      },
    });
  });
});

app.get('/voluntarios', async (req, res) => {
  try {
    const usuarios = await queryAsync(
      `
        SELECT id_usuario, nome, email, numero, tipo_usuario,
               COALESCE(especialidade, 'Atendimento geral') AS especialidade
        FROM usuarios
        WHERE tipo_usuario = 'voluntario'
        ORDER BY nome ASC
      `
    );

    const dadosComDisponibilidade = await Promise.all(
      usuarios.map(async (voluntario) => {
        const disponibilidades = await queryAsync(
          `
            SELECT id_disponibilidade, dia_semana, horario_inicio, horario_fim, ativo
            FROM disponibilidade_voluntario
            WHERE id_voluntario = ? AND ativo = 1
            ORDER BY FIELD(dia_semana, 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'), horario_inicio ASC
          `,
          [voluntario.id_usuario]
        );

        return {
          ...voluntario,
          total_disponibilidades: disponibilidades.length,
          disponibilidades,
        };
      })
    );

    return res.json(dadosComDisponibilidade);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar voluntários' });
  }
});

app.get('/voluntarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await queryAsync(
      `
        SELECT id_usuario, nome, email, numero, tipo_usuario,
               COALESCE(especialidade, 'Atendimento geral') AS especialidade
        FROM usuarios
        WHERE id_usuario = ? AND tipo_usuario = 'voluntario'
      `,
      [id]
    );

    if (!usuario.length) {
      return res.status(404).json({ mensagem: 'Voluntário não encontrado' });
    }

    const disponibilidades = await queryAsync(
      `
        SELECT id_disponibilidade, dia_semana, horario_inicio, horario_fim, ativo
        FROM disponibilidade_voluntario
        WHERE id_voluntario = ? AND ativo = 1
        ORDER BY FIELD(dia_semana, 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'), horario_inicio ASC
      `,
      [id]
    );

    return res.json({ ...usuario[0], total_disponibilidades: disponibilidades.length, disponibilidades });
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar voluntário' });
  }
});

app.get('/voluntarios/:id/disponibilidades', async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await queryAsync(
      `
        SELECT id_disponibilidade, dia_semana, horario_inicio, horario_fim, ativo
        FROM disponibilidade_voluntario
        WHERE id_voluntario = ? AND ativo = 1
        ORDER BY FIELD(dia_semana, 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'), horario_inicio ASC
      `,
      [id]
    );

    return res.json(resultado);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar disponibilidades' });
  }
});

app.post('/voluntarios/:id/disponibilidades', async (req, res) => {
  const { id } = req.params;
  let { dia_semana, horario_inicio, horario_fim } = req.body;

  dia_semana = normalizarDiaSemana(dia_semana);
  horario_inicio = normalizarHorario(horario_inicio);
  horario_fim = normalizarHorario(horario_fim);

  const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  if (!dia_semana || !horario_inicio || !horario_fim) {
    return res.status(400).json({ mensagem: 'Dia e horário são obrigatórios' });
  }

  if (!diasValidos.includes(dia_semana)) {
    return res.status(400).json({ mensagem: 'Dia da semana inválido' });
  }

  const erroHorario = validarHorario(horario_inicio, horario_fim);
  if (erroHorario) {
    return res.status(400).json({ mensagem: erroHorario });
  }

  try {
    const voluntario = await queryAsync('SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND tipo_usuario = ?', [id, 'voluntario']);
    if (!voluntario.length) {
      return res.status(404).json({ mensagem: 'Voluntário não encontrado' });
    }

    const sql = `
      INSERT INTO disponibilidade_voluntario (id_voluntario, dia_semana, horario_inicio, horario_fim, ativo)
      VALUES (?, ?, ?, ?, 1)
    `;

    const resultado = await queryAsync(sql, [id, dia_semana, horario_inicio, horario_fim]);

    return res.status(201).json({
      mensagem: 'Disponibilidade cadastrada com sucesso',
      id_disponibilidade: resultado.insertId,
    });
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao cadastrar disponibilidade' });
  }
});

app.put('/voluntarios/:id/disponibilidades/:disponibilidadeId', async (req, res) => {
  const { id, disponibilidadeId } = req.params;
  let { dia_semana, horario_inicio, horario_fim } = req.body;

  dia_semana = normalizarDiaSemana(dia_semana);
  horario_inicio = normalizarHorario(horario_inicio);
  horario_fim = normalizarHorario(horario_fim);

  const diasValidos = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  if (!dia_semana || !horario_inicio || !horario_fim) {
    return res.status(400).json({ mensagem: 'Dia e horário são obrigatórios' });
  }

  if (!diasValidos.includes(dia_semana)) {
    return res.status(400).json({ mensagem: 'Dia da semana inválido' });
  }

  const erroHorario = validarHorario(horario_inicio, horario_fim);
  if (erroHorario) {
    return res.status(400).json({ mensagem: erroHorario });
  }

  try {
    const sql = `
      UPDATE disponibilidade_voluntario
      SET dia_semana = ?, horario_inicio = ?, horario_fim = ?
      WHERE id_disponibilidade = ? AND id_voluntario = ?
    `;

    const resultado = await queryAsync(sql, [dia_semana, horario_inicio, horario_fim, disponibilidadeId, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Disponibilidade não encontrada' });
    }

    return res.json({ mensagem: 'Disponibilidade atualizada com sucesso' });
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao atualizar disponibilidade' });
  }
});

app.delete('/voluntarios/:id/disponibilidades/:disponibilidadeId', async (req, res) => {
  const { id, disponibilidadeId } = req.params;

  try {
    const resultado = await queryAsync(
      'DELETE FROM disponibilidade_voluntario WHERE id_disponibilidade = ? AND id_voluntario = ?',
      [disponibilidadeId, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Disponibilidade não encontrada' });
    }

    return res.json({ mensagem: 'Disponibilidade removida com sucesso' });
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao remover disponibilidade' });
  }
});

app.get('/solicitacoes/usuario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT s.*, v.nome AS nome_voluntario, v.especialidade AS especialidade_voluntario, p.nome AS nome_pcd
      FROM solicitacoes_ajuda s
      INNER JOIN usuarios v ON v.id_usuario = s.id_voluntario
      INNER JOIN usuarios p ON p.id_usuario = s.id_pcd
      WHERE s.id_pcd = ?
      ORDER BY s.criado_em DESC
    `;

    const resultado = await queryAsync(sql, [id]);
    return res.json(resultado);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar solicitações do usuário' });
  }
});

app.get('/solicitacoes/voluntario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT s.*, p.nome AS nome_pcd
      FROM solicitacoes_ajuda s
      INNER JOIN usuarios p ON p.id_usuario = s.id_pcd
      WHERE s.id_voluntario = ?
      ORDER BY s.criado_em DESC
    `;

    const resultado = await queryAsync(sql, [id]);
    return res.json(resultado);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar solicitações do voluntário' });
  }
});

app.get('/solicitacoes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `
      SELECT s.*, p.nome AS nome_pcd, v.nome AS nome_voluntario
      FROM solicitacoes_ajuda s
      INNER JOIN usuarios p ON p.id_usuario = s.id_pcd
      INNER JOIN usuarios v ON v.id_usuario = s.id_voluntario
      WHERE s.id_solicitacao = ?
    `;

    const resultado = await queryAsync(sql, [id]);

    if (!resultado.length) {
      return res.status(404).json({ mensagem: 'Solicitação não encontrada' });
    }

    return res.json(resultado[0]);
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar solicitação' });
  }
});

app.post('/solicitacoes', async (req, res) => {
  const {
    id_pcd,
    id_voluntario,
    data_agendamento,
    horario_inicio,
    horario_fim,
    tipo_ajuda,
    descricao,
  } = req.body;

  if (!id_pcd || !id_voluntario || !data_agendamento || !horario_inicio || !horario_fim || !tipo_ajuda) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios da solicitação' });
  }

  const tipoAjudaLimpo = String(tipo_ajuda).trim();
  if (!tipoAjudaLimpo) {
    return res.status(400).json({ mensagem: 'Informe o tipo de ajuda' });
  }

  const erroHorario = validarHorario(horario_inicio, horario_fim);
  if (erroHorario) {
    return res.status(400).json({ mensagem: erroHorario });
  }

  try {
    await validarVoluntarioEUsuario(Number(id_voluntario), Number(id_pcd));

    const diaSemana = obterDiaSemana(data_agendamento);
    const disponibilidades = await queryAsync(
      `
        SELECT *
        FROM disponibilidade_voluntario
        WHERE id_voluntario = ? AND dia_semana = ? AND ativo = 1
      `,
      [id_voluntario, diaSemana]
    );

    const existeDisponibilidade = disponibilidades.some((disponibilidade) =>
      horariosSeSobrepoem(
        horario_inicio,
        horario_fim,
        disponibilidade.horario_inicio,
        disponibilidade.horario_fim
      )
    );

    if (!existeDisponibilidade) {
      return res.status(409).json({ mensagem: 'Este horário não está disponível para o voluntário selecionado' });
    }

    const conflitos = await queryAsync(
      `
        SELECT id_solicitacao
        FROM solicitacoes_ajuda
        WHERE id_voluntario = ?
          AND data_agendamento = ?
          AND status IN ('pendente', 'aceita')
          AND (
            (horario_inicio < ? AND horario_fim > ?) OR
            (horario_inicio < ? AND horario_fim > ?) OR
            (horario_inicio >= ? AND horario_fim <= ?)
          )
      `,
      [
        id_voluntario,
        data_agendamento,
        horario_fim,
        horario_inicio,
        horario_inicio,
        horario_fim,
        horario_inicio,
        horario_fim,
      ]
    );

    if (conflitos.length > 0) {
      return res.status(409).json({ mensagem: 'Este horário já foi solicitado ou está ocupado' });
    }

    const resultado = await queryAsync(
      `
        INSERT INTO solicitacoes_ajuda
        (id_pcd, id_voluntario, tipo_ajuda, descricao, data_agendamento, horario_inicio, horario_fim, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')
      `,
      [
        id_pcd,
        id_voluntario,
        tipoAjudaLimpo,
        descricao ? String(descricao).trim() : null,
        data_agendamento,
        normalizarHorario(horario_inicio),
        normalizarHorario(horario_fim),
      ]
    );

    return res.status(201).json({
      mensagem: 'Solicitação enviada com sucesso',
      id_solicitacao: resultado.insertId,
      status: 'pendente',
    });
  } catch (erro) {
    console.log(erro);
    return res.status(400).json({ mensagem: extrairMensagemErro(erro, 'Erro ao registrar solicitação de ajuda') });
  }
});

app.patch('/solicitacoes/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !STATUS_PERMITIDOS.includes(status)) {
    return res.status(400).json({ mensagem: 'Status inválido' });
  }

  try {
    const resultado = await queryAsync(
      'UPDATE solicitacoes_ajuda SET status = ? WHERE id_solicitacao = ?',
      [status, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Solicitação não encontrada' });
    }

    return res.json({ mensagem: 'Status atualizado com sucesso', status });
  } catch (erro) {
    console.log(erro);
    return res.status(500).json({ mensagem: 'Erro ao atualizar status da solicitação' });
  }
});

app.use((erro, req, res, next) => {
  console.error('Erro não tratado:', erro);
  return res.status(500).json({ mensagem: 'Erro interno do servidor' });
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
