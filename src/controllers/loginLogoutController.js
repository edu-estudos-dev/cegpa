import loginLogoutModel from '../models/loginLogoutModel.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Configuração do serviço de e-mail com o Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Usa TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verifica a conexão com o servidor SMTP ao iniciar
transporter.verify((error) => {
  if (error) {
    console.error('Erro ao verificar o transporter:', error);
  }
});

// Verifica a conexão com o servidor SMTP ao iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('Erro ao verificar o transporter:', error);
  } else {
    console.log('Transporter configurado com sucesso:', success);
  }
});

class LoginLogoutController {
  // Método para renderizar o form de login
  renderLoginForm = (req, res, success) => {
    res.render('login', { 
      erro: '', 
      success: success || '' 
    });
  };

  // Método para renderizar o form de registro
  renderRegisterForm = (req, res) => {
    res.render('register', { 
      erro: '', 
      success: '' 
    });
  };

  // Método para fazer o login
  login = async (req, res) => {
    const { matricula, senha } = req.body;
    const lowerCaseMatricula = matricula.toLowerCase().trim();
    
    try {
      const user = await loginLogoutModel.verifyUser(lowerCaseMatricula, senha);
      
      if (user) {
        req.session.user = {
          matricula: user.matricula,
          nome_completo: user.nome_completo,
          posto_grad: user.posto_grad,
          role: user.role
        };
        console.log('Sessão definida com sucesso:', req.session.user);

        req.session.save((err) => {
          if (err) {
            console.error('Erro ao salvar sessão:', err);
            return res.status(500).render('login', { 
              erro: 'Erro interno ao iniciar sessão' 
            });
          }
          console.log('Sessão salva, redirecionando para /painel');
          res.redirect('/painel');
        });
      } else {
        res.render('login', { 
          erro: 'Credenciais inválidas' 
        });
      }
    } catch (error) {
      console.error('Erro no processo de login:', error);
      res.status(500).render('login', {
        erro: 'Erro interno no servidor'
      });
    }
  };

  // Método para fazer o logout
  logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).send('Erro ao fazer logout');
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  };

  // Método criar um usuário
  createUser = async (req, res) => {
    const { matricula, nome_completo, postoGrad, senha, email } = req.body;
    
    try {
      if (!matricula || !nome_completo || !postoGrad || !senha || !email) {
        return res.render('register', {
          erro: 'Todos os campos são obrigatórios',
          success: ''
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.render('register', {
          erro: 'Formato de e-mail inválido',
          success: ''
        });
      }

      await loginLogoutModel.createUser(
        matricula.toLowerCase().trim(),
        nome_completo.trim(),
        postoGrad.trim(),
        senha,
        email.toLowerCase().trim()
      );

      res.render('register', {
        success: 'Cadastro realizado! Redirecionando...',
        erro: ''
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      let errorMessage = 'Erro no cadastro';
      if (error.message.includes('Duplicate entry')) {
        errorMessage = 'Matrícula ou e-mail já cadastrados';
      }
      res.render('register', {
        erro: errorMessage,
        success: ''
      });
    }
  };

    // Método para renderizar o form de recuperação de senha
  renderForgotPasswordForm = (req, res) => {
    res.render('forgot-password', {
      erro: req.query.erro || '',
      success: req.query.success || ''
    });
  };

  // Método para processa a solicitação de recuperação de senha
  handleForgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
      const user = await loginLogoutModel.findUserByEmail(email);
      if (!user) {
        return res.render('forgot-password', {
          erro: 'E-mail não encontrado',
          success: ''
        });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenExpires = Date.now() + 3600000;

      await loginLogoutModel.setResetToken(user.matricula, resetToken, resetTokenExpires);

      const resetUrl = `http://localhost:8080/reset-password/${resetToken}`;
      const mailOptions = {
        from: `"Suporte do Sistema" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Redefinição de Senha',
        html: `
          <h3>Redefina sua senha</h3>
          <p>Acesse este link para redefinir sua senha:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p><em>O link expira em 1 hora</em></p>
        `
      };

      await transporter.sendMail(mailOptions);
      res.render('forgot-password', {
        success: 'Instruções enviadas para seu e-mail',
        erro: ''
      });
    } catch (error) {
      console.error('Erro na recuperação:', error);
      let errorMessage = 'Falha ao processar solicitação';
      if (error.code === 'EAUTH') {
        errorMessage = 'Erro de autenticação: verifique o email e a senha no .env';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Erro de conexão: verifique sua rede ou o servidor SMTP';
      }
      res.render('forgot-password', {
        erro: errorMessage,
        success: ''
      });
    }
  };

  /// Método para resetar a senha
  renderResetPasswordForm = async (req, res) => {
    const { token } = req.params;
    
    try {
      const user = await loginLogoutModel.findUserByResetToken(token);
      
      if (!user || new Date(user.reset_token_expires).getTime() < Date.now()) {
        return res.render('reset-password', {
          token,
          erro: 'Link inválido ou expirado',
          success: ''
        });
      }

      res.render('reset-password', {
        token,
        erro: '',
        success: ''
      });
    } catch (error) {
      console.error('Erro ao validar token:', error);
      res.render('reset-password', {
        erro: 'Erro ao processar solicitação',
        success: ''
      });
    }
  };

  // Método para resetar a senha
  handleResetPassword = async (req, res) => {
    const { token } = req.params;
    const { senha } = req.body;
    
    try {
      if (senha.trim().length < 6) {
        return res.render('reset-password', {
          token,
          erro: 'A senha deve ter no mínimo 6 caracteres',
          success: ''
        });
      }

      const user = await loginLogoutModel.findUserByResetToken(token);
      
      if (!user || new Date(user.reset_token_expires).getTime() < Date.now()) {
        return res.render('reset-password', {
          token,
          erro: 'Link inválido ou expirado',
          success: ''
        });
      }

      const hashedPassword = await bcrypt.hash(senha.trim(), 10);
      await loginLogoutModel.updatePassword(user.matricula, hashedPassword);
      await loginLogoutModel.clearResetToken(user.matricula);

      req.session.destroy(() => {
        res.render('login', {
          success: 'Senha redefinida com sucesso! Faça login',
          erro: ''
        });
      });
    } catch (error) {
      console.error('Erro na redefinição:', error);
      res.render('reset-password', {
        token,
        erro: 'Erro ao atualizar senha',
        success: ''
      });
    }
  };
}

export default new LoginLogoutController();