import bcrypt from 'bcrypt';
import connection from "../../db_config/connection.js";

class LoginModel {
    verifyUser = async (nome, senha) => {
        const query = `SELECT * FROM usuarios WHERE nome = ?`;
        try {
            nome = nome.toLowerCase().trim();
            const [results] = await connection.execute(query, [nome]);
            if (results.length > 0) {
                const hashedPassword = results[0]['senha_hash'];
                return await bcrypt.compare(senha.trim(), hashedPassword);
            }
            return false; // Usuário não encontrado
        } catch (error) {
            console.error("Erro ao verificar usuário:", error);
            throw error;
        }
    };

    getHistoricoMovimentacao = async () => {
        const query = `
        SELECT 
          'entrada' AS tipo, 
          data_de_entrada AS data, 
          descricao, 
          quantidade 
        FROM estoqueatual 
        WHERE pago = FALSE
        UNION ALL
        SELECT 
          'saida' AS tipo, 
          data_de_saida AS data, 
          descricao, 
          quantidade 
        FROM itenspagos
        ORDER BY data DESC;
        `;
        try {
            const [results] = await connection.execute(query);
            return results;
        } catch (error) {
            console.error("Erro ao buscar histórico de movimentação:", error);
            throw error;
        }
    };

    createUser = async (nome, senha) => {
        const query = `INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)`;
        try {
            nome = nome.toLowerCase().trim();
            const hashedPassword = await bcrypt.hash(senha.trim(), 10);
            await connection.execute(query, [nome, hashedPassword]);
            return true;
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            throw error;
        }
    };
}

export default new LoginModel();
