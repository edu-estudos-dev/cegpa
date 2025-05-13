import express from 'express';
import SolicitacaoController from '../controllers/solicitacaoController.js';

const router = express.Router();

// Rota para renderizar o formulário (GET /form-solicitacao)
router.get('/form-solicitacao', SolicitacaoController.renderSolicitacaoForm);

// Rota para processar o envio do formulário (POST /form-solicitacao)
router.post('/form-solicitacao', SolicitacaoController.createSolicitacao);

// Rota para exibir a tabela de solicitações (GET /tabela/solicitacao)
router.get('/tabela/solicitacao', SolicitacaoController.getAllSolicitacaoController);

// Rota para buscar uma solicitação por ID (GET /solicitacao/:id)
router.get('/solicitacao/:id', SolicitacaoController.getSolicitacaoById);

// Rota para atualizar a situação (PUT /solicitacao/:id/situacao)
router.put('/solicitacao/:id/situacao', SolicitacaoController.atualizarSituacao);

export default router;