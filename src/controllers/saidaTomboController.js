import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SaidaTomboModel from '../models/SaidaTomboModel.js';
import sequenciaModel from '../models/sequenciaModel.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import AuditoriaModel from '../models/auditoriaModel.js';
import estoqueModel from '../models/estoqueModel.js';

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
         if (!numero) {
            return res
               .status(400)
               .json({ error: 'Número do termo não fornecido.' });
         }
         if (!/^\d{1,5}\/\d{4}$/.test(numero)) {
            return res.status(400).json({
               error: 'Formato de termo inválido. Use o formato N/AAAA ou NN/AAAA ou NNN/AAAA ou NNNN/AAAA ou NNNNN/AAAA (ex.: 5/2025 ou 00001/2025).',
            });
         }
         // Padronizar o número do termo com 5 dígitos para o nome do arquivo
         const [num, ano] = numero.split('/');
         const numeroFormatado = `${num.padStart(5, '0')}/${ano}`;
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${numeroFormatado.replace(/\//g, '-')}.pdf`
         );
         const existe = fs.existsSync(pdfPath);
         res.json({ existe });
      } catch (error) {
         console.error('Erro ao verificar termo:', error);
         res.status(500).json({
            error: 'Erro interno ao verificar termo.',
            details: error.message,
         });
      }
   },

   // Registra a saída de tombos e gera o PDF
   async registrarSaida(req, res) {
      // Validação inicial para req.body e req.user
      if (!req.body) {
         console.log(
            '[saidaTomboController.registrarSaida] Erro: req.body está indefinido'
         );
         return res.status(400).json({
            success: false,
            error: 'Corpo da requisição não fornecido.',
         });
      }
      if (!req.user) {
         console.log(
            '[saidaTomboController.registrarSaida] Erro: Usuário não autenticado'
         );
         return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado.',
         });
      }

      const {
         tombos,
         referencia,
         destino,
         postoGrad,
         mf_recebedor,
         tel_recebedor,
         nome_do_recebedor,
         observacao,
         modoDocSaida,
         doc_saida,
      } = req.body;

      const usuarioLogado = req.user;
      const nomeResponsavel = usuarioLogado?.nome_completo || 'Desconhecido';
      const mfResponsavel = usuarioLogado?.matricula || 'N/A';
      const postoGradResponsavel = usuarioLogado?.posto_grad || 'N/A';

      try {
         // Validações
         if (!tombos || tombos.length === 0) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Nenhum tombo selecionado'
            );
            return res
               .status(400)
               .json({ error: 'Selecione pelo menos um tombo.' });
         }
         if (
            !referencia ||
            !destino ||
            !postoGrad ||
            !mf_recebedor ||
            !tel_recebedor ||
            !nome_do_recebedor ||
            !doc_saida
         ) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Campos obrigatórios faltando'
            );
            return res
               .status(400)
               .json({ error: 'Todos os campos são obrigatórios.' });
         }

         // Validação do formato do termo
         if (!/^\d{1,5}\/\d{4}$/.test(doc_saida)) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Formato de termo inválido:',
               doc_saida
            );
            return res.status(400).json({
               error: 'Formato de termo inválido. Use o formato N/AAAA ou NN/AAAA ou NNN/AAAA ou NNNN/AAAA ou NNNNN/AAAA (ex.: 5/2025 ou 00001/2025).',
            });
         }

         // Padronizar o número do termo com 5 dígitos para consistência
         const [num, ano] = doc_saida.split('/');
         const docSaidaFormatado = `${num.padStart(5, '0')}/${ano}`;
         console.log(
            '[saidaTomboController.registrarSaida] Termo formatado:',
            docSaidaFormatado
         );

         // Validação para modo AUTO
         const anoAtual = new Date().getFullYear();
         if (modoDocSaida === 'AUTO') {
            const sequenciaAtual = await sequenciaModel.getSequenciaAtual(
               anoAtual
            );
            const expectedDocSaida = `${sequenciaAtual
               .toString()
               .padStart(5, '0')}/${anoAtual}`;
            if (docSaidaFormatado !== expectedDocSaida) {
               console.log(
                  '[saidaTomboController.registrarSaida] Erro: Número do termo inválido para modo AUTO. Esperado:',
                  expectedDocSaida
               );
               return res.status(400).json({
                  error: `Número do termo inválido para o modo AUTO. Esperado: ${expectedDocSaida}.`,
               });
            }
         }

         // Verifica se os tombos são válidos e estão disponíveis
         const validacao = await SaidaTomboModel.validarTombos(tombos);
         if (!validacao.valido) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Tombos inválidos:',
               validacao.erro
            );
            return res.status(400).json({ error: validacao.erro });
         }

         // Define o caminho da pasta de PDFs
         const pdfDir = path.join(__dirname, '../../pdfs');
         console.log(
            '[saidaTomboController.registrarSaida] Diretório de PDFs:',
            pdfDir
         );

         // Lista todos os arquivos na pasta de PDFs para depuração
         try {
            const filesInDir = fs.readdirSync(pdfDir);
         } catch (error) {}

         // Cria a pasta se não existir
         if (!fs.existsSync(pdfDir)) {
            console.log(
               '[saidaTomboController.registrarSaida] Criando diretório de PDFs:',
               pdfDir
            );
            fs.mkdirSync(pdfDir, { recursive: true });
         }

         // Define o caminho completo do PDF
         const pdfFileName = `Termo_${docSaidaFormatado.replace(
            /\//g,
            '-'
         )}.pdf`;
         const pdfPath = path.join(pdfDir, pdfFileName);
         console.log(
            '[saidaTomboController.registrarSaida] Caminho completo do PDF:',
            pdfPath
         );

         // Verifica se o PDF já existe
         const pdfExists = fs.existsSync(pdfPath);
         console.log(
            '[saidaTomboController.registrarSaida] O PDF já existe?',
            pdfExists
         );

         if (pdfExists) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Termo já existe:',
               docSaidaFormatado
            );
            return res.status(400).json({
               error: `O número do termo ${doc_saida} já foi utilizado. Escolha outro número.`,
            });
         }

         // Registra a saída no banco de dados antes de gerar o PDF
         const dataSaida = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
         await SaidaTomboModel.registrarSaida(
            req.body.tombos,
            req.body.referencia,
            req.body.destino,
            req.body.postoGrad,
            req.body.mf_recebedor,
            req.body.tel_recebedor,
            req.body.nome_do_recebedor,
            req.body.observacao,
            dataSaida,
            docSaidaFormatado
         );

         // Gera o PDF com jsPDF após o registro no banco
         const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
         });

         // Caminho da imagem
         const imagePath = path.join(
            __dirname,
            '../../public/images/cabeçalho pmce.png'
         );

         // Verifica se a imagem existe antes de tentar lê-la
         if (!fs.existsSync(imagePath)) {
            console.error(
               '[saidaTomboController.registrarSaida] Erro: Imagem não encontrada em:',
               imagePath
            );
            return res.status(500).json({
               success: false,
               error: 'Erro interno no servidor: Imagem do cabeçalho não encontrada.',
            });
         }

         const imageData = fs.readFileSync(imagePath).toString('base64');

         // Desenha a borda
         doc.setDrawColor(0);
         doc.setLineWidth(0.5);
         doc.rect(
            5,
            5,
            doc.internal.pageSize.width - 10,
            doc.internal.pageSize.height - 10
         );

         // Adiciona a imagem
         doc.addImage(imageData, 'PNG', 67.5, 8, 70, 15);

         // Título e cabeçalho
         doc.setFontSize(10);
         doc.setFont('helvetica', 'bold');
         doc.text(
            'TERMO DE RECEBIMENTO E RESPONSABILIDADE - CEGPA/COLOG',
            105,
            28,
            { align: 'center' }
         );
         doc.setFont('helvetica', 'normal');

         const headerYStart = 35;
         const headerData = [
            `Nº Termo: ${docSaidaFormatado}`,
            `Data: ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`,
            `Destino: ${destino.toUpperCase()}`,
            `Responsável: ${postoGrad.toUpperCase()} ${nome_do_recebedor.toUpperCase()}`,
            `MF: ${mf_recebedor}`,
            `Contato: ${tel_recebedor}`,
            `Referência: ${referencia.toUpperCase()}`,
         ];
         let headerYOffset = 0;
         headerData.forEach((line) => {
            doc.text(line, 14, headerYStart + headerYOffset);
            headerYOffset += 5;
         });

         // Observações
         const obsText = (observacao || 'Nenhuma').toUpperCase();
         const obsLines = doc.splitTextToSize(`Observações: ${obsText}`, 170);
         obsLines.forEach((obsLine) => {
            doc.text(obsLine, 14, headerYStart + headerYOffset);
            headerYOffset += 5;
         });

         // Tabela de tombos
         const tableStartY = headerYStart + headerYOffset + 2;
         const items = [];
         let ordem = 1;
         const tombosInfo = await SaidaTomboModel.getTombosInfo(tombos);
         for (const tombo of tombosInfo) {
            const descricao = tombo.descricao
               ? tombo.descricao
                    .toUpperCase()
                    .replace('RETAINGLIAR', 'RETANGULAR')
               : 'N/A';
            items.push([ordem++, tombo.tombo || 'N/A', descricao]);
         }

         doc.autoTable({
            startY: tableStartY,
            head: [['ORD.', 'TOMBO', 'DESCRIÇÃO']],
            body: items,
            styles: {
               fontSize: 8,
               halign: 'center',
               cellPadding: 1.5,
               overflow: 'linebreak',
            },
            headStyles: {
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: {
               0: { cellWidth: 15 },
               1: { cellWidth: 35 },
               2: { cellWidth: 130, halign: 'left' },
            },
            margin: { left: 13, right: 7, bottom: 10 },
            tableWidth: 'wrap',
            pageBreak: 'auto',
            didDrawPage: (data) => {
               doc.rect(
                  5,
                  5,
                  doc.internal.pageSize.width - 10,
                  doc.internal.pageSize.height - 10
               );
            },
         });

         // Cláusula de recebimento
         const tombosList = tombos.map((t) => t.tombo || t).join(', ');
         const clausula = `Eu, ${nome_do_recebedor.toUpperCase()} Declaro estar ciente de que, ao assinar o presente Termo de Recebimento, assumo a responsabilidade pelo correto recebimento e pela fixação das etiquetas de tombamento em todos os bens móveis nele relacionados, comprometendo-me a cumprir essa obrigação conforme as orientações da Célula de Gestão Patrimonial CEGPA/COLOG`;
         const clausulaLines = doc.splitTextToSize(clausula, 220);
         const clausulaY = tableStartY + items.length * 10 + 10;
         clausulaLines.forEach((line, index) => {
            doc.setFontSize(8);
            doc.text(line, 14, clausulaY + index * 5);
         });

         // Assinaturas na parte inferior
         const pageHeight = doc.internal.pageSize.height;
         const totalPages = doc.internal.getNumberOfPages();
         doc.setPage(totalPages);

         const signatureY = pageHeight - 20;
         const lineLength = 50;
         const gapBetweenBlocks = 10;
         const totalBlockWidth = lineLength * 3 + gapBetweenBlocks * 2;
         const startX = 5 + (200 - totalBlockWidth) / 2;

         const leftPos = startX + lineLength / 2;
         const centerPos = leftPos + lineLength + gapBetweenBlocks;
         const rightPos = centerPos + lineLength + gapBetweenBlocks;

         doc.setLineWidth(0.3);
         doc.line(startX, signatureY, startX + lineLength, signatureY);
         doc.line(
            centerPos - lineLength / 2,
            signatureY,
            centerPos + lineLength / 2,
            signatureY
         );
         doc.line(
            rightPos - lineLength / 2,
            signatureY,
            rightPos + lineLength / 2,
            signatureY
         );

         doc.setFontSize(6);
         doc.text(
            `${postoGrad.toUpperCase()} ${nome_do_recebedor.toUpperCase()}\nMF: ${mf_recebedor}`,
            leftPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.text('(Recebedor)', leftPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.text(
            'TEN. CEL. ALLAN KARDEK\nMF: 135.907-1-0',
            centerPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.text('Comandante CEGPA', centerPos, signatureY + 8.5, {
            align: 'center',
         });

         doc.text(
            `${postoGradResponsavel.toUpperCase()} ${nomeResponsavel.toUpperCase()}\nMF: ${mfResponsavel}`,
            rightPos,
            signatureY + 4,
            { align: 'center' }
         );
         doc.text('(Responsável pela entrega)', rightPos, signatureY + 8.5, {
            align: 'center',
         });

         // Salva o PDF
         console.log(
            '[saidaTomboController.registrarSaida] Salvando PDF em:',
            pdfPath
         );
         doc.save(pdfPath);
         console.log(
            '[saidaTomboController.registrarSaida] PDF salvo com sucesso em:',
            pdfPath
         );

         // Incrementa a sequência após o registro
         if (modoDocSaida === 'AUTO') {
            console.log(
               '[saidaTomboController.registrarSaida] Incrementando sequência para o ano:',
               anoAtual
            );
            await sequenciaModel.incrementarSequencia(anoAtual);
         }

         console.log(
            '[saidaTomboController.registrarSaida] Saída registrada com sucesso, retornando resposta'
         );
         res.status(200).json({
            success: true,
            pdfPath: `/pdfs/Termo_${docSaidaFormatado.replace(/\//g, '-')}.pdf`,
            message: 'Saída registrada com sucesso!',
         });
      } catch (error) {
         console.error(
            '[saidaTomboController.registrarSaida] Erro ao registrar saída:',
            error
         );
         res.status(500).json({
            success: false,
            error: 'Erro interno no servidor.',
            details: error.message,
         });
      }
   },

   // Método para mostrar todos os tombos usados
   async getAllTombosUsados(req, res) {
      try {
         const { data_inicial, data_final } = req.query;
         console.log('Requisição recebida em /tombos-usados:', {
            data_inicial,
            data_final,
         });

         const tombosUsados = await SaidaTomboModel.getAllTombosUsados(
            data_inicial,
            data_final
         );
         const userRole = req.user?.role || 'user';
         console.log('Tombos usados retornados:', tombosUsados);
         res.render('tabelaTombosUsados', {
            tombosUsados,
            userRole,
            data_inicial: data_inicial || '',
            data_final: data_final || '',
         });
      } catch (error) {
         console.error('Erro no servidor:', error);
         res.status(500).render('tabelaTombosUsados', {
            tombosUsados: [],
            userRole: req.user?.role || 'user',
            data_inicial: '',
            data_final: '',
            error: 'Erro ao carregar os tombos usados.',
         });
      }
   },

   // Método para visualizar um tombo usado específico
   async visualizarTomboUsado(req, res) {
      const { id } = req.params;
      try {
         console.log(
            `[saidaTomboController.visualizarTomboUsado] Buscando tombo com ID: ${id}`
         );
         const tombo = await SaidaTomboModel.getTomboUsadoDetalhes(id);
         console.log(
            '[saidaTomboController.visualizarTomboUsado] Dados do tombo:',
            tombo
         );
         if (tombo) {
            res.json(tombo);
         } else {
            console.log(
               `[saidaTomboController.visualizarTomboUsado] Tombo não encontrado para ID: ${id}`
            );
            res.status(404).json({ error: 'Tombo usado não encontrado' });
         }
      } catch (error) {
         console.error(
            '[saidaTomboController.visualizarTomboUsado] Erro:',
            error
         );
         res.status(500).json({
            error: 'Erro ao buscar tombo usado.',
            details: error.message,
         });
      }
   },

   // Método para reverter a saída de um tombo
   async reverterSaida(req, res) {
      console.log(
         `[SaidaTomboController] Recebida requisição DELETE para reverter saída com ID: ${req.params.id}`
      );
      const { id } = req.params;
      try {
         const tombo = await SaidaTomboModel.getTomboUsadoDetalhes(id);
         if (!tombo) {
            console.log(
               `[SaidaTomboController] Tombo usado não encontrado para ID: ${id}`
            );
            return res
               .status(404)
               .json({ error: 'Tombo usado não encontrado.' });
         }

         await SaidaTomboModel.reverterSaida(id, tombo.tombo);
         // Registrar log de auditoria
         await AuditoriaModel.registrarLog({
            usuario: req.user?.nome_completo || 'desconhecido',
            acao: 'REVERSÃO',
            tabela_afetada: 'saida_tombo',
            id_registro: id,
            tombo: tombo.tombo,
            detalhes: {
               motivo: 'Reversão de saída',
               tombo: tombo.tombo,
            },
         });

         console.log(
            `[SaidaTomboController] Saída revertida com sucesso para ID: ${id}`
         );
         res.status(200).json({
            message: 'Saída de tombo revertida com sucesso!',
         });
      } catch (error) {
         console.error(
            `[SaidaTomboController] Erro ao reverter saída para ID ${id}:`,
            error
         );
         res.status(500).json({
            error: 'Erro ao reverter saída do tombo.',
            details: error.message,
         });
      }
   },

   // Método para gerar relatório de tombos usados (PDF ou Excel)
   async generatePDFTombosUsados(req, res) {
      try {
         const { formato = 'pdf', data_inicial, data_final } = req.query;
         const tombosUsados = await SaidaTomboModel.getAllTombosUsados(
            data_inicial,
            data_final
         );
         await this._generatePDFTombosUsados(
            res,
            tombosUsados,
            'Relatório de Tombos Usados',
            formato,
            data_inicial || '',
            data_final || ''
         );
      } catch (error) {
         console.error('Erro ao gerar relatório de tombos usados:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   },

   // Método privado para geração de relatórios de tombos usados (PDF ou Excel)
   async _generatePDFTombosUsados(
      res,
      data,
      title,
      formato,
      data_inicial,
      data_final
   ) {
      const columns = [
         { header: 'Saída', dataKey: 'data_saida', width: 17 },
         {
            header: 'Descrição',
            dataKey: 'descricao',
            width: 115,
            halign: 'left',
         },
         { header: 'Tombo', dataKey: 'tombo', width: 15 },
         { header: 'Destino', dataKey: 'destino', width: 30 },
         { header: 'NUP (Suite)', dataKey: 'referencia', width: 32 },
         { header: 'Doc. Saída', dataKey: 'doc_saida', width: 18 },
      ];

      const rows = data.map((item) => ({
         data_saida: new Date(item.data_saida).toLocaleDateString('pt-BR'),
         descricao: item.descricao ? item.descricao.toUpperCase() : 'N/A',
         tombo: item.tombo || 'N/A',
         destino: item.destino ? item.destino.toUpperCase() : 'N/A',
         referencia: item.referencia ? item.referencia.toUpperCase() : 'N/A',
         doc_saida: item.doc_saida || 'N/A',
      }));

      const totalTombosUsados = rows.length;

      if (formato === 'pdf') {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });

         doc.setFontSize(15);
         const titleWidth = doc.getTextWidth(title);
         const pageWidth = doc.internal.pageSize.width;
         doc.text(title, 10, 15);
         const dateRangeText = `de ${data_inicial} a ${data_final}`;
         doc.setFontSize(6);
         const dateRangeWidth = doc.getTextWidth(dateRangeText);
         doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15);

         doc.setFontSize(8);
         const generatedText = `Gerado em: ${new Date().toLocaleDateString(
            'pt-BR'
         )}`;
         const pageNumberText = `Página 1`;
         doc.text(generatedText, 10, 22);
         doc.text(pageNumberText, doc.internal.pageSize.width - 10, 22, {
            align: 'right',
         });

         doc.autoTable({
            startY: 25,
            margin: { left: 8, right: 8, top: 25 },
            head: [columns.map((col) => col.header)],
            body: [
               ...rows.map((row) => columns.map((col) => row[col.dataKey])),
               [
                  {
                     content: `Total Tombos Usados: ${totalTombosUsados}`,
                     colSpan: 6,
                     styles: {
                        halign: 'center',
                        fontStyle: 'bold',
                     },
                  },
               ],
            ],
            styles: {
               fontSize: 6,
               cellPadding: 2,
               halign: 'center',
               overflow: 'linebreak',
            },
            headStyles: {
               fontSize: 7,
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: columns.reduce((acc, col, index) => {
               acc[index] = {
                  cellWidth: col.width,
                  halign: col.halign || 'center',
               };
               return acc;
            }, {}),
            didDrawPage: function (data) {
               doc.setFontSize(15);
               const titleWidth = doc.getTextWidth(title);
               const pageWidth = doc.internal.pageSize.width;
               doc.text(title, 10, 15);
               const dateRangeText = `de ${data_inicial} a ${data_final}`;
               doc.setFontSize(6);
               const dateRangeWidth = doc.getTextWidth(dateRangeText);
               doc.text(dateRangeText, pageWidth - dateRangeWidth - 10, 15);

               doc.setFontSize(8);
               const pageStr = `Página ${data.pageNumber}`;
               doc.text(generatedText, 10, 22);
               doc.text(pageStr, doc.internal.pageSize.width - 10, 22, {
                  align: 'right',
               });
            },
         });

         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } else if (formato === 'excel') {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(title);

         worksheet.mergeCells('A1:F1');
         worksheet.getCell('A1').value = title;
         worksheet.getCell('A1').alignment = { horizontal: 'center' };
         worksheet.getCell('A1').font = { size: 16, bold: true };

         worksheet.addRow([
            `Gerado em: ${new Date().toLocaleDateString(
               'pt-BR'
            )} - de ${data_inicial} a ${data_final}`,
         ]);

         worksheet.addRow(columns.map((col) => col.header)).eachCell((cell) => {
            cell.fill = {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FF228B22' },
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
         });

         rows.forEach((row) => {
            worksheet.addRow(columns.map((col) => row[col.dataKey]));
         });

         const totalRow = worksheet.addRow([
            `Total Tombos Usados: ${totalTombosUsados}`,
         ]);
         worksheet.mergeCells(`A${worksheet.rowCount}:F${worksheet.rowCount}`);
         totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
         });

         worksheet.columns = columns.map((col) => ({ width: col.width / 6 }));

         const excelBuffer = await workbook.xlsx.writeBuffer();
         res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
         );
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.xlsx`
         );
         res.send(excelBuffer);
      } else {
         res.status(400).json({
            error: 'Formato inválido. Use "pdf" ou "excel".',
         });
      }
   },

   // Método para visualizar o PDF associado a um tombo em uma nova aba
   async viewPDF(req, res) {
      const { tombo } = req.params;

      try {
         // Validação do parâmetro tombo
         if (!Number.isInteger(Number(tombo)) || Number(tombo) <= 0) {
            return res.status(400).json({ error: 'Tombo inválido.' });
         }

         // Buscar o PDF usando o método do estoqueModel
         const pdfData = await estoqueModel.getPDFByTombo(tombo);

         if (!pdfData) {
            console.error(
               `[saidaTomboController.viewPDF] Nenhum PDF encontrado para o tombo: ${tombo}`
            );
            return res
               .status(404)
               .json({ error: 'Nenhum PDF associado a este tombo.' });
         }

         const pdfPath = path.join(__dirname, '../../', pdfData.file_path);
         if (fs.existsSync(pdfPath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
               'Content-Disposition',
               `inline; filename="${pdfData.filename}"`
            );
            return fs.createReadStream(pdfPath).pipe(res);
         } else {
            console.error(
               `[saidaTomboController.viewPDF] PDF não encontrado em: ${pdfPath}`
            );
            return res
               .status(404)
               .json({ error: 'Arquivo PDF não encontrado no servidor.' });
         }
      } catch (error) {
         console.error(
            '[saidaTomboController.viewPDF] Erro ao buscar PDF:',
            error
         );
         return res.status(500).json({
            error: 'Erro interno ao buscar o PDF.',
            details: error.message,
         });
      }
   },

   // Método para listar todos os tombamentos
   async listarTombamento(req, res) {
      try {
         const tombamento = await estoqueModel.getAllTombamento();
         for (let item of tombamento) {
            const pdfData = await estoqueModel.getPDFByTombo(item.tombo);
            item.has_pdf = !!pdfData;

            if (item.data_de_entrada) {
               const d = new Date(item.data_de_entrada);
               item.data_de_entrada_formatada = isNaN(d.getTime())
                  ? 'N/A'
                  : d.toLocaleDateString('pt-BR');
            } else {
               item.data_de_entrada_formatada = 'N/A';
            }
         }
         const userRole = req.user?.role || 'user';
         res.render('tabelaTombamento', { tombamento, userRole });
      } catch (error) {
         console.error('Erro ao listar tombamento:', error);
         res.status(500).send('Erro ao carregar a tabela de tombamento');
      }
   },

   // Método para visualizar detalhes de um tombamento
   async visualizarTombamento(req, res) {
      try {
         const { id } = req.params;

         // Busca dados da tabela registrodetombamento
         const item = await estoqueModel.getInfoByIdTombamento(id);
         if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
         }

         // Busca dados da tabela saida_tombo relacionados ao tombo
         const tomboUsado = await SaidaTomboModel.getTomboUsadoDetalhes(
            item.tombo
         );

         // Combina os dados
         const response = {
            ...item,
            nome_recebedor: tomboUsado?.nome_recebedor || 'N/A',
            observacao_saida: tomboUsado?.observacao || 'N/A',
            doc_saida: tomboUsado?.doc_saida || 'N/A',
            destino: tomboUsado?.destino || 'N/A',
            posto_grad: tomboUsado?.posto_grad || 'N/A',
            mf_recebedor: tomboUsado?.mf_recebedor || 'N/A',
            tel_recebedor: tomboUsado?.tel_recebedor || 'N/A',
            referencia: tomboUsado?.referencia || 'N/A',
            data_saida: tomboUsado?.data_saida
               ? new Date(tomboUsado.data_saida).toLocaleDateString('pt-BR')
               : 'N/A',
         };

         res.json(response);
      } catch (error) {
         console.error(
            '[saidaTomboController.visualizarTombamento] Erro ao visualizar tombamento:',
            error
         );
         res.status(500).json({ error: 'Erro ao carregar detalhes' });
      }
   },

   // Método para excluir um tombamento
   async excluirTombamento(req, res) {
      try {
         await estoqueModel.deleteTombamento(req.params.id);
         res.json({ msg: 'Item tombado excluído com sucesso' });
      } catch (error) {
         console.error('Erro ao excluir tombamento:', error);
         res.status(500).json({ msg: 'Erro ao excluir item' });
      }
   },

   // Método para atualizar um tombamento
   async atualizarTombamento(req, res) {
      try {
         const {
            id,
            data_de_entrada,
            quantidade,
            tipo_tombo,
            tombo,
            tombo_inicial,
            tombo_final,
            tombo_lote_manual,
            categoria,
            doc_origem,
            valor,
            descricao,
            situacao,
            conta_contabil,
            estoque,
            observacao,
         } = req.body;

         // Validações dos campos obrigatórios
         if (!data_de_entrada) {
            return res
               .status(400)
               .json({ error: 'Data de entrada é obrigatória' });
         }
         if (!quantidade || quantidade < 1) {
            return res
               .status(400)
               .json({ error: 'Quantidade deve ser maior ou igual a 1' });
         }
         if (!categoria || categoria === 'Selecione uma categoria...') {
            return res.status(400).json({ error: 'Categoria é obrigatória' });
         }
         if (!doc_origem) {
            return res
               .status(400)
               .json({ error: 'Documento de origem é obrigatório' });
         }
         if (!valor || valor <= 0) {
            return res
               .status(400)
               .json({ error: 'Valor unitário deve ser maior que 0' });
         }
         if (!descricao) {
            return res.status(400).json({ error: 'Descrição é obrigatória' });
         }
         if (!situacao || situacao === 'Escolha uma opção...') {
            return res
               .status(400)
               .json({ error: 'Estado de conservação é obrigatório' });
         }
         if (!conta_contabil || conta_contabil === 'Escolha uma opção...') {
            return res
               .status(400)
               .json({ error: 'Conta contábil é obrigatória' });
         }
         if (!estoque || estoque === 'Escolha uma opção...') {
            return res
               .status(400)
               .json({ error: 'Local de estoque é obrigatório' });
         }

         // Preparar dados para atualização com conversão para caixa alta
         const updateData = {
            data_de_entrada,
            quantidade: parseInt(quantidade),
            tipo_tombo: tipo_tombo ? tipo_tombo.toUpperCase() : null,
            tombo: tombo ? tombo.toUpperCase() : null,
            tombo_inicial:
               tipo_tombo === 'LOTE'
                  ? tombo_inicial
                     ? tombo_inicial.toUpperCase()
                     : null
                  : null,
            tombo_final:
               tipo_tombo === 'LOTE'
                  ? tombo_final
                     ? tombo_final.toUpperCase()
                     : null
                  : null,
            tombo_lote_manual:
               tipo_tombo === 'LOTE_MANUAL'
                  ? JSON.parse(tombo_lote_manual)
                  : null,
            categoria: categoria ? categoria.toUpperCase() : null,
            doc_origem: doc_origem ? doc_origem.toUpperCase() : null,
            valor: parseFloat(valor),
            descricao: descricao ? descricao.toUpperCase() : null,
            situacao: situacao ? situacao.toUpperCase() : null,
            conta_contabil: conta_contabil
               ? conta_contabil.toUpperCase()
               : null,
            estoque: estoque ? estoque.toUpperCase() : null,
            observacao: observacao ? observacao.toUpperCase() : null,
         };

         // Atualizar o registro no banco
         const result = await estoqueModel.updateTombamento(id, updateData);

         if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item não encontrado' });
         }

         res.status(200).json({ message: 'Tombamento atualizado com sucesso' });
      } catch (error) {
         console.error('Erro ao atualizar tombamento:', error);
         res.status(500).json({
            error: 'Erro ao atualizar o tombamento: ' + error.message,
         });
      }
   },

   // Método para renderizar formulário de edição de tombamento
   async editarTombamento(req, res) {
      try {
         const item = await estoqueModel.getInfoByIdTombamento(req.params.id);
         if (!item) {
            return res.status(404).send('Item não encontrado');
         }

         // Ajustar formato da data para o input type="date" (YYYY-MM-DD)
         item.data_de_entrada = item.data_de_entrada
            ? new Date(item.data_de_entrada).toISOString().split('T')[0]
            : null;
         // Garantir que o valor seja um número puro
         item.valor = item.valor ? parseFloat(item.valor).toFixed(2) : null;
         // Padronizar valores para corresponder às opções do <select>
         item.categoria = item.categoria
            ? item.categoria.toLowerCase()
            : 'Selecione uma categoria...';
         item.situacao = item.situacao
            ? item.situacao.toLowerCase()
            : 'Escolha uma opção...';
         item.conta_contabil = item.conta_contabil
            ? item.conta_contabil.toLowerCase()
            : 'Escolha uma opção...';
         item.estoque = item.estoque
            ? item.estoque.toLowerCase()
            : 'Escolha uma opção...';
         // Definir destino_dados como 'registrodetombamento'
         item.destino_dados = 'registrodetombamento';
         res.render('editarTombamento', {
            item,
            userRole: req.user ? req.user.role : 'user',
         });
      } catch (error) {
         console.error('Erro ao carregar item para edição:', error);
         res.status(500).send('Erro ao carregar o formulário de edição');
      }
   },

   // Método para gerar relatório de tombamento (PDF ou Excel)
   async gerarRelatorioTombamento(req, res) {
      try {
         const { formato = 'pdf' } = req.query;
         const tombamento = await estoqueModel.getAllTombamento();
         await this._generateReport(
            res,
            tombamento,
            'Relatório de Tombamento',
            formato,
            [
               {
                  header: 'Entrada',
                  dataKey: 'data_de_entrada_formatada',
                  width: 18,
               },
               { header: 'Descrição', dataKey: 'descricao', width: 120 },
               { header: 'Tombo', dataKey: 'tombo', width: 20 },
               { header: 'Categoria', dataKey: 'categoria', width: 30 },
               { header: 'Local', dataKey: 'estoque', width: 20 },
               { header: 'Situação', dataKey: 'situacao', width: 20 },
               { header: 'Valor', dataKey: 'valor', width: 20 },
               { header: 'Doc Origem', dataKey: 'doc_origem', width: 30 },
            ]
         );
      } catch (error) {
         console.error('Erro ao gerar relatório de tombamento:', error);
         res.status(500).json({ error: 'Erro ao gerar relatório' });
      }
   },

   // Método privado para geração de relatórios gerais (PDF ou Excel)
   async _generateReport(res, data, title, formato, customColumns = null) {
      const columns = customColumns || [
         { header: 'Entrada', dataKey: 'data_entrada', width: 18 },
         { header: 'Descrição', dataKey: 'descricao', width: 120 },
         { header: 'Tombo', dataKey: 'tombo', width: 20 },
         { header: 'Categoria', dataKey: 'categoria', width: 30 },
         { header: 'Local', dataKey: 'estoque', width: 20 },
         { header: 'Situação', dataKey: 'situacao', width: 20 },
         { header: 'Valor', dataKey: 'valor', width: 20 },
         { header: 'Doc Origem', dataKey: 'doc_origem', width: 30 },
      ];

      const rows = data.map((item) => {
         const row = {};
         columns.forEach((col) => {
            if (col.dataKey === 'data_entrada') {
               row[col.dataKey] = item.data_de_entrada
                  ? new Date(item.data_de_entrada).toLocaleDateString('pt-BR')
                  : 'N/A';
            } else if (col.dataKey === 'valor') {
               row[col.dataKey] = item.valor
                  ? parseFloat(item.valor).toLocaleString('pt-BR', {
                       style: 'currency',
                       currency: 'BRL',
                    })
                  : 'N/A';
            } else if (col.dataKey === 'doc_origem') {
               row[col.dataKey] = item.doc_origem
                  ? item.doc_origem.toUpperCase()
                  : 'N/A';
            } else {
               row[col.dataKey] = item[col.dataKey]
                  ? item[col.dataKey].toString().toUpperCase()
                  : 'N/A';
            }
         });
         return row;
      });

      if (formato === 'pdf') {
         const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
         });

         const generatedText = `Gerado em: ${new Date().toLocaleDateString(
            'pt-BR'
         )}`;

         // Função para desenhar o cabeçalho
         const drawHeader = (pageNumber) => {
            doc.setFontSize(14);
            doc.text(title, doc.internal.pageSize.width / 2, 15, {
               align: 'center',
            });
            doc.setFontSize(6);
            const pageStr = `Página ${pageNumber}`;
            doc.text(generatedText, 10, 22);
            doc.text(pageStr, doc.internal.pageSize.width - 10, 22, {
               align: 'right',
            });
         };

         // Desenha o cabeçalho na primeira página
         drawHeader(1);

         doc.autoTable({
            startY: 25,
            margin: { left: 10, right: 10, top: 30 },
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            styles: {
               fontSize: 6,
               cellPadding: 2,
               halign: 'center',
               overflow: 'linebreak',
            },
            headStyles: {
               fontSize: 7,
               fillColor: [34, 139, 34],
               textColor: 255,
               fontStyle: 'bold',
            },
            columnStyles: columns.reduce((acc, col, index) => {
               acc[index] = {
                  cellWidth: col.width,
                  halign: col.dataKey === 'descricao' ? 'left' : 'center',
               };
               return acc;
            }, {}),
            didDrawPage: function (data) {
               drawHeader(data.pageNumber);
               if (data.pageNumber < doc.internal.getNumberOfPages()) {
                  doc.autoTable.previous.finalY = 30;
               }
            },
         });

         const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
         res.setHeader('Content-Type', 'application/pdf');
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.pdf`
         );
         res.send(pdfBuffer);
      } else if (formato === 'excel') {
         console.log('[EXCEL] Título da planilha:', title);
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet(title);
         worksheet.mergeCells(
            `A1:${String.fromCharCode(65 + columns.length - 1)}1`
         );
         worksheet.getCell('A1').value = title;
         worksheet.getCell('A1').alignment = { horizontal: 'center' };
         worksheet.getCell('A1').font = { size: 16, bold: true };
         worksheet.addRow([
            `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
         ]);
         worksheet.addRow(columns.map((col) => col.header)).eachCell((cell) => {
            cell.fill = {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FF228B22' },
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
         });
         rows.forEach((row) => {
            worksheet.addRow(columns.map((col) => row[col.dataKey]));
         });
         worksheet.columns = columns.map((col) => ({ width: col.width }));
         const excelBuffer = await workbook.xlsx.writeBuffer();
         res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
         );
         res.setHeader(
            'Content-Disposition',
            `attachment; filename=${title.replace(/ /g, '_')}.xlsx`
         );
         res.send(excelBuffer);
      } else {
         res.status(400).json({
            error: 'Formato inválido. Use "pdf" ou "excel".',
         });
      }
   },
};
