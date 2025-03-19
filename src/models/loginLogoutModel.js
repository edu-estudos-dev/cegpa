import bcrypt from 'bcrypt';
import connection from '../../db_config/connection.js';

class LoginModel {
   verifyUser = async (matricula, senha) => {
      const query = `SELECT * FROM usuarios WHERE matricula = ?`;
      matricula = matricula.toLowerCase().trim();
      console.log('Verificando matrícula:', matricula); // Log da matrícula
      try {
          const [results] = await connection.execute(query, [matricula]);
          console.log('Resultados do banco:', results); // Log dos dados retornados
          if (results.length > 0) {
              const hashedPassword = results[0]['senha_hash'];
              console.log('Senha hash do banco:', hashedPassword); // Log da senha hash
              const match = await bcrypt.compare(senha.trim(), hashedPassword);
              console.log('Senha corresponde:', match); // Log do resultado da comparação
              return match;
          }
          console.log('Matrícula não encontrada');
          return false;
      } catch (error) {
          console.error('Erro ao verificar usuário:', error);
          throw error;
      }
  };

    createUser = async (matricula, nome_completo, senha) => { // Adicionado 'nome_completo'
        const query = 'INSERT INTO usuarios (matricula, nome_completo, senha_hash) VALUES (?, ?, ?)';
        try {
            matricula = matricula.toLowerCase().trim();
            const hashedPassword = await bcrypt.hash(senha.trim(), 10);
            await connection.execute(query, [matricula, nome_completo.trim(), hashedPassword]);
            return true;
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    };
}

export default new LoginModel();