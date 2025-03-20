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

   createUser = async (matricula, nome_completo, postoGrad, senha) => {
      const query = 'INSERT INTO usuarios (matricula, nome_completo, posto_grad, senha_hash, criado_em) VALUES (?, ?, ?, ?, NOW())';
      try {
         matricula = matricula.toLowerCase().trim();
         const hashedPassword = await bcrypt.hash(senha.trim(), 10);
         await connection.execute(query, [
            matricula,
            nome_completo.trim(),
            postoGrad.trim(),
            hashedPassword,
         ]);
         return true;
      } catch (error) {
         console.error('Erro ao criar usuário:', error);
         throw error;
      }
   };
}

export default new LoginModel();