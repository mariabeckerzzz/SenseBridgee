const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

module.exports = function registrarRotasVideos(app, conexao) {
    const pasta = path.join(__dirname, 'uploads', 'videos');
    fs.mkdirSync(pasta, { recursive: true });

    const EXTENSOES = {
        'video/webm': '.webm',
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
    };
    const tipoBase = (mime) => String(mime || '').split(';')[0];

    const upload = multer({
        storage: multer.diskStorage({
            destination: pasta,
            filename: (req, file, cb) =>
                cb(null, crypto.randomBytes(16).toString('hex') + (EXTENSOES[tipoBase(file.mimetype)] || '.webm')),
        }),
        fileFilter: (req, file, cb) =>
            EXTENSOES[tipoBase(file.mimetype)] ? cb(null, true) : cb(new Error('tipo')),
        limits: { fileSize: 100 * 1024 * 1024 },
    });

    const receber = (req, res, next) =>
        upload.single('video')(req, res, (erro) => {
            if (erro) {
                return res.status(400).json({
                    mensagem: erro.code === 'LIMIT_FILE_SIZE'
                        ? 'Vídeo muito grande (máximo 100 MB)'
                        : 'Arquivo inválido. Envie um vídeo (mp4, webm ou mov).',
                });
            }
            next();
        });

    const apagarArquivo = (nome) =>
        fs.unlink(path.join(pasta, nome), () => {});

    const erroServidor = (res, erro, msg) => {
        console.log(erro);
        return res.status(500).json({ mensagem: msg });
    };

    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    app.post('/ensino/videos', receber, (req, res) => {
        const { id_usuario, palavra } = req.body;

        if (!req.file) return res.status(400).json({ mensagem: 'Nenhum vídeo enviado' });
        if (!palavra || !palavra.trim()) {
            apagarArquivo(req.file.filename);
            return res.status(400).json({ mensagem: 'Informe a palavra ou expressão ensinada' });
        }

        conexao.query(
            'SELECT id_pcd FROM pessoa_deficiencia WHERE id_usuario = ?',
            [id_usuario],
            (e, r) => {
                if (e) {
                    apagarArquivo(req.file.filename);
                    return erroServidor(res, e, 'Erro ao validar usuário');
                }
                if (r.length === 0) {
                    apagarArquivo(req.file.filename);
                    return res.status(403).json({ mensagem: 'Somente pessoas com deficiência podem publicar vídeos' });
                }
                conexao.query(
                    'INSERT INTO video_libras (id_pcd, palavra, arquivo) VALUES (?, ?, ?)',
                    [r[0].id_pcd, palavra.trim().slice(0, 100), req.file.filename],
                    (e2, ins) => {
                        if (e2) {
                            apagarArquivo(req.file.filename);
                            return erroServidor(res, e2, 'Erro ao salvar vídeo');
                        }
                        res.status(201).json({ mensagem: 'Vídeo publicado', id_video: ins.insertId });
                    }
                );
            }
        );
    });

    app.get('/ensino/videos/pcd/:idUsuario', (req, res) => {
        conexao.query(
            `SELECT v.id_video, v.palavra,
                    CONCAT('/uploads/videos/', v.arquivo) AS caminho,
                    DATE_FORMAT(v.criado_em, '%d/%m/%Y') AS data_publicacao
             FROM video_libras v
             JOIN pessoa_deficiencia p ON p.id_pcd = v.id_pcd
             WHERE p.id_usuario = ?
             ORDER BY v.criado_em DESC`,
            [req.params.idUsuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao carregar vídeos');
                res.json(r);
            }
        );
    });

    app.get('/ensino/videos/voluntario/:idUsuario', (req, res) => {
        conexao.query(
            `SELECT v.id_video, v.palavra,
                    CONCAT('/uploads/videos/', v.arquivo) AS caminho,
                    DATE_FORMAT(v.criado_em, '%d/%m/%Y') AS data_publicacao,
                    u.nome AS nome_professor
             FROM video_libras v
             JOIN pessoa_deficiencia p ON p.id_pcd = v.id_pcd
             JOIN usuarios u ON u.id_usuario = p.id_usuario
             JOIN candidatura_ensino c ON c.id_pcd = p.id_pcd
             JOIN solicitacao_aprender s
                  ON s.id_candidatura = c.id_candidatura AND s.status = 'aceita'
             JOIN voluntario vo ON vo.id_voluntario = s.id_voluntario
             WHERE vo.id_usuario = ?
             ORDER BY v.criado_em DESC`,
            [req.params.idUsuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao carregar vídeos');
                res.json(r);
            }
        );
    });

    app.delete('/ensino/videos/:id', (req, res) => {
        conexao.query(
            `SELECT v.arquivo FROM video_libras v
             JOIN pessoa_deficiencia p ON p.id_pcd = v.id_pcd
             WHERE v.id_video = ? AND p.id_usuario = ?`,
            [req.params.id, req.query.id_usuario],
            (e, r) => {
                if (e) return erroServidor(res, e, 'Erro ao validar vídeo');
                if (r.length === 0) return res.status(403).json({ mensagem: 'Vídeo não encontrado' });
                conexao.query('DELETE FROM video_libras WHERE id_video = ?', [req.params.id], (e2) => {
                    if (e2) return erroServidor(res, e2, 'Erro ao excluir vídeo');
                    apagarArquivo(r[0].arquivo);
                    res.json({ mensagem: 'Vídeo excluído' });
                });
            }
        );
    });
};