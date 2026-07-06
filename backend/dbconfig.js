const mysql = require('mysql2');

const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', //pode ser vazio ''
    database: 'sensebridge'
});

conexao.connect((erro) => {
    if (erro) {
        console.log('Erro ao conectar ao banco de dados:', erro);
        return;
    }
    console.log('Conexão bem-sucedida ao banco de dados.');
});

module.exports = conexao;