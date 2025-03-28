import bcrypt from 'bcrypt';
import connection from '../../db_config/connection.js';

class LoginModel {
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
               // Return the user object with all necessary fields
               return {
                  matricula: user.matricula,
                  nome_completo: user.nome_completo,
                  posto_grad: user.posto_grad,
               };
            }
         }
         console.log('Matrícula não encontrada ou senha incorreta');
         return null;
      } catch (error) {
         console.error('Erro ao verificar usuário:', error);
         throw error;
      }
   };

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
          nome_completo.trim(),
          postoGrad.trim(),
          hashedPassword,
          email.toLowerCase().trim()
        ]);
        
        return true;
      } catch (error) {
        console.error('Erro no Model:', error);
        throw error; // Apenas propague o erro
      }
    };

   
   findUserByEmail = async (email) => {
      const query = 'SELECT * FROM usuarios WHERE email = ?';
      const [results] = await connection.execute(query, [email]);
      return results[0];
    };
  
    setResetToken = async (matricula, token, expires) => {
      const query = 'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE matricula = ?';
      await connection.execute(query, [token, new Date(expires), matricula]);
    };
  
    findUserByResetToken = async (token) => {
      const query = 'SELECT * FROM usuarios WHERE reset_token = ?';
      const [results] = await connection.execute(query, [token]);
      return results[0];
    };
  
    updatePassword = async (matricula, newPassword) => {
      const query = 'UPDATE usuarios SET senha_hash = ? WHERE matricula = ?';
      await connection.execute(query, [newPassword, matricula]);
    };
  
    clearResetToken = async (matricula) => {
      const query = 'UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE matricula = ?';
      await connection.execute(query, [matricula]);
    };
}

export default new LoginModel();