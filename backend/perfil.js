const bcrypt = require('bcrypt');

module.exports = function registrarRotasPerfil(app, conexao) {
    const erroServidor = (res, erro, msg) => {
        console.log(erro);
        return res.status(500).json({ mensagem: msg });
    };

    app.get('/perfil/:id', (req, res) => {
        const sql = `
            SELECT u.id_usuario, u.nome, u.email, u.cpf, u.numero, u.tipo_usuario,
                   u.bio, u.avatar, u.interesses, u.notificacoes, u.legendas_automaticas,
                   TIMESTAMPDIFF(MONTH, u.criado_em, NOW()) AS meses,
                   (SELECT COUNT(*) FROM solicitacoes_ajuda s
                      LEFT JOIN pessoa_deficiencia p ON p.id_pcd = s.id_pcd
                      LEFT JOIN voluntario v ON v.id_voluntario = s.id_voluntario
                     WHERE (p.id_usuario = u.id_usuario OR v.id_usuario = u.id_usuario)
                       AND s.status IN ('aceita','concluida')) AS chamadas,
                   (SELECT COUNT(*) FROM solicitacao_aprender sa
                      JOIN candidatura_ensino c ON c.id_candidatura = sa.id_candidatura
                      JOIN pessoa_deficiencia p2 ON p2.id_pcd = c.id_pcd
                      LEFT JOIN voluntario v2 ON v2.id_voluntario = sa.id_voluntario
                     WHERE sa.status = 'aceita'
                       AND (p2.id_usuario = u.id_usuario OR v2.id_usuario = u.id_usuario)) AS aulas
            FROM usuarios u
            WHERE u.id_usuario = ?`;

        conexao.query(sql, [req.params.id], (e, r) => {
            if (e) return erroServidor(res, e, 'Erro ao carregar perfil');
            if (r.length === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
            res.json(r[0]);
        });
    });

    app.put('/perfil/:id/personalizacao', (req, res) => {
        const { bio, avatar, interesses } = req.body;

        if (bio && bio.length > 300) {
            return res.status(400).json({ mensagem: 'A descrição pode ter no máximo 300 caracteres' });
        }

        const lista = Array.isArray(interesses)
            ? interesses.map((i) => String(i).trim()).filter(Boolean).slice(0, 8)
            : [];

        conexao.query(
            'UPDATE usuarios SET bio = ?, avatar = ?, interesses = ? WHERE id_usuario = ?',
            [(bio || '').trim() || null, avatar ? String(avatar).slice(0, 10) : null, lista.join(',') || null, req.params.id],
            (e) => {
                if (e) return erroServidor(res, e, 'Erro ao salvar perfil');
                res.json({ mensagem: 'Perfil atualizado' });
            }
        );
    });

    app.patch('/perfil/:id/preferencias', (req, res) => {
        const { notificacoes, legendas_automaticas } = req.body;
        conexao.query(
            `UPDATE usuarios SET
                notificacoes = COALESCE(?, notificacoes),
                legendas_automaticas = COALESCE(?, legendas_automaticas)
             WHERE id_usuario = ?`,
            [
                notificacoes === undefined ? null : notificacoes ? 1 : 0,
                legendas_automaticas === undefined ? null : legendas_automaticas ? 1 : 0,
                req.params.id,
            ],
            (e) => {
                if (e) return erroServidor(res, e, 'Erro ao salvar preferências');
                res.json({ mensagem: 'Preferências salvas' });
            }
        );
    });

    app.put('/perfil/:id/senha', (req, res) => {
        const { senha_atual, nova_senha } = req.body;

        if (!senha_atual || !nova_senha) {
            return res.status(400).json({ mensagem: 'Preencha a senha atual e a nova senha' });
        }
        if (nova_senha.length < 6) {
            return res.status(400).json({ mensagem: 'A nova senha deve ter ao menos 6 caracteres' });
        }

        conexao.query('SELECT senha FROM usuarios WHERE id_usuario = ?', [req.params.id], async (e, r) => {
            if (e) return erroServidor(res, e, 'Erro ao validar senha');
            if (r.length === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado' });

            try {
                const confere = await bcrypt.compare(senha_atual, r[0].senha);
                if (!confere) return res.status(401).json({ mensagem: 'Senha atual incorreta' });

                const hash = await bcrypt.hash(nova_senha, 10);
                conexao.query('UPDATE usuarios SET senha = ? WHERE id_usuario = ?', [hash, req.params.id], (e2) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao alterar senha');
                    res.json({ mensagem: 'Senha alterada com sucesso' });
                });
            } catch (erro) {
                return erroServidor(res, erro, 'Erro ao alterar senha');
            }
        });
    });
};