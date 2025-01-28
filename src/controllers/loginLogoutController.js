import loginLogoutModel from "../models/loginLogoutModel.js";

class LoginLogoutController {
    renderLoginForm = (_, res) => {
        res.render("login", { erro: "" });
    };

    login = async (req, res) => {
        const { user, senha } = req.body;
        console.log(`Tentativa de autenticação para usuário: ${user}`);
        try {
            const isAuthenticated = await loginLogoutModel.verifyUser(user, senha);
            if (isAuthenticated) {
                req.session.user = user.toLowerCase().trim();
                console.log(`Usuário autenticado com sucesso: ${user}`);
                res.redirect("painel");
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
                res.clearCookie('connect.sid');
                res.redirect("/login");
            }
        });
    };

    createUser = async (user, senha) => {
        try {
            await loginLogoutModel.createUser(user, senha);
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            throw error;
        }
    };
}

export default new LoginLogoutController();
