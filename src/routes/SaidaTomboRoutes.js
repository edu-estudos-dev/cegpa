import express from 'express';
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


const saidaTombosRoutes = express.Router();


// Rota para registrar a saída de tombos
saidaTombosRoutes.post('/saida-tombo', isAuthenticated, saidaTomboController.registrarSaida);

// Rota para listar todos os registros de tombamento
saidaTombosRoutes.get('/tabela/tombamento', isAuthenticated, saidaTomboController.listarTombamento);

// Rota para visualizar detalhes de um registro de tombamento por ID
saidaTombosRoutes.get('/tombamento/visualizar/:id', isAuthenticated, saidaTomboController.visualizarTombamento);

// Rota para renderizar o formulário de edição de um registro de tombamento (acesso restrito a admins)
saidaTombosRoutes.get('/tombamento/editar/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.editarTombamento);

// Rota para atualizar um registro de tombamento (acesso restrito a admins)
saidaTombosRoutes.post('/tombamento/atualizar/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.atualizarTombamento);

// Rota para excluir um registro de tombamento (acesso restrito a admins)
saidaTombosRoutes.delete('/tombamento/excluir/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.excluirTombamento);

// Rota para obter a lista de tombos usados
saidaTombosRoutes.get('/tombos-usados', isAuthenticated, saidaTomboController.getAllTombosUsados);

// Rota para visualizar detalhes de um tombo usado por ID
saidaTombosRoutes.get('/visualizar/tombo-usado/:id', isAuthenticated, saidaTomboController.visualizarTomboUsado);

// Rota para reverter a saída de um tombo (acesso restrito a admins)
saidaTombosRoutes.delete('/reverter-saida-tombo/:id', isAuthenticated, checkRole(['admin']), saidaTomboController.reverterSaida);

// Rota alternativa para reverter a saída de um tombo (acesso restrito a admins)
saidaTombosRoutes.delete('/tombos-usados/reverter/:id', isAuthenticated, saidaTomboController.reverterSaida);

// Rota para gerar um relatório em PDF de tombos usados
saidaTombosRoutes.get('/relatorio/tombos-usados', isAuthenticated, saidaTomboController.generatePDFTombosUsados);

// Rota para renderizar o formulário de saída de tombos
saidaTombosRoutes.get('/saida-tombo', isAuthenticated, saidaTomboController.renderizarFormulario);

// Rota para gerar um novo número de termo de recebimento para saída de tombos
saidaTombosRoutes.get('/gerar-termo-tombo', isAuthenticated, saidaTomboController.gerarTermoRecebimento);

// Rota para verificar se um termo de recebimento de tombo já existe
saidaTombosRoutes.get('/verificar-termo-tombo-existente', isAuthenticated, saidaTomboController.verificarTermoExistente);

// Rota para gerar um relatório em PDF de registros de tombamento
saidaTombosRoutes.get('/relatorio/tombamento', isAuthenticated, saidaTomboController.gerarRelatorioTombamento);

// Rota para visualizar PDF associado a um tombo
saidaTombosRoutes.get('/download-pdf/:tombo', isAuthenticated, saidaTomboController.viewPDF);


export default saidaTombosRoutes;