import express from 'express';
import estoqueController from '../controllers/estoqueController.js';
import isAuthenticated from '../middleware/auth.js'; // Middleware de autenticação
import checkRole from '../middleware/checkRole.js'; // Middleware de permissão

const router = express.Router();

/* ********************************************************************************
                  Rotas para a ENTRADA de itens no Estoque
*********************************************************************************/

// Rota para renderizar o formulário de edição (apenas admin)
router.get('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.renderEditForm);

// Rota para atualizar os dados do item (apenas admin)
router.put('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.update);

// Rota para listar apenas os itens novos do estoque
// router.get('/itens-novos', estoqueController.getItensNovos);

// Rota para renderizar a tabela apenas os itens novos do estoque
router.get('/tabela/itens-novos', estoqueController.showItensNovos);

// Rota para listar apenas os itens usados do estoque
router.get('/itens-usados', estoqueController.getItensUsados);

// Rota para renderizar a tabela apenas os itens usados do estoque
router.get('/tabela/itens-usados', estoqueController.showItensUsados);

// Rota para renderizar o formulário de entrada
router.get('/entrada', estoqueController.renderEntradaForm);

// Rota para inserir dados no estoque
router.post('/entrada', estoqueController.create);

// Rota para obter o último tombo
router.get('/ultimo-tombo', estoqueController.fetchUltimoTombo);

// Rota para mostrar tabela com estoque atual (acessível a todos autenticados)
router.get('/tabela/estoqueatual', isAuthenticated, estoqueController.getAllEstoque);

// Rota para visualizar item específico (entrada)
router.get('/visualizar/:id', estoqueController.visualizarItem);

// Rota para mostrar quantidade única de itens no estoque
router.get('/qtde-unica', estoqueController.getQtdeUnicaEstoque);

// Rota para excluir um item do estoque (apenas admin)
router.delete('/excluir/:id', isAuthenticated, checkRole(['admin']), estoqueController.destroy);


/* ********************************************************************************
                  Rotas para a SAÍDA de itens no Estoque
*********************************************************************************/

// Rota para renderizar o formulário de SAÍDA
router.get('/saida', estoqueController.renderSaidaForm);

// Rota para mostrar tabela com itens pagos
router.get('/estoque/itenspagos', estoqueController.getAllItensPagos);

// Rota para buscar itens disponíveis
router.get('/api/itens-disponiveis', estoqueController.fetchItensDisponiveis);

// Rota para registrar a saída de itens
router.post('/saida', estoqueController.registrarSaida);

// Rota para gerar relatório da tabela de estoque (PDF ou Excel)
router.get('/relatorio/geral', estoqueController.generatePDF);

// Rota para gerar relatório de itens novos (PDF ou Excel)
router.get('/relatorio/novos', estoqueController.generatePDFNovos);

// Rota para gerar relatório de itens usados (PDF ou Excel)
router.get('/relatorio/usados', estoqueController.generatePDFUsados);

// Rota para gerar relatório de itens pagos (PDF ou Excel)
router.get('/relatorio/itens-pagos', estoqueController.generatePDFItensPagos);

// Rota para visualizar um item pago específico
router.get('/visualizar/itempago/:id', estoqueController.visualizarItemPago);

// Rota para buscar informações de um tombo (restaurada para Pesquisa Avançada)
router.get('/fetch-info-tombo', estoqueController.fetchInfoTombo);

export default router;