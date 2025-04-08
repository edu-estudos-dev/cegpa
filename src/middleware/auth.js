// import connection from '../../db_config/connection.js';

// const isAuthenticated = async (req, res, next) => {
//   if (req.session && req.session.user) {
//     try {
//       const matricula = req.session.user.matricula.toLowerCase().trim();
//       const query = `SELECT matricula, nome_completo, posto_grad FROM usuarios WHERE matricula = ?`;
//       const [results] = await connection.execute(query, [matricula]);

//       if (results.length > 0) {
//         req.user = {
//           matricula: results[0].matricula,
//           nome_completo: results[0].nome_completo,
//           posto_grad: results[0].posto_grad,
//         };
//         console.log('Usuário autenticado:', req.user);
//         return next();
//       } else {
//         console.log('Usuário não encontrado no banco de dados, redirecionando para /login');
//         return res.redirect('/login');
//       }
//     } catch (error) {
//       console.error('Erro ao buscar informações do usuário:', error);
//       req.user = req.session.user; // Fallback para dados da sessão
//       console.log('Usando dados da sessão como fallback:', req.user);
//       return next(); // Continua mesmo com erro, mas pode ser ajustado para redirecionar
//     }
//   } else {
//     console.log('Usuário não autenticado, redirecionando para /login');
//     res.redirect('/login');
//   }
// };

// export default isAuthenticated;

import connection from '../../db_config/connection.js';

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('Usuário autenticado:', req.user);
    return next();
  } else {
    console.log('Sessão não encontrada, redirecionando para /login');
    return res.redirect('/login');
  }
};

export default isAuthenticated;