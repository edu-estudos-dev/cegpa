const checkRole = (allowedRoles) => {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        console.log('Usuário não autenticado, redirecionando para /login');
        return res.redirect('/login');
      }
  
      const userRole = req.session.user.role;
      if (allowedRoles.includes(userRole)) {
        console.log(`Acesso permitido para ${userRole} na rota ${req.path}`);
        return next();
      } else {
        console.log(`Acesso negado para ${userRole} na rota ${req.path}`);
        return res.status(403).render('403', { erro: 'Você não tem permissão para acessar esta página' });
      }
    };
  };
  
  export default checkRole;