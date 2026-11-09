const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const conexao = require('./dbconfig');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/usuarios', async (req, res) => {
    const { nome, email, senha, cpf, numero, tipo_usuario } = req.body;

    if (!nome || !email || !senha || !cpf || !numero || !tipo_usuario) {
        return res.status(400).json({
            mensagem: 'Todos os campos são obrigatórios',
        });
    }

    if (!['pcd', 'voluntario'].includes(tipo_usuario)) {
        return res.status(400).json({
            mensagem: 'Tipo de usuário inválido',
        });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    const numeroLimpo = numero.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
        return res.status(400).json({
            mensagem: 'CPF inválido',
        });
    }

    const sql = `INSERT INTO usuarios 
    (nome, email, senha, cpf, numero, tipo_usuario) VALUES (?, ?, ?, ?, ?, ?)`;

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        conexao.query(
            sql,
            [nome, email, senhaCriptografada, cpfLimpo, numeroLimpo, tipo_usuario],
            (erro, resultado) => {
                if (erro) {
                    console.log(erro);

                    if (erro.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            mensagem: 'E-mail ou CPF já cadastrado',
                        });
                    }

                    return res.status(500).json({
                        mensagem: 'Erro ao cadastrar usuário',
                    });
                }

                // O nome da tabela vem de uma escolha fixa (nunca do que o usuário digita)
                const tabelaPerfil =
                    tipo_usuario === 'voluntario' ? 'voluntario' : 'pessoa_deficiencia';

                conexao.query(
                    `INSERT INTO ${tabelaPerfil} (id_usuario) VALUES (?)`,
                    [resultado.insertId],
                    (erroPerfil) => {
                        if (erroPerfil) {
                            console.log(erroPerfil);
                            return res.status(500).json({
                                mensagem: 'Usuário criado, mas houve erro ao criar o perfil',
                            });
                        }
                        res.json({ mensagem: 'Usuário cadastrado com sucesso' });
                    }
                );
            }
        );
    } catch (erro) {
        console.log(erro);
        return res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário',
        });
    }
});

app.get('/usuarios', (req, res) => {
    const sql = 'SELECT id_usuario, nome, email, cpf, numero, tipo_usuario FROM usuarios';

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({
                mensagem: 'Erro ao buscar usuários',
            });
        }
        res.json(resultado);
    });
});

// Busca um usuário específico pelo ID (tela de Perfil)
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;

    const sql =
        'SELECT id_usuario, nome, email, cpf, numero, tipo_usuario FROM usuarios WHERE id_usuario = ?';

    conexao.query(sql, [id], (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({
                mensagem: 'Erro ao buscar usuário',
            });
        }

        if (resultado.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado',
            });
        }

        res.json(resultado[0]);
    });
});

// Atualiza os dados do usuário (edição no Perfil)
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, cpf, numero } = req.body;

    if (!nome || !email || !cpf || !numero) {
        return res.status(400).json({
            mensagem: 'Todos os campos são obrigatórios',
        });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    const numeroLimpo = numero.replace(/\D/g, '');

    const sql = `UPDATE usuarios SET nome = ?, email = ?, cpf = ?, numero = ? WHERE id_usuario = ?`;

    conexao.query(sql, [nome, email, cpfLimpo, numeroLimpo, id], (erro) => {
        if (erro) {
            console.log(erro);

            if (erro.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    mensagem: 'E-mail ou CPF já usado por outro usuário',
                });
            }

            return res.status(500).json({
                mensagem: 'Erro ao atualizar usuário',
            });
        }

        res.json({
            mensagem: 'Dados atualizados com sucesso',
        });
    });
});


// ======================================================
// LOGIN
// ======================================================

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const query = `SELECT * FROM usuarios WHERE email = ?`;

    conexao.query(query, [email], async (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({
                mensagem: 'Erro ao buscar usuário',
            });
        }

        const usuario = resultado[0];

        if (!usuario) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Email ou senha incorretos',
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (senhaCorreta) {
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
                },
            });
        }

        return res.status(401).json({
            sucesso: false,
            mensagem: 'Email ou senha incorretos',
        });
    });
});


// ======================================================
// VOLUNTÁRIOS E DISPONIBILIDADE
// ======================================================

// Lista voluntários (a tela usa para achar o id_voluntario do usuário logado)
app.get('/voluntarios', (req, res) => {
    conexao.query('SELECT id_voluntario, id_usuario FROM voluntario', (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao buscar voluntários' });
        }
        res.json(resultado);
    });
});

// Voluntários com nome e horários disponíveis (tela de agendamento do PcD)
// IMPORTANTE: esta rota precisa ficar ANTES de qualquer rota /voluntarios/:id/...
app.get('/voluntarios/disponiveis', (req, res) => {
    const sql = `SELECT v.id_voluntario, u.nome, v.especialidade, v.avaliacao,
                        d.id_disponibilidade, d.dia_semana,
                        TIME_FORMAT(d.horario_inicio, '%H:%i') AS horario_inicio,
                        TIME_FORMAT(d.horario_fim, '%H:%i') AS horario_fim
                 FROM voluntario v
                 JOIN usuarios u ON u.id_usuario = v.id_usuario
                 JOIN disponibilidade_voluntario d ON d.id_voluntario = v.id_voluntario
                 WHERE d.ativo = 1
                 ORDER BY v.id_voluntario, d.id_disponibilidade`;

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao buscar voluntários' });
        }

        const mapa = {};
        resultado.forEach((linha) => {
            if (!mapa[linha.id_voluntario]) {
                mapa[linha.id_voluntario] = {
                    id_voluntario: linha.id_voluntario,
                    nome: linha.nome,
                    especialidade: linha.especialidade,
                    avaliacao: linha.avaliacao,
                    disponibilidades: [],
                };
            }
            mapa[linha.id_voluntario].disponibilidades.push({
                id_disponibilidade: linha.id_disponibilidade,
                dia_semana: linha.dia_semana,
                horario_inicio: linha.horario_inicio,
                horario_fim: linha.horario_fim,
            });
        });

        res.json(Object.values(mapa));
    });
});

// Lista disponibilidades de um voluntário
app.get('/voluntarios/:id/disponibilidades', (req, res) => {
    const sql = `SELECT id_disponibilidade, dia_semana, horario_inicio, horario_fim
                 FROM disponibilidade_voluntario
                 WHERE id_voluntario = ? AND ativo = 1`;

    conexao.query(sql, [req.params.id], (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao carregar disponibilidades' });
        }
        res.json(resultado);
    });
});

// Cadastra disponibilidade
app.post('/voluntarios/:id/disponibilidades', (req, res) => {
    const { dia_semana, horario_inicio, horario_fim } = req.body;

    if (!dia_semana || !horario_inicio || !horario_fim) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
    }

    const sql = `INSERT INTO disponibilidade_voluntario
                 (id_voluntario, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)`;

    conexao.query(sql, [req.params.id, dia_semana, horario_inicio, horario_fim], (erro) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao salvar disponibilidade' });
        }
        res.json({ mensagem: 'Disponibilidade salva com sucesso' });
    });
});

// Remove disponibilidade
app.delete('/voluntarios/:id/disponibilidades/:idDisp', (req, res) => {
    const sql = `DELETE FROM disponibilidade_voluntario
                 WHERE id_disponibilidade = ? AND id_voluntario = ?`;

    conexao.query(sql, [req.params.idDisp, req.params.id], (erro) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao remover disponibilidade' });
        }
        res.json({ mensagem: 'Disponibilidade removida com sucesso' });
    });
});


// ======================================================
// PCD E SOLICITAÇÕES
// ======================================================

// Descobre o id_pcd de um usuário (o app usa ao enviar a solicitação)
app.get('/pcd/usuario/:idUsuario', (req, res) => {
    conexao.query(
        'SELECT id_pcd FROM pessoa_deficiencia WHERE id_usuario = ?',
        [req.params.idUsuario],
        (erro, resultado) => {
            if (erro) {
                console.log(erro);
                return res.status(500).json({ mensagem: 'Erro ao buscar PcD' });
            }
            if (resultado.length === 0) {
                return res.status(404).json({ mensagem: 'PcD não encontrado' });
            }
            res.json(resultado[0]);
        }
    );
});

// PcD cria uma solicitação para um voluntário
app.post('/solicitacoes', (req, res) => {
    const {
        id_pcd, id_voluntario, id_disponibilidade,
        tipo_ajuda, descricao, data_agendamento, horario_inicio, horario_fim,
    } = req.body;

    if (!id_pcd || !id_voluntario || !tipo_ajuda || !data_agendamento || !horario_inicio || !horario_fim) {
        return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios' });
    }

    const sql = `INSERT INTO solicitacoes_ajuda
        (id_pcd, id_voluntario, id_disponibilidade, tipo_ajuda, descricao,
         data_agendamento, horario_inicio, horario_fim)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    conexao.query(
        sql,
        [id_pcd, id_voluntario, id_disponibilidade || null, tipo_ajuda,
         descricao || null, data_agendamento, horario_inicio, horario_fim],
        (erro, resultado) => {
            if (erro) {
                console.log(erro);
                return res.status(500).json({ mensagem: 'Erro ao criar solicitação' });
            }
            res.json({
                mensagem: 'Solicitação enviada com sucesso',
                id_solicitacao: resultado.insertId,
            });
        }
    );
});

// Solicitações recebidas por um voluntário (tela de disponibilidade)
app.get('/solicitacoes/voluntario/:id', (req, res) => {
    const sql = `SELECT s.id_solicitacao, u.nome AS nome_pcd, s.tipo_ajuda, s.descricao,
                        DATE_FORMAT(s.data_agendamento, '%d/%m/%Y') AS data_agendamento,
                        TIME_FORMAT(s.horario_inicio, '%H:%i') AS horario_inicio,
                        TIME_FORMAT(s.horario_fim, '%H:%i') AS horario_fim,
                        s.status
                 FROM solicitacoes_ajuda s
                 JOIN pessoa_deficiencia p ON p.id_pcd = s.id_pcd
                 JOIN usuarios u ON u.id_usuario = p.id_usuario
                 WHERE s.id_voluntario = ?
                 ORDER BY s.data_agendamento, s.horario_inicio`;

    conexao.query(sql, [req.params.id], (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao carregar solicitações' });
        }
        res.json(resultado);
    });
});

// Solicitações feitas por um PcD (tela Minhas Solicitações)
app.get('/solicitacoes/pcd/:id', (req, res) => {
    const sql = `SELECT s.id_solicitacao, u.nome AS nome_voluntario, s.tipo_ajuda, s.descricao,
                        DATE_FORMAT(s.data_agendamento, '%d/%m/%Y') AS data_agendamento,
                        TIME_FORMAT(s.horario_inicio, '%H:%i') AS horario_inicio,
                        TIME_FORMAT(s.horario_fim, '%H:%i') AS horario_fim,
                        s.status
                 FROM solicitacoes_ajuda s
                 JOIN voluntario v ON v.id_voluntario = s.id_voluntario
                 JOIN usuarios u ON u.id_usuario = v.id_usuario
                 WHERE s.id_pcd = ?
                 ORDER BY s.data_agendamento DESC, s.horario_inicio`;

    conexao.query(sql, [req.params.id], (erro, resultado) => {
        if (erro) {
            console.log(erro);
            return res.status(500).json({ mensagem: 'Erro ao carregar solicitações' });
        }
        res.json(resultado);
    });
});

// Aceitar / recusar / concluir
app.patch('/solicitacoes/:id/status', (req, res) => {
    const { status } = req.body;

    if (!['aceita', 'cancelada', 'concluida'].includes(status)) {
        return res.status(400).json({ mensagem: 'Status inválido' });
    }

    conexao.query(
        'UPDATE solicitacoes_ajuda SET status = ? WHERE id_solicitacao = ?',
        [status, req.params.id],
        (erro, resultado) => {
            if (erro) {
                console.log(erro);
                return res.status(500).json({ mensagem: 'Erro ao atualizar status' });
            }
            if (resultado.affectedRows === 0) {
                return res.status(404).json({ mensagem: 'Solicitação não encontrada' });
            }
            res.json({ mensagem: 'Status atualizado com sucesso' });
        }
    );
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});