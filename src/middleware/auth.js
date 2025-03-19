const isAuthenticated = (req, res, next) => {
   console.log('Verificando sessão no middleware:', req.session.matricula); // Log para depuração
   if (req.session && req.session.matricula) {
       return next(); // O usuário está autenticado, prossegue para a próxima função
   } else {
       console.log('Usuário não autenticado, redirecionando para /login');
       res.redirect('/login'); // Redireciona para a página de login se não estiver autenticado
   }
};

export default isAuthenticated;