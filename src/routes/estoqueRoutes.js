import express from 'express';
import estoqueController from '../controllers/estoqueController.js';
import saidaTomboController from '../controllers/saidaTomboController.js'; // Novo controlador para saída de tombos
import isAuthenticated from '../middleware/auth.js'; // Middleware de autenticação
import checkRole from '../middleware/checkRole.js'; // Middleware de permissão

const router = express.Router();

/* ********************************************************************************
                  Rotas para a ENTRADA de Itens no Estoque
*********************************************************************************/

// Nome: Renderizar Formulário de Entrada
router.get('/entrada', estoqueController.renderEntradaForm);

// Nome: Inserir Dados no Estoque
router.post('/entrada', estoqueController.create);

// Nome: Obter Último Tombo
router.get('/ultimo-tombo', estoqueController.fetchUltimoTombo);

// Nome: Visualizar Item Específico (Entrada)
router.get('/visualizar/:id', estoqueController.visualizarItem);

// Nome: Editar Item (Apenas Admin)
router.get('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.renderEditForm);

// Nome: Atualizar Item (Apenas Admin)
router.put('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.update);

// Nome: Excluir Item do Estoque (Apenas Admin)
router.delete('/excluir/:id', isAuthenticated, checkRole(['admin']), estoqueController.destroy);

/* ********************************************************************************
                  Rotas para a SAÍDA de Itens no Estoque
*********************************************************************************/

// Nome: Renderizar Formulário de Saída
router.get('/saida', estoqueController.renderSaidaForm);

// Nome: Registrar Saída de Itens
router.post('/saida', estoqueController.registrarSaida);

// Nome: Buscar Itens Disponíveis
router.get('/api/itens-disponiveis', estoqueController.fetchItensDisponiveis);

// Nome: Verificar Termo de Responsabilidade Existente
router.get('/verificar-termo-existente', estoqueController.verificarTermoExistente);

// Nome: Reverter Saída de Item (Apenas Admin)
router.delete('/reverter-saida/:id', isAuthenticated, checkRole(['admin']), estoqueController.reverterSaida);

// Nome: Visualizar Item Pago Específico
router.get('/visualizar/itempago/:id', estoqueController.visualizarItemPago);

/* ********************************************************************************
                  Rotas para SAÍDA de Tombos
*********************************************************************************/
// Nome: Mostrar Tabela de Tombos Usados
router.get('/tombos-usados', isAuthenticated, saidaTomboController.getAllTombosUsados);

// Nome: Visualizar Tombo Usado Específico
router.get('/visualizar/tombo-usado/:id', isAuthenticated, saidaTomboController.visualizarTomboUsado);

// Nome: Reverter Saída de Tombo (Apenas Admin)
router.delete('/reverter-saida-tombo/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.reverterSaida);

// Nome: Gerar Relatório de Tombos Usados (PDF/Excel)
router.get('/relatorio/tombos-usados', isAuthenticated, saidaTomboController.generatePDFTombosUsados);

// Nome: Renderizar Formulário de Saída de Tombos
router.get('/saida-tombo', isAuthenticated, saidaTomboController.renderizarFormulario);

// Nome: Gerar Termo de Recebimento
router.get('/gerar-termo-tombo', isAuthenticated, saidaTomboController.gerarTermoRecebimento);

// Nome: Verificar Termo de Recebimento Existente
router.get('/verificar-termo-tombo-existente', isAuthenticated, saidaTomboController.verificarTermoExistente);

// Nome: Registrar Saída de Tombos
router.post('/saida-tombo', isAuthenticated, saidaTomboController.registrarSaida);

/* ********************************************************************************
                  Rotas para TOMBAMENTO
*********************************************************************************/

// Nome: Listar Tombamentos
router.get('/tabela/tombamento', estoqueController.listarTombamento);

// Nome: Visualizar Tombamento Específico
router.get('/tombamento/visualizar/:id', estoqueController.visualizarTombamento);

// Nome: Editar Tombamento
router.get('/tombamento/editar/:id', estoqueController.editarTombamento);

// Nome: Atualizar Tombamento
router.post('/tombamento/atualizar/:id', estoqueController.atualizarTombamento);

// Nome: Excluir Tombamento
router.delete('/tombamento/excluir/:id', estoqueController.excluirTombamento);

/* ********************************************************************************
                  Rotas para RELATÓRIOS
*********************************************************************************/

// Nome: Mostrar Tabela de Estoque Atual
router.get('/tabela/estoqueatual', isAuthenticated, estoqueController.getAllEstoque);

// Nome: Mostrar Tabela de Itens Novos
router.get('/tabela/itens-novos', estoqueController.showItensNovos);

// Nome: Listar Itens Usados
router.get('/itens-usados', estoqueController.getItensUsados);

// Nome: Mostrar Tabela de Itens Usados
router.get('/tabela/itens-usados', estoqueController.showItensUsados);

// Nome: Mostrar Tabela de Itens Pagos
router.get('/estoque/itenspagos', estoqueController.getAllItensPagos);

// Nome: Obter Quantidade Única de Itens no Estoque
router.get('/qtde-unica', estoqueController.getQtdeUnicaEstoque);

// Nome: Gerar Relatório Geral (PDF/Excel)
router.get('/relatorio/geral', estoqueController.generatePDF);

// Nome: Gerar Relatório de Itens Novos (PDF/Excel)
router.get('/relatorio/novos', estoqueController.generatePDFNovos);

// Nome: Gerar Relatório de Itens Usados (PDF/Excel)
router.get('/relatorio/usados', estoqueController.generatePDFUsados);

// Nome: Gerar Relatório de Itens Pagos (PDF/Excel)
router.get('/relatorio/itens-pagos', estoqueController.generatePDFItensPagos);

// Nome: Gerar Relatório de Quantidade Disponível
router.get('/relatorio/quantidade-disponivel', estoqueController.generatePDFQuantidadeDisponivel);

// Nome: Gerar Relatório de Tombamento
router.get('/relatorio/tombamento', estoqueController.gerarRelatorioTombamento);

/* ********************************************************************************
                  Rotas para AUDITORIA
*********************************************************************************/

// Nome: Buscar Informações de um Tombo
router.get('/fetch-info-tombo', estoqueController.fetchInfoTombo);

// Nome: Histórico de Auditoria de Tombo (API)
router.get('/auditoria/api/tombo/:tombo', estoqueController.historicoAuditoriaTomboAPI);

export default router;