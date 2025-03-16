import express from 'express';
import estoqueController from '../controllers/estoqueController.js';

const router = express.Router();

/* ********************************************************************************
                  Rotas para a ENTRADA de itens no Estoque
*********************************************************************************/

// Rota para listar apenas os itens novos do estoque
router.get('/itens-novos', estoqueController.getItensNovos);

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

// Rota para mostrar tabela com estoque atual
router.get('/tabela/estoqueatual', estoqueController.getAllEstoque);

// Rota para visualizar item específico (entrada)
router.get('/visualizar/:id', estoqueController.visualizarItem);


// Rota para mostrar quantidade única de itens no estoque
router.get('/qtde-unica', estoqueController.getQtdeUnicaEstoque);

// Rota para excluir um item do estoque
router.delete('/excluir/:id', estoqueController.destroy);

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

// Rota para gerar PDF da tabela de estoque
router.get('/generate-pdf', estoqueController.generatePDF);
router.get('/generate-pdf-novos', estoqueController.generatePDFNovos);
router.get('/generate-pdf-usados', estoqueController.generatePDFUsados);

// Rota para visualizar um item pago específico
router.get('/visualizar/itempago/:id', estoqueController.visualizarItemPago);

export default router;