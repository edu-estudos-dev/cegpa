import loginLogoutModel from '../models/loginLogoutModel.js';

class LoginLogoutController {
   renderLoginForm = (_, res, success) => {
      res.render('login', { erro: '', success: success || '' });
   };

   renderRegisterForm = (req, res) => {
      res.render('register', { erro: '', success: '' });
   };

   login = async (req, res) => {
      const { matricula, senha } = req.body;
      const lowerCaseMatricula = matricula.toLowerCase().trim();
      console.log('Tentativa de login - Matrícula:', lowerCaseMatricula);
      try {
         const user = await loginLogoutModel.verifyUser(lowerCaseMatricula, senha);
         console.log('Resultado da autenticação:', user);
         if (user) {
            // Store user data in the session
            req.session.user = {
               matricula: user.matricula,
               nome_completo: user.nome_completo,
               posto_grad: user.posto_grad,
            };
            // Also populate req.user for consistency
            req.user = req.session.user;
            console.log('Sessão iniciada para:', req.session.user);
            // Salvar a sessão explicitamente antes do redirecionamento
            req.session.save((err) => {
               if (err) {
                  console.error('Erro ao salvar sessão:', err);
                  return res
                     .status(500)
                     .render('login', { erro: 'Erro ao salvar sessão' });
               }
               res.redirect('/painel');
            });
         } else {
            console.log('Autenticação falhou, renderizando login novamente');
            res.render('login', { erro: 'Matrícula ou senha inválidos' });
         }
      } catch (error) {
         console.error('Erro ao autenticar usuário:', error);
         res.status(500).render('login', {
            erro: 'Erro interno ao autenticar. Tente novamente.',
         });
      }
   };

   logout = (req, res) => {
      req.session.destroy((err) => {
         if (err) {
            console.error('Erro ao fazer logout:', err);
            res.status(500).send('Erro ao fazer logout.');
         } else {
            console.log('Usuário deslogado com sucesso');
            res.clearCookie('connect.sid');
            res.redirect('/login');
         }
      });
   };

   createUser = async (req, res) => {
      const { matricula, nome_completo, postoGrad, senha } = req.body;
      try {
         await loginLogoutModel.createUser(
            matricula.toLowerCase().trim(),
            nome_completo.trim(),
            postoGrad.trim(),
            senha
         );
         res.render('register', {
            success:
               'Usuário cadastrado com sucesso! Redirecionando para login...',
            erro: '',
         });
      } catch (error) {
         console.error('Erro ao criar usuário:', error);
         res.render('register', {
            erro: 'Erro ao criar usuário.',
            success: '',
         });
      }
   };
}

export default new LoginLogoutController();