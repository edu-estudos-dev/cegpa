import express from "express";
import loginLogoutController from "../controllers/loginLogoutController.js";

const router = express.Router();

// Rota: GET /register - Exibe o formulário de cadastro
router.get("/register", loginLogoutController.renderRegisterForm);

// Rota: POST /register - Processa a criação de um novo usuário
router.post("/register", loginLogoutController.createUser);

// Rota: GET /login - Exibe o formulário de login
router.get("/login", loginLogoutController.renderLoginForm);

// Rota: POST /login - Autentica as credenciais de login do usuário
router.post("/login", loginLogoutController.login);

// Rota: GET /logout - Encerra a sessão do usuário
router.get("/logout", loginLogoutController.logout);

// Rota: GET /forgot-password - Exibe o formulário de recuperação de senha
router.get("/forgot-password", loginLogoutController.renderForgotPasswordForm);

// Rota: POST /forgot-password - Processa a solicitação de recuperação de senha
router.post("/forgot-password", loginLogoutController.handleForgotPassword);

// Rota: GET /reset-password/:token - Exibe o formulário de redefinição de senha
router.get("/reset-password/:token", loginLogoutController.renderResetPasswordForm);

// Rota: POST /reset-password/:token - Processa a redefinição de senha
router.post("/reset-password/:token", loginLogoutController.handleResetPassword);

export default router;