import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SaidaTomboModel from '../models/SaidaTomboModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
   // Renderiza o formulário de saída de tombos
   async renderizarFormulario(req, res) {
      try {
         const tombosDisponiveis = await SaidaTomboModel.getTombosDisponiveis();
         res.render('saidaDeTombos', { tombosDisponiveis });
      } catch (error) {
         console.error('Erro ao carregar tombos:', error);
         res.status(500).json({ error: 'Erro ao carregar o formulário' });
      }
   },

   // Gera um número único para o termo de recebimento
   async gerarTermoRecebimento(req, res) {
      try {
         const docSaida = await SaidaTomboModel.gerarTermoRecebimento();
         res.json({ doc_saida: docSaida });
      } catch (error) {
         console.error('Erro ao gerar termo:', error);
         res.status(500).json({ error: 'Erro ao gerar termo' });
      }
   },

   // Verifica se o termo de recebimento já existe
   async verificarTermoExistente(req, res) {
      const { numero } = req.query;
      try {
         const pdfPath = path.join(__dirname, '../../pdfs', `Tombo_Termo_${numero}.pdf`); // Ajustado para pdfs
         const existe = fs.existsSync(pdfPath);
         res.json({ existe });
      } catch (error) {
         console.error('Erro ao verificar termo:', error);
         res.status(500).json({ error: 'Erro ao verificar termo' });
      }
   },

   // Registra a saída de tombos e gera o PDF
   async registrarSaida(req, res) {
      const {
         tombos, doc_saida, referencia, destino, postoGrad, mf_recebedor,
         tel_recebedor, nome_do_recebedor, observacao, modoDocSaida
      } = req.body;

      try {
         // Validações
         if (!tombos || tombos.length === 0) {
            return res.status(400).json({ error: 'Selecione pelo menos um tombo' });
         }
         if (!doc_saida || !referencia || !destino || !postoGrad || !mf_recebedor || !tel_recebedor || !nome_do_recebedor) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
         }

         // Verifica se os tombos são válidos e estão disponíveis
         const validacao = await SaidaTomboModel.validarTombos(tombos);
         if (!validacao.valido) {
            return res.status(400).json({ error: validacao.erro });
         }

         // Gera o PDF
         const pdfPath = path.join(__dirname, '../../pdfs', `Tombo_Termo_${doc_saida}.pdf`); // Ajustado para pdfs
         const pdfDir = path.dirname(pdfPath);
         if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true }); // Garante que a pasta pdfs exista
         }
         const doc = new PDFDocument();
         const stream = fs.createWriteStream(pdfPath);

         // Tratamento de erro no stream
         stream.on('error', (err) => {
            console.error('Erro ao escrever o PDF:', err);
            res.status(500).json({ error: 'Erro ao gerar o PDF' });
         });

         doc.pipe(stream);

         doc.fontSize(12).text('Termo de Recebimento de Tombos', { align: 'center' });
         doc.moveDown();
         doc.text(`Número do Termo: ${doc_saida}`);
         doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
         doc.text(`Referência (NUP): ${referencia}`);
         doc.text(`Destino: ${destino}`);
         doc.text(`Posto/Graduação: ${postoGrad}`);
         doc.text(`Matrícula Funcional: ${mf_recebedor}`);
         doc.text(`Telefone: ${tel_recebedor}`);
         doc.text(`Nome do Recebedor: ${nome_do_recebedor}`);
         doc.moveDown();
         doc.text('Tombos:', { underline: true });
         const tombosInfo = await SaidaTomboModel.getTombosInfo(tombos);
         tombosInfo.forEach(tombo => {
            doc.text(`- Tombo: ${tombo.tombo} - ${tombo.descricao}`);
         });
         if (observacao) {
            doc.moveDown();
            doc.text('Observação:', { underline: true });
            doc.text(observacao);
         }
         doc.end();

         // Aguarda a finalização do stream antes de prosseguir
         stream.on('finish', async () => {
            try {
               // Insere os registros na tabela saida_tombo
               const dataSaida = new Date().toISOString().slice(0, 19).replace('T', ' ');
               await SaidaTomboModel.registrarSaida(
                  tombos, doc_saida, referencia, destino, postoGrad,
                  mf_recebedor, tel_recebedor, nome_do_recebedor, observacao, dataSaida
               );
               res.json({ pdfPath: `/pdfs/Tombo_Termo_${doc_saida}.pdf` }); // Ajustado para /pdfs
            } catch (error) {
               console.error('Erro ao registrar saída:', error);
               res.status(500).json({ error: 'Erro ao registrar saída' });
            }
         });
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         res.status(500).json({ error: 'Erro ao registrar saída' });
      }
   }
};