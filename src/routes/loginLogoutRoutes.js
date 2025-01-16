import express from "express";
import loginLogoutController from "../controllers/loginLogoutController.js";

const router = express.Router();

// Rota para renderizar o formulário de login
router.get("/login", (req, res) => {
  console.log("Acessando rota /login");
  loginLogoutController.renderLoginForm(req, res);
});

// Rota para autenticar o usuário
router.post("/login", (req, res) => {
  console.log("Acessando rota /login com POST");
  loginLogoutController.login(req, res);
});

// Rota para fazer logout
router.get("/logout", (req, res) => {
  console.log("Acessando rota /logout");
  loginLogoutController.logout(req, res);
});

export default router;
