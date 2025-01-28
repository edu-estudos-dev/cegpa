import express from "express";
import loginLogoutController from "../controllers/loginLogoutController.js";

const router = express.Router();

router.get("/register", (req, res) => {
    res.render("register", { erro: "" });
});

router.post("/register", async (req, res) => {
    const { user, senha } = req.body;
    try {
        await loginLogoutController.createUser(user, senha);
        res.redirect("/login");
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.render("register", { erro: "Erro ao criar usuário." });
    }
});

router.get("/login", (req, res) => {
    console.log("Acessando rota /login");
    loginLogoutController.renderLoginForm(req, res);
});

router.post("/login", async (req, res) => {
    console.log("Acessando rota /login com POST");
    await loginLogoutController.login(req, res);
});

router.get("/logout", (req, res) => {
    console.log("Acessando rota /logout");
    loginLogoutController.logout(req, res);
});

export default router;
