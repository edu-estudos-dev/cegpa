import connection from '../../db_config/connection.js'; // Ajuste o caminho conforme sua estrutura

const isAuthenticated = async (req, res, next) => {
   console.log('Verificando sessão no middleware:', req.session.user);
   if (req.session && req.session.user) {
      try {
         const matricula = req.session.user.matricula.toLowerCase().trim();
         const query = `SELECT matricula, nome_completo, posto_grad FROM usuarios WHERE matricula = ?`;
         const [results] = await connection.execute(query, [matricula]);

         if (results.length > 0) {
            // Populando req.user com as informações do usuário
            req.user = {
               matricula: results[0].matricula,
               nome_completo: results[0].nome_completo,
               posto_grad: results[0].posto_grad,
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