import express from 'express';
import estoqueController from '../controllers/estoqueController.js';
import saidaTomboController from '../controllers/saidaTomboController.js';
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


const router = express.Router();

// Rota para renderizar o formulário de entrada de itens no estoque
router.get('/entrada', isAuthenticated, estoqueController.renderEntradaForm);

// Rota para criar um novo item no estoque, com upload de PDF
router.post('/entrada', isAuthenticated, upload, estoqueController.create);

// Rota para obter o último número de tombo registrado
router.get('/ultimo-tombo', isAuthenticated, estoqueController.fetchUltimoTombo);

// Rota para visualizar detalhes de um item no estoque por ID
router.get('/visualizar/:id', isAuthenticated, estoqueController.visualizarItem);

// Rota para renderizar o formulário de edição de um item no estoque (acesso restrito a admins)
router.get('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.renderEditForm);

// Rota para atualizar um item no estoque (acesso restrito a admins)
router.put('/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.update);

// Rota para excluir um item do estoque (acesso restrito a admins)
router.delete('/excluir/:id', isAuthenticated, checkRole(['admin']), estoqueController.destroy);

// Rota para renderizar o formulário de saída de itens do estoque
router.get('/saida', isAuthenticated, estoqueController.renderSaidaForm);

// Rota para registrar a saída de itens do estoque
router.post('/saida', isAuthenticated, estoqueController.registrarSaida);

// Rota para obter a lista de itens disponíveis no estoque
router.get('/api/itens-disponiveis', isAuthenticated, estoqueController.fetchItensDisponiveis);

// Rota para verificar se um termo de recebimento já existe
router.get('/verificar-termo-existente', isAuthenticated, estoqueController.verificarTermoExistente);

// Rota para reverter a saída de um item do estoque (acesso restrito a admins)
router.delete('/reverter-saida/:id', isAuthenticated, checkRole(['admin']), estoqueController.reverterSaida);

// Rota para visualizar detalhes de um item pago por ID
router.get('/visualizar/itempago/:id', isAuthenticated, estoqueController.visualizarItemPago);

// Rota para obter a lista de tombos usados
router.get('/tombos-usados', isAuthenticated, saidaTomboController.getAllTombosUsados);

// Rota para visualizar detalhes de um tombo usado por ID
router.get('/visualizar/tombo-usado/:id', isAuthenticated, saidaTomboController.visualizarTomboUsado);

// Rota para reverter a saída de um tombo (acesso restrito a admins)
router.delete('/reverter-saida-tombo/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.reverterSaida);

// Rota alternativa para reverter a saída de um tombo (acesso restrito a admins)
router.delete('/tombos-usados/reverter/:id', isAuthenticated, saidaTomboController.reverterSaida);

// Rota para gerar um relatório em PDF de tombos usados
router.get('/relatorio/tombos-usados', isAuthenticated, saidaTomboController.generatePDFTombosUsados);

// Rota para renderizar o formulário de saída de tombos
router.get('/saida-tombo', isAuthenticated, saidaTomboController.renderizarFormulario);

// Rota para gerar um novo número de termo de recebimento para saída de tombos
router.get('/gerar-termo-tombo', isAuthenticated, saidaTomboController.gerarTermoRecebimento);

// Rota para verificar se um termo de recebimento de tombo já existe
router.get('/verificar-termo-tombo-existente', isAuthenticated, saidaTomboController.verificarTermoExistente);

// Rota para registrar a saída de tombos
router.post('/saida-tombo', isAuthenticated, saidaTomboController.registrarSaida);

// Rota para listar todos os registros de tombamento
router.get('/tabela/tombamento', isAuthenticated, estoqueController.listarTombamento);

// Rota para visualizar detalhes de um registro de tombamento por ID
router.get('/tombamento/visualizar/:id', isAuthenticated, estoqueController.visualizarTombamento);

// Rota para renderizar o formulário de edição de um registro de tombamento (acesso restrito a admins)
router.get('/tombamento/editar/:id', isAuthenticated, checkRole(['admin']), estoqueController.editarTombamento);

// Rota para atualizar um registro de tombamento (acesso restrito a admins)
router.post('/tombamento/atualizar/:id', isAuthenticated, checkRole(['admin']), estoqueController.atualizarTombamento);

// Rota para excluir um registro de tombamento (acesso restrito a admins)
router.delete('/tombamento/excluir/:id', isAuthenticated, checkRole(['admin']), estoqueController.excluirTombamento);

// Rota para baixar/visualizar um arquivo PDF associado a um tombo
router.get('/download-pdf/:tombo', isAuthenticated, estoqueController.viewPDF);

// Rota para listar todos os itens no estoque atual
router.get('/tabela/estoqueatual', isAuthenticated, estoqueController.getAllEstoque);

// Rota para listar todos os itens novos no estoque
router.get('/tabela/itens-novos', isAuthenticated, estoqueController.showItensNovos);

// Rota para obter a lista de itens usados no estoque
router.get('/itens-usados', isAuthenticated, estoqueController.getItensUsados);

// Rota para listar todos os itens usados no estoque
router.get('/tabela/itens-usados', isAuthenticated, estoqueController.showItensUsados);

// Rota para listar todos os itens pagos (saídas registradas)
router.get('/estoque/itenspagos', isAuthenticated, estoqueController.getAllItensPagos);

// Rota para obter a quantidade única de itens no estoque, agrupada por descrição e categoria
router.get('/qtde-unica', isAuthenticated, estoqueController.getQtdeUnicaEstoque);

// Rota para gerar um relatório em PDF do estoque geral
router.get('/relatorio/geral', isAuthenticated, estoqueController.generatePDF);

// Rota para gerar um relatório em PDF de itens novos
router.get('/relatorio/novos', isAuthenticated, estoqueController.generatePDFNovos);

// Rota para gerar um relatório em PDF de itens usados
router.get('/relatorio/usados', isAuthenticated, estoqueController.generatePDFUsados);

// Rota para gerar um relatório em PDF de itens pagos
router.get('/relatorio/itens-pagos', isAuthenticated, estoqueController.generatePDFItensPagos);

// Rota para gerar um relatório em PDF da quantidade disponível no estoque
router.get('/relatorio/quantidade-disponivel', isAuthenticated, estoqueController.generatePDFQuantidadeDisponivel);

// Rota para gerar um relatório em PDF de registros de tombamento
router.get('/relatorio/tombamento', isAuthenticated, estoqueController.gerarRelatorioTombamento);

// Rota para buscar informações de um tombo específico
router.get('/fetch-info-tombo', isAuthenticated, estoqueController.fetchInfoTombo);

// Rota para obter o histórico de auditoria de um tombo específico por API
router.get('/auditoria/api/tombo/:tombo', isAuthenticated, estoqueController.historicoAuditoriaTomboAPI);

export default router;