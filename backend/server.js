const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const conexao = require('./dbconfig');

const app = express();

app.use(cors());
app.use(express.json());


app.post('/usuarios', async (req, res) => {
    const { nome, email, senha, cpf, numero } = req.body;

    if (!nome || !email || !senha || !cpf || !numero) {
        return res.status(400).json({
            mensagem: 'Todos os campos são obrigatórios',
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
    (nome, email, senha, cpf, numero) VALUES (?, ?, ?, ?, ?)`;

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        conexao.query(
            sql,
            [nome, email, senhaCriptografada, cpfLimpo, numeroLimpo],
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
                res.json({
                    mensagem: 'Usuário cadastrado com sucesso',
                });
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
    const sql = "SELECT id_usuario, nome, email, cpf, numero FROM usuarios";

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.log(erro)
            return res.status(500).json({
                mensagem: 'Erro ao buscar usuários',
            });
        }
        res.json(resultado);
    })
});


// NOVA ROTA: busca um usuário específico pelo ID (usada pela tela de Perfil)
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;

    const sql = "SELECT id_usuario, nome, email, cpf, numero FROM usuarios WHERE id_usuario = ?";

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


// NOVA ROTA: atualiza os dados do usuário (usada pela edição no Perfil)
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

    conexao.query(
        sql,
        [nome, email, cpfLimpo, numeroLimpo, id],
        (erro, resultado) => {
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
        }
    );
});


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
                    id_usuario: usuario.id_usuario, // agora envia o ID
                    nome: usuario.nome,
                    email: usuario.email,
                    cpf: usuario.cpf,
                    numero: usuario.numero,
                },
            });
        }

        return res.status(401).json({
            sucesso: false,
            mensagem: 'Email ou senha incorretos',
        });
    });
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});