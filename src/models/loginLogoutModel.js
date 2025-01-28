import bcrypt from "bcrypt";
import connection from "../../db_config/connection.js";

class LoginModel {
  verifyUser = async (nome, senha) => {
    const query = `SELECT * FROM usuarios WHERE nome = ?`;
    nome = nome.toLowerCase().trim();
    console.log(`Verificando usuário no banco de dados: ${nome}`);
    try {
      const [results] = await connection.execute(query, [nome]);
      console.log(`Resultados da consulta: ${JSON.stringify(results)}`);
      if (results.length > 0) {
        const hashedPassword = results[0]["senha_hash"];
        const match = await bcrypt.compare(senha.trim(), hashedPassword);
        console.log(
          `Comparação de senha: ${match ? "Senha válida" : "Senha inválida"}`
        );
        return match;
      }
      console.log("Usuário não encontrado");
      return false; // Usuário não encontrado
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      throw error;
    }
  };

  createUser = async (nome, senha) => {
    const query = "INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)";
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
}

export default new LoginModel();
