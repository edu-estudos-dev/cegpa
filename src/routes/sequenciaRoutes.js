import express from "express";
import sequenciaController from "../controllers/sequenciaController.js";

const router = express.Router();

// Gera novo termo de responsabilidade
router.get('/gerar-termo', sequenciaController.gerarTermoResponsabilidade);

// Consulta sequência por ano (opcional)
router.get('/consultar/:ano', sequenciaController.consultarSequencia);

export default router;