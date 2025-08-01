import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SaidaTomboModel from '../models/SaidaTomboModel.js';
import sequenciaModel from '../models/sequenciaModel.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Corrigido para importar de 'date-fns/locale'

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
         if (!/^\d{5}\/\d{4}$/.test(numero)) {
            return res.status(400).json({ error: 'Formato de termo inválido: esperado NNNNN/AAAA' });
         }
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${numero.replace(/\//g, '-')}.pdf`
         );
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
         tombos,
         referencia,
         destino,
         postoGrad,
         mf_recebedor,
         tel_recebedor,
         nome_do_recebedor,
         observacao,
         modoDocSaida,
         doc_saida // Adicionado para suportar o número do termo enviado pelo frontend
      } = req.body;

      const usuarioLogado = req.user;
      const nomeResponsavel = usuarioLogado?.nome_completo || 'Desconhecido';
      const mfResponsavel = usuarioLogado?.matricula || 'N/A';
      const postoGradResponsavel = usuarioLogado?.posto_grad || 'N/A';

      try {
         // Validações
         if (!tombos || tombos.length === 0) {
            return res.status(400).json({ error: 'Selecione pelo menos um tombo' });
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
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
         }

         // Validação do formato do termo
         if (!/^\d{5}\/\d{4}$/.test(doc_saida)) {
            return res.status(400).json({ error: 'Formato de termo inválido: esperado NNNNN/AAAA' });
         }

         // Validação para modo AUTO
         const anoAtual = new Date().getFullYear();
         if (modoDocSaida === 'AUTO') {
            const sequenciaAtual = await sequenciaModel.getSequenciaAtual(anoAtual);
            const expectedDocSaida = `${sequenciaAtual.toString().padStart(5, '0')}/${anoAtual}`;
            if (doc_saida !== expectedDocSaida) {
               return res.status(400).json({ error: 'Número do termo inválido para o modo AUTO' });
            }
         }

         // Verifica se os tombos são válidos e estão disponíveis
         const validacao = await SaidaTomboModel.validarTombos(tombos);
         if (!validacao.valido) {
            return res.status(400).json({ error: validacao.erro });
         }

         // Verifica se o PDF já existe
         const pdfPath = path.join(
            __dirname,
            '../../pdfs',
            `Termo_${doc_saida.replace(/\//g, '-')}.pdf`
         );
         if (fs.existsSync(pdfPath)) {
            return res.status(400).json({ error: 'Já existe um PDF com esse número de termo' });
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
            `Nº Termo: ${doc_saida}`,
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

         // Tabela de tombos (sem a coluna "Situação")
         const tableStartY = headerYStart + headerYOffset + 2;
         const items = [];
         let ordem = 1;
         const tombosInfo = await SaidaTomboModel.getTombosInfo(tombos);
         console.log('Dados retornados por getTombosInfo:', tombosInfo); // Log para depuração
         for (const tombo of tombosInfo) {
            const descricao = tombo.descricao
               ? tombo.descricao.toUpperCase().replace('RETAINGLIAR', 'RETANGULAR')
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
         const clausula = `Eu, ${nome_do_recebedor.toUpperCase()} estou recebendo as etiquetas dos tombos e me comprometo em afixá-las nos referidos itens.`;
         const clausulaLines = doc.splitTextToSize(clausula, 180);
         const clausulaY = tableStartY + items.length * 10 + 10; // Ajuste dinâmico após a tabela
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
         const dataSaida = new Date().toISOString().slice(0, 19).replace('T', ' ');
         await SaidaTomboModel.registrarSaida(
            tombos,
            doc_saida,
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
            await sequenciaModel.incrementarSequencia(anoAtual);
         }

         res.status(200).json({
            success: true,
            pdfPath: `/pdfs/Termo_${doc_saida.replace(/\//g, '-')}.pdf`,
            message: 'Saída registrada com sucesso!',
         });
      } catch (error) {
         console.error('Erro ao registrar saída:', error);
         res.status(500).json({
            success: false,
            error: 'Erro interno no servidor',
            details: error.message,
         });
      }
   },
};