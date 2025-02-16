import express from "express";
import sequenciaController from "../controllers/sequenciaController.js";

const router = express.Router();

router.get('/proxima-sequencia', sequenciaController.getProximaSequencia);
router.post('/incrementar-sequencia', sequenciaController.incrementarSequencia);

export default router;
