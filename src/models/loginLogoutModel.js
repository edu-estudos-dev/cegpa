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

  // Método para obter o histórico de movimentação
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
