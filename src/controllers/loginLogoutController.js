import loginLogoutModel from "../models/loginLogoutModel.js";

class LoginLogoutController {
  renderLoginForm = (_, res) => {
    res.render("login", { erro: "" }); // Renderiza a view de login com erro vazio
  };

  authenticate = async (req, res) => {
    const { user, senha } = req.body;
    console.log(`Tentativa de autenticação para usuário: ${user}`);
    try {
      const isAuthenticated = await loginLogoutModel.verifyUser(user, senha);
      if (isAuthenticated) {
        req.session.user = user; // Define a sessão de usuário
        console.log(`Usuário autenticado com sucesso: ${user}`);
        res.redirect("/tabela"); // Redireciona para a página inicial após login bem-sucedido
      } else {
        console.log(`Autenticação falhou para usuário: ${user}`);
        res.render("login", { erro: "Usuário ou senha inválidos" });
      }
    } catch (error) {
      console.error("Erro ao autenticar usuário:", error);
      res.status(500).send("Erro ao autenticar usuário.");
    }
  };

  logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Erro ao fazer logout:", err);
        res.status(500).send("Erro ao fazer logout.");
      } else {
        console.log("Usuário deslogado com sucesso");
        res.redirect("/login"); // Redireciona para a página de login após logout
      }
    });
  };
}

export default new LoginLogoutController();
