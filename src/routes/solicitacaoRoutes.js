import express from 'express';
import SolicitacaoController from '../controllers/solicitacaoController.js';

const router = express.Router();

// Rota para renderizar o formulário para cadastrar solicitação de requisição
router.get('/form-solicitacao', SolicitacaoController.renderSolicitacaoForm);

// Rota para inserir dados no estoque
router.post('/cadastrar-solicitacao', SolicitacaoController.createSolicitacao);

export default router;
