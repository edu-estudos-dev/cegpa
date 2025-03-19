import connection from '../../db_config/connection.js'; // Ajuste o caminho conforme sua estrutura

const isAuthenticated = async (req, res, next) => {
   console.log('Verificando sessão no middleware:', req.session.matricula);
   if (req.session && req.session.matricula) {
      try {
         const matricula = req.session.matricula.toLowerCase().trim();
         const query = `SELECT matricula, nome_completo FROM usuarios WHERE matricula = ?`;
         const [results] = await connection.execute(query, [matricula]);

         if (results.length > 0) {
            // Populando req.user com as informações do usuário
            req.user = {
               mf: results[0].matricula, // Matrícula funcional
               nome_completo: results[0].nome_completo, // Nome completo
            };
            console.log('Usuário autenticado:', req.user);
            return next(); // Prossegue para a próxima função
         } else {
            console.log('Usuário não encontrado no banco de dados');
            res.redirect('/login');
         }
      } catch (error) {
         console.error('Erro ao buscar informações do usuário:', error);
         res.redirect('/login');
      }
   } else {
      console.log('Usuário não autenticado, redirecionando para /login');
      res.redirect('/login');
   }
};

export default isAuthenticated;
