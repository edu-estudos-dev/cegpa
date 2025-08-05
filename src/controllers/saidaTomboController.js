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
// import AuditoriaModel from '../models/AuditoriaModel.js';

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
      console.log('=========================================================');
      console.log(
         '[saidaTomboController.registrarSaida] INÍCIO DA REQUISIÇÃO POST /saida-tombo'
      );
      console.log(
         '[saidaTomboController.registrarSaida] Corpo da requisição:',
         JSON.stringify(req.body, null, 2)
      );
      console.log(
         '[saidaTomboController.registrarSaida] Usuário autenticado:',
         JSON.stringify(req.user, null, 2)
      );
      console.log('=========================================================');

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

         // Verifica se o PDF já existe
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${docSaidaFormatado.replace(/\//g, '-')}.pdf`
         );
         if (fs.existsSync(pdfPath)) {
            console.log(
               '[saidaTomboController.registrarSaida] Erro: Termo já existe:',
               docSaidaFormatado
            );
            return res.status(400).json({
               error: `O número do termo ${doc_saida} já foi utilizado. Escolha outro número.`,
            });
         }

         // Gera o PDF com jsPDF
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
         doc.text(
            'TERMO DE RECEBIMENTO E RESPONSABILIDADE - CEGPA/COLOG',
            105,
            28,
            { align: 'center' }
         );

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
         headerData.forEach((line, index) => {
            if (line.startsWith('Nº Termo')) {
               doc.setFont('helvetica', 'bold');
               doc.setFontSize(12);
               doc.text(line, 14, headerYStart + headerYOffset);
               doc.setFont('helvetica', 'normal');
               doc.setFontSize(10);
            } else {
               doc.text(line, 14, headerYStart + headerYOffset);
            }
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
         const clausulaLines = doc.splitTextToSize(clausula, 230);
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
         const pdfDir = path.dirname(pdfPath);
         if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
         }
         doc.save(pdfPath);

         // Registra a saída
         const dataSaida = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
         console.log(
            '[saidaTomboController.registrarSaida] Chamando SaidaTomboModel.registrarSaida com:',
            {
               tombos,
               docSaidaFormatado,
               referencia,
               destino,
               postoGrad,
               mf_recebedor,
               tel_recebedor,
               nome_do_recebedor,
               observacao,
               dataSaida,
            }
         );
         await SaidaTomboModel.registrarSaida(
            tombos,
            docSaidaFormatado,
            referencia,
            destino,
            postoGrad,
            mf_recebedor,
            tel_recebedor,
            nome_do_recebedor,
            observacao,
            dataSaida
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
         const tombo = await SaidaTomboModel.getTomboUsadoDetalhes(id);
         console.log('Tombo usado retornado:', tombo);
         if (tombo) {
            res.json(tombo);
         } else {
            res.status(404).json({ error: 'Tombo usado não encontrado' });
         }
      } catch (error) {
         console.error('Erro ao buscar tombo usado pelo ID:', error);
         res.status(500).json({ error: 'Erro ao buscar tombo usado.' });
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
};
