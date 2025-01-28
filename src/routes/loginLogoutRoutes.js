import express from "express";
import loginLogoutController from "../controllers/loginLogoutController.js";

const router = express.Router();

// Rota GET para exibir formulário de cadastro
router.get("/register", loginLogoutController.renderRegisterForm);

// Rota POST para processar criação de novo usuário
router.post("/register", loginLogoutController.createUser);

// Rota GET para exibir formulário de login
router.get("/login", loginLogoutController.renderLoginForm);

// Rota POST para autenticar credenciais de login
router.post("/login", loginLogoutController.login);

// Rota GET para encerrar sessão do usuário
router.get("/logout", loginLogoutController.logout);

export default router;