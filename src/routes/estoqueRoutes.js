import express from 'express';
import estoqueController from '../controllers/estoqueController.js';
// import saidaTomboController from '../controllers/saidaTomboController.js';
import isAuthenticated from '../middleware/auth.js';
import checkRole from '../middleware/checkRole.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Multer para salvar PDFs
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'Uploads/');
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
      cb(null, `temp-${uniqueSuffix}.pdf`); // Nome temporário
   },
});

const upload = multer({
   storage,
   fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
         cb(null, true);
      } else {
         cb(new Error('Apenas arquivos PDF são permitidos'), false);
      }
   },
}).single('pdfFile');

const estoqueRoutes = express.Router();

// Rota para renderizar o formulário de entrada de itens no estoque
estoqueRoutes.get('/entrada', isAuthenticated, estoqueController.renderEntradaForm);

// Rota para criar um novo item no estoque, com upload de PDF
estoqueRoutes.post('/entrada', isAuthenticated, upload, estoqueController.create);

// Rota para obter o último número de tombo registrado
estoqueRoutes.get('/ultimo-tombo', isAuthenticated, estoqueController.fetchUltimoTombo);

// Rota para visualizar detalhes de um item no estoque por ID
estoqueRoutes.get('/visualizar/:id', isAuthenticated, estoqueController.visualizarItem);

// Rota para renderizar o formulário de edição de um item no estoque (acesso restrito a admins)
estoqueRoutes.get('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.renderEditForm);

// Rota para atualizar um item no estoque (acesso restrito a admins)
estoqueRoutes.put('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.update);

// Rota para excluir um item do estoque (acesso restrito a admins)
estoqueRoutes.delete('/excluir/:id', isAuthenticated, checkRole(['admin']), estoqueController.destroy);

// Rota para renderizar o formulário de saída de itens do estoque
estoqueRoutes.get('/saida', isAuthenticated, estoqueController.renderSaidaForm);

// Rota para registrar a saída de itens do estoque
estoqueRoutes.post('/saida', isAuthenticated, estoqueController.registrarSaida);

// Rota para obter a lista de itens disponíveis no estoque
estoqueRoutes.get('/api/itens-disponiveis', isAuthenticated, estoqueController.fetchItensDisponiveis);

// Rota para verificar se um termo de recebimento já existe
estoqueRoutes.get('/verificar-termo-existente', isAuthenticated, estoqueController.verificarTermoExistente);

// Rota para reverter a saída de um item do estoque (acesso restrito a admins)
estoqueRoutes.delete('/reverter-saida/:id', isAuthenticated, checkRole(['admin']), estoqueController.reverterSaida);

// Rota para visualizar detalhes de um item pago por ID
estoqueRoutes.get('/visualizar/itempago/:id', isAuthenticated, estoqueController.visualizarItemPago);

// Rota para listar todos os itens no estoque atual
estoqueRoutes.get('/tabela/estoqueatual', isAuthenticated, estoqueController.getAllEstoque);

// Rota para listar todos os itens novos no estoque
// estoqueRoutes.get('/tabela/itens-novos', isAuthenticated, estoqueController.showItensNovos);

// Rota para obter a lista de itens usados no estoque
// estoqueRoutes.get('/itens-usados', isAuthenticated, estoqueController.getItensUsados);

// Rota para listar todos os itens usados no estoque
// estoqueRoutes.get('/tabela/itens-usados', isAuthenticated, estoqueController.showItensUsados);

// Rota para listar todos os itens pagos (saídas registradas)
estoqueRoutes.get('/estoque/itenspagos', isAuthenticated, estoqueController.getAllItensPagos);

// Rota para obter a quantidade única de itens no estoque, agrupada por descrição e categoria
estoqueRoutes.get('/qtde-unica', isAuthenticated, estoqueController.getQtdeUnicaEstoque);

// Rota para gerar um relatório em PDF do estoque geral
estoqueRoutes.get('/relatorio/geral', isAuthenticated, estoqueController.generatePDF);

// Rota para gerar um relatório em PDF de itens novos
estoqueRoutes.get('/relatorio/novos', isAuthenticated, estoqueController.generatePDFNovos);

// Rota para gerar um relatório em PDF de itens usados
// estoqueRoutes.get('/relatorio/usados', isAuthenticated, estoqueController.generatePDFUsados);

// Rota para gerar um relatório em PDF de itens pagos
// estoqueRoutes.get('/relatorio/itens-pagos', isAuthenticated, estoqueController.generatePDFItensPagos);

// Rota para gerar um relatório em PDF da quantidade disponível no estoque
estoqueRoutes.get('/relatorio/quantidade-disponivel', isAuthenticated, estoqueController.generatePDFQuantidadeDisponivel);

// Rota para buscar informações de um tombo específico
estoqueRoutes.get('/fetch-info-tombo', isAuthenticated, estoqueController.fetchInfoTombo);

// Rota para obter o histórico de auditoria de um tombo específico por API
estoqueRoutes.get('/historico-auditoria/:tombo', isAuthenticated, estoqueController.historicoAuditoriaTomboAPI);

// Rota para registrar uma reserva de item
estoqueRoutes.post('/reservar', estoqueController.registrarReserva);

// Rota para cancelar uma reserva (acesso restrito a admins)
estoqueRoutes.delete('/reservas/cancelar/:id', isAuthenticated, checkRole(['admin']), estoqueController.cancelarReserva);

// Rota para mostrar tabela de itens reservados (acesso restrito a admins)
estoqueRoutes.get('/tabela/itens-reservados', estoqueController.showReservas);


export default estoqueRoutes;