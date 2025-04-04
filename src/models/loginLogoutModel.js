import bcrypt from 'bcrypt';
import connection from '../../db_config/connection.js';

class LoginModel {
  // Método: verifyUser - Verifica se o usuário existe e se a senha está correta
  verifyUser = async (matricula, senha) => {
    const query = `SELECT * FROM usuarios WHERE matricula = ?`;
    matricula = matricula.toLowerCase().trim();
    try {
      const [results] = await connection.execute(query, [matricula]);
      if (results.length > 0) {
        const user = results[0];
        const hashedPassword = user['senha_hash'];
        const match = await bcrypt.compare(senha.trim(), hashedPassword);
        if (match) {
          return {
            matricula: user.matricula,
            nome_completo: user.nome_completo,
            posto_grad: user.posto_grad,
            role: user.role // Adiciona o role ao objeto retornado
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      throw error;
    }
  };

  // Método: createUser - Cria um novo usuário no banco de dados
  createUser = async (matricula, nome_completo, postoGrad, senha, email) => {
    const query = `
      INSERT INTO usuarios 
        (matricula, nome_completo, posto_grad, senha_hash, email, criado_em) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    try {
      matricula = matricula.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(senha.trim(), 10);
      await connection.execute(query, [
        matricula,
        nome_completo.trim().toUpperCase(),
        postoGrad.trim().toUpperCase(),
        hashedPassword,
        email.toLowerCase().trim()
      ]);
      return true;
    } catch (error) {
      console.error('Erro no Model:', error);
      throw error;
    }
  };

  // Método: findUserByEmail - Busca um usuário pelo email
  findUserByEmail = async (email) => {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [results] = await connection.execute(query, [email]);
    return results[0];
  };

  // Método: setResetToken - Define o token de redefinição de senha e sua expiração
  setResetToken = async (matricula, token, expires) => {
    const query = 'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE matricula = ?';
    await connection.execute(query, [token, new Date(expires), matricula]);
  };

  // Método: findUserByResetToken - Busca um usuário pelo token de redefinição
  findUserByResetToken = async (token) => {
    const query = 'SELECT * FROM usuarios WHERE reset_token = ?';
    const [results] = await connection.execute(query, [token]);
    return results[0];
  };

  // Método: updatePassword - Atualiza a senha do usuário
  updatePassword = async (matricula, newPassword) => {
    const query = 'UPDATE usuarios SET senha_hash = ? WHERE matricula = ?';
    await connection.execute(query, [newPassword, matricula]);
  };

  // Método: clearResetToken - Limpa o token de redefinição de senha
  clearResetToken = async (matricula) => {
    const query = 'UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE matricula = ?';
    await connection.execute(query, [matricula]);
  };
}

export default new LoginModel();