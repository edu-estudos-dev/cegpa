import connection from "../../db_config/connection.js";

class LoginModel {
  verifyUser = async (nome, senha) => {
    const query = `SELECT * FROM usuarios WHERE nome = ? AND senha = ?`;
    try {
      const [results] = await connection.execute(query, [nome, senha]);
      return results.length > 0; // Verifica se encontrou um usuário com o nome e senha fornecidos
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      throw error;
    }
  };
}

export default new LoginModel();
