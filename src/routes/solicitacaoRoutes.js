import express from 'express';
import SolicitacaoController from '../controllers/solicitacaoController.js';
import isAuthenticated from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

// Rota para renderizar o formulário de cadastro
router.get('/form-solicitacao', isAuthenticated, SolicitacaoController.renderSolicitacaoForm);

// Rota para processar o envio do formulário de cadastro
router.post('/form-solicitacao', isAuthenticated, SolicitacaoController.createSolicitacao);

// Rota para exibir a tabela de solicitações
router.get('/tabela/solicitacao', isAuthenticated, SolicitacaoController.getAllSolicitacaoController);

// Rota para buscar uma solicitação por ID
router.get('/:id', isAuthenticated, SolicitacaoController.getSolicitacaoById);

// Rota para atualizar a situação
router.put('/:id/situacao', isAuthenticated, SolicitacaoController.atualizarSituacao);

// Rota para renderizar o formulário de edição
router.get('/editar/:id', isAuthenticated, checkRole(['admin']), SolicitacaoController.renderEditForm);

// Rota para atualizar uma solicitação
router.put('/editar/:id', isAuthenticated, checkRole(['admin']), SolicitacaoController.updateSolicitacao);

// Rota para excluir uma solicitação
router.delete('/excluir/:id', isAuthenticated, checkRole(['admin']), SolicitacaoController.destroy);

export default router;