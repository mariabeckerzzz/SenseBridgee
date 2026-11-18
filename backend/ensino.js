module.exports = function registrarRotasEnsino(app, conexao) {
    const CATEGORIAS = ['alfabeto_numeros', 'cumprimentos_cotidiano', 'pratica'];
    const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const MODALIDADES = ['online', 'presencial', 'ambos'];

    const buscarPcd = (idUsuario, cb) =>
        conexao.query(
            'SELECT id_pcd FROM pessoa_deficiencia WHERE id_usuario = ?',
            [idUsuario],
            (e, r) => cb(e, r && r[0])
        );

    const buscarVoluntario = (idUsuario, cb) =>
        conexao.query(
            'SELECT id_voluntario FROM voluntario WHERE id_usuario = ?',
            [idUsuario],
            (e, r) => cb(e, r && r[0])
        );

    function validar(body) {
        const { descricao, modalidade, max_voluntarios, categorias, disponibilidades } = body;

        if (!descricao || !descricao.trim()) return 'Descreva o conteúdo que pretende compartilhar';
        if (!MODALIDADES.includes(modalidade)) return 'Modalidade inválida';

        if (max_voluntarios !== null && max_voluntarios !== undefined && max_voluntarios !== '') {
            if (!Number.isInteger(Number(max_voluntarios)) || Number(max_voluntarios) < 1) {
                return 'Quantidade máxima de voluntários inválida';
            }
        }

        if (!Array.isArray(categorias) || categorias.length === 0) {
            return 'Selecione ao menos uma categoria';
        }
        if (categorias.some((c) => !CATEGORIAS.includes(c.categoria))) {
            return 'Categoria inválida';
        }

        if (!Array.isArray(disponibilidades) || disponibilidades.length === 0) {
            return 'Informe ao menos um dia e horário disponível';
        }
        for (const d of disponibilidades) {
            if (!DIAS.includes(d.dia_semana) || !d.horario_inicio || !d.horario_fim) {
                return 'Disponibilidade inválida';
            }
            if (d.horario_inicio >= d.horario_fim) {
                return 'O horário de início deve ser anterior ao de fim';
            }
        }
        return null;
    }

    function salvarFilhos(idCandidatura, categorias, disponibilidades, cb) {
        const conteudos = [];
        categorias.forEach((c) => {
            const itens = Array.isArray(c.itens) && c.itens.length ? c.itens : [c.categoria];
            itens.forEach((item) =>
                conteudos.push([idCandidatura, c.categoria, String(item).slice(0, 100)])
            );
        });
        const disps = disponibilidades.map((d) => [
            idCandidatura, d.dia_semana, d.horario_inicio, d.horario_fim,
        ]);

        conexao.query(
            'INSERT INTO candidatura_conteudo (id_candidatura, categoria, item) VALUES ?',
            [conteudos],
            (e1) => {
                if (e1) return cb(e1);
                conexao.query(
                    `INSERT INTO candidatura_disponibilidade
                     (id_candidatura, dia_semana, horario_inicio, horario_fim) VALUES ?`,
                    [disps],
                    cb
                );
            }
        );
    }

    function anexarDetalhes(lista, cb) {
        if (!lista.length) return cb(null, lista);
        const ids = lista.map((c) => c.id_candidatura);

        conexao.query(
            'SELECT id_candidatura, categoria, item FROM candidatura_conteudo WHERE id_candidatura IN (?)',
            [ids],
            (e1, conteudos) => {
                if (e1) return cb(e1);
                conexao.query(
                    `SELECT id_candidatura, dia_semana,
                            TIME_FORMAT(horario_inicio, '%H:%i') AS horario_inicio,
                            TIME_FORMAT(horario_fim, '%H:%i') AS horario_fim
                     FROM candidatura_disponibilidade WHERE id_candidatura IN (?)`,
                    [ids],
                    (e2, disps) => {
                        if (e2) return cb(e2);
                        lista.forEach((c) => {
                            c.categorias = {};
                            conteudos
                                .filter((x) => x.id_candidatura === c.id_candidatura)
                                .forEach((x) => {
                                    if (!c.categorias[x.categoria]) c.categorias[x.categoria] = [];
                                    c.categorias[x.categoria].push(x.item);
                                });
                            c.disponibilidades = disps.filter(
                                (d) => d.id_candidatura === c.id_candidatura
                            );
                        });
                        cb(null, lista);
                    }
                );
            }
        );
    }

    // Confere se a candidatura pertence ao usuário logado
    function candidaturaDoUsuario(idCandidatura, idUsuario, cb) {
        conexao.query(
            `SELECT c.id_candidatura FROM candidatura_ensino c
             JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
             WHERE c.id_candidatura = ? AND p.id_usuario = ?`,
            [idCandidatura, idUsuario],
            (e, r) => cb(e, r && r[0])
        );
    }

    const erroServidor = (res, erro, msg) => {
        console.log(erro);
        return res.status(500).json({ mensagem: msg });
    };

    // ---------- PROFESSOR (PcD): candidatura ----------

    app.post('/ensino/candidaturas', (req, res) => {
        const { id_usuario, descricao, modalidade, max_voluntarios, categorias, disponibilidades } = req.body;

        const problema = validar(req.body);
        if (problema) return res.status(400).json({ mensagem: problema });

        buscarPcd(id_usuario, (e, pcd) => {
            if (e) return erroServidor(res, e, 'Erro ao validar usuário');
            if (!pcd) {
                return res.status(403).json({ mensagem: 'Somente pessoas com deficiência podem ensinar' });
            }

            conexao.query(
                `INSERT INTO candidatura_ensino (id_pcd, descricao, modalidade, max_voluntarios)
                 VALUES (?, ?, ?, ?)`,
                [pcd.id_pcd, descricao.trim(), modalidade, max_voluntarios ? Number(max_voluntarios) : null],
                (e2, r) => {
                    if (e2) {
                        if (e2.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ mensagem: 'Você já tem uma candidatura. Edite-a.' });
                        }
                        return erroServidor(res, e2, 'Erro ao salvar candidatura');
                    }
                    salvarFilhos(r.insertId, categorias, disponibilidades, (e3) => {
                        if (e3) return erroServidor(res, e3, 'Erro ao salvar detalhes da candidatura');
                        res.status(201).json({ mensagem: 'Candidatura publicada', id_candidatura: r.insertId });
                    });
                }
            );
        });
    });

    // Candidatura do professor logado (retorna null se não houver)
    app.get('/ensino/candidaturas/pcd/:idUsuario', (req, res) => {
        conexao.query(
            `SELECT c.id_candidatura, c.descricao, c.modalidade, c.max_voluntarios, c.status
             FROM candidatura_ensino c
             JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
             WHERE p.id_usuario = ?`,
            [req.params.idUsuario],
            (e, lista) => {
                if (e) return erroServidor(res, e, 'Erro ao buscar candidatura');
                anexarDetalhes(lista, (e2, completa) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao buscar candidatura');
                    res.json(completa[0] || null);
                });
            }
        );
    });

    app.put('/ensino/candidaturas/:id', (req, res) => {
        const { id_usuario, descricao, modalidade, max_voluntarios, categorias, disponibilidades } = req.body;

        const problema = validar(req.body);
        if (problema) return res.status(400).json({ mensagem: problema });

        candidaturaDoUsuario(req.params.id, id_usuario, (e, cand) => {
            if (e) return erroServidor(res, e, 'Erro ao validar candidatura');
            if (!cand) return res.status(403).json({ mensagem: 'Candidatura não encontrada' });

            conexao.query(
                `UPDATE candidatura_ensino SET descricao = ?, modalidade = ?, max_voluntarios = ?
                 WHERE id_candidatura = ?`,
                [descricao.trim(), modalidade, max_voluntarios ? Number(max_voluntarios) : null, req.params.id],
                (e2) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao atualizar candidatura');
                    conexao.query('DELETE FROM candidatura_conteudo WHERE id_candidatura = ?', [req.params.id], (e3) => {
                        if (e3) return erroServidor(res, e3, 'Erro ao atualizar conteúdos');
                        conexao.query(
                            'DELETE FROM candidatura_disponibilidade WHERE id_candidatura = ?',
                            [req.params.id],
                            (e4) => {
                                if (e4) return erroServidor(res, e4, 'Erro ao atualizar disponibilidade');
                                salvarFilhos(req.params.id, categorias, disponibilidades, (e5) => {
                                    if (e5) return erroServidor(res, e5, 'Erro ao atualizar candidatura');
                                    res.json({ mensagem: 'Candidatura atualizada' });
                                });
                            }
                        );
                    });
                }
            );
        });
    });

    // Pausar / reativar
    app.patch('/ensino/candidaturas/:id/status', (req, res) => {
        const { id_usuario, status } = req.body;
        if (!['ativa', 'pausada'].includes(status)) {
            return res.status(400).json({ mensagem: 'Status inválido' });
        }
        candidaturaDoUsuario(req.params.id, id_usuario, (e, cand) => {
            if (e) return erroServidor(res, e, 'Erro ao validar candidatura');
            if (!cand) return res.status(403).json({ mensagem: 'Candidatura não encontrada' });
            conexao.query(
                'UPDATE candidatura_ensino SET status = ? WHERE id_candidatura = ?',
                [status, req.params.id],
                (e2) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao atualizar status');
                    res.json({ mensagem: status === 'pausada' ? 'Candidatura pausada' : 'Candidatura reativada' });
                }
            );
        });
    });

    app.delete('/ensino/candidaturas/:id', (req, res) => {
        const idUsuario = req.query.id_usuario;
        candidaturaDoUsuario(req.params.id, idUsuario, (e, cand) => {
            if (e) return erroServidor(res, e, 'Erro ao validar candidatura');
            if (!cand) return res.status(403).json({ mensagem: 'Candidatura não encontrada' });
            conexao.query('DELETE FROM candidatura_ensino WHERE id_candidatura = ?', [req.params.id], (e2) => {
                if (e2) return erroServidor(res, e2, 'Erro ao excluir candidatura');
                res.json({ mensagem: 'Candidatura excluída' });
            });
        });
    });

    // ---------- VOLUNTÁRIO: aprender ----------

    // Candidaturas ativas + status da solicitação do voluntário logado
    app.get('/ensino/candidaturas', (req, res) => {
        buscarVoluntario(req.query.id_usuario, (e, vol) => {
            if (e) return erroServidor(res, e, 'Erro ao validar usuário');
            if (!vol) {
                return res.status(403).json({ mensagem: 'Somente voluntários podem ver as aulas' });
            }
            conexao.query(
                `SELECT c.id_candidatura, c.descricao, c.modalidade, c.max_voluntarios,
                        u.id_usuario AS id_professor, u.nome AS nome_professor,
                        s.status AS minha_solicitacao
                 FROM candidatura_ensino c
                 JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
                 JOIN usuarios u ON u.id_usuario = p.id_usuario
                 LEFT JOIN solicitacao_aprender s
                        ON s.id_candidatura = c.id_candidatura AND s.id_voluntario = ?
                 WHERE c.status = 'ativa'
                 ORDER BY c.criado_em DESC`,
                [vol.id_voluntario],
                (e2, lista) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao buscar professores');
                    anexarDetalhes(lista, (e3, completa) => {
                        if (e3) return erroServidor(res, e3, 'Erro ao buscar professores');
                        res.json(completa);
                    });
                }
            );
        });
    });

    // "Quero aprender"
    app.post('/ensino/solicitacoes', (req, res) => {
        const { id_usuario, id_candidatura, conteudo_desejado, disponibilidade } = req.body;

        if (!id_candidatura || !conteudo_desejado || !conteudo_desejado.trim()) {
            return res.status(400).json({ mensagem: 'Informe o conteúdo que deseja aprender' });
        }

        buscarVoluntario(id_usuario, (e, vol) => {
            if (e) return erroServidor(res, e, 'Erro ao validar usuário');
            if (!vol) {
                return res.status(403).json({ mensagem: 'Somente voluntários podem solicitar aulas' });
            }

            conexao.query(
                "SELECT id_candidatura FROM candidatura_ensino WHERE id_candidatura = ? AND status = 'ativa'",
                [id_candidatura],
                (e2, r) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao validar candidatura');
                    if (r.length === 0) {
                        return res.status(404).json({ mensagem: 'Candidatura indisponível' });
                    }
                    conexao.query(
                        `INSERT INTO solicitacao_aprender
                         (id_candidatura, id_voluntario, conteudo_desejado, disponibilidade)
                         VALUES (?, ?, ?, ?)`,
                        [id_candidatura, vol.id_voluntario, conteudo_desejado.trim(), disponibilidade || null],
                        (e3, ins) => {
                            if (e3) {
                                if (e3.code === 'ER_DUP_ENTRY') {
                                    return res.status(409).json({ mensagem: 'Você já solicitou aula a este professor' });
                                }
                                return erroServidor(res, e3, 'Erro ao enviar solicitação');
                            }
                            res.status(201).json({
                                mensagem: 'Solicitação enviada',
                                id_solicitacao_aprender: ins.insertId,
                            });
                        }
                    );
                }
            );
        });
    });

    // Solicitações enviadas pelo voluntário
    app.get('/ensino/solicitacoes/voluntario/:idUsuario', (req, res) => {
        conexao.query(
            `SELECT s.id_solicitacao_aprender, s.conteudo_desejado, s.status,
                    DATE_FORMAT(s.criado_em, '%d/%m/%Y') AS data_solicitacao,
                    c.id_candidatura, c.modalidade, u.id_usuario AS id_professor, u.nome AS nome_professor
             FROM solicitacao_aprender s
             JOIN voluntario v ON v.id_voluntario = s.id_voluntario
             JOIN candidatura_ensino c ON c.id_candidatura = s.id_candidatura
             JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
             JOIN usuarios u ON u.id_usuario = p.id_usuario
             WHERE v.id_usuario = ?
             ORDER BY s.criado_em DESC`,
            [req.params.idUsuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao carregar solicitações');
                res.json(r);
            }
        );
    });

    // ---------- PROFESSOR: voluntários interessados ----------

    app.get('/ensino/solicitacoes/professor/:idUsuario', (req, res) => {
        conexao.query(
            `SELECT s.id_solicitacao_aprender, s.conteudo_desejado, s.disponibilidade, s.status,
                    DATE_FORMAT(s.criado_em, '%d/%m/%Y') AS data_solicitacao,
                    u.id_usuario AS id_voluntario_usuario, u.nome AS nome_voluntario
             FROM solicitacao_aprender s
             JOIN candidatura_ensino c ON c.id_candidatura = s.id_candidatura
             JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
             JOIN voluntario v ON v.id_voluntario = s.id_voluntario
             JOIN usuarios u ON u.id_usuario = v.id_usuario
             WHERE p.id_usuario = ?
             ORDER BY FIELD(s.status, 'pendente', 'aceita', 'recusada'), s.criado_em DESC`,
            [req.params.idUsuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao carregar solicitações');
                res.json(r);
            }
        );
    });

    // Aceitar / recusar (somente o professor dono da candidatura)
    app.patch('/ensino/solicitacoes/:id/status', (req, res) => {
        const { id_usuario, status } = req.body;
        if (!['aceita', 'recusada'].includes(status)) {
            return res.status(400).json({ mensagem: 'Status inválido' });
        }

        conexao.query(
            `SELECT s.id_solicitacao_aprender, s.id_candidatura, c.max_voluntarios
             FROM solicitacao_aprender s
             JOIN candidatura_ensino c ON c.id_candidatura = s.id_candidatura
             JOIN pessoa_deficiencia p ON p.id_pcd = c.id_pcd
             WHERE s.id_solicitacao_aprender = ? AND p.id_usuario = ?`,
            [req.params.id, id_usuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao validar solicitação');
                if (r.length === 0) return res.status(403).json({ mensagem: 'Solicitação não encontrada' });

                const atualizar = () =>
                    conexao.query(
                        'UPDATE solicitacao_aprender SET status = ? WHERE id_solicitacao_aprender = ?',
                        [status, req.params.id],
                        (e3) => {
                            if (e3) return erroServidor(res, e3, 'Erro ao atualizar solicitação');
                            res.json({ mensagem: status === 'aceita' ? 'Voluntário aceito' : 'Solicitação recusada' });
                        }
                    );

                if (status === 'aceita' && r[0].max_voluntarios) {
                    conexao.query(
                        `SELECT COUNT(*) AS total FROM solicitacao_aprender
                         WHERE id_candidatura = ? AND status = 'aceita'`,
                        [r[0].id_candidatura],
                        (e2, c) => {
                            if (e2) return erroServidor(res, e2, 'Erro ao validar limite');
                            if (c[0].total >= r[0].max_voluntarios) {
                                return res.status(409).json({ mensagem: 'Limite de voluntários atingido' });
                            }
                            atualizar();
                        }
                    );
                } else {
                    atualizar();
                }
            }
        );
    });
};