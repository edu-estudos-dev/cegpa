import bcrypt from 'bcrypt';
import connection from '../../db_config/connection.js';

class LoginModel {
    // Verifica as credenciais do usuário no banco de dados
    // Retorna true/false conforme a validade da autenticação
    verifyUser = async (nome, senha) => {
        const query = `SELECT * FROM usuarios WHERE nome = ?`;
        nome = nome.toLowerCase().trim();
        try {
            const [results] = await connection.execute(query, [nome]);
            if (results.length > 0) {
                const hashedPassword = results[0]['senha_hash'];
                const match = await bcrypt.compare(
                    senha.trim(),
                    hashedPassword
                );
                return match;
            }
            console.log('Usuário não encontrado');
            return false; // Usuário não encontrado
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            throw error;
        }
    };

    // Cria novo usuário com senha hasheada no banco de dados
    // Retorna true em caso de sucesso ou lança exceção
    createUser = async (nome, senha) => {
        const query = 'INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)';
        try {
            nome = nome.toLowerCase().trim();
            const hashedPassword = await bcrypt.hash(senha.trim(), 10);
            await connection.execute(query, [nome, hashedPassword]);
            return true;
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    };
}

export default new LoginModel();
