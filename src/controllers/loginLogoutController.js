import loginLogoutModel from "../models/loginLogoutModel.js";

class LoginLogoutController {
  // Exibe formulário de login com mensagens de status

  renderLoginForm = (_, res, success) => {
    res.render("login", { erro: "", success: success || "" });
  };

  // Exibe formulário de registro com mensagens de status
  renderRegisterForm = (req, res) => {
    res.render("register", { erro: "", success: "" });
  };
  
  // Autentica credenciais e inicia sessão do usuário
  login = async (req, res) => {
    const { user, senha } = req.body;
    const lowerCaseUser = user.toLowerCase().trim();
    try {
      const isAuthenticated = await loginLogoutModel.verifyUser(
        lowerCaseUser,
        senha
      );
      if (isAuthenticated) {
        req.session.user = lowerCaseUser;
        res.redirect("painel");
      } else {
        res.render("login", { erro: "Usuário ou senha inválidos" });
      }
    } catch (error) {
      console.error("Erro ao autenticar usuário:", error);
      res.status(500).send("Erro ao autenticar usuário.");
    }
  };

  // Encerra sessão do usuário e limpa cookies
  logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao fazer logout:", err);
        res.status(500).send("Erro ao fazer logout.");
      } else {
        console.log("Usuário deslogado com sucesso");
        res.clearCookie("connect.sid");
        res.redirect("/login");
      }
    });
  };

  // Processa criação de novo usuário no banco de dados
  createUser = async (req, res) => {
    const { user, senha } = req.body;
    try {
      await loginLogoutModel.createUser(user.toLowerCase().trim(), senha);
      res.render("register", {
        success: "Usuário cadastrado com sucesso! Redirecionando para login...",
        erro: ""
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.render("register", { 
        erro: "Erro ao criar usuário.", 
        success: "" 
      });
    }
  };
}

export default new LoginLogoutController();
